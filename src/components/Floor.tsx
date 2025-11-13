interface FloorItemProps {
	image: string;
	x: number;
	y: number;
	width: number;
	height: number;
}

interface FloorProps {
	items?: FloorItemProps[];
}

export function Floor({ items = [] }: FloorProps) {
	return (
		<>
			{items.map((item, index) => (
				<div
					key={index}
					className="floor-item"
					style={{
						position: 'absolute',
						left: `${item.x}px`,
						bottom: `${item.y}px`,
						width: `${item.width}px`,
						height: `${item.height}px`,
						pointerEvents: 'none',
					}}
				>
					<img
						src={`/ocean-floor/${item.image}`}
						alt={item.image}
						style={{
							width: '100%',
							height: '100%',
							objectFit: 'contain',
						}}
					/>
				</div>
			))}
		</>
	);
}
