import { useState, useEffect } from "react";

/**
 * Custom hook to get a message from Cabbage backend.
 * This hook listens to messages sent from the backend and updates the local state
 * whenever new data is received.
 * @param channelId
 */
export const useCabbageMessage = <T>(channelId: string) => {
	const [message, setMessage] = useState<T>();

	// Sync message with external updates
	useEffect(() => {
		const handleMessage = (event: MessageEvent) => {
			const { id: incomingChannelId, widgetJson, command } = event.data;

			if (incomingChannelId !== channelId) return;

			if (widgetJson && command === "widgetUpdate") {
				const parsedData = JSON.parse(widgetJson);

				console.log(
					`[Cabbage-React] Received message for channelId ${incomingChannelId}`,
					parsedData,
				);

				setMessage(parsedData);
			}
		};

		window.addEventListener("message", handleMessage);

		return () => {
			window.removeEventListener("message", handleMessage);
		};
	}, []);

	return {
		message,
	};
};
