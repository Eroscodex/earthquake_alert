function AlarmModal({ quake, onClose, onMute, isMuted, isTest = false }) {
  if (!quake && !isTest) return null

  const displayMag = quake ? quake.magnitude.toFixed(1) : '5.5'
  const displayLocation = quake ? quake.location : 'TEST EMERGENCY ALERT SOUND'
  const displayDepth = quake ? `${quake.depthKm.toFixed(1)} km` : '10 km'
  const displayTime = quake ? quake.dateTime : new Date().toLocaleString()

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-md p-4 animate-fade-in">
      <div className="relative w-full max-w-lg overflow-hidden rounded-3xl border-2 border-rose-500 bg-white dark:bg-slate-900 p-6 shadow-2xl shadow-rose-950/50">
        
        {/* Animated Emergency Top Bar */}
        <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-rose-500 via-amber-500 to-rose-600 animate-pulse" />

        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-rose-500/15 text-2xl text-rose-600 dark:text-rose-400 animate-bounce">
              ⚠️
            </span>
            <div>
              <span className="rounded-full bg-rose-500/20 px-2.5 py-0.5 text-xs font-bold uppercase tracking-wider text-rose-600 dark:text-rose-400 border border-rose-500/30">
                {isTest ? 'TEST ALARM ACTIVE' : 'SIGNIFICANT EARTHQUAKE ALERT'}
              </span>
              <h2 className="text-xl font-bold text-slate-900 dark:text-white mt-1">
                Magnitude {displayMag}
              </h2>
            </div>
          </div>

          <button
            onClick={onClose}
            className="rounded-full p-2 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
          >
            ✕
          </button>
        </div>

        {/* Quake Details */}
        <div className="mt-4 rounded-2xl bg-rose-50/80 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/50 p-4 space-y-2 text-sm text-slate-800 dark:text-rose-100">
          <p className="font-semibold text-base">{displayLocation}</p>
          <div className="grid grid-cols-2 gap-2 text-xs opacity-90 pt-1 border-t border-rose-200/60 dark:border-rose-900/40">
            <div>Depth: {displayDepth}</div>
            <div>Time: {displayTime}</div>
          </div>
        </div>

        {/* Emergency Safety Protocol */}
        <div className="mt-4 space-y-2">
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
            PHIVOLCS Emergency Response Guide
          </h4>
          <div className="grid grid-cols-3 gap-2 text-center text-xs">
            <div className="rounded-xl border border-cyan-500/30 bg-cyan-50 dark:bg-slate-800/80 p-2.5">
              <div className="text-lg">🛑</div>
              <div className="font-bold text-cyan-700 dark:text-cyan-300 mt-1">DROP</div>
              <div className="text-[10px] text-slate-500 dark:text-slate-400">Get to hands & knees</div>
            </div>
            <div className="rounded-xl border border-amber-500/30 bg-amber-50 dark:bg-slate-800/80 p-2.5">
              <div className="text-lg">🛡️</div>
              <div className="font-bold text-amber-700 dark:text-amber-300 mt-1">COVER</div>
              <div className="text-[10px] text-slate-500 dark:text-slate-400">Under sturdy desk</div>
            </div>
            <div className="rounded-xl border border-emerald-500/30 bg-emerald-50 dark:bg-slate-800/80 p-2.5">
              <div className="text-lg">✊</div>
              <div className="font-bold text-emerald-700 dark:text-emerald-300 mt-1">HOLD ON</div>
              <div className="text-[10px] text-slate-500 dark:text-slate-400">Until shaking stops</div>
            </div>
          </div>
        </div>

        {/* Buttons */}
        <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
          <button
            onClick={onMute}
            className="inline-flex items-center gap-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 px-4 py-2 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700 cursor-pointer"
          >
            {isMuted ? '🔇 Audio Muted' : '🔊 Mute Sound'}
          </button>

          <button
            onClick={onClose}
            className="inline-flex items-center gap-2 rounded-xl bg-rose-600 px-6 py-2 text-xs font-bold text-white shadow-lg shadow-rose-600/30 hover:bg-rose-700 active:scale-95 transition-all cursor-pointer"
          >
            Acknowledge Alert
          </button>
        </div>

      </div>
    </div>
  )
}

export default AlarmModal
