import { useEffect, useState } from "react";
import { Cabbage } from "../cabbage/cabbage.js";

/**
 * Custom hook to sync a parameter with Cabbage.
 * This hook listens for updates to a parameter value from Cabbage and
 * sends updates to Cabbage when the parameter value changes locally (e.g., through a UI slider).
 */
export const useCabbageState = <T>(channel: string, paramIdx: number) => {
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

	// Sync value with external updates (e.g., automation from a DAW)
	useEffect(() => {
		const handleMessage = (event: MessageEvent) => {
			const { data } = event;

			// Set initial value and type
			if (data.command === "widgetUpdate") {
				if (data.channel !== channel) return;

				console.log(
					`[Cabbage-React] ${data.command}: Received initial value for channel "${data.channel}"`,
					data.value
				);

				if (data.value !== undefined) {
					setChannelValue(data.value);

					if (typeof data.value === "number") {
						setChannelType("number");
					} else if (typeof data.value === "string") {
						setChannelType("string");
					}
				}
			}

			if (data.data?.paramIdx !== paramIdx) return;

			// Update when receiving changes
			if (
				data.command === "parameterChange" &&
				data?.data?.value !== undefined
			) {
				console.log(
					`[Cabbage-React] ${data.command}: Received value change for paramIdx: ${data.data?.paramIdx}`,
					data?.data?.value
				);

				setChannelValue(data?.data?.value);
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
