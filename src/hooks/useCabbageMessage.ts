import { useEffect, useRef, useState } from "react";
import { createCabbageDebugger } from "../utils/cabbageDebug.js";

/**
 * Custom hook to get the latest message for a specific type from Cabbage backend.
 * This hook listens to messages sent from the backend and updates the local state
 * whenever new data is received.
 * @param messageType - The value of the `type` property in the incoming message object to listen for.
 * @param options - Optional configuration
 * @param options.onMessage - Callback fires immediately when receiving a new message (synchronous - bypasses state batching)
 * @param options.skip - When true, the hook returns a NOP state and never registers listeners
 * @param options.debug - When true, logs incoming messages for this hook to the console for debugging
 */
export const useCabbageMessage = <T>(
	messageType: string,
	options?: {
		onMessage?: (message: T) => void;
		skip?: boolean;
		debug?: boolean;
	},
) => {
	// Early return when messageType is empty string or skip-option is set to true
	if (!messageType || options?.skip) return { message: undefined };

	// Use ref to ensure effects always call the current debug function.
	// This avoids stale closures when options.debug changes after effects mount.
	const debugRef = useRef<ReturnType<typeof createCabbageDebugger> | undefined>(
		undefined,
	);
	debugRef.current = createCabbageDebugger(messageType, options?.debug);

	const [message, setMessage] = useState<T>();

	useEffect(() => {
		const handleMessage = (event: MessageEvent) => {
			const { data, type } = event;
			if (!data || type !== "message") return;
			if (data.type !== messageType) return;

			debugRef.current?.("Received data", data);
			if (options?.onMessage) options.onMessage(data);
			setMessage(data);
		};

		window.addEventListener("message", handleMessage);

		return () => window.removeEventListener("message", handleMessage);
	}, [messageType, options?.onMessage]);

	return { message };
};
