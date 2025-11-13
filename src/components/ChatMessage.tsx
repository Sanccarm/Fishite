import { useEffect, useState } from 'react';

interface ChatMessageProps {
	id: string;
	text: string;
	x: number;
	y: number;
	timestamp: number;
	ttlMs?: number;
}

export function ChatMessage({
	id,
	text,
	x,
	y,
	timestamp,
	ttlMs = 6000,
}: ChatMessageProps) {
	const [opacity, setOpacity] = useState(1);

	useEffect(() => {
		const createdAt = timestamp;
		const now = Date.now();
		const elapsed = now - createdAt;
		const fadeStartMs = ttlMs * 0.7; // Start fading at 70% of TTL

		// Set initial opacity
		if (elapsed > fadeStartMs) {
			const fadeProgress = (elapsed - fadeStartMs) / (ttlMs - fadeStartMs);
			setOpacity(Math.max(0, 1 - fadeProgress));
		}

		// Animate fade out
		const interval = setInterval(() => {
			const now = Date.now();
			const elapsed = now - createdAt;

			if (elapsed >= ttlMs) {
				setOpacity(0);
				clearInterval(interval);
				return;
			}

			if (elapsed > fadeStartMs) {
				const fadeProgress = (elapsed - fadeStartMs) / (ttlMs - fadeStartMs);
				setOpacity(Math.max(0, 1 - fadeProgress));
			}
		}, 50);

		return () => clearInterval(interval);
	}, [timestamp, ttlMs, id]);

	return (
		<div
			style={{
				position: 'absolute',
				left: `${x + 30}px`,
				top: `${y - 40}px`,
				maxWidth: '200px',
				padding: '6px 10px',
				borderRadius: '8px',
				backgroundColor: 'rgba(100, 150, 200, 0.9)',
				color: 'black',
				fontSize: '13px',
				fontWeight: '600',
				textShadow: '2px 2px 4px rgba(255, 255, 255, 0.8)',
				whiteSpace: 'normal',
				wordWrap: 'break-word',
				pointerEvents: 'none',
				opacity,
				transition: 'opacity 0.05s linear',
				zIndex: 10,
				border: '1px solid rgba(150, 200, 255, 0.6)',
				boxShadow: '0 2px 8px rgba(0, 0, 0, 0.3)',
				textAlign: 'center',
				transform: 'translateX(-50%)',
			}}
		>
			{text}
		</div>
	);
}
