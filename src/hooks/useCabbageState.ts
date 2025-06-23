import { useEffect, useState } from "react";
import { Cabbage } from "../cabbage/cabbage.js";
import { useCabbageProperties } from "./useCabbageProperties.js";

/**
 * Custom hook to sync a parameter with Cabbage.
 * This hook listens for updates to a parameter value from Cabbage and
 * sends updates to Cabbage when the parameter value changes locally (e.g., through a UI slider).
 */
export const useCabbageState = <T>(channel: string, paramIdx: number) => {
	const { properties } = useCabbageProperties(channel);

	const [channelValue, setChannelValue] = useState<T>();
	const [channelType, setChannelType] = useState<"number" | "string">();

	const handleValueChange = (newValue: T) => {
		setChannelValue(newValue);

		const msg = {
			paramIdx: paramIdx,
			channelType: channelType,
			channel: channel,
			value: newValue,
		};
		Cabbage.sendParameterUpdate(msg, null);
	};

	const determineChannelType = (
		value: any
	): "number" | "string" | undefined => {
		if (typeof value === "number") return "number";
		if (typeof value === "string") return "string";
	};

	// Set initial value and type (relevant the first time you open plugin)
	useEffect(() => {
		if (properties?.channel !== channel) return;

		const defaultValue = properties?.range?.defaultValue;

		if (channelValue === undefined && defaultValue !== undefined) {
			console.log(
				`[Cabbage-React]: Received default value for channel "${properties?.channel}"`,
				defaultValue
			);

			setChannelValue(defaultValue);

			const type = determineChannelType(defaultValue);
			if (type) setChannelType(type);
		}
	}, [properties]);

	// Sync value with external updates (e.g., automation from a DAW, opening a session where plugin exists)
	useEffect(() => {
		const handleMessage = (event: MessageEvent) => {
			const { command } = event.data;

			// Set initial value and type
			if (command === "widgetUpdate") {
				const { channel: incomingChannel, value: incomingValue } = event.data;

				if (incomingChannel !== channel) return;

				console.log(
					`[Cabbage-React] ${command}: Received initial value for channel "${incomingChannel}"`,
					incomingValue
				);

				if (incomingValue !== undefined) {
					setChannelValue(incomingValue);

					const type = determineChannelType(incomingValue);
					if (type) setChannelType(type);
				}
			}

			// Update when receiving changes
			if (command === "parameterChange") {
				const { paramIdx: incomingIdx, value: incomingValue } =
					event.data.data || {};

				if (incomingIdx === paramIdx && incomingValue !== undefined) {
					console.log(
						`[Cabbage-React] ${command}: Received value change for paramIdx: ${incomingIdx}`,
						incomingValue
					);
					setChannelValue(incomingValue);
				}
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
