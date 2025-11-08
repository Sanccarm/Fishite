/** biome-ignore-all lint/a11y/useAltText: <explanation> */
import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect, useRef } from "react";

export const Route = createFileRoute("/demo/")({
	component: App,
});

export default function App() {
	const [position, setPosition] = useState({ x: 100, y: 100 });
	const keysPressed = useRef(new Set());
	const fishSize = 50;
	const speed = 10;
	useEffect(() => {
		const handleKeyDown = (e: { key: unknown }) => {
			keysPressed.current.add(e.key);
		};

		const handleKeyUp = (e: { key: unknown }) => {
			keysPressed.current.delete(e.key);
		};

		const move = () => {
			setPosition((prev) => {
				let newX = prev.x;
				let newY = prev.y;

				if (keysPressed.current.has("ArrowUp")) newY -= speed;
				if (keysPressed.current.has("ArrowDown")) newY += speed;
				if (keysPressed.current.has("ArrowLeft")) newX -= speed;
				if (keysPressed.current.has("ArrowRight")) newX += speed;

				const maxX = window.innerWidth - fishSize;
				const maxY = window.innerHeight - fishSize;
				if (newX < 0) newX = 0;
				if (newY < 0) newY = 0;
				if (newX > maxX) newX = maxX;
				if (newY > maxY) newY = maxY;

				return { x: newX, y: newY };
			});
		};

		const interval = setInterval(move, 16); // ~60 FPS

		window.addEventListener("keydown", handleKeyDown);
		window.addEventListener("keyup", handleKeyUp);

		return () => {
			clearInterval(interval);
			window.removeEventListener("keydown", handleKeyDown);
			window.removeEventListener("keyup", handleKeyUp);
		};
	}, []);
	return (
		<div
			className="water-background"
			style={{
				width: "100vw",
				height: "100vh",
				position: "relative",
				overflow: "hidden",
			}}
		>
			<div className="water-background">
				<div className="ocean-floor">
					<div className="sand-texture"></div>
				</div>
				<div
					style={{
						width: 50,
						height: 50,
						position: "absolute",
						left: position.x,
						top: position.y,
						borderRadius: 10,
						transition: "left 0.1s, top 0.1s",
					}}
				>
					<img
						src=".\public\favicon.ico"
						alt="fish"
						style={{ width: "100%", height: "100%" }}
					/>
				</div>
				<div className="light-rays"></div>
			</div>
		</div>
	);
}
