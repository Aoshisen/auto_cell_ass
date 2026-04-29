
export enum Status {
	Dead,
	Dying,
	Live,
}

export interface Item {
	x: number;
	y: number;
	status: Status;
}

export type RuleEngine = {
	rule: number[][],
	color_map: string[],
}

export interface SimpleRGBA {
	r: number;
	g: number;
	b: number;
	a: number;
}