// @see https://playgameoflife.com/info
import { Board, PaletteBoard } from "./base";
import { base_rule_engine, dying_rule_engine } from "./constance";
import { convertToPixel, extractGridBlock, extractPixelMatrix, getImageDataFromUrl, getRuleEngine } from "./utils";
import CutePeople from "./assets/Cute People Icon v2.png"
const $: (e: string) => any = (selection) => document.querySelector(selection)
const app = $("#app") as HTMLCanvasElement;
const next = $("#next") as HTMLButtonElement;
const play = $("#play") as HTMLButtonElement;
const palette = $("#palette") as HTMLCanvasElement;
// import { convertToPixel, extractGridBlock, extractPixelMatrix, getImageDataFromUrl, getRuleEngine } from "./utils";
// 调色板当前选中的状态（数字），棋盘落子时使用
let active_status = 0;
const RULE_ENGINE = dying_rule_engine


const CUTE_PEOPLE = false;

if (CUTE_PEOPLE) {
  getImageDataFromUrl(CutePeople).then(data => {

    const matrix = extractPixelMatrix(data);
    const subMatrix = extractGridBlock(matrix, 1, 1, 0, 0);
    const pixelMatrix = convertToPixel(subMatrix);
    const cute_people_engine = getRuleEngine(pixelMatrix);
    const board = new Board(700, 700, 10, app, cute_people_engine);
    board.applyMatrix(cute_people_engine.rule)
    board.reRender();

    // 点击棋盘时，把格子设成调色板选中的状态
    board.clickHandler(({ x, y }) => {
      board.setItem(x, y, active_status);
      board.reRender();
    });

    const PLATTEITEMSIZE = 30;
    const PALETTEROWS = 5;
    const palette_board = new PaletteBoard(PLATTEITEMSIZE * PALETTEROWS, Math.ceil(cute_people_engine.color_map.length / PALETTEROWS) * PLATTEITEMSIZE, PLATTEITEMSIZE, palette, cute_people_engine.color_map);
    palette_board.reRender();
    palette_board.clickHandler(({ index }) => {
      active_status = index;
      palette_board.activeIndex = index;
      palette_board.reRender();
    })
  })

} else {
  const board = new Board(700, 700, 10, app, RULE_ENGINE);
  board.reRender();

  // 点击棋盘时，把格子设成调色板选中的状态
  board.clickHandler(({ x, y }) => {
    board.setItem(x, y, active_status);
    board.reRender();
  });

  const palette_board = new PaletteBoard(90, 30, 30, palette, RULE_ENGINE.color_map);
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
}