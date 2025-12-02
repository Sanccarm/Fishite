import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/")({
	beforeLoad: () => {
		const uid = localStorage.getItem("playerUid");
		
		if (!uid) {
			// No UID found, redirect to start page
			throw redirect({
				to: "/start",
			});
		}
		
		// UID exists, redirect to tank
		throw redirect({
			to: "/tank",
		});
	},
});

