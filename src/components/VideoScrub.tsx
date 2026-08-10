import { useLayoutEffect, useRef } from 'react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

interface VideoScrubProps {
  /** Path to video file. Store in public/assets/ — use '/assets/filename.mp4' */
  src: string
  className?: string
  /** How much scroll length to pin the scene for. Default: '300%' */
  scrubLength?: string
  /** Optional overlay content (text, CTAs) rendered above the video */
  children?: React.ReactNode
}

/**
 * Scroll-scrubbed Higgsfield video scene.
 * Rule: At least 1 VideoScrub per site using Higgsfield video.
 * The video currentTime tracks scroll progress — no autoplay needed.
 *
 * IMPORTANT: Video must be muted + playsInline + preload="auto" (already set).
 * Store video in public/assets/ and reference as '/assets/hero-video.mp4'.
 */
export function VideoScrub({ src, className, scrubLength = '300%', children }: VideoScrubProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const videoRef = useRef<HTMLVideoElement>(null)

  useLayoutEffect(() => {
    const video = videoRef.current
    const ctx = gsap.context(() => {
      ScrollTrigger.create({
        trigger: containerRef.current,
        start: 'top top',
        end: `+=${scrubLength}`,
        pin: true,
        scrub: true,
        onUpdate: (self) => {
          if (video?.duration) {
            video.currentTime = self.progress * video.duration
          }
        },
      })
    }, containerRef)
    return () => ctx.revert()
  }, [scrubLength])

  return (
    <div
      ref={containerRef}
      className={`relative h-screen overflow-hidden ${className ?? ''}`}
    >
      <video
        ref={videoRef}
        src={src}
        muted
        playsInline
        preload="auto"
        className="absolute inset-0 w-full h-full object-cover"
      />
      {children && (
        <div className="relative z-10 h-full">
          {children}
        </div>
      )}
    </div>
  )
}
