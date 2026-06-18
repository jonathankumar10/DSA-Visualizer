export default function ZoomControls({ onZoomIn, onZoomOut, onReset, isZoomed }) {
  const btn = 'w-7 h-7 rounded-lg flex items-center justify-center text-slate-400 hover:text-white bg-white/[0.04] hover:bg-white/[0.08] border border-white/10 transition-colors leading-none select-none'
  return (
    <div className="absolute top-3 right-3 flex items-center gap-1 z-10">
      <button onClick={onZoomOut} className={btn} aria-label="Zoom out">−</button>
      {isZoomed && (
        <button onClick={onReset} className={`${btn} w-auto px-2 text-[10px]`} aria-label="Reset zoom">
          reset
        </button>
      )}
      <button onClick={onZoomIn} className={btn} aria-label="Zoom in">+</button>
    </div>
  )
}
