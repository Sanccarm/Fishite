/** biome-ignore-all lint/a11y/useKeyWithClickEvents: <Being dumb> */
/** biome-ignore-all lint/a11y/noStaticElementInteractions: <Being dumb> */
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { Ocean } from "../components/Ocean";

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
];

function App() {
	const [nickname, setNickname] = useState("");
	const [character, setCharacter] = useState<string | null>(null);
	const navigate = useNavigate();

	const handleStart = () => {
		if (!nickname.trim() || !character) return;
		
		// Store in localStorage
		localStorage.setItem("playerNickname", nickname.trim());
		localStorage.setItem("playerCharacter", character);
		
		// Navigate to tank
		navigate({ to: "/tank" });
	};

	return (
		<div className="flex items-center justify-center min-h-screen">
			<Ocean>
				<div className="relative z-10 bg-white/90 backdrop-blur-sm rounded-lg p-8 shadow-xl max-w-2xl w-full mx-4">
					<h2 className="text-3xl font-bold mb-6 text-center">Choose Your Fish</h2>
					
					<div className="mb-6">
						<label htmlFor="nickname" className="block text-sm font-medium mb-2">
							Nickname
						</label>
						<input
							id="nickname"
							type="text"
							value={nickname}
							onChange={(e) => setNickname(e.target.value)}
							placeholder="Enter your nickname"
							className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
							maxLength={20}
						/>
					</div>

					<div className="mb-6">
						<label className="block text-sm font-medium mb-3">
							Select Character
						</label>
						<div className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-6 gap-4">
							{CHARACTERS.map((char) => (
								<button
									key={char}
									type="button"
									onClick={() => setCharacter(char)}
									className={`p-2 border-2 rounded-lg transition-all ${
										character === char
											? "border-blue-500 bg-blue-50 scale-105"
											: "border-gray-300 hover:border-gray-400"
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
								</button>
							))}
						</div>
					</div>

					<button
						type="button"
						onClick={handleStart}
						disabled={!nickname.trim() || !character}
						className="w-full py-3 bg-blue-500 text-white rounded-md font-semibold hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
					>
						Start Swimming
					</button>
				</div>
			</Ocean>
		</div>
	);
}

