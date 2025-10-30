import { useEffect, useState } from "react";
import { Cabbage } from "../cabbage/cabbage.js";
import { useCabbageProperties } from "./useCabbageProperties.js";

/**
 * Custom hook to sync a parameter with Cabbage.
 * This hook listens for updates to a parameter value from Cabbage and
 * sends updates to Cabbage when the parameter value changes locally (e.g., through a UI slider).
 */
export const useCabbageState = <T>(
	channelId: string,
	parameterIndex: number
) => {
	const { properties } = useCabbageProperties(channelId);

	const [channelValue, setChannelValue] = useState<T>();

	const handleValueChange = (newValue: T) => {
		setChannelValue(newValue);

		const msg = {
			paramIdx: parameterIndex,
			channel: channelId,
			value: newValue,
		};
		Cabbage.sendParameterUpdate(msg, null);
	};

	// Set initial or default value
	useEffect(() => {
		const incomingValue = properties?.value;

		// Set initial value - when opening an existing session, and when reopening the plugin UI
		if (incomingValue !== undefined && incomingValue !== null) {
			console.log(
				`[Cabbage-React] Received initial value for channelId "${channelId}"`,
				incomingValue
			);

			setChannelValue(incomingValue);
			return;
		}

		// Find the specific properties of this channel in the channels-array
		const channelProperties = properties?.channels.find(
			(c: any) => c.id === channelId
		);
		if (!channelProperties) return;

		const defaultValue = channelProperties.range?.defaultValue;

		// Set default value - when adding the plugin to a session
		if (channelValue === undefined && defaultValue !== undefined) {
			console.log(
				`[Cabbage-React] Received default value for channelId "${channelProperties.id}"`,
				defaultValue
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
				const { value, paramIdx: incomingParameterIndex } = event.data;

				if (incomingParameterIndex !== parameterIndex) return;
				if (value === null) return;

				console.log(
					`[Cabbage-React] Received value change for parameterIndex ${incomingParameterIndex}`,
					value
				);

				setChannelValue(value);
			}
		};

		window.addEventListener("message", handleMessage);

		return () => {
			window.removeEventListener("message", handleMessage);
		};
	}, []);

	return {
		value: channelValue,
		setValue: handleValueChange,
	};
};
