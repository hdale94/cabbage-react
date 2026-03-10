import { useState, useEffect } from "react";

/**
 * Custom hook to get the latest message for a specific type from Cabbage backend.
 * This hook listens to messages sent from the backend and updates the local state
 * whenever new data is received.
 * @param messageType - The value of the `type` property in the incoming message object to listen for.
 * @param onMessage - Callback fires immediately when receiving a new message (synchronous - bypasses state batching)
 * @param options - Optional configuration
 * @param options.skip - When true, the hook returns a NOP state and never registers listeners
 */
export const useCabbageMessage = <T>(
	messageType: string,
	onMessage?: (message: T) => void,
	options?: { skip?: boolean },
) => {
	// Early return when messageType is empty string or skip-option is set to true
	if (!messageType || options?.skip) return { message: undefined };

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
