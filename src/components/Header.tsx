import { Link } from "@tanstack/react-router";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useAudio } from "../lib/AudioProvider";


export default function Header() {
	const { isPlaying, start, stop, change, setVolume } = useAudio()
	const [musicInitialized, setMusicInitialized] = useState(false)
	const [volume, setVolumeState] = useState(1)

	const handleToggle = async () => {
		if (!musicInitialized) {
			await change('/music/theme_1.mp3', { autoplay: true })
			setMusicInitialized(true)
			return
		}

		if (isPlaying) stop()
		else await start()
	}

	const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		const newVolume = parseFloat(e.target.value)
		setVolumeState(newVolume)
		setVolume(newVolume)
	}

	return (
		<div className="bg-primary w-full border-border border-b">
			<div className="flex items-center justify-between mx-auto w-full px-4 py-2">
				<Link to="/start">
					<h1 className="font-bold text-4xl tracking-tighter text-secondary">Fishite</h1>
				</Link>
				<div className="flex items-center gap-2">
					<Button
						type="button"
						onClick={handleToggle}
						className="p-2"
						aria-pressed={isPlaying}
						aria-label={isPlaying ? 'Stop music' : 'Play music'}
						title={isPlaying ? 'Stop music' : 'Play music'}
					>
						<span aria-hidden className="text-3xl">{isPlaying ? '🔊' : '🔇'}</span>
					</Button>
					<input
						type="range"
						min="0"
						max="1"
						step="0.1"
						value={volume}
						onChange={handleVolumeChange}
						className="w-24 h-2 bg-secondary rounded-lg appearance-none cursor-pointer"
						aria-label="Volume control"
						title="Volume"
					/>
				</div>
			</div>
		</div>
	);
}
