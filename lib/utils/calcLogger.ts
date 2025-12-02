let enabled = false

export function setCalculationDebug(value: boolean): void {
	enabled = Boolean(value)
}

export function isCalculationDebugEnabled(): boolean {
	return enabled
}

export function calcLog(...args: unknown[]): void {
	if (!enabled) return
	// eslint-disable-next-line no-console
	console.log(...args)
}
