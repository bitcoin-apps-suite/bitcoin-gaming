# bGames

Games on Bitcoin SV, built to open inside bWallet (bWalletX) as a bApp: Snake and 2048, plus chain games
from TokenBlaster.lol (Arena, Chain Frogger) where every move is a real transaction.

- Live: https://bitcoin-gaming.vercel.app (the bGames tile in bWallet's Apps tab opens this)
- In bWallet's frame the page talks to the wallet over BRC-100 XDM (`components/mobile/cwi.ts`); in the
  in-app browser it uses the injected `window.CWI`. See bWallet `docs/BAPP-FRAME.md`.
- `next.config.js` sends `frame-ancestors 'self' capacitor://localhost https://localhost` so the wallet
  can frame it.

## Development

```bash
pnpm install
pnpm dev        # http://localhost:4102
pnpm test
pnpm build
```

## License

MIT
