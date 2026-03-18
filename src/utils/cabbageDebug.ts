export const createCabbageDebugger = (scope: string, enabled?: boolean) => {
	return (...args: any[]) => {
		if (!enabled) return;

		console.log(`[Cabbage-React] ${scope}:`, ...args);
	};
};
