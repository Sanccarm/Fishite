import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState, useEffect, useRef } from "react";
import { io } from "socket.io-client";
import { Ocean } from "../components/Ocean";
import { Fish } from "../components/Fish";

export const Route = createFileRoute("/tank")({
	component: App,
});

export default function App() {
	// biome-ignore lint/suspicious/noExplicitAny: <>
	const socketRef = useRef<any>(null);
	const [players, setPlayers] = useState<
		Record<string, { 
			position: { x: number; y: number };
			nickname?: string | null;
			character?: string | null;
			direction?: 'left' | 'right';
		}>
	>({});
	const [myId, setMyId] = useState<string | null>(null);
	const nickname = localStorage.getItem("playerNickname");
	const character = localStorage.getItem("playerCharacter");
	const navigate = useNavigate();

	const keysPressed = useRef(new Set<string>());
	const fishSize = 50;
	const speed = 1.5;
	const friction = 0.9;

	// Redirect to start page if nickname or character is missing
	useEffect(() => {
		if (!nickname || !character) {
			navigate({ to: "/start" });
			return;
		}
	}, [nickname, character, navigate]);

	useEffect(() => {
		// Don't connect if missing nickname or character
		if (!nickname || !character) return;
		
		const socket = io("http://localhost:8080"); // https://fishsever-1074820372233.us-east1.run.app
		socketRef.current = socket;

		socket.on("connect", () => {
			console.log("Connected to fish server 🐠");
			// Send player info (nickname and character) to server
			if (nickname && character) {
				socket.emit("playerInfo", { nickname, character });
			}
		});

		socket.on("init", (playersMap: Record<string, { 
			position: { x: number; y: number };
			nickname?: string | null;
			character?: string | null;
			direction?: 'left' | 'right';
		}>) => {
			setPlayers(playersMap);
			setMyId(socket.id ?? null);
		})

		socket.on("playerJoined", ({ id, position, nickname, character, direction }) => {
			setPlayers((prev) => ({
				...prev,
				[id]: { position, nickname, character, direction},
			}));
		})

		socket.on("playerMoved", ({ id, position, nickname, character, direction }) => {
			setPlayers((prev) => {
				const prevPlayer = prev[id];
				return {
					...prev,
					[id]: { 
						position, 
						nickname: nickname || prevPlayer?.nickname, 
						character: character || prevPlayer?.character, 
						direction: direction || prevPlayer?.direction || 'right'
					},
				};
			});
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
		const maxVelocity = 10;
		let direction = 'right';

		const move = () => {
			let newVelX = velocityRef.x;
			let newVelY = velocityRef.y;
			let newDirection = direction as 'left' | 'right';
			
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

			//max velocity
			newVelX = Math.max(Math.min(newVelX, maxVelocity), -maxVelocity);
			newVelY = Math.max(Math.min(newVelY, maxVelocity), -maxVelocity);

			// Apply velocity
			pos.x += newVelX;
			pos.y += newVelY;

			// Update direction
			if (newVelX < -0.1) {
				newDirection = 'left';
			} else if (newVelX > 0.1) {
				newDirection = 'right';
			}

			// Save new velocity
			velocityRef.x = newVelX;
			velocityRef.y = newVelY;

			// Boundaries
			const maxX = window.innerWidth - fishSize;
			const maxY = window.innerHeight - fishSize;

			if (pos.x < 0) pos.x = 0;
			if (pos.y < 0) pos.y = 0;
			if (pos.x > maxX) pos.x = maxX;
			if (pos.y > maxY) pos.y = maxY;


			// Update socket position to server
			// Server will send back direction in playerMoved event
			if (socketRef.current && myId) {
				socketRef.current.emit("move", pos, newDirection);
				setPlayers((prev) => {
					const current = prev[myId];
					return {
						...prev,
						[myId]: {
							position: pos,
							nickname: current?.nickname || nickname,
							character: current?.character || character,
							direction: newDirection as 'left' | 'right'
						},
					};
				})
			}
			
		}

		const interval = setInterval(move, 16); // ~60 FPS

		return () => {
			clearInterval(interval);
			window.removeEventListener("keydown", handleKeyDown);
			window.removeEventListener("keyup", handleKeyUp);
		}
	}, [myId, nickname, character]);

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
					.filter(([id, playerData]) => {
						// Only render players that have valid positions and a known socket ID
						if (!playerData || !playerData.position || 
							typeof playerData.position.x !== "number" || 
							typeof playerData.position.y !== "number")
							return false
						// Don't show your own fish until your ID is known and initialized
						if (id === myId && (!myId || (playerData.position.x === 0 && playerData.position.y === 0)))
							return false
						return true
					})
					.sort(([idA], [idB]) => {
						// Always render your own fish last so it appears on top
						if (idA === myId) return 1;
						if (idB === myId) return -1;
						return 0;
					})
					.map(([id, playerData]) => (
						<div
							key={id}
							style={{
								opacity: id === myId ? 0.9 : 0.75,
								transform: id === myId ? "scale(1.1)" : "scale(1.0)",
								filter: id === myId ? "drop-shadow(0 0 5px yellow)" : "none",
								transition: "opacity 0.1s linear, transform 0.1s linear",
								
							}}
						>
							<Fish
								x={playerData.position.x}
								y={playerData.position.y}
								clientId={id}
								character={playerData.character || undefined}
								nickname={playerData.nickname || undefined}
								size={50}
								direction={playerData.direction as 'left' | 'right'}
							/>
						</div>
					))}
			</Ocean>
		</div>
	)
}
