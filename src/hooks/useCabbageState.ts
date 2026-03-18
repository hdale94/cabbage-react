import { useEffect, useRef, useState } from "react";
import { Cabbage } from "../cabbage/cabbage.js";
import { useCabbageProperties } from "./useCabbageProperties.js";
import { createCabbageDebugger } from "../utils/cabbageDebug.js";

/**
 * Custom hook to sync a parameter with Cabbage backend.
 * This hook listens for updates to a parameter value from the backend and
 * sends updates to the backend when the parameter value changes locally (e.g., through a UI slider).
 * @param channelId
 * @param options - Optional configuration
 * @param options.onValueUpdate - Callback fires immediately when receiving a value update (synchronous - bypasses state batching)
 * @param options.skip - When true, the hook returns a NOP state and never registers listeners
 * @param options.debug - When true, logs incoming value updates for this hook to the console for debugging
 */
export const useCabbageState = <T>(
	channelId: string,
	options?: {
		onValueUpdate?: (value: T) => void;
		skip?: boolean;
		debug?: boolean;
	},
) => {
	// Early return when channelId is empty string or skip-option is set to true
	if (!channelId || options?.skip)
		return { value: undefined, setValue: () => {} };

	// Use ref to ensure effects always call the current debug function.
	// This avoids stale closures when options.debug changes after effects mount.
	const debugRef = useRef<ReturnType<typeof createCabbageDebugger> | undefined>(
		undefined,
	);
	debugRef.current = createCabbageDebugger(channelId, options?.debug);

	const { properties } = useCabbageProperties(channelId, {
		debug: options?.debug,
	});

	const [channelValue, setChannelValue] = useState<T>();
	const [paramIdx, setParamIdx] = useState<number>();

	const handleValueChange = (
		value: T,
		gesture: "begin" | "value" | "end" | "complete" = "complete",
	) => {
		setChannelValue(value);

		Cabbage.sendControlData({
			channel: channelId,
			value: value as string | number,
			gesture,
		});
	};

	const applyValueUpdate = (value: T) => {
		if (options?.onValueUpdate) options.onValueUpdate(value);
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
			debugRef.current?.("Received parameterIndex", parameterIndex);
			setParamIdx(parameterIndex);
		}

		// Skip setting default/initial value if channel-value is already set
		if (channelValue !== undefined) return;

		const initialValue = channelProperties.range?.value;

		// Set default/initial value - when adding plugin to session, when reopening the plugin UI
		if (initialValue !== undefined && initialValue !== null) {
			debugRef.current?.("Received initial value", initialValue);
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

				debugRef.current?.("Received parameterChange", value);
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

				debugRef.current?.("Received batchWidgetUpdate", value);
				applyValueUpdate(value);
			}
		};

		window.addEventListener("message", handleMessage);

		return () => window.removeEventListener("message", handleMessage);
	}, [channelId, options?.onValueUpdate, paramIdx]);

	return { value: channelValue, setValue: handleValueChange };
};
