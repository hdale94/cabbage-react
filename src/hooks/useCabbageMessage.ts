import { useState, useEffect } from "react";

/**
 * Custom hook to get a message from Cabbage backend.
 * This hook listens to messages sent from the backend and updates the local state
 * whenever new data is received.
 * @param messageId
 */
export const useCabbageMessage = <T>(messageId: string) => {
	const [data, setData] = useState<T>();

	// Sync message with external updates
	useEffect(() => {
		const handleMessage = (event: MessageEvent) => {
			const { data, type } = event;

			if (data && type === "message") {
				if (data.id !== messageId) return;

				console.log(
					`[Cabbage-React] Received data for messageId ${data.id}`,
					data,
				);

				setData(data);
			}
		};

		window.addEventListener("message", handleMessage);

		return () => {
			window.removeEventListener("message", handleMessage);
		};
	}, []);

	return {
		data,
	};
};
