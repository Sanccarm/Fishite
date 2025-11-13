/** biome-ignore-all lint/a11y/useKeyWithClickEvents: <Being dumb> */
/** biome-ignore-all lint/a11y/noStaticElementInteractions: <Being dumb> */
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { useAudio } from "../lib/AudioProvider";
import { Ocean } from "../components/Ocean";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export const Route = createFileRoute("/start")({
	component: App,
});

const CHARACTERS = [
	"2dumbfish",
	"angelfish",
	"animated-manta-ray",
	"big_fish",
	"clownfish",
	"coolfish",
	"discusani",
	"fish_7",
	"fish_swim_3",
	"fish_swim-7",
	"humpback_salmon",
	"shark",
	"sunfish",
	"fred"
];

function App() {
	const [nickname, setNickname] = useState("");
	const [character, setCharacter] = useState<string | null>(null);
	const navigate = useNavigate();

	const { isPlaying, start, stop, change } = useAudio()
	const [musicInitialized, setMusicInitialized] = useState(false)

	const handleEnterTank = () => {
		if (!nickname.trim() || !character) return;
		
		// Store in localStorage
		localStorage.setItem("playerNickname", nickname.trim());
		localStorage.setItem("playerCharacter", character);
		
		// Navigate to tank
		navigate({ to: "/tank" });
	};

	const handleToggleMusic = async () => {
		if (!musicInitialized) {
			// Initialize with the public music file and autoplay
			await change('/music/theme_1.mp3', { autoplay: true })
			setMusicInitialized(true)
			return
		}

		if (isPlaying) stop()
		else await start()
	}

	return (
		<div className="flex items-center justify-center min-h-screen">
			<Ocean>
				<Card className="relative z-10 bg-white/90 backdrop-blur-sm max-w-2xl w-full mx-4">
					<CardHeader>
						<div className="flex items-center justify-between">
							<CardTitle className="text-3xl text-center">Choose Your Fish</CardTitle>
							<div>
								<Button
									type="button"
									onClick={handleToggleMusic}
									className="ml-4"
								>
									{isPlaying ? 'Stop Music' : 'Play Music'}
								</Button>
							</div>
						</div>
					</CardHeader>
					<CardContent className="space-y-6">
						<div className="space-y-2">
							<Label htmlFor="nickname">Nickname</Label>
							<Input
								id="nickname"
								type="text"
								value={nickname}
								onChange={(e) => setNickname(e.target.value)}
								placeholder="Enter your nickname"
								maxLength={20}
							/>
						</div>

						<div className="space-y-3">
							<Label>Select Character</Label>
							<div className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-6 gap-4">
								{CHARACTERS.map((char) => (
									<Button
										key={char}
										type="button"
										variant={character === char ? "default" : "outline"}
										onClick={() => setCharacter(char)}
										className={`p-2 h-auto flex-col ${
											character === char ? "scale-105" : ""
										}`}
									>
										<div className="w-full aspect-square flex items-center justify-center">
											<img
												src={`/fishes/${char}.gif`}
												alt={char}
												className="w-full h-full object-contain"
											/>
										</div>
										<p className="text-xs mt-1 text-center truncate">{char}</p>
									</Button>
								))}
							</div>
						</div>

						<Button
							type="button"
							onClick={handleEnterTank}
							disabled={!nickname.trim() || !character}
							className="w-full"
							size="lg"
						>
							Start Swimming
						</Button>
					</CardContent>
				</Card>
			</Ocean>
		</div>
	);
}

