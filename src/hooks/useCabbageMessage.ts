import { useState, useEffect } from "react";

/**
 * Custom hook to get the latest message for a specific type from Cabbage backend.
 * This hook listens to messages sent from the backend and updates the local state
 * whenever new data is received.
 * @param messageType - The value of the `type` property in the incoming message object to listen for.
 * @param onMessage - Callback fires immediately when receiving a new message (synchronous - bypasses state batching)
 */
export const useCabbageMessage = <T>(
	messageType: string,
	onMessage?: (message: T) => void,
) => {
	const [message, setMessage] = useState<T>();

	useEffect(() => {
		const handleMessage = (event: MessageEvent) => {
			const { data, type } = event;
			if (!data || type !== "message") return;
			if (data.type !== messageType) return;

			console.log(
				`[Cabbage-React] Received data for messageType: ${data.type}`,
				data,
			);

			if (onMessage) onMessage(data);
			setMessage(data);
		};

		window.addEventListener("message", handleMessage);

		return () => window.removeEventListener("message", handleMessage);
	}, [messageType, onMessage]);

	return { message };
};
