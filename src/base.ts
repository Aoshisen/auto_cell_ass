import { type RuleEngine } from "./type";

export class BaseBoard {
	/** 每个格子存一个状态数字 */
	matrix: number[][] = [];
	ctx: CanvasRenderingContext2D;
	//行
	cols!: number;
	//列
	rows!: number;
	constructor(public width: number, public height: number, public readonly itemSize: number, public readonly node: HTMLCanvasElement) {
		this.ctx = node.getContext('2d')!;
		this.resize(width, height);
	}
	/** 重设画布尺寸，并按新尺寸重建矩阵 */
	resize(width: number, height: number) {
		this.width = width;
		this.height = height;
		this.node.width = width;
		this.node.height = height;
		// 列数由宽度决定，行数由高度决定
		this.cols = Math.ceil(this.width / this.itemSize);
		this.rows = Math.ceil(this.height / this.itemSize);
		this.matrix = this.createMatrix(this.cols, this.rows);
	}
	createMatrix(cols: number, rows: number) {
		const matrix: number[][] = [];
		for (let y = 0; y < rows; y++) {
			matrix.push(Array.from({ length: cols }, () => 0));
		}
		return matrix
	}
	clickHandler(callback: (position: { x: number, y: number, index: number }) => void) {
		this.node.addEventListener('click', (e) => {
			callback(this.getMouseEventPosition(e as MouseEvent));
		})
	}
	getMouseEventPosition(e: MouseEvent) {
		const { offsetX, offsetY } = e;
		const x = Math.floor(offsetX / this.itemSize);
		const y = Math.floor(offsetY / this.itemSize);
		const index = y * this.cols + x;
		return { x, y, index }
	}

	loop(callback: (x: number, y: number) => void) {
		for (let y = 0; y < this.rows; y++) {
			for (let x = 0; x < this.cols; x++) {
				callback(x, y);
			}
		}
	}
	getItem(x: number, y: number, data = this.matrix): number {
		// 处理 X 轴环绕
		const _x = (x % this.cols + this.cols) % this.cols;
		// 处理 Y 轴环绕
		const _y = (y % this.rows + this.rows) % this.rows;
		return data[_y][_x];
	}
	setItem(x: number, y: number, value: number, data = this.matrix) {
		// 处理 X 轴环绕
		const _x = (x % this.cols + this.cols) % this.cols;
		// 处理 Y 轴环绕
		const _y = (y % this.rows + this.rows) % this.rows;
		data[_y][_x] = value;
	}
}

export class PaletteBoard extends BaseBoard {
	colors: string[];
	activeIndex = 0;
	/** 每行放几个颜色，不传则一行排开 */
	columns?: number;
	constructor(itemSize: number, node: HTMLCanvasElement, colors: string[], columns?: number) {
		const { width, height } = PaletteBoard.measure(colors.length, itemSize, columns);
		super(width, height, itemSize, node);
		this.colors = colors;
		this.columns = columns;
	}
	/** 根据颜色数量算出画布宽高 */
	static measure(colorCount: number, itemSize: number, columns?: number) {
		const cols = Math.max(1, Math.min(columns ?? colorCount, colorCount));
		const rows = Math.max(1, Math.ceil(colorCount / cols));
		return { width: cols * itemSize, height: rows * itemSize };
	}
	/** 换一组颜色并重新计算画布尺寸 */
	setColors(colors: string[]) {
		this.colors = colors;
		this.activeIndex = Math.min(this.activeIndex, Math.max(0, colors.length - 1));
		const { width, height } = PaletteBoard.measure(colors.length, this.itemSize, this.columns);
		this.resize(width, height);
		this.reRender();
	}
	get activeColor() {
		return this.colors[this.activeIndex];
	}
	reRender() {
		this.ctx.clearRect(0, 0, this.width, this.height);
		this.loop((x, y) => {
			const colorIndex = x + this.cols * y;
			const color = this.colors[colorIndex];
			if (colorIndex > this.colors.length - 1) {
				return;
			}
			const left = x * this.itemSize;
			const top = y * this.itemSize;
			this.ctx.fillStyle = color;
			this.ctx.fillRect(left, top, this.itemSize, this.itemSize);
			if (colorIndex === this.activeIndex) {
				this.ctx.strokeStyle = "white";
				this.ctx.lineWidth = 1;
				// 描边默认以路径为中心向两侧各画 0.5px，贴边时外侧会被 canvas 裁掉，
				// 导致边框一半粗一半细。向内缩 0.5px 后四条边宽度一致。
				const inset = 0.5;
				this.ctx.strokeRect(
					left + inset,
					top + inset,
					this.itemSize - inset * 2,
					this.itemSize - inset * 2
				);
			}
		})
	}
}


export class Board extends BaseBoard {
	next_matrix: number[][] = [];
	is_playing: boolean;
	timer: number | null = null;
	DURATION = 200;
	DIRECTIONS = [
		[-1, -1], [0, -1], [1, -1],
		[-1, 0], [1, 0],
		[-1, 1], [0, 1], [1, 1]
	];
	rule_engine: RuleEngine;
	constructor(width: number, height: number, itemSize: number, node: HTMLCanvasElement, rule_engine: RuleEngine, initMatrix?: number[][]) {
		super(width, height, itemSize, node);
		this.next_matrix = this.createMatrix(this.cols, this.rows);
		this.is_playing = false;
		this.rule_engine = rule_engine;
		if (initMatrix) this.applyMatrix(initMatrix);
	}
	applyMatrix(matrix: number[][]) {
		for (let y = 0; y < matrix.length; y++) {
			for (let x = 0; x < matrix[y].length; x++) {
				this.setItem(x, y, matrix[y][x]);
			}
		}
	}
	play() {
		this.is_playing = true;
		this.timer = setInterval(() => {
			this.next()
		}, this.DURATION)
	}
	pause() {
		if (this.timer) {
			clearInterval(this.timer)
		}
		this.timer = null;
		this.is_playing = false;
	}
	/**
	 * 统计 8 个邻居各状态的数量，按状态数字顺序拼成签名。
	 * 两个状态时：5 个状态 0 + 3 个状态 1 -> "53"。
	 */
	getNeighborSignature(x: number, y: number) {
		const counts: number[] = new Array(this.rule_engine.rule.length).fill(0);
		for (const [dx, dy] of this.DIRECTIONS) {
			counts[this.getItem(x + dx, y + dy)]++;
		}
		return counts.join("");
	}
	reRender() {
		this.ctx.clearRect(0, 0, this.width, this.height);
		this.loop((x, y) => {
			const status = this.getItem(x, y);
			this.ctx.fillStyle = this.rule_engine.color_map[status]!;
			this.ctx.fillRect(x * this.itemSize, y * this.itemSize, this.itemSize, this.itemSize);
		})
	}
	next() {
		this.loop((x, y) => {
			const status = this.getItem(x, y);
			const row = this.rule_engine.rule[status] ?? {};
			const signature = this.getNeighborSignature(x, y);
			// 命中具体签名就用它，否则退回 default，再没有就保持原状态
			const next_status = signature in row ? row[signature] : row.default ?? status;
			this.setItem(x, y, next_status, this.next_matrix);
		});
		[this.matrix, this.next_matrix] = [this.next_matrix, this.matrix];
		this.reRender();
	}
}