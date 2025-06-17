import { useState, useEffect } from "react";

/**
 * Custom hook to get a parameter's properties from Cabbage.
 * This hook listens for updates to parameter properties via Cabbage and updates the local state
 * whenever new data is received.
 */
export const useCabbageProperties = (channel: string) => {
	const [properties, setProperties] = useState<Record<string, any>>();

	// Sync form data with external updates from Cabbage
	useEffect(() => {
		const handleMessage = (event: MessageEvent) => {
			const { data } = event;

			if (data.channel !== channel) return;

			if (data.data && data.command === "widgetUpdate") {
				const parsedData = JSON.parse(data.data);

				console.log(
					`[Cabbage-React] ${data.command}: Received properties for channel: ${data.channel}`,
					parsedData
				);

				setProperties(parsedData);
			}
		};

		window.addEventListener("message", handleMessage);

		return () => {
			window.removeEventListener("message", handleMessage);
		};
	}, []);

	return {
		properties,
	};
};
