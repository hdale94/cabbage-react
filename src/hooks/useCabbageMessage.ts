import { useState, useEffect } from "react";

/**
 * Custom hook to get a message from Cabbage backend.
 * This hook listens to messages sent from the backend and updates the local state
 * whenever new data is received.
 * @param messageId
 */
export const useCabbageMessage = <T>(messageId: string) => {
	const [message, setMessage] = useState<T>();

	// Sync message with external updates
	useEffect(() => {
		const handleMessage = (event: MessageEvent) => {
			const { widgetJson, command } = event.data;

			if (widgetJson && command === "widgetUpdate") {
				const parsedData = JSON.parse(widgetJson);

				if (parsedData.id !== messageId) return;

				console.log(
					`[Cabbage-React] Received message for channelId ${parsedData.id}`,
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
