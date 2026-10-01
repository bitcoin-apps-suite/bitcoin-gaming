import { describe, expect, it } from 'vitest';
import { canMove, move2048, newSnake, slideRow, steer, swipeDir, tickSnake } from '../components/mobile/games';

describe('2048', () => {
  it('merges each pair once', () => {
    expect(slideRow([2, 2, 2, 2])).toEqual({ row: [4, 4, 0, 0], gained: 8 });
    expect(slideRow([0, 4, 0, 4])).toEqual({ row: [8, 0, 0, 0], gained: 8 });
    expect(slideRow([2, 4, 8, 16]).gained).toBe(0);
  });
  it('moves in all directions', () => {
    const b = [[2, 0, 0, 2], [0, 0, 0, 0], [0, 0, 0, 0], [2, 0, 0, 0]];
    expect(move2048(b, 'right').board[0]).toEqual([0, 0, 0, 4]);
    expect(move2048(b, 'down').board[3][0]).toBe(4);
    expect(move2048([[2, 4, 2, 4], [4, 2, 4, 2], [2, 4, 2, 4], [4, 2, 4, 2]], 'left').moved).toBe(false);
  });
  it('detects game over', () => {
    expect(canMove([[2, 4, 2, 4], [4, 2, 4, 2], [2, 4, 2, 4], [4, 2, 4, 2]])).toBe(false);
  });
});

describe('snake', () => {
  it('moves, refuses reversal and dies at the wall', () => {
    let s = newSnake(8, () => 0);
    expect(steer(s, 'left').nextDir).toBe('right');
    s = tickSnake(s, () => 0);
    expect(s.snake[0]).toEqual({ x: 5, y: 4 });
    for (let i = 0; i < 5; i++) s = tickSnake(s, () => 0);
    expect(s.over).toBe(true);
  });
  it('grows when eating', () => {
    const s = { ...newSnake(8), food: { x: 5, y: 4 } };
    const n = tickSnake(s, () => 0);
    expect(n.score).toBe(1);
    expect(n.snake.length).toBe(4);
  });
});

it('swipeDir', () => {
  expect(swipeDir(5, 5)).toBeNull();
  expect(swipeDir(-60, 10)).toBe('left');
  expect(swipeDir(3, 80)).toBe('down');
});
