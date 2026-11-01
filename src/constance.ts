import type { RuleEngine } from "./type"


export const base_rule_engine: RuleEngine = {
	rule: [
		{ /* Dead：恰好 3 个 Live 邻居（5 Dead + 3 Live）-> Live */
			"53": 1,
			"default": 0,
		},
		{ /* Live：2 或 3 个 Live 邻居 -> 存活，否则 Dead */
			"62": 1,
			"53": 1,
			"default": 0,
		},
	],
	color_map: [
		"#161616", "#ff5050"
	]
}

export const dying_rule_engine: RuleEngine = {
	rule: [
		{ /* Dead：恰好 3 个 Live 邻居 -> Live */
			"062": 2, "152": 2, "242": 2, "332": 2, "422": 2, "512": 2, "602": 2,
			"default": 0,
		},
		{
			"default": 0,
		},
		{
			"default": 1,
		}
	],

	color_map: [
		"#161616", "#93FE02", "#ff5050"
	]
}
