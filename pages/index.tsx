import { useState } from 'react'
import Head from 'next/head'

export default function Home() {
  const [isHovered, setIsHovered] = useState(false)

  return (
    <>
      <Head>
        <title>Bitcoin Gaming - The Future of Gaming</title>
        <meta name="description" content="Revolutionary Bitcoin-powered gaming platform" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <main style={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #f7931a 0%, #ff6b35 100%)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px',
        fontFamily: 'Arial, sans-serif'
      }}>
        <div style={{
          textAlign: 'center',
          color: 'white',
          maxWidth: '800px'
        }}>
          <h1 style={{
            fontSize: '4rem',
            fontWeight: 'bold',
            marginBottom: '1rem',
            textShadow: '2px 2px 4px rgba(0,0,0,0.3)'
          }}>
            ₿ Bitcoin Gaming
          </h1>
          
          <p style={{
            fontSize: '1.5rem',
            marginBottom: '2rem',
            opacity: 0.9
          }}>
            The Future of Gaming is Here
          </p>
          
          <p style={{
            fontSize: '1.1rem',
            marginBottom: '3rem',
            lineHeight: '1.6',
            opacity: 0.8
          }}>
            Experience revolutionary gaming powered by Bitcoin. Earn, play, and own your digital assets 
            in a decentralized gaming ecosystem.
          </p>
          
          <button
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
            style={{
              background: isHovered ? 'rgba(255,255,255,0.2)' : 'rgba(255,255,255,0.1)',
              border: '2px solid white',
              color: 'white',
              padding: '15px 30px',
              fontSize: '1.2rem',
              borderRadius: '50px',
              cursor: 'pointer',
              transition: 'all 0.3s ease',
              transform: isHovered ? 'translateY(-2px)' : 'translateY(0)',
              boxShadow: isHovered ? '0 8px 25px rgba(0,0,0,0.2)' : '0 4px 15px rgba(0,0,0,0.1)'
            }}
          >
            Coming Soon
          </button>
        </div>
        
        <div style={{
          position: 'absolute',
          bottom: '20px',
          color: 'rgba(255,255,255,0.7)',
          fontSize: '0.9rem'
        }}>
          Part of the Bitcoin Apps Suite
        </div>
      </main>
    </>
  )
}