# Cabbage React

Cabbage React provides React hooks for synchronizing [Cabbage](https://cabbageaudio.com) with [React](https://github.com/facebook/react), making it easier to build a custom UI that communicates with the Cabbage host.

## Example Project

An example of implementation is available [here](https://github.com/hdale94/cabbage-react-example).

## Installation

```jsx
yarn add cabbage-react
# or
npm install cabbage-react
```

## Hooks

### useCabbageState

Synchronize a parameter with Cabbage. This hook:

- Identifies and sets the default value defined in Cabbage to a state.
- Handles initialization when opening an existing session, or reopening the plugin window.
- Listens for value updates from the host (DAW), or from Csound.
- Sends changes back to Cabbage when using the provided value-setter.

### useCabbageProperties

Get properties for a parameter from Cabbage.
This hook:

- Listens for property updates from Cabbage.
- Updates local state automatically when data changes.

## Usage

```tsx
import { InputHTMLAttributes } from "react";
import { useCabbageProperties, useCabbageState } from "cabbage-react";

const HorizontalSlider = ({
	channelId,
	parameterIndex,
	inputProps,
}: {
	channelId: string;
	parameterIndex: number;
	inputProps?: InputHTMLAttributes<HTMLInputElement>;
}) => {
	const { properties } = useCabbageProperties(channelId);
	const channelProperties = properties?.channels.find(
		(c: any) => c.id === channelId
	);

	const { value, setValue } = useCabbageState<number>(
		channelId,
		parameterIndex
	);

	return (
		<div>
			{/* Label */}
			<p style={{ marginBottom: "4px" }}>{properties?.text ?? "Label"}</p>

			<input
				type="range"
				min={channelProperties?.range?.min ?? 0}
				max={channelProperties?.range?.max ?? 1}
				step={channelProperties?.range?.increment ?? 0.01}
				value={value}
				onChange={(e) => setValue(e.target.valueAsNumber)}
				{...inputProps}
				style={{
					accentColor: "rgb(148, 242, 254)",
					marginTop: "20px",
					...inputProps?.style,
				}}
			/>

			{/* Displaying the value */}
			<p style={{ marginTop: "4px" }}>{value ?? 0}</p>
		</div>
	);
};

export default HorizontalSlider;
```

## Interact directly with Cabbage

You can also import the [Cabbage class](https://github.com/hdale94/cabbage-react/blob/main/src/cabbage/cabbage.js) to send custom messages or interact directly with Cabbage.

## Notify Cabbage When UI Is Ready

To let Cabbage know your UI is ready to receive data, send a `cabbageIsReadyToLoad` message when your app initializes.

Place this call before rendering your app — typically in your main.tsx or index.tsx file:

```jsx
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.tsx";
import { Cabbage } from "cabbage-react";

if (import.meta.env.PROD) {
	// Notify Cabbage that the UI is ready to receive data
	Cabbage.sendCustomCommand("cabbageIsReadyToLoad");
}

createRoot(document.getElementById("root")!).render(
	<StrictMode>
		<App />
	</StrictMode>
);
```
