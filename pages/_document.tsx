import { Html, Head, Main, NextScript } from 'next/document'

// Black from the first paint: without this the browser's default white
// background and 8px body margin flash before the shell classes apply.
export default function Document() {
  return (
    <Html lang="en" style={{ background: '#000', colorScheme: 'dark' }}>
      <Head />
      <body style={{ margin: 0, background: '#000' }}>
        <Main />
        <NextScript />
      </body>
    </Html>
  )
}
