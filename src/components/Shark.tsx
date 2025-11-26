interface SharkProps {
	x: number;
	y: number;
	direction?: 'left' | 'right';
	debug?: boolean;
}

export function Shark({ x = 100, y = 100, direction = 'right', debug = false }: SharkProps) {
	const size = 200;
	const hitboxSize = 70;
	
	return (
		<div
			className="shark-hitbox"
			style={{
				position: 'absolute',
				left: `${x}px`,
				top: `${y}px`,
				pointerEvents: 'none',
				transform: 'translate(-50%, -50%)',
			}}
		>
			<img
				src="/fishes/shark.gif"
				alt="shark"
				style={{
					display: 'block',
					width: `${size}px`,
					height: `${size}px`,
					objectFit: 'contain',
					transform: direction === 'left' ? 'scaleX(-1)' : 'none',
				}}
			/>
			{debug && (
				<>
					<div
						style={{
							position: 'absolute',
							left: '50%',
							top: '50%',
							transform: 'translate(-50%, -50%)',
							width: `${hitboxSize}px`,
							height: `${hitboxSize}px`,
							border: '2px solid red',
							boxSizing: 'border-box',
							pointerEvents: 'none',
						}}
					/>
					<div
						style={{
							position: 'absolute',
							top: '50%',
							left: '50%',
							transform: 'translate(-50%, calc(-50% - 20px))',
							fontSize: '10px',
							color: 'red',
							backgroundColor: 'rgba(0, 0, 0, 0.7)',
							padding: '2px 4px',
							borderRadius: '2px',
							whiteSpace: 'nowrap',
							pointerEvents: 'none',
						}}
					>
						{hitboxSize}×{hitboxSize}
					</div>
				</>
			)}
		</div>
	);
}

