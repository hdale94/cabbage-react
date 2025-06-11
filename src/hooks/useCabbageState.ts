import { useState, useEffect } from "react";
import { Cabbage } from "../cabbage/cabbage.js";

/**
 * Custom hook to sync a parameter with Cabbage.
 * This hook listens for updates to a parameter value from Cabbage and
 * sends updates to Cabbage when the parameter value changes locally (e.g., through a UI slider).
 */
export const useCabbageState = <T>(channel: string, paramIdx: number) => {
	const [channelValue, setChannelValue] = useState<T>();
	const [channelType, setChannelType] = useState<"number" | "string">();
	const [channelData, setChannelData] = useState<any>();

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

	// Sync value with external updates (e.g., automation from a DAW)
	useEffect(() => {
		const handleMessage = (event: MessageEvent) => {
			const { data } = event;
			console.log("Cabbage-React: receiving parameter change", data);

			if (data.channel !== channel) return;

			if (data.command === "widgetUpdate") {
				if (data.value) setChannelValue(data.value);
				if (data.data) setChannelData(JSON.parse(data.data));
				if (typeof data.value === "number") {
					setChannelType("number");
				} else if (typeof data.value === "string") {
					setChannelType("string");
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
		data: channelData,
	};
};
