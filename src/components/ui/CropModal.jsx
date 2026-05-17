import { useState, useRef } from 'react'

/**
 * CropModal — drag-to-position + zoom crop tool
 *
 * Props:
 *   src         — data URL of the raw image
 *   shape       — 'circle' | 'rect'  (default: 'circle')
 *   aspectRatio — width/height ratio used when shape='rect'  (default: 16/9)
 *   onApply(dataUrl) — called with the cropped JPEG data URL
 *   onCancel()  — called when user cancels
 */
export default function CropModal({ src, shape = 'circle', aspectRatio = 1, onApply, onCancel }) {
  const FRAME_W = 280
  const FRAME_H = shape === 'circle' ? 280 : Math.round(280 / aspectRatio)

  const [pos,     setPos]     = useState({ x: 0, y: 0 })
  const [zoom,    setZoom]    = useState(1)
  const [imgSize, setImgSize] = useState({ w: 1, h: 1 })
  const [ready,   setReady]   = useState(false)
  const MIN_ZOOM = 0.2
  const MAX_ZOOM = 5

  const handleLoad = (e) => {
    const { naturalWidth: w, naturalHeight: h } = e.target
    setImgSize({ w, h })
    // Scale to cover the frame initially
    const coverScale = Math.max(FRAME_W / w, FRAME_H / h)
    setZoom(Math.max(coverScale, MIN_ZOOM))
    setPos({ x: 0, y: 0 })
    setReady(true)
  }

  /* Mouse drag — capture start state in closure so no stale refs */
  const handleMouseDown = (e) => {
    e.preventDefault()
    const sx = e.clientX, sy = e.clientY
    const px = pos.x,     py = pos.y

    const onMove = (ev) => setPos({ x: px + (ev.clientX - sx), y: py + (ev.clientY - sy) })
    const onUp   = () => { window.removeEventListener('mousemove', onMove); window.removeEventListener('mouseup', onUp) }
    window.addEventListener('mousemove', onMove)
    window.addEventListener('mouseup',   onUp)
  }

  /* Touch drag */
  const handleTouchStart = (e) => {
    if (e.touches.length !== 1) return
    const t0 = e.touches[0]
    const sx = t0.clientX, sy = t0.clientY
    const px = pos.x,      py = pos.y

    const onMove = (ev) => {
      if (ev.touches.length !== 1) return
      const t = ev.touches[0]
      setPos({ x: px + (t.clientX - sx), y: py + (t.clientY - sy) })
    }
    const onEnd = () => { window.removeEventListener('touchmove', onMove); window.removeEventListener('touchend', onEnd) }
    window.addEventListener('touchmove', onMove, { passive: true })
    window.addEventListener('touchend',  onEnd)
  }

  const applyImage = () => {
    const EXPORT_W = shape === 'circle' ? 400 : 800
    const EXPORT_H = shape === 'circle' ? 400 : Math.round(800 / aspectRatio)

    const canvas = document.createElement('canvas')
    canvas.width  = EXPORT_W
    canvas.height = EXPORT_H
    const ctx = canvas.getContext('2d')

    if (shape === 'circle') {
      ctx.beginPath()
      ctx.arc(EXPORT_W / 2, EXPORT_H / 2, EXPORT_W / 2, 0, Math.PI * 2)
      ctx.clip()
    }

    // Derive which portion of the source image is visible in the frame
    const dispW = imgSize.w * zoom
    const dispH = imgSize.h * zoom
    const imgX  = FRAME_W / 2 + pos.x - dispW / 2   // top-left of displayed image in frame coords
    const imgY  = FRAME_H / 2 + pos.y - dispH / 2

    const srcX = -imgX / zoom           // source pixel at frame left edge
    const srcY = -imgY / zoom           // source pixel at frame top edge
    const srcW =  FRAME_W / zoom        // source pixels spanning frame width
    const srcH =  FRAME_H / zoom        // source pixels spanning frame height

    const img = new Image()
    img.src = src
    ctx.drawImage(img, srcX, srcY, srcW, srcH, 0, 0, EXPORT_W, EXPORT_H)

    onApply(canvas.toDataURL('image/jpeg', 0.92))
  }

  // Displayed image dimensions & position within the frame
  const dispW = imgSize.w * zoom
  const dispH = imgSize.h * zoom

  return (
    <div
      className="modal-overlay"
      onClick={(e) => { if (e.target.classList.contains('modal-overlay')) onCancel() }}
    >
      <div className="modal" style={{ maxWidth: FRAME_W + 80 }}>
        <div className="modal-title">Crop Photo</div>

        <div style={{ fontSize: 12, color: 'var(--text3)', textAlign: 'center', marginBottom: 16 }}>
          Drag to reposition · slider to zoom
        </div>

        {/* Preview frame */}
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 20 }}>
          <div
            style={{
              width: FRAME_W, height: FRAME_H,
              overflow: 'hidden',
              borderRadius: shape === 'circle' ? '50%' : 12,
              cursor: 'grab',
              position: 'relative',
              border: '2px solid var(--border2)',
              background: 'var(--navy4)',
              userSelect: 'none',
              flexShrink: 0,
            }}
            onMouseDown={handleMouseDown}
            onTouchStart={handleTouchStart}
          >
            <img
              src={src}
              alt=""
              draggable={false}
              onLoad={handleLoad}
              style={{
                position: 'absolute',
                width:  dispW,
                height: dispH,
                left:   FRAME_W / 2 + pos.x - dispW / 2,
                top:    FRAME_H / 2 + pos.y - dispH / 2,
                pointerEvents: 'none',
                userSelect: 'none',
                opacity: ready ? 1 : 0,
                transition: 'opacity .2s',
              }}
            />
          </div>
        </div>

        {/* Zoom slider */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20, padding: '0 12px' }}>
          <span style={{ fontSize: 13, color: 'var(--text3)', lineHeight: 1 }}>−</span>
          <input
            type="range"
            min={MIN_ZOOM}
            max={MAX_ZOOM}
            step={0.01}
            value={zoom}
            onChange={(e) => setZoom(Number(e.target.value))}
            style={{ flex: 1, accentColor: 'var(--gold)', cursor: 'pointer' }}
          />
          <span style={{ fontSize: 13, color: 'var(--text3)', lineHeight: 1 }}>+</span>
        </div>

        <div className="modal-footer">
          <button className="btn" onClick={onCancel}>Cancel</button>
          <button className="btn btn-primary" onClick={applyImage}>Apply</button>
        </div>
      </div>
    </div>
  )
}
