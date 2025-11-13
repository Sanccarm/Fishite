import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState, useEffect, useRef } from "react";
import { io } from "socket.io-client";
import { Ocean } from "../components/Ocean";
import { Fish } from "../components/Fish";
import Bubble from "../components/ui/bubble";

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
	const [bubbles, setBubbles] = useState<Record<string, { x: number; y: number }>>({});
	

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

		// Bubbles: spawn, update, remove
 		socket.on("bubbleSpawned", ({ id, x, y }) => {
 			setBubbles((prev) => ({ ...prev, [id]: { x, y } }));
 		});

 		socket.on("bubblesUpdate", (updates: Array<{ id: string; x: number; y: number }>) => {
 			setBubbles((prev) => {
 				const copy = { ...prev };
 				for (const u of updates) copy[u.id] = { x: u.x, y: u.y };
 				return copy;
 			});
 		});

 		socket.on("bubbleRemoved", ({ id }) => {
 			setBubbles((prev) => {
 				const copy = { ...prev };
 				delete copy[id];
 				return copy;
 			});
 		});

		return () => {
			socket.disconnect();
		}
	}, []);

	useEffect(() => {
		const handleKeyDown = (e: { key: string }) => {
			const key = e.key.startsWith("Arrow") ? e.key : e.key.toLowerCase();
			keysPressed.current.add(key);

			// Emit bubble on space press
			if (e.key === " " || e.key === "Spacebar" || e.key.toLowerCase() === "space") {
				// pos is the local position in this scope
				// spawn bubble closer to the fish (near the mouth/top-center)
				const bubbleX = pos.x - fishSize / 2 - 10;
				const bubbleY = pos.y + Math.round(fishSize * 1);
				if (socketRef.current && myId) {
					socketRef.current.emit("bubbleCreate", { x: bubbleX, y: bubbleY });
				}
			}
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
		const ACCELERATION = 1.5; // must be greater than 0
		const SPEED = 7;
		const FRICTION = 0.9; // must be less than 1
		let direction = 'right';

		const move = () => {
			
			// Accelerate while key pressed (works for arrow keys and wWASD)
			if (keysPressed.current.has("ArrowUp") || keysPressed.current.has("w"))
				velocityRef.y -= ACCELERATION * .55;
			if (keysPressed.current.has("ArrowDown") || keysPressed.current.has("s"))
				velocityRef.y += ACCELERATION * .55;
			if (keysPressed.current.has("ArrowLeft") || keysPressed.current.has("a"))
				velocityRef.x -= ACCELERATION;
			if (keysPressed.current.has("ArrowRight") || keysPressed.current.has("d"))
				velocityRef.x += ACCELERATION;

			// Apply friction 
			velocityRef.x *= FRICTION;
			velocityRef.y *= FRICTION;

			//max velocity: SPEED
			velocityRef.x = Math.max(Math.min(velocityRef.x, SPEED), -SPEED);
			velocityRef.y = Math.max(Math.min(velocityRef.y, SPEED * .8), -(SPEED*.8));

			// Apply velocity
			pos.x += velocityRef.x;
			pos.y += velocityRef.y;

			// Update direction only when there's significant movement
			if (velocityRef.x < -0.1) {
				direction = 'left'; 
			} else if (velocityRef.x > 0.1) {
				direction = 'right'; 
			}

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
				socketRef.current.emit("move", pos, direction);
				setPlayers((prev) => {
					const current = prev[myId];
					return {
						...prev,
						[myId]: {
							position: pos,
							nickname: current?.nickname || nickname,
							character: current?.character || character,
							direction: direction as 'left' | 'right'
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

						{Object.entries(bubbles).map(([id, b]) => (
							<Bubble key={id} id={id} x={b.x} y={b.y} size={12} />
						))}
			</Ocean>
		</div>
	)
}
