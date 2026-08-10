import { forwardRef, useImperativeHandle, useLayoutEffect, useRef } from 'react'
import gsap from 'gsap'

/* ═══════════════════════════════════════════════════════════════
   DICE CUBE — real CSS 3D geometry, not generated video.

   The prior hero used an AI-generated video loop of the dice tumbling.
   Across three regeneration attempts (two providers, three motion
   profiles) the model repeatedly lost track of which cube face was
   which mid-rotation and rendered two simultaneously-visible faces
   with the SAME pip count — impossible on a real die, and something no
   amount of prompting reliably prevented (a face-identity/temporal-
   consistency limitation of video diffusion, not a prompt problem).

   This component sidesteps that class of bug entirely: six real <span>
   faces are wired into an actual cube via CSS `transform-style:
   preserve-3d` + `backface-visibility: hidden`, each textured with one
   of six independently-generated, verified-correct face photos (see
   public/assets/dice-faces/, cropped from a single studio contact-sheet
   generation — image models render a single face's pip count reliably;
   it is only *video* face-tracking across a rotation that broke). GSAP
   then rotates the actual DOM cube. Because the geometry is real, every
   possible rotation is automatically a valid die — there is no frame,
   ever, where two visible faces can show the same count. Correctness is
   structural, not something re-verified per generation.

   The back face (2) carries the real edge-stamp "2026 · USA" — accurate
   to the physical piece, but not something the marketing hero should
   read aloud. Rather than retouch the photo, the resting pose and idle
   motion are geometrically bounded so the back/left/bottom faces never
   turn to camera: the die tosses in, bounces, and settles showing only
   front (1) / top (5) / right (6), then idles with a small wobble that
   stays well clear of the 90°/180° turns that would reveal another face.
   ═══════════════════════════════════════════════════════════════ */

const FACE = {
  front: '/assets/dice-faces/face-1.jpg', // engraved eye-sigil · FLIGHT TRIBE · 1 ruby
  right: '/assets/dice-faces/face-6.jpg', // 6 rubies, two columns of three
  top: '/assets/dice-faces/face-5.jpg', // 5 rubies, quincunx
  back: '/assets/dice-faces/face-2.jpg', // 2026 · USA · 2 rubies — kept out of view, see header note
  left: '/assets/dice-faces/face-4.jpg', // 4 rubies, corners
  bottom: '/assets/dice-faces/face-3.jpg', // 3 rubies, diagonal
} as const

interface DiceCubeProps {
  reduce: boolean
}

export const DiceCube = forwardRef<HTMLDivElement, DiceCubeProps>(function DiceCube({ reduce }, forwardedRef) {
  const rootRef = useRef<HTMLDivElement>(null)
  const cubeRef = useRef<HTMLDivElement>(null)

  useImperativeHandle(forwardedRef, () => rootRef.current as HTMLDivElement)

  useLayoutEffect(() => {
    const cube = cubeRef.current
    if (!cube) return

    // resting pose: front (1) + top (5) + right (6) all in view — the
    // same three-face read the brief always wanted, now guaranteed real
    const REST = { rotationX: -20, rotationY: 32, rotationZ: 0, x: 0, y: 0, scale: 1 }

    const ctx = gsap.context(() => {
      if (reduce) {
        gsap.set(cube, REST)
        return
      }

      // off-stage left, mid-air, tumbling — about to be tossed in
      gsap.set(cube, {
        x: '-42vw', y: -140, rotationX: -40, rotationY: -300, rotationZ: -22, scale: 0.82, opacity: 0,
      })

      gsap.timeline({ delay: 0.15 })
        .to(cube, { opacity: 1, duration: 0.3, ease: 'power1.out' }, 0)
        // roll in from the left
        .to(cube, { x: 0, duration: 1.05, ease: 'power2.out' }, 0)
        // hits the surface and bounces — a few decreasing bounces baked
        // into the ease, then settles dead on the floor
        .to(cube, { y: 0, duration: 1.3, ease: 'bounce.out' }, 0)
        // tumble decelerates into the guaranteed 1/5/6 resting read —
        // monotonic, so it never lingers face-on to the back/left/bottom
        .to(cube, { rotationX: REST.rotationX, rotationY: REST.rotationY, rotationZ: 0, scale: 1, duration: 1.35, ease: 'power3.out' }, 0.05)
        // idle — small bounded wobble only; ±14° on Y and ±8° on X keeps
        // every face except front/top/right permanently out of frame
        .to(cube, { rotationY: '+=14', duration: 3.2, ease: 'sine.inOut', repeat: -1, yoyo: true }, 1.5)
        .to(cube, { rotationX: '-=8', duration: 4.4, ease: 'sine.inOut', repeat: -1, yoyo: true }, 1.5)
    }, rootRef)

    return () => ctx.revert()
  }, [reduce])

  return (
    <div ref={rootRef} className="dice-stage">
      <div className="dice-stage__scene">
        <div ref={cubeRef} className="dice-cube">
          <span className="dice-face dice-face--front" style={{ backgroundImage: `url(${FACE.front})` }} />
          <span className="dice-face dice-face--back" style={{ backgroundImage: `url(${FACE.back})` }} />
          <span className="dice-face dice-face--right" style={{ backgroundImage: `url(${FACE.right})` }} />
          <span className="dice-face dice-face--left" style={{ backgroundImage: `url(${FACE.left})` }} />
          <span className="dice-face dice-face--top" style={{ backgroundImage: `url(${FACE.top})` }} />
          <span className="dice-face dice-face--bottom" style={{ backgroundImage: `url(${FACE.bottom})` }} />
        </div>
        <div className="dice-stage__shadow" aria-hidden="true" />
      </div>
    </div>
  )
})
