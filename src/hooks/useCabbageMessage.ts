import { useState, useEffect } from "react";

/**
 * Custom hook to get the latest message for a specific type from Cabbage backend.
 * This hook listens to messages sent from the backend and updates the local state
 * whenever new data is received.
 * @param messageType
 */
export const useCabbageMessage = <T>(messageType: string) => {
	const [data, setData] = useState<T>();

	// Sync message with external updates
	useEffect(() => {
		const handleMessage = (event: MessageEvent) => {
			const { data, type } = event;

			if (data && type === "message") {
				if (data.type !== messageType) return;

				console.log(
					`[Cabbage-React] Received data for messageType: ${data.type}`,
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
