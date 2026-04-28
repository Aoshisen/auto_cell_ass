// @see https://playgameoflife.com/info
import { compact, flatten, map } from "lodash-es";
const app = document.getElementById("app") as HTMLCanvasElement;
const next = document.getElementById('next')! as HTMLButtonElement;
enum Status {
  Dead,
  Live,
}
interface Item {
  x: number;
  y: number;
  status: Status;
}
const base_rule = (item: Item, item_neighbors: Item[]) => {
  const live_neighbors_count = compact(item_neighbors).filter(n => n.status === Status.Live).length;
  const rule_engine = [[0, 0, 0, 1, 0, 0, 0, 0, 0], /*死的时候 */[0, 0, 1, 1, 0, 0, 0, 0, 0] /*活的时候*/]
  return rule_engine[item.status][live_neighbors_count]
}
class Board<T extends Item> {
  current_board: T[][] = [];
  ctx: CanvasRenderingContext2D;
  cols: number;
  rows: number;
  colors_map = ["#161616", "white"];
  next_board: T[][] = [];
  constructor(public readonly width: number, public readonly height: number, public readonly itemSize: number, public readonly node: HTMLCanvasElement) {
    this.ctx = node.getContext('2d')!;
    this.cols = Math.floor(this.width / itemSize);
    this.rows = Math.floor(this.height / itemSize);
    this.current_board = Array.from({ length: this.cols }, () => Array(this.rows).fill(null));
    this.next_board = Array.from({ length: this.cols }, () => Array(this.rows).fill(null));
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
  flattenMap(data: T[][], callback: (item: T, index: number) => void) {
    map(flatten(data), callback)
  }

  getNeighbors(item: T) {
    return [[-1, -1], [0, -1], [1, -1], [-1, 0], [1, 0], [-1, 1], [0, 1], [1, 1]].map(([dx, dy]) => {
      const x = item.x + dx;
      const y = item.y + dy;
      if (x < 0 || x >= this.cols || y < 0 || y >= this.rows) {
        return null;
      }
      return this.getItem(x, y);
    })
  }
  reRender() {
    this.ctx.clearRect(0, 0, this.width, this.height);
    this.loop((x, y) => {
      const item = this.getItem(x, y)!;
      this.ctx.fillStyle = this.colors_map[item.status]!;
      this.ctx.fillRect(x * this.itemSize, y * this.itemSize, this.itemSize, this.itemSize);
    })
  }
  getItem(x: number, y: number, data = this.current_board) {
    if (x < 0 || x >= this.cols || y < 0 || y >= this.rows) {
      return null;
    }
    return data[y][x];
  }
  next() {
    this.loop((x, y) => {
      const item = this.getItem(x, y)!;
      const next_status = base_rule(item, this.getNeighbors(item) as Item[]);
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
