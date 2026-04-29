import type { RuleEngine } from "./type"


export const base_rule_engine: RuleEngine = {
	rule:
		[[0, 0, 0, 1, 0, 0, 0, 0, 0], /*死的时候 */[0, 0, 1, 1, 0, 0, 0, 0, 0] /*活的时候*/],
	color_map: [
		"#161616", "#ff5050"
	]
}

export const dying_rule_engine: RuleEngine = {
	rule:
		[
			[0, 0, 0, 2, 0, 0, 0, 0, 0], /*dead */
			[0, 0, 0, 2, 0, 0, 0, 0, 0], /*dying*/
			[1, 1, 2, 2, 1, 1, 1, 1, 1]  /*live */
		],

	color_map: [
		"#161616", "#93FE02", "#ff5050"
	]
}