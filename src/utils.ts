import type { SimpleRGBA } from "./type";

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
export const getStaticRules = (data: string[][]) => {
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
	const rule: number[][] = data.map(row => {
		return row.map(color => {
			// 获取颜色对应的索引，如果找不到则默认为 0 (Dead)
			return colorToIndexMap.get(color) ?? 0;
		});
	});

	return {
		color_map,
		rule
	};
}
