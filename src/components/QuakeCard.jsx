function QuakeCard({ quake, distanceKm, isSignificant, isSelected, onSelect }) {
  let magBadgeStyle = 'bg-cyan-500/10 text-cyan-600 dark:bg-cyan-500/20 dark:text-cyan-300 border-cyan-500/30'
  if (quake.magnitude >= 5.0) {
    magBadgeStyle = 'bg-rose-500/15 text-rose-600 dark:bg-rose-500/25 dark:text-rose-400 border-rose-500/40 animate-pulse'
  } else if (quake.magnitude >= 4.0) {
    magBadgeStyle = 'bg-amber-500/15 text-amber-600 dark:bg-amber-500/25 dark:text-amber-400 border-amber-500/30'
  }

  return (
    <article
      onClick={() => onSelect && onSelect(quake.id)}
      className={`group relative overflow-hidden rounded-2xl border p-4 shadow-sm backdrop-blur-md transition-all cursor-pointer ${
        isSelected
          ? 'border-cyan-500 bg-cyan-50/90 dark:bg-zinc-900/90 dark:border-cyan-500 ring-2 ring-cyan-500/50 shadow-md'
          : 'border-slate-200/80 dark:border-zinc-800 bg-white/80 dark:bg-zinc-900/80 hover:border-cyan-500/40 hover:bg-cyan-50/50 dark:hover:bg-zinc-800/80 hover:shadow-md'
      }`}
    >
      {/* Top row: Magnitude & Tags */}
      <div className="mb-2 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className={`inline-flex items-center rounded-xl border px-3 py-1 text-sm font-bold shadow-2xs ${magBadgeStyle}`}>
            M {quake.magnitude.toFixed(1)}
          </span>

          {isSignificant && (
            <span className="inline-flex items-center gap-1 rounded-full border border-rose-500/30 bg-rose-500/10 px-2.5 py-0.5 text-[11px] font-semibold text-rose-600 dark:text-rose-400">
              <span className="h-1.5 w-1.5 rounded-full bg-rose-500 animate-ping" />
              Significant
            </span>
          )}
        </div>

        <p className="text-xs text-slate-500 dark:text-zinc-400 font-medium">
          {quake.dateTime}
        </p>
      </div>

      {/* Location header */}
      <h3 className="text-sm font-semibold text-slate-800 dark:text-zinc-100 group-hover:text-cyan-600 dark:group-hover:text-cyan-400 transition-colors">
        {quake.location}
      </h3>

      {/* Detail statistics grid */}
      <div className="mt-3 grid grid-cols-3 gap-2 text-xs font-medium text-slate-600 dark:text-zinc-300 pt-2 border-t border-slate-100 dark:border-zinc-800">
        <div>
          <span className="block text-[10px] text-slate-400 dark:text-zinc-500 uppercase tracking-wider">Depth</span>
          <span>{quake.depthKm.toFixed(1)} km</span>
        </div>

        <div>
          <span className="block text-[10px] text-slate-400 dark:text-zinc-500 uppercase tracking-wider">Coordinates</span>
          <span>{quake.lat.toFixed(2)}°, {quake.lng.toFixed(2)}°</span>
        </div>

        <div>
          <span className="block text-[10px] text-slate-400 dark:text-zinc-500 uppercase tracking-wider">Proximity</span>
          <span className={distanceKm != null ? 'font-semibold text-cyan-600 dark:text-cyan-400' : 'text-slate-400 dark:text-zinc-500'}>
            {distanceKm != null ? `${distanceKm.toFixed(1)} km` : 'Set location'}
          </span>
        </div>
      </div>
    </article>
  )
}


export default QuakeCard