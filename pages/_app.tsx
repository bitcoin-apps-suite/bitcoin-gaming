import type { AppProps } from 'next/app'
import '../components/mobile/mobile-bwallet.css'
import '../components/mobile/mobile-app.css'
import MobileShellInit from '../components/mobile/MobileShellInit'

export default function App({ Component, pageProps }: AppProps) {
  return (
    <>
      <MobileShellInit />
      <Component {...pageProps} />
    </>
  )
}
