'use client';

/**
 * bWalletX payments over the open BRC-100 wallet interface (same pattern as the other bApps).
 *
 * WalletClient('auto') picks the transport: XDM when framed inside bWalletX, window.CWI when a
 * wallet injects it, otherwise a local wallet on localhost:3321. Any BRC-100 wallet works.
 * No keys and no balances live in this app: every payment is a createAction the wallet shows on
 * its own approval sheet, and the user approves it there.
 */
import { WalletClient, P2PKH, PublicKey } from '@bsv/sdk';

let client: WalletClient | null = null;
export function wallet(): WalletClient {
  if (!client) {
    const w = window as unknown as { CWI?: WalletClient };
    const framed = window.self !== window.top;
    client = w.CWI && typeof w.CWI.createAction === 'function'
      ? w.CWI
      : new WalletClient(framed ? 'XDM' : 'auto', window.location.host);
  }
  return client;
}

/** Where tips go: a public receive address set by env (never hardcoded). Empty = tips hidden. */
export const TIP_ADDRESS = process.env.NEXT_PUBLIC_TIP_ADDRESS ?? '';
export const TIP_SATS = [1000, 5000, 20000] as const;

const desc = (d: string) => d.slice(0, 50).padEnd(5, ' ');

/** Pay satoshis to a P2PKH address. The wallet shows its own approval sheet. */
export async function payAddress(address: string, satoshis: number, description: string): Promise<string> {
  const res = await wallet().createAction({
    description: desc(description),
    outputs: [{ lockingScript: new P2PKH().lock(address).toHex(), satoshis, outputDescription: 'payment' }],
    options: { randomizeOutputs: false },
  });
  if (!res.txid) throw new Error('The wallet did not return a transaction id.');
  return res.txid;
}

/** Pay satoshis to an identity key (P2PKH to its address). */
export function payIdentity(toIdentityKey: string, satoshis: number, description: string): Promise<string> {
  return payAddress(PublicKey.fromString(toIdentityKey).toAddress(), satoshis, description);
}

/** Tip the bGames makers. */
export function tip(satoshis: number): Promise<string> {
  if (!TIP_ADDRESS) return Promise.reject(new Error('Tips are not set up yet.'));
  return payAddress(TIP_ADDRESS, satoshis, `bGames tip ${satoshis} sats`);
}
