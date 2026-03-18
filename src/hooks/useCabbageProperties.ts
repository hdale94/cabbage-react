import { useEffect, useRef, useState } from "react";
import { createCabbageDebugger } from "../utils/cabbageDebug.js";

/**
 * Custom hook to get a parameter's properties from Cabbage backend.
 * This hook listens for updates to parameter properties from the backend and updates the local state
 * whenever new data is received.
 * @param channelId
 * @param options - Optional configuration
 * @param options.onPropertiesUpdate - Callback fires immediately when receiving an update to properties (synchronous - bypasses state batching)
 * @param options.skip - When true, the hook returns a NOP state and never registers listeners
 * @param options.debug - When true, logs incoming updates to properties for this hook to the console for debugging
 */
export const useCabbageProperties = (
	channelId: string,
	options?: {
		onPropertiesUpdate?: (properties: Record<string, any>) => void;
		skip?: boolean;
		debug?: boolean;
	},
) => {
	// Early return when channelId is empty string or skip-option is set to true
	if (!channelId || options?.skip) return { properties: undefined };

	// Use ref to ensure effects always call the current debug function.
	// This avoids stale closures when options.debug changes after effects mount.
	const debugRef = useRef<ReturnType<typeof createCabbageDebugger> | undefined>(
		undefined,
	);
	debugRef.current = createCabbageDebugger(channelId, options?.debug);

	const [properties, setProperties] = useState<Record<string, any>>();

	// Sync properties with external updates
	useEffect(() => {
		const handleMessage = (event: MessageEvent) => {
			const { id: incomingChannelId, widgetJson, command } = event.data;

			if (incomingChannelId !== channelId) return;

			if (widgetJson && command === "widgetUpdate") {
				const parsedData = JSON.parse(widgetJson);

				debugRef.current?.("Received properties", parsedData);
				if (options?.onPropertiesUpdate) options.onPropertiesUpdate(parsedData);
				setProperties(parsedData);
			}
		};

		window.addEventListener("message", handleMessage);

		return () => window.removeEventListener("message", handleMessage);
	}, [channelId, options?.onPropertiesUpdate]);

	return { properties };
};
