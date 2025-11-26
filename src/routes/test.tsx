/** biome-ignore-all lint/a11y/useKeyWithClickEvents: <Being dumb> */
/** biome-ignore-all lint/a11y/noStaticElementInteractions: <Being dumb> */
import { createFileRoute } from "@tanstack/react-router";
import { Ocean } from "../components/Ocean";
import { Fish } from "../components/Fish";
import { Shark } from "@/components/Shark";

export const Route = createFileRoute("/test")({
	component: App,
});

function App() {
	const fishes = [
		{ character: "2dumbfish", x: 50, y: 50},
		{ character: "angelfish", x: 200, y: 100 },
		{ character: "animated-manta-ray", x: 350, y: 150 },
		{ character: "big_fish", x: 500, y: 80 },
		{ character: "clownfish", x: 150, y: 250 },
		{ character: "coolfish", x: 400, y: 300 },
		{ character: "discusani", x: 600, y: 200 },
		{ character: "fish_7", x: 250, y: 400 },
		{ character: "fish_swim_3", x: 450, y: 450 },
		{ character: "fish_swim-7", x: 100, y: 500 },
		{ character: "humpback_salmon", x: 550, y: 350 },
		{ character: "sunfish", x: 650, y: 500},
	];

	return (
		// \/ Do not touch this div, work inside of it \/
		<div > 
			<Ocean>
				{fishes.map((fish, index) => (
					<Fish 
						clientId={index.toString()}
						x={fish.x} 
						y={fish.y} 
						character={fish.character}
						debug={true}
					/>
				))}
				<Shark x={300} y={550} debug={true} />
			</Ocean>
		</div>)
}

