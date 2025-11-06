import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/")({
	component: App,
});

function App() {
	return (
	<div className="water-background">
      <div className="light-rays"></div>
			<div className="ocean-floor">
				<div className="sand-texture">
				</div>
			</div>
		</div>
	);
}
