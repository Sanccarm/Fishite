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

export function Fish({ x = 100, y = 100, clientId: _clientId, character, nickname = 'Anonymous', direction = 'right', debug = false, imageSize = 50}: FishProps) {
	const hitboxSize = 35;
	
	// Determine which GIF to use based on character, default to big_fish.gif
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
				pointerEvents: 'none',
				transform: 'translate(-50%, -50%)',
			}}
		>
			<img
				src={gifPath}
				alt="fish"
				style={{
					display: 'block',
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
							left: '50%',
							top: '50%',
							transform: 'translate(-50%, -50%)',
							width: `${hitboxSize}px`,
							height: `${hitboxSize}px`,
							border: '2px solid green',
							boxSizing: 'border-box',
							pointerEvents: 'none',
						}}/>
			)}
			{nickname && (
				<div
					style={{
						position: 'absolute',
						top: '50%',
						left: '50%',
						transform: `translate(-50%, calc(50% + ${imageSize / 2}px - 5px))`,
						whiteSpace: 'nowrap',
						fontSize: '12px',
						color: 'white',
						textShadow: '1px 1px 2px rgba(0, 0, 0, 0.73)',
						fontWeight: 'bold',
						pointerEvents: 'none',
					}}
				>
					{nickname}
				</div>
			)}
		</div>
	);
}

