import { useState, useEffect } from "react";

/**
 * Custom hook to get a parameter's properties from Cabbage.
 * This hook listens for updates to parameter properties via Cabbage and updates the local state
 * whenever new data is received.
 * @param channelId - The channel name
 */
export const useCabbageProperties = (channelId: string) => {
	const [properties, setProperties] = useState<Record<string, any>>();

	// Sync properties with external updates
	useEffect(() => {
		const handleMessage = (event: MessageEvent) => {
			const { id: incomingChannelId, widgetJson, command } = event.data;

			if (incomingChannelId !== channelId) return;

			if (widgetJson && command === "widgetUpdate") {
				const parsedData = JSON.parse(widgetJson);

				console.log(
					`[Cabbage-React] Received properties for channelId ${incomingChannelId}`,
					parsedData,
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
