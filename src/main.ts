// @see https://playgameoflife.com/info
import { Board, PaletteBoard } from "./base";
import { base_rule_engine } from "./constance";
import { convertToPixel, extractGridBlock, extractPixelMatrix, getImageDataFromUrl, getRuleEngine } from "./utils";
import type { RuleEngine } from "./type";
import CutePeople from "./assets/Cute People Icon v2.png"

const $: (e: string) => any = (selection) => document.querySelector(selection)
const app = $("#app") as HTMLCanvasElement;
const next = $("#next") as HTMLButtonElement;
const play = $("#play") as HTMLButtonElement;
const palette = $("#palette") as HTMLCanvasElement;

const CUTE_PEOPLE = false;
const BOARD_SIZE = 700;
const ITEM_SIZE = 10;
const PALETTE_ITEM_SIZE = 30;
const PALETTE_COLUMNS = 6; // 调色板每行放几个颜色，宽高由颜色数量自动算

// 调色板当前选中的状态（数字），棋盘落子时使用
let active_status = 0;

/** 用一套规则引擎把棋盘和调色板挂上去 */
function mount(rule_engine: RuleEngine, initMatrix?: number[][]) {
  const board = new Board(BOARD_SIZE, BOARD_SIZE, ITEM_SIZE, app, rule_engine, initMatrix);
  board.reRender();

  // 点击棋盘时，把格子设成调色板选中的状态
  board.clickHandler(({ x, y }) => {
    board.setItem(x, y, active_status);
    board.reRender();
  });

  const palette_board = new PaletteBoard(PALETTE_ITEM_SIZE, palette, rule_engine.color_map, PALETTE_COLUMNS);
  palette_board.reRender();
  palette_board.clickHandler(({ index }) => {
    // 点到没有颜色的空格子时忽略
    if (index >= rule_engine.color_map.length) return;
    active_status = index;
    palette_board.activeIndex = index;
    palette_board.reRender();
  });

  next.addEventListener("click", board.next.bind(board));
  play.addEventListener("click", () => {
    if (board.is_playing) {
      board.pause();
      play.innerText = "play";
    } else {
      board.play();
      play.innerText = "pause";
    }
  });
}

if (CUTE_PEOPLE) {
  getImageDataFromUrl(CutePeople).then((data) => {
    const pixelMatrix = convertToPixel(extractGridBlock(extractPixelMatrix(data), 1, 1, 0, 0));
    const { color_map, rule, initMatrix } = getRuleEngine(pixelMatrix);
    mount({ rule, color_map }, initMatrix);
  });
} else {
  mount(base_rule_engine);
}
