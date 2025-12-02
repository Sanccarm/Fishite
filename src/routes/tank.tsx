import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState, useEffect, useRef } from "react";
import { io } from "socket.io-client";
import { Ocean } from "../components/Ocean";
import { Fish } from "../components/Fish";
import { Shark } from "../components/Shark";
import { ChatMessage } from "../components/ChatMessage";
import Bubble from "../components/ui/bubble";

export const Route = createFileRoute("/tank")({
	component: App,
});

// Get or generate uid from localStorage
function getOrCreateUid(): string {
	const stored = localStorage.getItem("playerUid");
	if (stored) {
		return stored;
	}
	const newUid = crypto.randomUUID();
	localStorage.setItem("playerUid", newUid);
	return newUid;
}

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
	const uid = getOrCreateUid();
	const navigate = useNavigate();

	// Chat state
	const [messages, setMessages] = useState<
		Record<string, {
			id: string;
			senderId: string;
			senderNickname: string;
			text: string;
			timestamp: number;
		}>
	>({});

    

	const keysPressed = useRef(new Set<string>());
	const posRef = useRef({ x: 100, y: 100 });
	const directionRef = useRef<'left' | 'right'>('right');
	const posInitialized = useRef(false);
	const fishSize = 50;
	const [bubbles, setBubbles] = useState<Record<string, { x: number; y: number }>>({});
	const [debugMode, setDebugMode] = useState(false);
	const [shark, setShark] = useState<{ x: number; y: number; active: boolean } | null>(null);
	const [showWarning, setShowWarning] = useState(false);
	

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
			// Send player info (uid, nickname and character) to server
			if (nickname && character) {
				socket.emit("playerInfo", { uid, nickname, character });
			}
		});

		socket.on("init", (playersMap: Record<string, { 
			position: { x: number; y: number };
			nickname?: string | null;
			character?: string | null;
			direction?: 'left' | 'right';
		}>) => {
			setPlayers(playersMap);
			setMyId(uid);
			// Sync local position with server position if available
			if (uid && playersMap[uid]?.position) {
				posRef.current.x = playersMap[uid].position.x;
				posRef.current.y = playersMap[uid].position.y;
				directionRef.current = playersMap[uid].direction || 'right';
				posInitialized.current = true;
			}
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

		// Chat messages
		socket.on("chatMessageReceived", ({ id, senderId, senderNickname, text, timestamp }) => {
			setMessages((prev) => ({
				...prev,
				[id]: { id, senderId, senderNickname, text, timestamp },
			}));
		});

		socket.on("chatMessageRemoved", ({ id }) => {
			setMessages((prev) => {
				const copy = { ...prev };
				delete copy[id];
				return copy;
			});
		});

		// Shark events
		socket.on("sharkEventStart", ({ x, y }: { x: number; y: number }) => {
			setShark({ x, y, active: true });
			setShowWarning(true);
		});

		socket.on("sharkPosition", ({ x, y }: { x: number; y: number }) => {
			setShark((prev) => {
				if (!prev) return null;
				return { ...prev, x, y };
			});
		});

		socket.on("sharkEventEnd", () => {
			setShark((prev) => {
				if (!prev) return null;
				return { ...prev, active: false };
			});
		});

		return () => {
			socket.disconnect();
		}
	}, [uid, nickname, character]);

	// Hide warning after 2 seconds
	useEffect(() => {
		if (showWarning) {
			const timer = setTimeout(() => {
				setShowWarning(false);
			}, 2000);
			return () => clearTimeout(timer);
		}
	}, [showWarning]);

	useEffect(() => {
		const handleKeyDown = (e: KeyboardEvent) => {
			const rawKey = e.key;
			const key = rawKey.startsWith("Arrow") ? rawKey : rawKey.toLowerCase();
			keysPressed.current.add(key);

			// Toggle debug mode on backslash press
			if (rawKey === "\\" || rawKey === "Backslash") {
				e.preventDefault();
				setDebugMode((prev) => !prev);
				return;
			}

			// Emit bubble on space press but avoid interfering with focused form controls
			const isSpace = rawKey === " " || rawKey === "Spacebar" || rawKey.toLowerCase() === "space";
			if (isSpace) {
				const active = document.activeElement as HTMLElement | null;
				const activeTag = active?.tagName ?? "";
				// Allow normal space behavior only for text entry controls, but treat range inputs (volume sliders)
				// as non-text so Space will spawn bubbles instead of moving the slider.
				let isTextControl = false;
				if (active) {
					if (activeTag === "TEXTAREA" || activeTag === "SELECT") isTextControl = true;
					if (activeTag === "INPUT") {
						const type = (active.getAttribute("type") || "").toLowerCase();
						// treat range (sliders) as non-text controls so Space spawns bubbles
						if (type !== "range") isTextControl = true;
					}
					if (active.isContentEditable) isTextControl = true;
				}
				if (isTextControl) return; // let normal behavior occur for typing controls

				// Prevent default so space doesn't toggle focused buttons (e.g., header play)
				e.preventDefault();
				e.stopPropagation();

				// pos is the local position in this scope
				// spawn bubble closer to the fish (near the mouth/top-center)
				const bubbleX = pos.x - fishSize / 2 - 10;
				const bubbleY = pos.y + Math.round(fishSize * 1);
				if (socketRef.current && myId) {
					socketRef.current.emit("bubbleCreate", { x: bubbleX, y: bubbleY });
				}
			}
		}

		const handleKeyUp = (e: KeyboardEvent) => {
			const rawKey = e.key;
			const key = rawKey.startsWith("Arrow") ? rawKey : rawKey.toLowerCase();
			keysPressed.current.delete(key);
		}

		window.addEventListener("keydown", handleKeyDown);
		window.addEventListener("keyup", handleKeyUp);

		// Use refs for smooth updates without stale state
		const velocityRef = { x: 0, y: 0 };
		const pos = posRef.current;
		const ACCELERATION = 1.5; // must be greater than 0
		const SPEED = 7;
		const FRICTION = 0.9; // must be less than 1
		let direction = directionRef.current;

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
				directionRef.current = 'left';
			} else if (velocityRef.x > 0.1) {
				direction = 'right';
				directionRef.current = 'right';
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
			// Only send updates after we've received initial position from server
			if (socketRef.current && myId && posInitialized.current) {
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

	// Handle chat message send from header
	useEffect(() => {
		const handleSendChat = (event: Event) => {
			const customEvent = event as CustomEvent;
			const { text } = customEvent.detail;
			if (socketRef.current && myId) {
				socketRef.current.emit("chatMessage", { text });
			}
		};

		window.addEventListener('sendChat', handleSendChat);
		return () => window.removeEventListener('sendChat', handleSendChat);
	}, [myId]);

	return (
		<div
			className="water-background"
			style={{
				width: "100vw",
				height: "100vh",
				maxHeight: "1200px",
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
								transform: id === myId ? "scale(1)" : "scale(1)",
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
								direction={playerData.direction as 'left' | 'right'}
								debug={debugMode}
							/>
							{/* Render chat messages above this fish */}
							{Object.entries(messages)
								.filter(([_, msg]) => msg.senderId === id)
								.map(([msgId, msg]) => (
									<ChatMessage
										key={msgId}
										id={msgId}
										text={msg.text}
										x={playerData.position.x}
										y={playerData.position.y}
										timestamp={msg.timestamp}
									/>
								))}
						</div>
					))}

				{Object.entries(bubbles).map(([id, b]) => (
					<Bubble key={id} id={id} x={b.x} y={b.y} size={12} />
				))}

				{shark?.active && (
					<Shark x={shark.x} y={shark.y} direction="right" debug={debugMode} />
				)}

				{showWarning && (
					<img
						src="/warning.gif"
						alt="Warning"
						style={{
							position: 'absolute',
							left: '20px',
							top: '50%',
							transform: 'translateY(-50%)',
							zIndex: 1000,
							pointerEvents: 'none',
						}}
					/>
				)}
			</Ocean>
		</div>
	)
}
