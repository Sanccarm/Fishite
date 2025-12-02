import { Link } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { useAudio } from "../lib/AudioProvider";
import { ChatInputModal } from "./ChatInputModal";


export default function Header() {
	const { isPlaying, start, stop, change, setVolume } = useAudio()
	const [musicInitialized, setMusicInitialized] = useState(false)
	const [volume, setVolumeState] = useState(1)
	const [isChatOpen, setIsChatOpen] = useState(false);
	const [coinCount, setCoinCount] = useState<number>(0);
	const [isAnimating, setIsAnimating] = useState(false);
	const [animationType, setAnimationType] = useState<'increase' | 'decrease' | null>(null);

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

	const handleSendChat = (text: string) => {
		window.dispatchEvent(new CustomEvent('sendChat', { detail: { text } }));
	}

	// Listen for coin updates from tank.tsx
	useEffect(() => {
		const handleCoinUpdate = (event: Event) => {
			const customEvent = event as CustomEvent<{ coinCount: number; animate?: boolean; isIncrease?: boolean }>;
			//console.log('Coin update received:', customEvent.detail);
			setCoinCount(customEvent.detail.coinCount);
			if (customEvent.detail.animate && customEvent.detail.isIncrease !== undefined) {
				const animType = customEvent.detail.isIncrease ? 'increase' : 'decrease';
				//console.log('Setting animation:', animType);
				setAnimationType(animType);
				setIsAnimating(true);
				// Reset animation after it completes
				setTimeout(() => {
					//console.log('Resetting animation');
					setIsAnimating(false);
					setAnimationType(null);
				}, 600);
			}
		};

		window.addEventListener('coinUpdate', handleCoinUpdate);
		return () => window.removeEventListener('coinUpdate', handleCoinUpdate);
	}, []);

	return (
		<div className="bg-primary w-full border-border border-b">
			<div className="flex items-center justify-between mx-auto w-full px-4 py-2">
				<Link to="/start">
					<h1 className="font-bold text-4xl tracking-tighter text-secondary">Fishite</h1>
				</Link>
				<div className="flex items-center gap-3">
					{/* Coin Display */}
					<div className="flex items-center gap-2 px-3 py-1 bg-secondary/20 rounded-lg">
						<img
							src="/coin.png"
							alt="Coin"
							className={`w-6 h-6 transition-transform duration-300 ${isAnimating ? 'scale-150 rotate-12' : ''}`}
							style={{
								animation: isAnimating ? 'coinPulse 0.6s ease-in-out' : 'none',
							}}
						/>
						<span 
							key={`coin-${coinCount}-${isAnimating ? animationType : 'static'}`}
							className={`font-bold text-secondary text-lg ${isAnimating && animationType === 'increase' ? 'coin-flash-green' : ''} ${isAnimating && animationType === 'decrease' ? 'coin-flash-red' : ''}`}
						>
							{coinCount}
						</span>
					</div>
					<ChatInputModal
						isOpen={isChatOpen}
						onSend={handleSendChat}
						onClose={() => setIsChatOpen(false)}
					/>
					{!isChatOpen && (
						<Button
							type="button"
							onClick={() => setIsChatOpen(true)}
							className="p-2"
							title="Send a message"
						>
							<span aria-hidden className="text-3xl">💬</span>
						</Button>
					)}
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
