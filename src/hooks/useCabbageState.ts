import { useEffect, useRef, useState } from "react";
import { Cabbage } from "../cabbage/cabbage.js";
import { useCabbageProperties } from "./useCabbageProperties.js";

/**
 * Custom hook to sync a parameter with Cabbage.
 * This hook listens for updates to a parameter value from Cabbage and
 * sends updates to Cabbage when the parameter value changes locally (e.g., through a UI slider).
 */
export const useCabbageState = <T>(channelId: string) => {
	const { properties } = useCabbageProperties(channelId);

	const [channelValue, setChannelValue] = useState<T>();
	const [paramIdx, setParamIdx] = useState<number>();

	const handleValueChange = (value: T) => {
		setChannelValue(value);

		const msg = {
			channel: channelId,
			paramIdx,
			value,
		};

		Cabbage.sendParameterUpdate(msg, null);
	};

	// Set initial or default value
	useEffect(() => {
		// Find the specific properties of this channel in the channels-array
		const channelProperties = properties?.channels.find(
			(c: any) => c.id === channelId,
		);
		if (!channelProperties) return;

		// Set parameterIndex
		const parameterIndex = channelProperties?.parameterIndex;
		if (paramIdx === undefined && parameterIndex !== undefined) {
			console.log(
				`[Cabbage-React] Received parameterIndex for channelId "${channelProperties.id}"`,
				parameterIndex,
			);
			setParamIdx(parameterIndex);
		}

		// Set initial value - when opening an existing session, and when reopening the plugin UI
		const incomingValue = properties?.value;
		if (incomingValue !== undefined && incomingValue !== null) {
			console.log(
				`[Cabbage-React] Received initial value for channelId "${channelId}"`,
				incomingValue,
			);

			setChannelValue(incomingValue);
		}

		// Set default value - when adding the plugin to a session
		const defaultValue = channelProperties.range?.defaultValue;
		if (channelValue === undefined && defaultValue !== undefined) {
			console.log(
				`[Cabbage-React] Received default value for channelId "${channelProperties.id}"`,
				defaultValue,
			);
			setChannelValue(defaultValue);
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
					`[Cabbage-React] Received parameterChange for parameterIndex ${incomingParameterIndex}`,
					value,
				);
				setChannelValue(value);
			}
			// Handle batch updating - loading a preset
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
					`[Cabbage-React] Received batch widget update for channelId ${widget.id}`,
					value,
				);
				setChannelValue(value);
			}
		};

		window.addEventListener("message", handleMessage);

		return () => {
			window.removeEventListener("message", handleMessage);
		};
	}, [paramIdx]);

	return {
		value: channelValue,
		setValue: handleValueChange,
	};
};
