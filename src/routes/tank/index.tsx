import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect, useRef } from "react";
import { io } from "socket.io-client";
import { Ocean } from "../../components/Ocean";

export const Route = createFileRoute("/tank/")({
	component: App,
});

export default function App() {
	// biome-ignore lint/suspicious/noExplicitAny: <>
	const socketRef = useRef<any>(null);
	const [players, setPlayers] = useState<
		Record<string, { x: number; y: number }>
	>({});
	const [myId, setMyId] = useState<string | null>(null);
	const [position, setPosition] = useState({ x: 100, y: 100 });

	const keysPressed = useRef(new Set<string>());
	const fishSize = 50;
	const speed = 1.5;
	const friction = 0.9;

	useEffect(() => {
		const socket = io("http://localhost:3000"); // https://fishsever-1074820372233.us-east1.run.app
		socketRef.current = socket;

		socket.on("connect", () => console.log("Connected to fish server 🐠"));

		socket.on("init", (playersMap) => {
			setPlayers(playersMap);
			setMyId(socket.id ?? null);
		})

		socket.on("playerJoined", ({ id, position }) => {
			setPlayers((prev) => ({ ...prev, [id]: position }));
		})

		socket.on("playerMoved", ({ id, position }) => {
			setPlayers((prev) => ({ ...prev, [id]: position }));
		})

		socket.on("playerLeft", (id) => {
			setPlayers((prev) => {
				const copy = { ...prev };
				delete copy[id];
				return copy;
			})
		})

		return () => {
			socket.disconnect();
		}
	}, []);

	useEffect(() => {
		const handleKeyDown = (e: { key: string }) => {
			const key = e.key.startsWith("Arrow") ? e.key : e.key.toLowerCase();
			keysPressed.current.add(key);
		}

		const handleKeyUp = (e: { key: string }) => {
			const key = e.key.startsWith("Arrow") ? e.key : e.key.toLowerCase();
			keysPressed.current.delete(key);
		}

		window.addEventListener("keydown", handleKeyDown);
		window.addEventListener("keyup", handleKeyUp);

		// Use refs for smooth updates without stale state
		const velocityRef = { x: 0, y: 0 };
		const pos = { x: 100, y: 100 };

		const move = () => {
			let newVelX = velocityRef.x;
			let newVelY = velocityRef.y;
			if (socketRef.current && myId) {
				const updatedPos = { ...pos };
				socketRef.current.emit("move", updatedPos);
				setPlayers((prev) => {
					const newPlayers = { ...prev };
					newPlayers[myId] = updatedPos;
					return newPlayers;
				})
			}
			// Accelerate while key pressed (works for arrow keys and wWASD)
			if (keysPressed.current.has("ArrowUp") || keysPressed.current.has("w"))
				newVelY -= speed;
			if (keysPressed.current.has("ArrowDown") || keysPressed.current.has("s"))
				newVelY += speed;
			if (keysPressed.current.has("ArrowLeft") || keysPressed.current.has("a"))
				newVelX -= speed;
			if (keysPressed.current.has("ArrowRight") || keysPressed.current.has("d"))
				newVelX += speed;

			// Apply friction 
			newVelX *= friction;
			newVelY *= friction;

			// Apply velocity
			pos.x += newVelX;
			pos.y += newVelY;

			// Boundaries
			const maxX = window.innerWidth - fishSize;
			const maxY = window.innerHeight - fishSize;

			if (pos.x < 0) pos.x = 0;
			if (pos.y < 0) pos.y = 0;
			if (pos.x > maxX) pos.x = maxX;
			if (pos.y > maxY) pos.y = maxY;

			// Update local state for render this took forever to figureout, lowkey had to ask dr.GPT
			setPosition({ ...pos });

			// Update socket position to server
			if (socketRef.current && myId) {
				socketRef.current.emit("move", pos);
				setPlayers((prev) => ({
					...prev,
					[myId]: { ...pos },
				}))
			}

			// Save new velocity
			velocityRef.x = newVelX;
			velocityRef.y = newVelY;
		}

		const interval = setInterval(move, 16); // ~60 FPS

		return () => {
			clearInterval(interval);
			window.removeEventListener("keydown", handleKeyDown);
			window.removeEventListener("keyup", handleKeyUp);
		}
	}, [myId]);

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
			<Ocean>
				{Object.entries(players)
					.filter(([id, pos]) => {
						// Only render players that have valid positions and a known socket ID
						if (!pos || typeof pos.x !== "number" || typeof pos.y !== "number")
							return false
						// Don't show your own fish until your ID is known and initialized
						if (id === myId && (!myId || (pos.x === 0 && pos.y === 0)))
							return false
						return true
					})
					.map(([id, pos]) => (
						<div
							key={id}
							style={{
								width: fishSize,
								height: fishSize,
								position: "absolute",
								left: pos.x,
								top: pos.y,
								borderRadius: "50%",
								transition: "left 0.1s linear, top 0.1s linear",
							}}
						>
							<img
								src="/favicon.ico"
								alt="fish"
								style={{
									width: "100%",
									height: "100%",
									opacity: id === myId ? 1 : 0.7,
									transform: id === myId ? "scale(1.1)" : "scale(1.0)",
									filter: id === myId ? "drop-shadow(0 0 5px yellow)" : "none",
								}}
							/>
						</div>
					))}
			</Ocean>
		</div>
	)
}
