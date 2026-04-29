// @see https://playgameoflife.com/info
import { clamp, compact } from "lodash-es";
const app = document.getElementById("app") as HTMLCanvasElement;
const next = document.getElementById('next')! as HTMLButtonElement;
const play = document.getElementById('play')! as HTMLButtonElement;
enum Status {
  Dead,
  Dying,
  Live,
}
interface Item {
  x: number;
  y: number;
  status: Status;
}
const base_rule_color_map = [
  "#161616", "#ff5050"
]
const base_rule = (item: Item, item_neighbors: (Item | null)[]) => {
  const live_neighbors_count = compact(item_neighbors).filter(n => n.status === Status.Live).length;
  const rule_engine = [[0, 0, 0, 1, 0, 0, 0, 0, 0], /*死的时候 */[0, 0, 1, 1, 0, 0, 0, 0, 0] /*活的时候*/]
  return rule_engine[item.status][live_neighbors_count]
}
const dying_rule_color_map = [
  "#161616", "#93FE02", "#ff5050"
]
type Rules = {
  rule: (item: Item, item_neighbors: (Item | null)[]) => number
  color_map: string[]
}
const dying_rule = (item: Item, item_neighbors: (Item | null)[]) => {
  const live_neighbors_count = compact(item_neighbors).filter(n => n.status === Status.Live).length;
  const rule_engine = [
    [0, 0, 0, 2, 0, 0, 0, 0, 0], /*dead */
    [0, 0, 0, 2, 0, 0, 0, 0, 0], /*dying*/
    [1, 1, 2, 2, 1, 1, 1, 1, 1]  /*live */
  ]
  return rule_engine[item.status][live_neighbors_count]
}

const rules: Rules = {
  rule: base_rule,
  color_map: base_rule_color_map
}

const rules_dying: Rules = {
  rule: dying_rule,
  color_map: dying_rule_color_map
}

class Board<T extends Item> {
  current_board: T[][] = [];
  ctx: CanvasRenderingContext2D;
  cols: number;
  rows: number;
  next_board: T[][] = [];
  is_playing: boolean;
  timer: number | null = null;
  DURATION = 200;
  DIRECTIONS = [
    [-1, -1], [0, -1], [1, -1],
    [-1, 0], [1, 0],
    [-1, 1], [0, 1], [1, 1]
  ];
  rules: Rules
  constructor(public readonly width: number, public readonly height: number, public readonly itemSize: number, public readonly node: HTMLCanvasElement) {
    this.ctx = node.getContext('2d')!;
    this.cols = Math.floor(this.width / itemSize);
    this.rows = Math.floor(this.height / itemSize);
    this.current_board = Array.from({ length: this.cols }, () => Array(this.rows).fill(null));
    this.next_board = Array.from({ length: this.cols }, () => Array(this.rows).fill(null));
    this.is_playing = false;
    this.rules = rules_dying;
    this.node.addEventListener('click', this.canvasHandler.bind(this));
    this.loop((x, y) => {
      this.current_board[y][x] = { x, y, status: Status.Dead } as T;
      this.next_board[y][x] = { x, y, status: Status.Dead } as T;
    });
  }
  canvasHandler(e: MouseEvent) {
    const { offsetX, offsetY } = e;
    const x = Math.floor(offsetX / this.itemSize);
    const y = Math.floor(offsetY / this.itemSize);
    const item = this.getItem(x, y);
    if (item) {
      item.status = (item.status === Status.Dead ? Status.Live : Status.Dead);
      this.reRender();
    }
  }
  loop(callback: (x: number, y: number) => void) {
    for (let y = 0; y < this.rows; y++) {
      for (let x = 0; x < this.cols; x++) {
        callback(x, y);
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
  getNeighbors(item: T) {
    return this.DIRECTIONS.map(([dx, dy]) => {
      const x = item.x + dx;
      const y = item.y + dy;
      return this.getItem(x, y);
    })
  }
  reRender() {
    this.ctx.clearRect(0, 0, this.width, this.height);
    this.loop((x, y) => {
      const item = this.getItem(x, y)!;
      this.ctx.fillStyle = this.rules.color_map[item.status]!;
      this.ctx.fillRect(x * this.itemSize, y * this.itemSize, this.itemSize, this.itemSize);
    })
  }
  getItem(x: number, y: number, data = this.current_board) {
    // 处理 X 轴环绕
    const _x = (x % this.cols + this.cols) % this.cols;
    // 处理 Y 轴环绕
    const _y = (y % this.rows + this.rows) % this.rows;
    return data[_y][_x];
  }
  next() {
    this.loop((x, y) => {
      const item = this.getItem(x, y)!;
      const next_status = this.rules.rule(item, this.getNeighbors(item));
      const target_item = this.getItem(x, y, this.next_board)!;
      target_item.status = next_status;
    });
    [this.current_board, this.next_board] = [this.next_board, this.current_board];
    this.reRender();
  }
}
const board = new Board(app.width, app.height, 10, app);
board.reRender();
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
