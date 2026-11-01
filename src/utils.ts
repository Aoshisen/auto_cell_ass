import type { RuleRow, SimpleRGBA } from "./type";

export const getImageDataFromUrl = (url: string): Promise<ImageData> => {
	return new Promise((resolve, reject) => {
		const img = new Image();
		// 关键：处理跨域问题，如果图片服务器支持 CORS
		img.crossOrigin = "Anonymous";

		img.onload = () => {
			const canvas = document.createElement('canvas');
			canvas.width = img.width;
			canvas.height = img.height;

			const ctx = canvas.getContext('2d');
			if (!ctx) {
				reject(new Error('Failed to get canvas context'));
				return;
			}

			ctx.drawImage(img, 0, 0);

			try {
				// 获取像素数据
				const imageData = ctx.getImageData(0, 0, img.width, img.height);
				resolve(imageData);
			} catch (e) {
				reject(e);
			}
		};

		img.onerror = (err) => {
			reject(err);
		};

		img.src = url;
	});
};
export const extractPixelMatrix = (imageData: ImageData): SimpleRGBA[][] => {
	const { width, height, data } = imageData;
	const matrix: SimpleRGBA[][] = [];

	for (let y = 0; y < height; y++) {
		const row: SimpleRGBA[] = [];
		for (let x = 0; x < width; x++) {
			const index = (y * width + x) * 4;
			row.push({
				r: data[index],
				g: data[index + 1],
				b: data[index + 2],
				a: data[index + 3]
			});
		}
		matrix.push(row);
	}
	return matrix;
};
/**
 * 从像素矩阵中提取指定网格位置的数据块
 * @param matrix 原始像素矩阵 [y][x]
 * @param gridCols 横向分割份数 (例如 4)
 * @param gridRows 纵向分割份数 (例如 3)
 * @param targetCol 目标列索引 (0 ~ gridCols-1)
 * @param targetRow 目标行索引 (0 ~ gridRows-1)
 * @returns 截取后的子矩阵 SimpleRGBA[][]
 */
export const extractGridBlock = (
	matrix: SimpleRGBA[][],
	gridCols: number,
	gridRows: number,
	targetCol: number,
	targetRow: number
): SimpleRGBA[][] => {
	const totalRows = matrix.length;
	if (totalRows === 0) return [];
	const totalCols = matrix[0].length;

	// 1. 计算每个格子的宽高 (向下取整，多余像素忽略或归入最后一格，这里采用均匀切割逻辑)
	const blockWidth = Math.floor(totalCols / gridCols);
	const blockHeight = Math.floor(totalRows / gridRows);

	// 2. 计算目标格子的起始坐标
	const startX = targetCol * blockWidth;
	const startY = targetRow * blockHeight;

	// 3. 计算结束坐标 (不包含)
	const endX = startX + blockWidth;
	const endY = startY + blockHeight;

	// 4. 截取数据
	const subMatrix: SimpleRGBA[][] = [];
	for (let y = startY; y < endY; y++) {
		// 防止越界
		if (y >= totalRows) break;

		const row = matrix[y];
		// 使用 slice 快速截取行数据
		const subRow = row.slice(startX, endX);
		subMatrix.push(subRow);
	}

	return subMatrix;
};
export const convertToPixel = (matrix: SimpleRGBA[][]) => {
	return matrix.map(row => {
		return row.map(pixel => {
			const { r, g, b, a } = pixel;
			// 注意：CSS rgba 函数参数之间需要用逗号分隔
			return `rgba(${r}, ${g}, ${b}, ${a / 255})`;
		});
	});
}
const DIRECTIONS = [
	[-1, -1], [0, -1], [1, -1],
	[-1, 0], [1, 0],
	[-1, 1], [0, 1], [1, 1]
];

/** 8 个邻居各状态的个数按状态顺序拼成的签名，例如 2 个状态时 "53" */
export const getNeighborSignature = (matrix: number[][], x: number, y: number, stateCount: number) => {
	const rows = matrix.length;
	const cols = matrix[0]?.length ?? 0;
	const counts: number[] = new Array(stateCount).fill(0);
	for (const [dx, dy] of DIRECTIONS) {
		const nx = (x + dx + cols) % cols;
		const ny = (y + dy + rows) % rows;
		counts[matrix[ny][nx]]++;
	}
	return counts.join("");
};

/**
 * 参考 meltdown：拿当前棋盘当样本学规则。
 * 逐格统计邻居签名，对每个状态，第一次遇到该签名时就把这一格的当前状态
 * 记成转移结果，之后不再覆盖。
 * 没学到的组合落到 default（0），保证还能继续收缩/消失。
 */
export const buildRule = (matrix: number[][], stateCount: number): RuleRow[] => {
	const rule: RuleRow[] = Array.from({ length: stateCount }, () => ({ default: 0 }));
	for (let y = 0; y < matrix.length; y++) {
		for (let x = 0; x < matrix[y].length; x++) {
			const signature = getNeighborSignature(matrix, x, y, stateCount);
			const state = matrix[y][x];
			for (let i = 0; i < stateCount; i++) {
				if (rule[i][signature] === undefined) {
					rule[i][signature] = state;
				}
			}
		}
	}
	return rule;
};

/**
 * 参考 freqRules：按频率学规则。
 * 先统计样本里每个签名下各状态出现了多少次，再对每个签名取出现最多的状态
 * 作为转移结果（并列时取状态下标小的）。同样给每行一个 default: 0。
 */
export const buildRules = (matrix: number[][], stateCount: number): RuleRow[] => {
	// 签名 -> 该签名下每个状态出现的次数
	const frequency = new Map<string, number[]>();
	for (let y = 0; y < matrix.length; y++) {
		for (let x = 0; x < matrix[y].length; x++) {
			const signature = getNeighborSignature(matrix, x, y, stateCount);
			let counts = frequency.get(signature);
			if (!counts) {
				counts = new Array(stateCount).fill(0);
				frequency.set(signature, counts);
			}
			counts[matrix[y][x]]++;
		}
	}
	const rule: RuleRow[] = Array.from({ length: stateCount }, () => ({ default: 0 }));
	for (const [signature, counts] of frequency) {
		let best = 0;
		for (let state = 1; state < counts.length; state++) {
			if (counts[state] > counts[best]) best = state;
		}
		// 和 meltdown 一样，每个状态行都写入同一个结果
		for (let i = 0; i < stateCount; i++) {
			rule[i][signature] = best;
		}
	}
	return rule;
};

/**
 * 参考 cycleRules：状态循环，每个状态下一帧前进到下一个状态，
 * 最后一个状态回到 0。和邻居情况无关，所以每行只写 default。
 */
export const buildCycle = (stateCount: number): RuleRow[] => {
	return Array.from({ length: stateCount }, (_, state) => ({
		default: (state + 1) % stateCount,
	}));
};

export const getRuleEngine = (data: string[][]) => {
	const colorSet = new Set<string>();
	for (const row of data) {
		for (const color of row) {
			colorSet.add(color);
		}
	}
	const color_map: string[] = Array.from(colorSet);
	const colorToIndexMap = new Map<string, number>();
	color_map.forEach((color, index) => {
		colorToIndexMap.set(color, index);
	});
	// 像素矩阵是初始棋盘，不是规则表
	const initMatrix: number[][] = data.map(row => {
		return row.map(color => {
			// 获取颜色对应的索引，如果找不到则默认为 0 (Dead)
			return colorToIndexMap.get(color) ?? 0;
		});
	});
	// 真正的规则表：用初始棋盘当样本学出来
	// const rule = buildCycle(color_map.length)
	// const rule = buildRules(initMatrix, color_map.length)

	const rule = buildRule(initMatrix, color_map.length)
	return {
		color_map,
		rule,
		initMatrix,
	};
}
