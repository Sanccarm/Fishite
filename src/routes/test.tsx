/** biome-ignore-all lint/a11y/useKeyWithClickEvents: <Being dumb> */
/** biome-ignore-all lint/a11y/noStaticElementInteractions: <Being dumb> */
import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { Ocean } from "../components/Ocean";
import { Fish } from "../components/Fish";

export const Route = createFileRoute("/test")({
	component: App,
});

function App() {
	const fishes = [
		{ character: "2dumbfish", x: 50, y: 50, size: 50 },
		{ character: "angelfish", x: 200, y: 100, size: 50 },
		{ character: "animated-manta-ray", x: 350, y: 150, size: 50 },
		{ character: "big_fish", x: 500, y: 80, size: 50 },
		{ character: "clownfish", x: 150, y: 250, size: 50 },
		{ character: "coolfish", x: 400, y: 300, size: 50 },
		{ character: "discusani", x: 600, y: 200, size: 50 },
		{ character: "fish_7", x: 250, y: 400, size: 50 },
		{ character: "fish_swim_3", x: 450, y: 450, size: 50 },
		{ character: "fish_swim-7", x: 100, y: 500, size: 50 },
		{ character: "humpback_salmon", x: 550, y: 350, size: 50 },
		{ character: "shark", x: 300, y: 550, size: 200 },
		{ character: "sunfish", x: 650, y: 500, size: 85 },
	];

	return (
		// \/ Do not touch this div, work inside of it \/
		<div > 
			<Ocean>
				{fishes.map((fish, index) => (
					<Fish 
						key={index}
						x={fish.x} 
						y={fish.y} 
						character={fish.character}
						size={fish.size}
					/>
				))}
			</Ocean>
		</div>)
}

