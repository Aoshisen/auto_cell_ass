// @see https://playgameoflife.com/info
import { Board, PaletteBoard } from "./base";
import { base_rule_engine } from "./constance";
const $: (e: string) => any = (selection) => document.querySelector(selection)
const app = $("#app") as HTMLCanvasElement;
const next = $("#next") as HTMLButtonElement;
const play = $("#play") as HTMLButtonElement;
const palette = $("#palette") as HTMLCanvasElement;
// import { convertToPixel, extractGridBlock, extractPixelMatrix, getImageDataFromUrl, getRuleEngine } from "./utils";
// 调色板当前选中的状态（数字），棋盘落子时使用
let active_status = 0;

const board = new Board(700, 700, 10, app, base_rule_engine);
board.reRender();

// 点击棋盘时，把格子设成调色板选中的状态
board.clickHandler(({ x, y }) => {
  board.setItem(x, y, active_status);
  board.reRender();
});

const palette_board = new PaletteBoard(90, 30, 30, palette, base_rule_engine.color_map);
palette_board.reRender();
palette_board.clickHandler(({ index }) => {
  active_status = index;
  palette_board.activeIndex = index;
  palette_board.reRender();
})


next.addEventListener("click", board.next.bind(board))
play.addEventListener("click", () => {
  if (board.is_playing) {
    board.pause()
    play.innerText = "play"
  } else {
    board.play();
    play.innerText = "pause"
  }
})

// getImageDataFromUrl(CutePeople).then(data => {
//   const matrix = extractPixelMatrix(data);
//   const subMatrix = extractGridBlock(matrix, 1, 1, 0, 0);
//   const pixelMatrix = convertToPixel(subMatrix);
//   const { color_map, rule } = getRuleEngine(pixelMatrix);
//   board.rule_engine = { rule, color_map }
//   board.applyMatrix(rule)
//   board.reRender();
// })
