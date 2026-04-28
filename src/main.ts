// @see https://playgameoflife.com/info
import { compact, flatten, map } from "lodash-es";
const app = document.getElementById('app')! as HTMLCanvasElement;
const next = document.getElementById('next')! as HTMLButtonElement;


enum Status {
  Dead,
  Live,
}
class Board<T> {
  current_board: (Item<T> | null)[][] = [];
  ctx: CanvasRenderingContext2D;
  cols: number;
  rows: number;
  colors_map = new Map([[Status.Live, 'white'], [Status.Dead, 'black']]);
  status_board = new Map<string, T>();
  #item_map = new Map<string, Item<T>>();
  #base_board: { x: number, y: number }[] = [];
  constructor(public readonly width: number, public readonly height: number, public readonly itemSize: number, public readonly node: HTMLCanvasElement) {
    this.ctx = node.getContext('2d')!;
    this.cols = Math.floor(this.width / itemSize);
    this.rows = Math.floor(this.height / itemSize);
    this.current_board = Array.from({ length: this.cols }, () => Array(this.rows).fill(null));
    this.node.addEventListener('click', this.canvasHandler.bind(this));
    this.loop(this.cols, this.rows, (col, row) => {
      this.#base_board.push({ x: col, y: row })
    });
    this.#base_board.map(item => this.addItem(new Item(item.x, item.y, this.itemSize, this.ctx, Status.Dead as T, this.colors_map as Map<T, string>)))
  }
  canvasHandler(e: MouseEvent) {
    const { offsetX, offsetY } = e;
    const x = Math.floor(offsetX / this.itemSize);
    const y = Math.floor(offsetY / this.itemSize);
    const item = this.getItem(x, y);
    if (item) {
      item.status = (item.status === Status.Dead ? Status.Live : Status.Dead) as T;
      this.reRender();
    }
  }
  loop(x: number, y: number, callback: (x: number, y: number) => void) {
    for (let _y = 0; _y < y; _y++) {
      for (let _x = 0; _x < x; _x++) {
        callback(_x, _y);
      }
    }
  }

  #generateItemMapKey(item: { x: number, y: number }) {
    return [item.x, item.y].join("-");
  }
  addItem(item: Item<T>) {
    this.#item_map.set(this.#generateItemMapKey(item), item)
    this.current_board[item.y][item.x] = item;
  }
  getNeighbors(item: Item<T>): Item<T>[] {
    return compact(map(item.neighbors, ({ x, y }) => this.getItem(x, y)))
  }
  reRender() {
    map(flatten(this.current_board), (item: Item<T>) => {
      item.draw();
    })
  }
  getItem(x: number, y: number): Item<T> | undefined {
    return this.#item_map.get(this.#generateItemMapKey({ x, y }))
  }
  next() {
    this.calcNextBoard(Board.BASE_RULE);
    this.reRender();
  }
  calcNextBoard(Rule: any) {
    map(flatten(this.current_board), (item: Item<T>) => {
      const key = this.#generateItemMapKey(item);
      // 传入当前的 board 实例，Rule 内部读取的是 item 当前的 status
      const nextSt = Rule(item, this);
      this.status_board.set(key, nextSt);
    });

    // 2. 应用阶段：统一更新状态
    map(flatten(this.current_board), (item: Item<T>) => {
      const key = this.#generateItemMapKey(item);
      if (this.status_board.has(key)) {
        item.status = this.status_board.get(key)!;
      }
    });
  }
  static BASE_RULE = (item: Item<Status>, board: Board<Status>) => {
    const item_neighbors = board.getNeighbors(item);
    const live_neighbors_count = item_neighbors.filter(n => n.status === Status.Live).length;
    const rule_engine = [[0, 0, 0, 1, 0, 0, 0, 0, 0], /*死的时候 */[0, 0, 1, 1, 0, 0, 0, 0, 0] /*活的时候*/]
    return rule_engine[item.status][live_neighbors_count]
  }

}

class Item<T> {
  #fillStyle: string;
  offsetX: number;
  offsetY: number;
  public constructor(public readonly x: number, public readonly y: number, public readonly size: number, public readonly ctx: CanvasRenderingContext2D, public _status: T, public readonly status_color_map: Map<T, string>) {
    this.#fillStyle = this.getFillStyle(this._status);
    this.offsetX = this.x * this.size;
    this.offsetY = this.y * this.size;
  }
  getFillStyle(status: T) {
    return this.status_color_map.get(status) || "#000"
  }
  get status() {
    return this._status;
  }
  set status(value: T) {
    this.#fillStyle = this.getFillStyle(value);
    this._status = value;
  }

  draw() {
    this.ctx.fillStyle = this.#fillStyle;
    this.ctx.fillRect(this.offsetX, this.offsetY, this.size, this.size);
  }

  get neighbors(): { x: number, y: number }[] {
    // 定义8个方向的偏移量：上、下、左、右、左上、右上、左下、右下
    const directions = [
      [-1, -1], [-1, 0], [-1, 1],
      [0, -1], [0, 1],
      [1, -1], [1, 0], [1, 1]
    ];

    return map(directions, ([dx, dy]) => {
      const newX = this.x + dx;
      const newY = this.y + dy;
      return { x: newX, y: newY }
    })
  }
  set fillStyle(color: string) {
    this.#fillStyle = color;
  }
  get fillStyle(): string {
    return this.#fillStyle;
  }
}

const WIDTH = 600;
const HEIGHT = WIDTH;

app.width = WIDTH;
app.height = HEIGHT;
const board = new Board(WIDTH, HEIGHT, 20, app);
board.reRender();

next.addEventListener("click", board.next.bind(board))
