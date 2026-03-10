import { useEffect, useState } from "react";
import { Cabbage } from "../cabbage/cabbage.js";
import { useCabbageProperties } from "./useCabbageProperties.js";

/**
 * Custom hook to sync a parameter with Cabbage backend.
 * This hook listens for updates to a parameter value from the backend and
 * sends updates to the backend when the parameter value changes locally (e.g., through a UI slider).
 * @param channelId
 * @param gesture - The gesture type: "begin" (start of interaction), "value" (during interaction), "end" (end of continuous interaction), or "complete" (discrete action e.g. button click).
 * @param onValueUpdate - Callback fires immediately when receiving a value update (synchronous - bypasses state batching)
 * @param options - Optional configuration
 * @param options.skip - When true, the hook returns a NOP state and never registers listeners
 */
export const useCabbageState = <T>(
	channelId: string,
	gesture: "begin" | "value" | "end" | "complete" = "complete",
	onValueUpdate?: (value: T) => void,
	options?: { skip?: boolean },
) => {
	// Early return when channelId is empty string or skip-option is set to true
	if (!channelId || options?.skip)
		return { value: undefined, setValue: () => {} };

	const { properties } = useCabbageProperties(channelId);

	const [channelValue, setChannelValue] = useState<T>();
	const [paramIdx, setParamIdx] = useState<number>();

	const handleValueChange = (value: T) => {
		setChannelValue(value);

		Cabbage.sendControlData({
			channel: channelId,
			value: value as string | number,
			gesture,
		});
	};

	const applyValueUpdate = (value: T) => {
		if (onValueUpdate) onValueUpdate(value);
		setChannelValue(value);
	};

	// Set initial or default value
	useEffect(() => {
		// Find the specific properties of this channel in the channels-array
		const channelProperties = properties?.channels.find(
			(c: any) => c.id === channelId,
		);
		if (!channelProperties) return;

		// Set parameterIndex
		const parameterIndex = channelProperties.parameterIndex;
		if (paramIdx === undefined && parameterIndex !== undefined) {
			console.log(
				`[Cabbage-React] Received parameterIndex for channelId: ${channelProperties.id}`,
				parameterIndex,
			);
			setParamIdx(parameterIndex);
		}

		// Skip setting default/initial value if channel-value is already set
		if (channelValue !== undefined) return;

		const initialValue = channelProperties.range?.value;

		// Set default/initial value - when adding plugin to session, when reopening the plugin UI
		if (initialValue !== undefined && initialValue !== null) {
			console.log(
				`[Cabbage-React] Received initial value for channelId: ${channelProperties.id}`,
				initialValue,
			);

			applyValueUpdate(initialValue);
		}
	}, [properties]);

	// Sync value with external updates
	useEffect(() => {
		const handleMessage = (event: MessageEvent) => {
			const { command } = event.data;

			// Update local channel value-state when receiving changes - automation from a DAW, setting value in Csound
			if (command === "parameterChange") {
				const { value, paramIdx: incomingParameterIndex } = event.data.data;

				if (incomingParameterIndex !== paramIdx) return;
				if (value === null) return;

				console.log(
					`[Cabbage-React] Received parameterChange for parameterIndex: ${incomingParameterIndex}`,
					value,
				);
				applyValueUpdate(value);
			}
			// Handle batch updating - loading a preset, opening a session
			else if (command === "batchWidgetUpdate") {
				const widgets = event.data.widgets;
				const widget = widgets?.find((w: any) => w.id === channelId);
				if (!widget) return;

				const widgetJson = JSON.parse(widget.widgetJson);
				const channelProperties = widgetJson.channels.find(
					(c: any) => c.id === channelId,
				);
				const value = channelProperties?.range?.value;

				console.log(
					`[Cabbage-React] Received batch widget update for channelId: ${widget.id}`,
					value,
				);
				applyValueUpdate(value);
			}
		};

		window.addEventListener("message", handleMessage);

		return () => window.removeEventListener("message", handleMessage);
	}, [channelId, onValueUpdate, paramIdx]);

	return { value: channelValue, setValue: handleValueChange };
};
