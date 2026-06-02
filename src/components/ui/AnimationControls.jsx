const SPEEDS = [0.5, 1, 2]

function PauseIcon() {
  return (
    <svg width="11" height="11" viewBox="0 0 11 11" fill="currentColor">
      <rect x="1.5" y="1" width="3" height="9" rx="1" />
      <rect x="6.5" y="1" width="3" height="9" rx="1" />
    </svg>
  )
}

function PlayIcon() {
  return (
    <svg width="11" height="11" viewBox="0 0 11 11" fill="currentColor">
      <path d="M2 1 L10 5.5 L2 10 Z" />
    </svg>
  )
}

export default function AnimationControls({ isPlaying, speed, onToggle, onSpeed }) {
  return (
    <div className="flex items-center justify-center gap-3 pt-3 border-t border-white/8 mt-1">
      <button
        onClick={onToggle}
        title={isPlaying ? 'Pause' : 'Play'}
        className="w-8 h-8 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20
          flex items-center justify-center text-slate-400 hover:text-white transition-colors"
      >
        {isPlaying ? <PauseIcon /> : <PlayIcon />}
      </button>

      <div className="flex gap-1">
        {SPEEDS.map((s) => (
          <button
            key={s}
            onClick={() => onSpeed(s)}
            className={`px-2 py-0.5 rounded text-xs font-mono font-semibold transition-colors ${
              speed === s
                ? 'bg-blue-600 text-white'
                : 'bg-white/5 border border-white/10 text-slate-500 hover:text-slate-200 hover:border-white/20'
            }`}
          >
            {s}x
          </button>
        ))}
      </div>
    </div>
  )
}
