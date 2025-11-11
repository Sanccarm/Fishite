interface FishProps {
	clientId?: string;
    x?: number;
	y?: number;
    z?: number;
    character?: string;
}

export function Fish({ x = 100, y = 100, clientId: _clientId, character, z }: FishProps) {
	// Determine which GIF to use based on character, default to pinkfish
	const gifPath = character 
		? `/fishes/${character}.gif` 
		: '/fishes/pinkfish.gif';

	return (
		<div
			className="fish-hitbox"
			style={{
				position: 'absolute',
				left: `${x}px`,
				top: `${y}px`,
				width: '50px',
				height: '50px',
				pointerEvents: 'none',
				zIndex: z,
			}}
		>
			<img
				src={gifPath}
				alt="fish"
				style={{
					width: '100%',
					height: '100%',
					objectFit: 'contain',
				}}
			/>
		</div>
	);
}

