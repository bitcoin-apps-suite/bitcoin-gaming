import { WalletClient } from '@bsv/sdk';

/**
 * BRC-100 sign-in via window.CWI (injected by bWallet / Yours Wallet Mobile).
 * No keys are ever handled here: we only ask the wallet for the user's
 * public identity key and keep it in localStorage as the session marker.
 */
/** Structurally compatible with the suite's HandCashUser shape. */
export interface CWIUser {
  handle: string;
  paymail: string;
  publicKey?: string;
  avatarUrl?: string;
  displayName?: string;
}

const STORAGE_KEY = 'bwallet_cwi_user';

interface CWILike {
  getPublicKey: (args: { identityKey?: boolean }) => Promise<{ publicKey: string }>;
  isAuthenticated?: (args?: object) => Promise<{ authenticated: boolean }>;
  waitForAuthentication?: (args?: object) => Promise<{ authenticated: boolean }>;
}

let framed: CWILike | null = null;

/**
 * The wallet: bWallet's in-app browser injects window.CWI; inside bWallet's Apps tab the page is an
 * iframe with no injection, and the wallet answers BRC-100 over postMessage (XDM) instead.
 */
export function getCWI(): CWILike | null {
  const w = window as unknown as { CWI?: CWILike };
  if (w.CWI && typeof w.CWI.getPublicKey === 'function') return w.CWI;
  if (window.self !== window.top) return (framed ??= new WalletClient('XDM', window.location.host) as unknown as CWILike);
  return null;
}

export function hasCWI(): boolean {
  return getCWI() !== null;
}

function toUser(publicKey: string): CWIUser {
  const short = `${publicKey.slice(0, 6)}…${publicKey.slice(-4)}`;
  return { handle: short, paymail: '', publicKey, displayName: 'bWallet' };
}

export async function signInWithCWI(): Promise<CWIUser> {
  const cwi = getCWI();
  if (!cwi) throw new Error('bWallet (window.CWI) not available');
  if (cwi.waitForAuthentication) await cwi.waitForAuthentication({});
  const { publicKey } = await cwi.getPublicKey({ identityKey: true });
  const user = toUser(publicKey);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(user));
  return user;
}

export function getStoredCWIUser(): CWIUser | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as CWIUser) : null;
  } catch {
    return null;
  }
}
