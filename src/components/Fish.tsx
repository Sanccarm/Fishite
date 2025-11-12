interface FishProps {
	clientId?: string;
    x: number;
	y: number;
    character?: string;
    nickname?: string;
    size?: number;
    direction?: 'left' | 'right';
}

export function Fish({ x = 100, y = 100, clientId: _clientId, character, nickname = 'Anonymous', size = 50, direction = 'right'}: FishProps) {
	// Determine which GIF to use based on character, default to pinkfish
	const gifPath = character 
		? `/fishes/${character}.gif` 
		: '/fishes/big_fish.gif';

	return (
		<div
			className="fish-hitbox"
			style={{
				position: 'absolute',
				left: `${x}px`,
				top: `${y}px`,
				width: `${size}px`,
				pointerEvents: 'none',
			}}
		>
			<img
				src={gifPath}
				alt="fish"
				style={{
					width: `${size}px`,
					height: `${size}px`,
					objectFit: 'contain',
					transform: direction === 'left' ? 'scaleX(-1)' : 'none',
				}}
			/>
			{nickname && (
				<div
					style={{
						position: 'absolute',
						top: `${size - 5}px`,
						left: '50%',
						transform: 'translateX(-50%)',
						whiteSpace: 'nowrap',
						fontSize: '12px',
						color: 'white',
						textShadow: '1px 1px 2px rgba(0, 0, 0, 0.8)',
						fontWeight: 'bold',
					}}
				>
					{nickname}
				</div>
			)}
		</div>
	);
}

