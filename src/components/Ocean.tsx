import type { ReactNode } from "react";
import { Floor } from "./Floor";

interface OceanProps {
	children?: ReactNode;
	floorItems?: Array<{ image: string; x: number; y: number; width: number; height: number }>;
}

// Default floor decorations
const defaultFloorItems = [
	{ image: 'sponges.png', x: -30, y: 40, width: 150, height: 100 },
	{ image: 'seaweed.gif', x: 50, y: 30, width: 80, height: 120 },
	{ image: 'coral.gif', x: 180, y: 25, width: 70, height: 100 },
	{ image: 'starfish.gif', x: 320, y: 35, width: 60, height: 60 },
	{ image: 'seaweed.gif', x: 450, y: 20, width: 100, height: 140 },
	{ image: 'WeirdThing.gif', x: 620, y: 30, width: 75, height: 110 },
	{ image: 'seaweed.gif', x: 800, y: 25, width: 90, height: 130 },
	{ image: 'coral.gif', x: 950, y: 28, width: 65, height: 95 },
	{ image: 'starfish.gif', x: 1100, y: 32, width: 55, height: 55 },
	{ image: 'seaweed.gif', x: 1250, y: 35, width: 85, height: 125 },
	{ image: 'WeirdThing.gif', x: 1400, y: 27, width: 80, height: 115 },
	{ image: 'coral.gif', x: 1550, y: 30, width: 72, height: 105 },
	{ image: 'seaweed.gif', x: 1700, y: 22, width: 95, height: 135 },
	{ image: 'starfish.gif', x: 1850, y: 36, width: 58, height: 58 },
	{ image: 'WeirdThing.gif', x: 2000, y: 28, width: 78, height: 112 },
	{ image: 'seaweed.gif', x: 2150, y: 31, width: 87, height: 128 },
	{ image: 'coral.gif', x: 2300, y: 25, width: 68, height: 98 },
	{ image: 'starfish.gif', x: 2450, y: 34, width: 62, height: 62 },
	{ image: 'WeirdThing.gif', x: 2600, y: 29, width: 76, height: 108 },
	{ image: 'seaweed.gif', x: 2750, y: 26, width: 92, height: 132 },
	{ image: 'coral.gif', x: 2900, y: 32, width: 70, height: 102 },
];

export function Ocean({ children, floorItems = defaultFloorItems }: OceanProps) {
	return (
		<>
			<div className="light-rays"></div>
				<div className="ocean-floor">
					<div className="sand-texture"></div>
					<Floor items={floorItems} />
				</div>
			{children}		
		</>
	);
}

