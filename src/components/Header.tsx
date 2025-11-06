import { Link } from "@tanstack/react-router";


export default function Header() {
	return (
		<div className="bg-primary w-full border-border border-b">
			<div className="flex justify-between mx-auto w-full">
				<Link to="/">
					<h1 className="font-bold text-4xl tracking-tighter text-secondary">Fishite</h1>
				</Link>
			</div>
		</div>
	);
}
