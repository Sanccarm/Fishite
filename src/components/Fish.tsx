interface FishProps {
	clientId?: string;
    x: number;
	y: number;
    character?: string;
    nickname?: string;
    direction?: 'left' | 'right';
	imageSize?: number;
	debug?: boolean;
}

export function Fish({ x = 100, y = 100, clientId: _clientId, character, nickname = 'Anonymous', direction = 'right', debug = false, imageSize = 70}: FishProps) {
	const hitboxSize = 35;
	
	// Determine which GIF to use based on character, default to pinkfish
	const gifPath = character 
		? `/fishes/${character}.gif` 
		: '/fishes/big_fish.gif';

	return (
		<div
			className="fish-hitbox"
			style={{
				position: 'absolute',
				left: `${x - hitboxSize / 2}px`,
				top: `${y - hitboxSize / 2}px`,
				width: `${hitboxSize}px`,
				height: `${hitboxSize}px`,
				pointerEvents: 'none',
				border: debug ? '2px solid green' : 'none',
				boxSizing: 'border-box',
				display: 'flex',
				alignItems: 'center',
				justifyContent: 'center',
			}}
		>
			<img
				src={gifPath}
				alt="fish"
				style={{
					width: `${imageSize}px`,
					height: `${imageSize}px`,
					objectFit: 'contain',
					transform: direction === 'left' ? 'scaleX(-1)' : 'none',
				}}
			/>
			{debug && (
				<div
					style={{
						position: 'absolute',
						top: '-20px',
						left: '50%',
						transform: 'translateX(-50%)',
						fontSize: '10px',
						color: 'green',
						backgroundColor: 'rgba(0, 0, 0, 0.7)',
						padding: '2px 4px',
						borderRadius: '2px',
						whiteSpace: 'nowrap',
					}}
				>
					{hitboxSize}×{hitboxSize}
				</div>
			)}
			{nickname && (
				<div
					style={{
						position: 'absolute',
						top: `${hitboxSize / 2 + imageSize / 2 - 5}px`,
						left: '50%',
						transform: 'translateX(-50%)',
						whiteSpace: 'nowrap',
						fontSize: '12px',
						color: 'white',
						textShadow: '1px 1px 2px rgba(0, 0, 0, 0.73)',
						fontWeight: 'bold',
					}}
				>
					{nickname}
				</div>
			)}
		</div>
	);
}

