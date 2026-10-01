/** Pure game logic for the bGames mobile app (no DOM), plus local high scores. */

export type Dir = 'up' | 'down' | 'left' | 'right';
export interface Pt { x: number; y: number }

const DELTA: Record<Dir, Pt> = {
  up: { x: 0, y: -1 }, down: { x: 0, y: 1 }, left: { x: -1, y: 0 }, right: { x: 1, y: 0 },
};
const OPPOSITE: Record<Dir, Dir> = { up: 'down', down: 'up', left: 'right', right: 'left' };

// ---------- Snake ----------
export interface SnakeState {
  size: number;
  snake: Pt[]; // head first
  dir: Dir;
  nextDir: Dir;
  food: Pt;
  score: number;
  over: boolean;
}

export function placeFood(size: number, snake: Pt[], rnd: () => number = Math.random): Pt {
  const free: Pt[] = [];
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      if (!snake.some(p => p.x === x && p.y === y)) free.push({ x, y });
    }
  }
  return free.length ? free[Math.floor(rnd() * free.length)] : { x: -1, y: -1 };
}

export function newSnake(size = 16, rnd: () => number = Math.random): SnakeState {
  const mid = Math.floor(size / 2);
  const snake = [{ x: mid, y: mid }, { x: mid - 1, y: mid }, { x: mid - 2, y: mid }];
  return { size, snake, dir: 'right', nextDir: 'right', food: placeFood(size, snake, rnd), score: 0, over: false };
}

/** Queue a turn; reversing into yourself is ignored. */
export function steer(s: SnakeState, d: Dir): SnakeState {
  if (s.over || d === OPPOSITE[s.dir]) return s;
  return { ...s, nextDir: d };
}

export function tickSnake(s: SnakeState, rnd: () => number = Math.random): SnakeState {
  if (s.over) return s;
  const dir = s.nextDir;
  const head = { x: s.snake[0].x + DELTA[dir].x, y: s.snake[0].y + DELTA[dir].y };
  const eats = head.x === s.food.x && head.y === s.food.y;
  const body = eats ? s.snake : s.snake.slice(0, -1);
  const hitWall = head.x < 0 || head.y < 0 || head.x >= s.size || head.y >= s.size;
  if (hitWall || body.some(p => p.x === head.x && p.y === head.y)) return { ...s, dir, over: true };
  const snake = [head, ...body];
  return {
    ...s, dir, snake,
    score: eats ? s.score + 1 : s.score,
    food: eats ? placeFood(s.size, snake, rnd) : s.food,
  };
}

// ---------- 2048 ----------
export type Board = number[][]; // 4x4, 0 = empty

export function emptyBoard(): Board {
  return Array.from({ length: 4 }, () => [0, 0, 0, 0]);
}

export function addTile(b: Board, rnd: () => number = Math.random): Board {
  const free: Pt[] = [];
  b.forEach((row, y) => row.forEach((v, x) => { if (!v) free.push({ x, y }); }));
  if (!free.length) return b;
  const p = free[Math.floor(rnd() * free.length)];
  const next = b.map(r => [...r]);
  next[p.y][p.x] = rnd() < 0.9 ? 2 : 4;
  return next;
}

export function new2048(rnd: () => number = Math.random): Board {
  return addTile(addTile(emptyBoard(), rnd), rnd);
}

/** Slide one row to the left, merging equal neighbours once. */
export function slideRow(row: number[]): { row: number[]; gained: number } {
  const vals = row.filter(v => v);
  const out: number[] = [];
  let gained = 0;
  for (let i = 0; i < vals.length; i++) {
    if (vals[i] === vals[i + 1]) {
      out.push(vals[i] * 2);
      gained += vals[i] * 2;
      i++;
    } else {
      out.push(vals[i]);
    }
  }
  while (out.length < 4) out.push(0);
  return { row: out, gained };
}

const transpose = (b: Board): Board => b[0].map((_, x) => b.map(r => r[x]));
const flip = (b: Board): Board => b.map(r => [...r].reverse());

export function move2048(b: Board, d: Dir): { board: Board; gained: number; moved: boolean } {
  let g = b;
  if (d === 'up' || d === 'down') g = transpose(g);
  if (d === 'right' || d === 'down') g = flip(g);
  let gained = 0;
  g = g.map(r => { const s = slideRow(r); gained += s.gained; return s.row; });
  if (d === 'right' || d === 'down') g = flip(g);
  if (d === 'up' || d === 'down') g = transpose(g);
  const moved = g.some((r, y) => r.some((v, x) => v !== b[y][x]));
  return { board: g, gained, moved };
}

export function canMove(b: Board): boolean {
  return (['up', 'down', 'left', 'right'] as Dir[]).some(d => move2048(b, d).moved);
}

/** Swipe direction from a touch delta, or null for a tap. */
export function swipeDir(dx: number, dy: number, min = 24): Dir | null {
  if (Math.max(Math.abs(dx), Math.abs(dy)) < min) return null;
  if (Math.abs(dx) > Math.abs(dy)) return dx > 0 ? 'right' : 'left';
  return dy > 0 ? 'down' : 'up';
}

// ---------- High scores ----------
export type GameId = 'snake' | '2048';
const HS_KEY = 'bgames_highscores';

export function getHighScores(): Record<GameId, number> {
  try {
    const raw = localStorage.getItem(HS_KEY);
    return { snake: 0, '2048': 0, ...(raw ? JSON.parse(raw) : {}) };
  } catch {
    return { snake: 0, '2048': 0 };
  }
}

/** Saves if it beats the stored best. Returns true for a new record. */
export function recordScore(game: GameId, score: number): boolean {
  const hs = getHighScores();
  if (score <= hs[game]) return false;
  try {
    localStorage.setItem(HS_KEY, JSON.stringify({ ...hs, [game]: score }));
  } catch {
    /* storage unavailable */
  }
  return true;
}
