import type { ReactNode } from "react";

interface OceanProps {
	children?: ReactNode;
}

export function Ocean({ children }: OceanProps) {
	return (
		<div className="water-background">
			<div className="light-rays"></div>
            {children}
			<div className="ocean-floor">
				<div className="sand-texture"></div>
			</div>
		</div>
	);
}

