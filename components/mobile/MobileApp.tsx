/**
 * Phone-first bGames app. Rendered instead of the desktop page when the
 * viewport is <= 768px or the page is inside bWallet (see shell.ts).
 *
 * Screens: home (games list with best scores) and a full-screen game.
 * Games: Snake (swipe or d-pad) and 2048 (swipe or d-pad).
 * Chrome: native-style top bar, bottom action bar, silent CWI sign-in.
 */
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { hasCWI, signInWithCWI, CWIUser } from './cwi';
import {
  Board, Dir, GameId, SnakeState, canMove, getHighScores, move2048, new2048, addTile,
  newSnake, recordScore, steer, swipeDir, tickSnake,
} from './games';

export interface MobileAppProps {
  appName: string;
  user: { handle: string; publicKey?: string } | null;
  onLogin: (user: CWIUser) => void;
}

const GAMES: { id: GameId; name: string; icon: string; blurb: string }[] = [
  { id: 'snake', name: 'Snake', icon: '🐍', blurb: 'Eat, grow, don’t hit the walls' },
  { id: '2048', name: '2048', icon: '▦', blurb: 'Merge tiles to reach 2048' },
];

/** Chain games on TokenBlaster.lol: open in this same frame, so they run with your wallet too. */
const CHAIN_GAMES: { name: string; img: string; blurb: string; href: string }[] = [
  { name: 'Arena', img: 'https://www.tokenblaster.lol/arcade/arena.jpg', blurb: 'Load the tokens in your wallet and fire them. Every bullet is a real transaction.', href: 'https://www.tokenblaster.lol/arena' },
  { name: 'Chain Frogger', img: 'https://www.tokenblaster.lol/arcade/frogger.jpg', blurb: 'Cross a 3D city where every vehicle is a live mainnet transaction.', href: 'https://www.tokenblaster.lol/arcade/frogger' },
];

function withTimeout<T>(p: Promise<T>, ms: number): Promise<T> {
  return Promise.race([p, new Promise<T>((_, rej) => setTimeout(() => rej(new Error('timeout')), ms))]);
}

/** Swipe handlers for a game surface. */
function useSwipe(onDir: (d: Dir) => void, onTap?: () => void) {
  const start = useRef<{ x: number; y: number } | null>(null);
  return {
    onTouchStart: (e: React.TouchEvent) => {
      const t = e.touches[0];
      start.current = { x: t.clientX, y: t.clientY };
    },
    onTouchEnd: (e: React.TouchEvent) => {
      if (!start.current) return;
      const t = e.changedTouches[0];
      const d = swipeDir(t.clientX - start.current.x, t.clientY - start.current.y);
      start.current = null;
      if (d) onDir(d); else onTap?.();
    },
  };
}

/** Arrow keys / WASD for hardware keyboards. */
function useKeys(onDir: (d: Dir) => void) {
  useEffect(() => {
    const map: Record<string, Dir> = {
      ArrowUp: 'up', ArrowDown: 'down', ArrowLeft: 'left', ArrowRight: 'right',
      w: 'up', s: 'down', a: 'left', d: 'right',
    };
    const h = (e: KeyboardEvent) => {
      const d = map[e.key];
      if (d) { e.preventDefault(); onDir(d); }
    };
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, [onDir]);
}

function DPad({ onDir }: { onDir: (d: Dir) => void }) {
  return (
    <div className="bgm-dpad" aria-label="Direction pad">
      <button className="bgm-dkey up" aria-label="Up" onClick={() => onDir('up')}>▲</button>
      <button className="bgm-dkey left" aria-label="Left" onClick={() => onDir('left')}>◀</button>
      <button className="bgm-dkey right" aria-label="Right" onClick={() => onDir('right')}>▶</button>
      <button className="bgm-dkey down" aria-label="Down" onClick={() => onDir('down')}>▼</button>
    </div>
  );
}

interface GameHandle { score: number; over: boolean }

function SnakeGame({ paused, onState }: {
  paused: boolean; onState: (s: GameHandle) => void;
}) {
  const [s, setS] = useState<SnakeState>(() => newSnake());
  useEffect(() => { onState({ score: s.score, over: s.over }); }, [s.score, s.over, onState]);
  useEffect(() => {
    if (paused || s.over) return;
    const speed = Math.max(70, 170 - s.score * 5);
    const id = window.setTimeout(() => setS(prev => tickSnake(prev)), speed);
    return () => window.clearTimeout(id);
  }, [s, paused]);
  const onDir = useCallback((d: Dir) => setS(prev => steer(prev, d)), []);
  useKeys(onDir);
  const swipe = useSwipe(onDir);
  const cells: React.ReactNode[] = [];
  const body = new Set(s.snake.map(p => `${p.x},${p.y}`));
  const head = `${s.snake[0].x},${s.snake[0].y}`;
  for (let y = 0; y < s.size; y++) {
    for (let x = 0; x < s.size; x++) {
      const k = `${x},${y}`;
      const cls = k === head ? ' head' : body.has(k) ? ' body' : s.food.x === x && s.food.y === y ? ' food' : '';
      cells.push(<div key={k} className={`bgm-sc${cls}`} />);
    }
  }
  return (
    <>
      <div className="bgm-stage" {...swipe}>
        <div className="bgm-snake" style={{ gridTemplateColumns: `repeat(${s.size}, 1fr)` }} data-testid="snake-board">
          {cells}
        </div>
      </div>
      <DPad onDir={onDir} />
    </>
  );
}

function Game2048({ onState }: { onState: (s: GameHandle) => void }) {
  const [st, setSt] = useState<{ board: Board; score: number }>(() => ({ board: new2048(), score: 0 }));
  const { board, score } = st;
  const over = !canMove(board);
  useEffect(() => { onState({ score, over }); }, [score, over, onState]);
  const onDir = useCallback((d: Dir) => {
    setSt(prev => {
      const r = move2048(prev.board, d);
      return r.moved ? { board: addTile(r.board), score: prev.score + r.gained } : prev;
    });
  }, []);
  useKeys(onDir);
  const swipe = useSwipe(onDir);
  return (
    <>
      <div className="bgm-stage" {...swipe}>
        <div className="bgm-2048" data-testid="board-2048">
          {board.flat().map((v, i) => (
            <div key={i} className={`bgm-tile t${Math.min(v, 4096)}`}>{v || ''}</div>
          ))}
        </div>
      </div>
      <DPad onDir={onDir} />
    </>
  );
}

export default function MobileApp({ appName, user, onLogin }: MobileAppProps) {
  const [game, setGame] = useState<GameId | null>(null);
  const [best, setBest] = useState<Record<GameId, number>>(() => getHighScores());
  const [live, setLive] = useState<GameHandle>({ score: 0, over: false });
  const [paused, setPaused] = useState(false);
  const [restartKey, setRestartKey] = useState(0);
  const [toast, setToast] = useState('');
  const [signInFailed, setSignInFailed] = useState(false);
  const cwi = hasCWI();
  const signingIn = cwi && !user && !signInFailed;

  // Silent BRC-100 sign-in inside bWallet: no chooser, no modal.
  useEffect(() => {
    if (user || !cwi) return;
    let cancelled = false;
    withTimeout(signInWithCWI(), 10000)
      .then(u => { if (!cancelled) onLogin(u); })
      .catch(err => {
        console.warn('bWallet silent sign-in failed', err);
        if (!cancelled) setSignInFailed(true);
      });
    return () => { cancelled = true; };
  }, [user, cwi, onLogin]);

  const flash = useCallback((msg: string) => {
    setToast(msg);
    window.setTimeout(() => setToast(''), 1800);
  }, []);

  // Child games report score/over; record the high score when a round ends.
  const onState = useCallback((s: GameHandle) => {
    setLive(s);
    if (s.over && game) {
      if (recordScore(game, s.score)) flash('New best!');
      setBest(getHighScores());
    }
  }, [game, flash]);

  const open = (id: GameId) => {
    setGame(id);
    setPaused(false);
    setLive({ score: 0, over: false });
    setRestartKey(k => k + 1);
  };

  const goHome = () => {
    if (game && !live.over && recordScore(game, live.score)) flash('New best!');
    setBest(getHighScores());
    setGame(null);
  };

  const restart = () => {
    if (game && recordScore(game, live.score)) setBest(getHighScores());
    setPaused(false);
    setLive({ score: 0, over: false });
    setRestartKey(k => k + 1);
  };

  const share = async () => {
    const g = GAMES.find(x => x.id === game);
    const text = g
      ? `I scored ${live.score} in ${g.name} on ${appName}!`
      : `My ${appName} bests: Snake ${best.snake}, 2048 ${best['2048']}`;
    const nav = navigator as Navigator & { share?: (d: ShareData) => Promise<void> };
    try {
      if (nav.share) { await nav.share({ title: appName, text }); return; }
      await navigator.clipboard.writeText(text);
      flash('Copied');
    } catch (err) {
      if ((err as Error)?.name !== 'AbortError') flash('Share unavailable');
    }
  };

  const current = GAMES.find(x => x.id === game);

  return (
    <div className="bgm-root">
      <header className="bgm-topbar">
        {game ? (
          <button className="bgm-icon-btn" onClick={goHome} aria-label="Back to games">‹</button>
        ) : (
          <span className="bgm-logo" aria-hidden="true">🎮</span>
        )}
        <div className="bgm-title">
          {current ? current.name : appName}
          {current && <span className="bgm-score" data-testid="score">{live.score}</span>}
        </div>
        {user ? (
          <span className="bgm-user" title={user.publicKey} data-testid="user">{user.handle}</span>
        ) : signingIn ? (
          <span className="bgm-user">Signing in…</span>
        ) : null}
      </header>

      {!game ? (
        <main className="bgm-home">
          <ul className="bgm-list">
            {GAMES.map(g => (
              <li key={g.id}>
                <button className="bgm-list-main" onClick={() => open(g.id)} data-testid={`play-${g.id}`}>
                  <span className="bgm-list-icon">{g.icon}</span>
                  <span className="bgm-list-text">
                    <span className="bgm-list-title">{g.name}</span>
                    <span className="bgm-list-sub">{g.blurb}</span>
                  </span>
                  <span className="bgm-best">Best {best[g.id]}</span>
                </button>
              </li>
            ))}
          </ul>
          <p className="bgm-note">Scores are kept on this device. Swipe or use the pad to play.</p>
          <h2 className="bgm-section">Chain games</h2>
          <ul className="bgm-cards">
            {CHAIN_GAMES.map(c => (
              <li key={c.name}>
                <a className="bgm-card" href={c.href} data-testid={`chain-${c.name}`}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={c.img} alt="" className="bgm-card-img" loading="lazy" />
                  <span className="bgm-card-text">
                    <span className="bgm-list-title">{c.name}</span>
                    <span className="bgm-list-sub">{c.blurb}</span>
                  </span>
                </a>
              </li>
            ))}
          </ul>
          <p className="bgm-note">Chain games open from TokenBlaster.lol, right here inside bWallet.</p>
        </main>
      ) : (
        <main className="bgm-game">
          {game === 'snake'
            ? <SnakeGame key={restartKey} paused={paused} onState={onState} />
            : <Game2048 key={restartKey} onState={onState} />}
          {live.over && (
            <div className="bgm-over" role="dialog" aria-label="Game over">
              <div className="bgm-over-card">
                <div className="bgm-over-title">Game over</div>
                <div>Score {live.score} · Best {best[game]}</div>
                <button className="bgm-primary" onClick={restart}>Play again</button>
              </div>
            </div>
          )}
        </main>
      )}

      <nav className="bgm-actionbar">
        {game ? (
          <>
            <button className="bgm-action" onClick={restart}><span className="bgm-action-icon">↻</span>Restart</button>
            {game === 'snake' && (
              <button className="bgm-action" onClick={() => setPaused(p => !p)} disabled={live.over}>
                <span className="bgm-action-icon">{paused ? '▶' : '❚❚'}</span>{paused ? 'Resume' : 'Pause'}
              </button>
            )}
            <button className="bgm-action bgm-action-gold" onClick={share}><span className="bgm-action-icon">⇪</span>Share</button>
          </>
        ) : (
          <>
            <button className="bgm-action" onClick={() => open('snake')}><span className="bgm-action-icon">🐍</span>Snake</button>
            <button className="bgm-action" onClick={() => open('2048')}><span className="bgm-action-icon">▦</span>2048</button>
            <button className="bgm-action bgm-action-gold" onClick={share}><span className="bgm-action-icon">⇪</span>Share</button>
          </>
        )}
      </nav>

      {toast && <div className="bgm-toast" role="status">{toast}</div>}
    </div>
  );
}
