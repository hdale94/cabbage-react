import { useState, useEffect } from "react";

/**
 * Custom hook to get a parameter's properties from Cabbage.
 * This hook listens for updates to parameter properties via Cabbage and updates the local state
 * whenever new data is received.
 */
export const useCabbageProperties = (channel: string) => {
	const [properties, setProperties] = useState<Record<string, any>>();

	// Sync properties with external updates
	useEffect(() => {
		const handleMessage = (event: MessageEvent) => {
			const { channel: incomingChannel, data, command } = event.data;

			if (incomingChannel !== channel) return;

			if (data && command === "widgetUpdate") {
				const parsedData = JSON.parse(data);

				console.log(
					`[Cabbage-React] ${command}: Received properties for channel: ${incomingChannel}`,
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
