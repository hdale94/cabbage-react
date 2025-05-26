import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import dts from "vite-plugin-dts";
import path from "path";

// https://vite.dev/config/
export default defineConfig({
	plugins: [react(), dts()],
	build: {
		lib: {
			entry: path.resolve(__dirname, "src/index.ts"),
			name: "cabbage-react",
			fileName: (format) => (format === "es" ? "index.mjs" : "index.cjs"),
			formats: ["es", "cjs"], // Both ESM and CommonJS
		},
		rollupOptions: {
			external: ["react"], // Exclude React from the bundle
			output: {
				globals: {
					react: "React", // Make sure React is available globally
				},
			},
		},
	},
});
