
/**
 * 一行规则：邻居状态签名 -> 下一状态，查不到时用 "default"。
 * 状态直接用数字表示（0、1、2...），签名按数字顺序拼接各状态的邻居个数，
 * 例如 2 个状态时 "53" = 5 个状态 0 的邻居 + 3 个状态 1 的邻居。
 */
export type RuleRow = Record<string, number>;

export type RuleEngine = {
	rule: RuleRow[],
	color_map: string[],
}

export interface SimpleRGBA {
	r: number;
	g: number;
	b: number;
	a: number;
}