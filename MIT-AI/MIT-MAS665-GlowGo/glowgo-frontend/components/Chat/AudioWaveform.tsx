'use client'

import { useEffect, useRef } from 'react'

interface AudioWaveformProps {
  isActive: boolean
  className?: string
}

/**
 * Animated audio waveform visualization
 * Shows visual feedback during voice recording
 */
export default function AudioWaveform({ isActive, className = '' }: AudioWaveformProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const animationFrameRef = useRef<number | null>(null)
  const barsRef = useRef<number[]>([])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    // Set canvas size
    const dpr = window.devicePixelRatio || 1
    const rect = canvas.getBoundingClientRect()
    canvas.width = rect.width * dpr
    canvas.height = rect.height * dpr
    ctx.scale(dpr, dpr)

    // Initialize bars with random heights
    const barCount = 40
    if (barsRef.current.length === 0) {
      barsRef.current = Array.from({ length: barCount }, () => Math.random() * 0.3 + 0.1)
    }

    const barWidth = rect.width / barCount
    const maxBarHeight = rect.height

    const animate = () => {
      if (!isActive) {
        // Fade out animation when not active
        ctx.clearRect(0, 0, rect.width, rect.height)
        ctx.fillStyle = '#FBCDD2' // blush-100 (lighter, softer)

        barsRef.current = barsRef.current.map(height => Math.max(height * 0.95, 0.05))

        barsRef.current.forEach((height, i) => {
          const barHeight = height * maxBarHeight
          const x = i * barWidth
          const y = (maxBarHeight - barHeight) / 2

          ctx.fillRect(
            x + barWidth * 0.2,
            y,
            barWidth * 0.6,
            barHeight
          )
        })

        if (Math.max(...barsRef.current) > 0.06) {
          animationFrameRef.current = requestAnimationFrame(animate)
        }
        return
      }

      // Active animation - simulate audio levels
      ctx.clearRect(0, 0, rect.width, rect.height)

      // Update bar heights with smooth random variations
      barsRef.current = barsRef.current.map((height, i) => {
        const target = Math.random() * 0.7 + 0.2
        const speed = 0.15
        return height + (target - height) * speed
      })

      // Draw bars with lighter gradient using brand colors
      const gradient = ctx.createLinearGradient(0, 0, 0, maxBarHeight)
      gradient.addColorStop(0, '#FDE8EA') // blush-50 (lightest)
      gradient.addColorStop(0.3, '#FAD4D8') // blush-500 (main brand color)
      gradient.addColorStop(0.7, '#F5C0C6') // blush-600
      gradient.addColorStop(1, '#E8A1B0') // blush-700 (deepest)

      ctx.fillStyle = gradient

      barsRef.current.forEach((height, i) => {
        const barHeight = height * maxBarHeight
        const x = i * barWidth
        const y = (maxBarHeight - barHeight) / 2

        // Draw bar with rounded caps
        const radius = barWidth * 0.3
        ctx.beginPath()
        ctx.roundRect(
          x + barWidth * 0.2,
          y,
          barWidth * 0.6,
          barHeight,
          radius
        )
        ctx.fill()
      })

      animationFrameRef.current = requestAnimationFrame(animate)
    }

    animate()

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current)
      }
    }
  }, [isActive])

  return (
    <div className={`relative w-full ${className}`}>
      {/* Glowing background effect */}
      <div className="absolute inset-0 bg-gradient-to-r from-blush-50 via-blush-100 to-blush-50 rounded-xl opacity-50 blur-sm"></div>

      {/* Canvas with rounded corners and subtle shadow */}
      <canvas
        ref={canvasRef}
        className="relative w-full h-16 rounded-xl"
        style={{ width: '100%', height: '64px' }}
      />
    </div>
  )
}
