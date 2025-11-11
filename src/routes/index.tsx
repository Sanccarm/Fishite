/** biome-ignore-all lint/a11y/useKeyWithClickEvents: <Being dumb> */
/** biome-ignore-all lint/a11y/noStaticElementInteractions: <Being dumb> */
import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { Ocean } from "../components/Ocean";

export const Route = createFileRoute("/")({
	component: App,
});

function App() {
	const wsRef = useRef<WebSocket | null>(null);
	const [clientId, setClientId] = useState<string | null>(null);

	useEffect(() => {
		const ws = new WebSocket("ws://localhost:3000/ws");

		ws.onopen = () => {
			console.log("WebSocket connected (client)");
		};

		ws.onmessage = (event) => {
			try {
				const data = JSON.parse(event.data);
				console.log("Message from server (client):", data);

				// Store UUID when received in welcome message
				if (data.type === "welcome" && data.clientId) {
					setClientId(data.clientId);
					console.log("Client ID assigned:", data.clientId);
				}
			} catch (err) {
				console.error("Error parsing server message:", err);
			}
		};

		ws.onclose = () => {
			console.log("WebSocket closed (client)");
		};

		ws.onerror = (err) => {
			console.error("WebSocket error (client):", err);
		};

		wsRef.current = ws;

		return () => {
			ws.close();
		};
	}, []);

	const handleClick = (e: React.MouseEvent<HTMLDivElement>) => {
		const ws = wsRef.current;
		if (ws && ws.readyState === WebSocket.OPEN) {
			if (!clientId) {
				console.warn("No client ID yet — waiting for server welcome message");
				return;
			}

			const rect = (e.currentTarget as HTMLDivElement).getBoundingClientRect();
			const x = e.clientX - rect.left;
			const y = e.clientY - rect.top;

			const payload = { type: "click", x, y, clientId };
			ws.send(JSON.stringify(payload));
			console.log("Sent click:", payload);
		}
	};

	return (
		// \/ Do not touch this div, work inside of it \/
		<div onClick={handleClick} style={{ width: "100vw", height: "100vh", background: "#eee" }}> 
			<Ocean>
				<div className="sand-texture"></div>
			</Ocean>
		</div>)
}
