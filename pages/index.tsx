import { useCallback, useEffect, useState } from 'react'
import Head from 'next/head'
import dynamic from 'next/dynamic'
import { useMountedCompactShell } from '../components/mobile/shell'
import { CWIUser, getStoredCWIUser } from '../components/mobile/cwi'

// Client-only: the phone app uses window, localStorage and touch APIs.
const MobileApp = dynamic(() => import('../components/mobile/MobileApp'), { ssr: false })

export default function Home() {
  const compact = useMountedCompactShell()
  // Restore a bWallet user. Server: null; nothing user-dependent renders before mount.
  const [user, setUser] = useState<CWIUser | null>(() => (typeof window === 'undefined' ? null : getStoredCWIUser()))
  const handleLogin = useCallback((u: CWIUser) => setUser(u), [])

  useEffect(() => {
    document.documentElement.classList.toggle('bw-mobile-app', compact === true)
  }, [compact])

  const head = (
    <Head>
      <title>bGames</title>
      <meta name="description" content="Games on Bitcoin SV, inside bWallet: Snake, 2048, and chain games where every move is a real transaction." />
      <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
      <meta name="theme-color" content="#000000" />
      <link rel="icon" href="/favicon.ico" />
    </Head>
  )

  // Not mounted yet: render neither variant, so the server HTML never holds
  // the desktop page for a phone (no flash) and hydration matches.
  if (compact === null) return <>{head}<div style={{ minHeight: '100vh', background: '#000' }} /></>
  if (compact) return <>{head}<MobileApp appName="bGames" user={user} onLogin={handleLogin} /></>
  return (
    <>
      {head}
      <div style={{ minHeight: '100vh', background: '#000', display: 'flex', justifyContent: 'center' }}>
        <div style={{ width: '100%', maxWidth: 480 }}>
          <MobileApp appName="bGames" user={user} onLogin={handleLogin} />
        </div>
      </div>
    </>
  )
}
