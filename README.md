# Cabbage-React

Cabbage-React provides React hooks for synchronizing [Cabbage](https://cabbageaudio.com) with [React](https://github.com/facebook/react), making it easier to build a custom UI that communicates with the Cabbage host.

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

- Listens for value updates from Cabbage.
- Sends local changes (e.g., via sliders, knobs) back to Cabbage.

### useCabbageProperties

Get properties for a parameter from Cabbage.
This hook:

- Listens for property updates from Cabbage.
- Updates local state automatically when data changes.

## Usage

```jsx
import { InputHTMLAttributes } from "react";
import { useCabbageProperties, useCabbageState } from "cabbage-react";

const HorizontalSlider = ({
	channel,
	paramIdx,
	inputProps,
}: {
	channel: string;
	paramIdx: number;
	inputProps?: InputHTMLAttributes<HTMLInputElement>;
}) => {
	const { properties } = useCabbageProperties(channel);
	const { value, setValue } = useCabbageState<number>(channel, paramIdx);

	return (
		<div>
			<input
				type="range"
				min={properties?.range?.min ?? 0}
				max={properties?.range?.max ?? 1}
				step={properties?.range?.increment ?? 0.01}
				value={value}
				onChange={(e) => setValue(e.target.valueAsNumber)}
				{...inputProps}
				style={{
					accentColor: "rgb(147,210,0)",
					...inputProps?.style,
				}}
			/>

			{/* Displaying the value */}
			<p style={{ margin: 0 }}>{value ?? 0}</p>
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

// Notify Cabbage that the UI is ready to receive data
Cabbage.sendCustomCommand("cabbageIsReadyToLoad");

createRoot(document.getElementById("root")!).render(
	<StrictMode>
		<App />
	</StrictMode>
);
```
