import { useRef, useCallback, useEffect } from 'react'
import { Download, Share2, X } from 'lucide-react'
import { motion } from 'framer-motion'
import { hapticSuccess } from '@/lib/haptics'
import { useToast } from '@/hooks/useToast'

interface ShareImageCardProps {
  tradition: string
  book: string
  chapter: number
  verse: number
  text: string
  onClose: () => void
}

export default function ShareImageCard({ tradition, book, chapter, verse, text, onClose }: ShareImageCardProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const { showToast } = useToast()

  const traditionMeta: Record<string, { label: string; color: string; accent: string }> = {
    bible: { label: 'The Bible', color: '#e0ece2', accent: '#6b8f71' },
    quran: { label: 'The Quran', color: '#f5efe0', accent: '#c9a96e' },
    tanakh: { label: 'The Tanakh', color: '#e0eaf5', accent: '#7a9cc6' },
    buddhist: { label: 'The Dhammapada', color: '#f5e0d8', accent: '#b85c3f' },
    mormon: { label: 'The Book of Mormon', color: '#fffbeb', accent: '#d97706' },
  }

  const meta = traditionMeta[tradition] || { label: tradition, color: '#faf6ee', accent: '#1e2337' }

  const drawCanvas = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const width = 1080
    const height = 1350
    const dpr = 2
    canvas.width = width * dpr
    canvas.height = height * dpr
    canvas.style.width = `${width}px`
    canvas.style.height = `${height}px`
    ctx.scale(dpr, dpr)

    // Background
    ctx.fillStyle = '#faf6ee'
    ctx.fillRect(0, 0, width, height)

    // Subtle top accent bar
    ctx.fillStyle = meta.accent
    ctx.fillRect(0, 0, width, 8)

    // Watermark pattern (subtle dots)
    ctx.fillStyle = 'rgba(30, 35, 55, 0.03)'
    for (let i = 0; i < width; i += 40) {
      for (let j = 0; j < height; j += 40) {
        ctx.beginPath()
        ctx.arc(i, j, 1.5, 0, Math.PI * 2)
        ctx.fill()
      }
    }

    // Content area
    const padding = 80
    const contentWidth = width - padding * 2
    let y = 180

    // Tradition label
    ctx.font = '500 20px Inter, system-ui, sans-serif'
    ctx.fillStyle = meta.accent
    ctx.textAlign = 'center'
    ctx.fillText(meta.label.toUpperCase(), width / 2, y)
    y += 60

    // Quote mark
    ctx.font = 'italic 400 120px Georgia, serif'
    ctx.fillStyle = 'rgba(30, 35, 55, 0.08)'
    ctx.textAlign = 'left'
    ctx.fillText('"', padding, y + 20)

    // Verse text (word wrap)
    ctx.font = '400 42px Georgia, "Times New Roman", serif'
    ctx.fillStyle = '#1e2337'
    ctx.textAlign = 'left'

    const words = text.split(' ')
    let line = ''
    const lines: string[] = []
    for (const word of words) {
      const test = line + word + ' '
      const metrics = ctx.measureText(test)
      if (metrics.width > contentWidth && line.length > 0) {
        lines.push(line.trim())
        line = word + ' '
      } else {
        line = test
      }
    }
    lines.push(line.trim())

    y += 80
    for (const l of lines) {
      ctx.fillText(l, padding, y)
      y += 64
    }

    // Reference
    y += 40
    ctx.font = '500 28px Inter, system-ui, sans-serif'
    ctx.fillStyle = meta.accent
    ctx.textAlign = 'center'
    ctx.fillText(`${book} ${chapter}:${verse}`, width / 2, y)

    // Bottom divider
    y = height - 200
    ctx.strokeStyle = 'rgba(30, 35, 55, 0.1)'
    ctx.lineWidth = 1
    ctx.beginPath()
    ctx.moveTo(padding, y)
    ctx.lineTo(width - padding, y)
    ctx.stroke()

    // App branding
    ctx.font = '500 22px Inter, system-ui, sans-serif'
    ctx.fillStyle = 'rgba(30, 35, 55, 0.4)'
    ctx.textAlign = 'center'
    ctx.fillText('Meek Meet', width / 2, y + 50)

    ctx.font = '400 18px Inter, system-ui, sans-serif'
    ctx.fillStyle = 'rgba(30, 35, 55, 0.25)'
    ctx.fillText('Where wisdom from across the ages gathers', width / 2, y + 85)

    return canvas
  }, [text, book, chapter, verse, meta])

  useEffect(() => {
    drawCanvas()
  }, [drawCanvas])

  const handleDownload = useCallback(() => {
    drawCanvas()
    const canvas = canvasRef.current
    if (!canvas) return
    const link = document.createElement('a')
    link.download = `meek-meet-${book}-${chapter}-${verse}.png`
    link.href = canvas.toDataURL('image/png')
    link.click()
    hapticSuccess()
    showToast('Image saved to gallery', 'success')
  }, [drawCanvas, book, chapter, verse, showToast])

  const handleShare = useCallback(async () => {
    drawCanvas()
    const canvas = canvasRef.current
    if (!canvas) return
    canvas.toBlob(async (blob) => {
      if (!blob) return
      const file = new File([blob], `meek-meet-${book}-${chapter}-${verse}.png`, { type: 'image/png' })
      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        try {
          await navigator.share({
            files: [file],
            title: `${book} ${chapter}:${verse}`,
            text: `"${text}" — ${book} ${chapter}:${verse}`,
          })
          hapticSuccess()
        } catch {
          // cancelled
        }
      } else {
        handleDownload()
      }
    })
  }, [drawCanvas, book, chapter, verse, text, handleDownload])

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ y: 100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 100, opacity: 0 }}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-sm bg-cream rounded-2xl p-5 border border-border-soft shadow-xl"
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-medium text-midnight text-sm">Share Verse</h3>
          <button onClick={onClose} className="p-1">
            <X className="w-5 h-5 text-charcoal-muted" strokeWidth={1.5} />
          </button>
        </div>

        {/* Canvas preview */}
        <div className="rounded-xl overflow-hidden border border-border-soft mb-4">
          <canvas
            ref={canvasRef}
            className="w-full h-auto"
            style={{ aspectRatio: '1080/1350' }}
          />
        </div>

        {/* Canvas is drawn automatically on mount */}

        <div className="flex gap-2">
          <button
            onClick={handleDownload}
            className="flex-1 py-3 bg-midnight text-cream rounded-xl text-sm font-medium flex items-center justify-center gap-2 active:scale-95 transition-transform"
          >
            <Download className="w-4 h-4" strokeWidth={1.5} />
            Save
          </button>
          <button
            onClick={handleShare}
            className="flex-1 py-3 bg-terracotta text-cream rounded-xl text-sm font-medium flex items-center justify-center gap-2 active:scale-95 transition-transform"
          >
            <Share2 className="w-4 h-4" strokeWidth={1.5} />
            Share
          </button>
        </div>
      </motion.div>
    </motion.div>
  )
}
