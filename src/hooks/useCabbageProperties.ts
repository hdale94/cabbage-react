import { useEffect, useState } from "react";

/**
 * Custom hook to get a parameter's properties from Cabbage backend.
 * This hook listens for updates to parameter properties from the backend and updates the local state
 * whenever new data is received.
 * @param channelId
 * @param onPropertiesUpdate - Callback fires immediately when receiving an update to properties (synchronous - bypasses state batching)
 * @param options - Optional configuration
 * @param options.skip - When true, the hook returns a NOP state and never registers listeners
 */
export const useCabbageProperties = (
	channelId: string,
	onPropertiesUpdate?: (properties: Record<string, any>) => void,
	options?: { skip?: boolean },
) => {
	// Early return when channelId is empty string or skip-option is set to true
	if (!channelId || options?.skip) return { properties: undefined };

	const [properties, setProperties] = useState<Record<string, any>>();

	// Sync properties with external updates
	useEffect(() => {
		const handleMessage = (event: MessageEvent) => {
			const { id: incomingChannelId, widgetJson, command } = event.data;

			if (incomingChannelId !== channelId) return;

			if (widgetJson && command === "widgetUpdate") {
				const parsedData = JSON.parse(widgetJson);

				console.log(
					`[Cabbage-React] Received properties for channelId: ${incomingChannelId}`,
					parsedData,
				);

				if (onPropertiesUpdate) onPropertiesUpdate(parsedData);
				setProperties(parsedData);
			}
		};

		window.addEventListener("message", handleMessage);

		return () => window.removeEventListener("message", handleMessage);
	}, [channelId, onPropertiesUpdate]);

	return { properties };
};
