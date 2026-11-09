import { useCallback, useEffect, useRef, useState } from 'react'
import { DuckieEngine, WORLD_W, WORLD_H } from './game/engine'

const A = (p: string) => `${import.meta.env.BASE_URL}assets/${p}`

const DUCKS = [
  { name: 'Rosie', img: 'duck_0.png', stand: 'duckstand_0.png' },
  { name: 'Sunny', img: 'duck_1.png', stand: 'duckstand_1.png' },
  { name: 'Duke', img: 'duck_2.png', stand: 'duckstand_2.png' },
]

type Screen = 'menu' | 'select' | 'game'

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const im = new Image()
    im.onload = () => resolve(im)
    im.onerror = reject
    im.src = src
  })
}

export default function App() {
  const [screen, setScreen] = useState<Screen>(() => (location.hash === '#game' ? 'game' : 'menu'))
  const [charIdx, setCharIdx] = useState(() => Number(localStorage.getItem('duckie.char') ?? 0))
  const [best, setBest] = useState(() => Number(localStorage.getItem('duckie.best') ?? 0))
  const [muted, setMuted] = useState(() => localStorage.getItem('duckie.muted') === '1')
  const bgmRef = useRef<HTMLAudioElement | null>(null)

  const startBgm = useCallback(() => {
    if (!bgmRef.current) {
      const a = new Audio(A('bgm.mp3'))
      a.loop = true
      a.volume = 0.32
      bgmRef.current = a
    }
    if (!muted) bgmRef.current.play().catch(() => {})
  }, [muted])

  useEffect(() => {
    if (!bgmRef.current) return
    if (muted) bgmRef.current.pause()
    else bgmRef.current.play().catch(() => {})
    localStorage.setItem('duckie.muted', muted ? '1' : '0')
  }, [muted])

  const pickChar = (i: number) => {
    setCharIdx(i)
    localStorage.setItem('duckie.char', String(i))
  }

  const handleGameOver = useCallback((score: number) => {
    setBest(prev => {
      const nb = Math.max(prev, score)
      localStorage.setItem('duckie.best', String(nb))
      return nb
    })
  }, [])

  return (
    <div
      className="fixed inset-0 overflow-hidden bg-cover bg-center"
      style={{ backgroundImage: `url(${A('cover_notext.png')})` }}
    >
      {/* soft blur wash outside the stage on wide screens */}
      <div className="absolute inset-0 backdrop-blur-[3px] bg-sky-200/30" />
      <div className="relative h-full w-full flex items-center justify-center">
        <div
          className="relative overflow-hidden shadow-2xl sm:rounded-[28px] sm:ring-8 sm:ring-white/60"
          style={{
            height: '100dvh',
            width: `min(100vw, calc(100dvh * ${WORLD_W} / ${WORLD_H}))`,
            maxHeight: '100dvh',
          }}
        >
          {screen === 'menu' && (
            <MenuScreen
              muted={muted}
              onToggleMute={() => setMuted(m => !m)}
              onStart={() => { startBgm(); setScreen('select') }}
            />
          )}
          {screen === 'select' && (
            <SelectScreen
              charIdx={charIdx}
              onPick={pickChar}
              onBack={() => setScreen('menu')}
              onStart={() => { startBgm(); setScreen('game') }}
            />
          )}
          {screen === 'game' && (
            <GameScreen
              charIdx={charIdx}
              best={best}
              muted={muted}
              onToggleMute={() => setMuted(m => !m)}
              onGameOver={handleGameOver}
              onExit={() => setScreen('menu')}
            />
          )}
        </div>
      </div>
    </div>
  )
}

/* ------------------------------ MENU ------------------------------ */

function MenuScreen({ muted, onToggleMute, onStart }: { muted: boolean; onToggleMute: () => void; onStart: () => void }) {
  const [showHelp, setShowHelp] = useState(false)
  const click = useClickSound(muted)
  return (
    <div className="absolute inset-0 select-none">
      <img src={A('cover_notext.png')} alt="" className="absolute inset-0 h-full w-full object-cover" draggable={false} />
      {/* title */}
      <div className="absolute inset-x-0 top-[7%] flex flex-col items-center gap-1">
        <img src={A('ui_0.png')} alt="DUCKIE" className="w-[62%] animate-wobble drop-shadow-[0_6px_0_rgba(122,74,18,0.35)]" draggable={false} />
        <img src={A('ui_3.png')} alt="JUMP!" className="w-[56%] animate-wobble [animation-delay:0.25s] drop-shadow-[0_6px_0_rgba(122,74,18,0.35)]" draggable={false} />
      </div>
      {/* bouncing duck mascot */}
      <img src={A('duck_0.png')} alt="" className="absolute left-1/2 top-[38%] w-[30%] -translate-x-1/2 animate-hop" draggable={false} />
      {/* buttons */}
      <div className="absolute inset-x-0 bottom-[9%] flex flex-col items-center gap-4">
        <button
          onClick={() => { click(); onStart() }}
          className="push-btn w-[52%] max-w-64 transition-transform active:scale-95"
          aria-label="Start game"
        >
          <img src={A('ui_1.png')} alt="START" className="w-full" draggable={false} />
        </button>
        <button
          onClick={() => { click(); setShowHelp(s => !s) }}
          className="push-btn w-[44%] max-w-56 transition-transform active:scale-95"
          aria-label="Settings and help"
        >
          <img src={A('ui_2.png')} alt="SETTINGS" className="w-full" draggable={false} />
        </button>
      </div>
      {/* help / settings panel */}
      {showHelp && (
        <div className="absolute inset-x-6 bottom-[30%] animate-bounce-in rounded-3xl border-4 border-[#7a4a12] bg-[#fff3d6] p-4 text-center shadow-[8px_8px_0_rgba(122,74,18,0.9)]">
          <p className="font-display text-lg font-bold text-[#c2571b]">HOW TO PLAY</p>
          <p className="mt-1 text-sm font-semibold text-[#7a4a12]">
            ← → / A D or touch-drag to steer.<br />Bounce on bread, hit hay bales for a mega boost.<br />Don't fall in the water!
          </p>
          <button
            onClick={() => { click(); onToggleMute() }}
            className="push-btn mt-3 rounded-full border-4 border-[#7a4a12] bg-[#ffd93c] px-6 py-2 font-display text-base font-bold text-[#c2571b]"
          >
            SOUND: {muted ? 'OFF' : 'ON'}
          </button>
        </div>
      )}
      {/* mute quick toggle */}
      <button
        onClick={() => { onToggleMute() }}
        aria-label={muted ? 'Unmute' : 'Mute'}
        className="push-btn absolute right-3 top-[max(12px,env(safe-area-inset-top))] flex h-11 w-11 items-center justify-center rounded-full border-4 border-[#7a4a12] bg-[#ffd93c] text-xl"
      >
        {muted ? '🔇' : '🔊'}
      </button>
    </div>
  )
}

/* ----------------------------- SELECT ----------------------------- */

function SelectScreen({ charIdx, onPick, onBack, onStart }: { charIdx: number; onPick: (i: number) => void; onBack: () => void; onStart: () => void }) {
  const click = useClickSound(false)
  return (
    <div className="absolute inset-0 select-none">
      <img src={A('select_bg.png')} alt="" className="absolute inset-0 h-full w-full object-cover" draggable={false} />
      <div className="absolute inset-x-0 top-[6%] text-center">
        <span className="font-display text-[clamp(24px,7vw,40px)] font-bold tracking-wide text-[#ffd93c] [-webkit-text-stroke:2px_#7a4a12] [text-shadow:0_4px_0_rgba(122,74,18,0.6)]">
          CHOOSE YOUR DUCKIE
        </span>
      </div>
      <div className="absolute inset-x-0 top-[24%] flex items-end justify-center gap-[3%] px-4">
        {DUCKS.map((d, i) => (
          <button
            key={d.name}
            onClick={() => { click(); onPick(i) }}
            className="group flex w-[30%] flex-col items-center"
            aria-label={`Choose ${d.name}`}
          >
            <img
              src={A(d.stand)}
              alt={d.name}
              draggable={false}
              className={`w-full transition-all duration-200 ${
                i === charIdx
                  ? 'scale-110 drop-shadow-[0_0_14px_rgba(255,255,255,0.95)] animate-bobble'
                  : 'opacity-85 group-active:scale-95'
              }`}
            />
            <span
              className={`mt-2 rounded-full border-[3px] px-3 py-1 font-display text-sm font-bold transition-colors ${
                i === charIdx
                  ? 'border-[#7a4a12] bg-[#ffd93c] text-[#c2571b]'
                  : 'border-white/70 bg-white/40 text-white'
              }`}
            >
              {d.name}
            </span>
          </button>
        ))}
      </div>
      <div className="absolute inset-x-0 bottom-[8%] flex flex-col items-center gap-3">
        <button onClick={() => { click(); onStart() }} className="push-btn w-[52%] max-w-64 transition-transform active:scale-95" aria-label="Start">
          <img src={A('ui_1.png')} alt="START" className="w-full" draggable={false} />
        </button>
        <button
          onClick={() => { click(); onBack() }}
          className="push-btn rounded-full border-4 border-[#7a4a12] bg-[#fff3d6] px-6 py-2 font-display text-base font-bold text-[#c2571b]"
        >
          ← BACK
        </button>
      </div>
    </div>
  )
}

/* ------------------------------ GAME ------------------------------ */

function GameScreen({
  charIdx, best, muted, onToggleMute, onGameOver, onExit,
}: {
  charIdx: number
  best: number
  muted: boolean
  onToggleMute: () => void
  onGameOver: (score: number) => void
  onExit: () => void
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const stageRef = useRef<HTMLDivElement>(null)
  const engineRef = useRef<DuckieEngine | null>(null)
  const [score, setScore] = useState(0)
  const [phase, setPhase] = useState<'playing' | 'paused' | 'over'>('playing')
  const [finalScore, setFinalScore] = useState(0)
  const phaseRef = useRef(phase)
  phaseRef.current = phase
  const click = useClickSound(muted)

  useEffect(() => {
    let disposed = false
    let eng: DuckieEngine | null = null
    const keys = new Set<string>()

    const updateKeys = () => {
      const l = keys.has('ArrowLeft') || keys.has('a')
      const r = keys.has('ArrowRight') || keys.has('d')
      eng?.setKeyDir(l && !r ? -1 : r && !l ? 1 : 0)
    }
    const onKeyDown = (e: KeyboardEvent) => {
      const k = e.key.length === 1 ? e.key.toLowerCase() : e.key
      if (['ArrowLeft', 'ArrowRight', 'a', 'd'].includes(k)) {
        e.preventDefault()
        keys.add(k)
        updateKeys()
      }
      if ((k === 'p' || k === 'Escape') && phaseRef.current === 'playing') {
        setPhase('paused')
        if (eng) eng.paused = true
      }
    }
    const onKeyUp = (e: KeyboardEvent) => {
      const k = e.key.length === 1 ? e.key.toLowerCase() : e.key
      keys.delete(k)
      updateKeys()
    }
    window.addEventListener('keydown', onKeyDown)
    window.addEventListener('keyup', onKeyUp)

    Promise.all([
      loadImage(A(DUCKS[charIdx].img)),
      loadImage(A('bread1.png')),
      loadImage(A('bread2.png')),
      loadImage(A('hay.png')),
      loadImage(A('background.png')),
    ]).then(([duck, bread1, bread2, hay, background]) => {
      if (disposed || !canvasRef.current || !stageRef.current) return
      const rect = stageRef.current.getBoundingClientRect()
      canvasRef.current.style.width = '100%'
      canvasRef.current.style.height = '100%'
      eng = new DuckieEngine(canvasRef.current, { duck, bread1, bread2, hay, background }, {
        onScore: s => setScore(s),
        onGameOver: s => {
          setFinalScore(s)
          onGameOver(s)
          setPhase('over')
        },
      })
      eng.muted = muted
      eng.resize(rect.width, rect.height)
      eng.start()
      engineRef.current = eng
    })

    const onResize = () => {
      if (!stageRef.current || !eng) return
      const r = stageRef.current.getBoundingClientRect()
      eng.resize(r.width, r.height)
    }
    window.addEventListener('resize', onResize)

    return () => {
      disposed = true
      window.removeEventListener('keydown', onKeyDown)
      window.removeEventListener('keyup', onKeyUp)
      window.removeEventListener('resize', onResize)
      eng?.stop()
      engineRef.current = null
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [charIdx])

  useEffect(() => {
    if (engineRef.current) engineRef.current.muted = muted
  }, [muted])

  // pointer steering
  const pointerActive = useRef(false)
  const setPtr = (clientX: number | null) => {
    const el = stageRef.current
    const eng = engineRef.current
    if (!el || !eng) return
    const r = el.getBoundingClientRect()
    eng.setPointer(clientX === null ? null : clientX - r.left, r.width)
  }

  const retry = () => {
    click()
    setScore(0)
    setPhase('playing')
    engineRef.current?.start()
  }

  return (
    <div
      ref={stageRef}
      className="absolute inset-0 touch-none select-none"
      onPointerDown={e => { pointerActive.current = true; setPtr(e.clientX) }}
      onPointerMove={e => { if (pointerActive.current) setPtr(e.clientX) }}
      onPointerUp={() => { pointerActive.current = false; setPtr(null) }}
      onPointerCancel={() => { pointerActive.current = false; setPtr(null) }}
    >
      <canvas ref={canvasRef} className="block h-full w-full" />

      {/* HUD */}
      {phase !== 'over' && (
        <div className="pointer-events-none absolute inset-x-0 top-0 flex items-start justify-between p-3 pt-[max(12px,env(safe-area-inset-top))]">
          <div className="rounded-full border-4 border-[#7a4a12] bg-[#fff3d6]/95 px-4 py-1 shadow-[4px_4px_0_rgba(122,74,18,0.85)]">
            <div className="text-[10px] font-bold tracking-widest text-[#c2571b]">SCORE</div>
            <div className="font-display text-2xl font-bold tabular-nums leading-none text-[#7a4a12]">{score}</div>
          </div>
          <div className="pointer-events-auto flex gap-2">
            <button
              onClick={() => onToggleMute()}
              aria-label={muted ? 'Unmute' : 'Mute'}
              className="push-btn flex h-11 w-11 items-center justify-center rounded-full border-4 border-[#7a4a12] bg-[#ffd93c] text-lg"
            >
              {muted ? '🔇' : '🔊'}
            </button>
            {phase === 'playing' && (
              <button
                onClick={() => { click(); setPhase('paused'); if (engineRef.current) engineRef.current.paused = true }}
                aria-label="Pause"
                className="push-btn flex h-11 w-11 items-center justify-center rounded-full border-4 border-[#7a4a12] bg-[#ffd93c] text-lg font-bold text-[#7a4a12]"
              >
                ❚❚
              </button>
            )}
          </div>
        </div>
      )}

      {/* PAUSED */}
      {phase === 'paused' && (
        <div className="absolute inset-0 flex items-center justify-center bg-sky-900/40 backdrop-blur-[2px]">
          <div className="animate-bounce-in rounded-3xl border-4 border-[#7a4a12] bg-[#fff3d6] p-6 text-center shadow-[10px_10px_0_rgba(122,74,18,0.9)]">
            <p className="font-display text-3xl font-bold text-[#c2571b]">PAUSED</p>
            <div className="mt-4 flex flex-col items-center gap-3">
              <button
                onClick={() => { click(); setPhase('playing'); if (engineRef.current) engineRef.current.paused = false }}
                className="push-btn w-48 rounded-full border-4 border-[#7a4a12] bg-[#ffd93c] py-2 font-display text-xl font-bold text-[#c2571b]"
              >
                RESUME
              </button>
              <button onClick={retry} className="push-btn w-48 rounded-full border-4 border-[#7a4a12] bg-[#fff] py-2 font-display text-xl font-bold text-[#c2571b]">
                RESTART
              </button>
              <button onClick={() => { click(); onExit() }} className="push-btn w-48 rounded-full border-4 border-[#7a4a12] bg-[#fff] py-2 font-display text-xl font-bold text-[#c2571b]">
                MENU
              </button>
            </div>
          </div>
        </div>
      )}

      {/* GAME OVER */}
      {phase === 'over' && (
        <div className="absolute inset-0 flex items-center justify-center bg-sky-900/40 backdrop-blur-[2px]">
          <div className="animate-bounce-in rounded-3xl border-4 border-[#7a4a12] bg-[#fff3d6] px-8 py-6 text-center shadow-[10px_10px_0_rgba(122,74,18,0.9)]">
            <p className="font-display text-3xl font-bold text-[#c2571b]">SPLASH!</p>
            {finalScore >= best && finalScore > 0 && (
              <p className="mt-1 animate-pulse font-display text-sm font-bold text-[#ff7a1a]">★ NEW BEST! ★</p>
            )}
            <div className="mt-3 flex items-center justify-center gap-6">
              <div>
                <div className="text-[10px] font-bold tracking-widest text-[#c2571b]">SCORE</div>
                <div className="font-display text-4xl font-bold tabular-nums text-[#7a4a12]">{finalScore}</div>
              </div>
              <div>
                <div className="text-[10px] font-bold tracking-widest text-[#c2571b]">BEST</div>
                <div className="font-display text-4xl font-bold tabular-nums text-[#7a4a12]">{best}</div>
              </div>
            </div>
            <div className="mt-5 flex flex-col items-center gap-3">
              <button onClick={retry} className="push-btn w-52 rounded-full border-4 border-[#7a4a12] bg-[#ffd93c] py-2.5 font-display text-xl font-bold text-[#c2571b]">
                ↻ RETRY
              </button>
              <button onClick={() => { click(); onExit() }} className="push-btn w-52 rounded-full border-4 border-[#7a4a12] bg-[#fff] py-2.5 font-display text-xl font-bold text-[#c2571b]">
                MENU
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function useClickSound(muted: boolean) {
  return useCallback(() => {
    if (muted) return
    const a = new Audio(A('click.mp3'))
    a.volume = 0.5
    a.play().catch(() => {})
  }, [muted])
}
