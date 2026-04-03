import { useEffect, useState, type CSSProperties } from 'react'
import { BRAND_ACRONYM, BRAND_FULL_NAME } from '../data/brand'
import './SplashScreen.css'

const SPLASH_MS = 2800
const EXIT_START_MS = 2200

interface SplashScreenProps {
  onDone: () => void
}

export function SplashScreen({ onDone }: SplashScreenProps) {
  const [phase, setPhase] = useState<'in' | 'out'>('in')
  const letters = [...BRAND_ACRONYM]

  useEffect(() => {
    const exit = window.setTimeout(() => setPhase('out'), EXIT_START_MS)
    const done = window.setTimeout(onDone, SPLASH_MS)
    return () => {
      window.clearTimeout(exit)
      window.clearTimeout(done)
    }
  }, [onDone])

  return (
    <div
      className={`splash${phase === 'out' ? ' splash--out' : ''}`}
      role="presentation"
      aria-hidden="true"
    >
      <div className="splash__vignette" />
      <div className="splash__grid" />
      <div className="splash__scanline" />
      <div className="splash__content">
        <div className="splash__wordmark" aria-label={`${BRAND_ACRONYM}, ${BRAND_FULL_NAME}`}>
          {letters.map((ch, i) => (
            <span key={`${ch}-${i}`} className="splash__char-wrap" style={{ '--i': i } as CSSProperties}>
              <span className="splash__bar" aria-hidden />
              <span className="splash__letter">{ch}</span>
            </span>
          ))}
        </div>
        <p className="splash__subtitle">{BRAND_FULL_NAME}</p>
      </div>
    </div>
  )
}
