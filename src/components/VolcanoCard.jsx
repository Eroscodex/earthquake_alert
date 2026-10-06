import { getVolcanoAlertInfo } from '../utils/phVolcanoes'

function VolcanoCard({ volcano, distanceKm, isSelected, onSelect }) {
  const alertInfo = getVolcanoAlertInfo(volcano.alertLevel)

  return (
    <article
      onClick={() => onSelect && onSelect(volcano.id)}
      className={`group relative overflow-hidden rounded-2xl border p-4 shadow-sm backdrop-blur-md transition-all cursor-pointer ${
        isSelected
          ? 'border-rose-500 bg-rose-50/90 dark:bg-zinc-900/90 dark:border-rose-500 ring-2 ring-rose-500/50 shadow-md'
          : 'border-slate-200/80 dark:border-zinc-800 bg-white/80 dark:bg-zinc-900/80 hover:border-rose-500/40 hover:bg-rose-50/50 dark:hover:bg-zinc-800/80 hover:shadow-md'
      }`}
    >
      {/* Top row: Volcano Name & Alert Badge */}
      <div className="mb-2 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className={`inline-flex items-center gap-1 rounded-xl px-3 py-1 text-sm font-bold shadow-2xs ${alertInfo.badge}`}>
            🌋 Alert Level {volcano.alertLevel}
          </span>

          {volcano.alertLevel > 0 && (
            <span className="inline-flex items-center gap-1 rounded-full border border-rose-500/30 bg-rose-500/10 px-2.5 py-0.5 text-[11px] font-semibold text-rose-600 dark:text-rose-400">
              <span className="h-1.5 w-1.5 rounded-full bg-rose-500 animate-ping" />
              Active Unrest
            </span>
          )}
        </div>

        <p className="text-xs text-slate-500 dark:text-zinc-400 font-medium truncate">
          Type: {volcano.type}
        </p>
      </div>

      {/* Volcano Name & Province Header */}
      <h3 className="text-base font-bold text-slate-900 dark:text-zinc-100 group-hover:text-rose-600 dark:group-hover:text-rose-400 transition-colors">
        {volcano.name}
      </h3>
      <p className="text-xs text-slate-500 dark:text-zinc-400 font-medium">
        📍 {volcano.province}
      </p>

      {/* Activity Status */}
      <p className="mt-2 text-xs text-slate-600 dark:text-zinc-300 bg-slate-50 dark:bg-zinc-800/70 p-2 rounded-xl border border-slate-200/60 dark:border-zinc-700/60 leading-relaxed">
        {volcano.activity}
      </p>

      {/* Detail statistics grid */}
      <div className="mt-3 grid grid-cols-3 gap-1.5 sm:gap-2 text-[11px] sm:text-xs font-medium text-slate-600 dark:text-zinc-300 pt-2 border-t border-slate-100 dark:border-zinc-800">
        <div>
          <span className="block text-[9px] sm:text-[10px] text-slate-400 dark:text-zinc-500 uppercase tracking-wider truncate">Elevation</span>
          <span className="block truncate font-semibold text-slate-800 dark:text-zinc-200">{volcano.elevation}</span>
        </div>

        <div>
          <span className="block text-[9px] sm:text-[10px] text-slate-400 dark:text-zinc-500 uppercase tracking-wider truncate">Last Eruption</span>
          <span className="block truncate font-semibold text-slate-800 dark:text-zinc-200">{volcano.lastEruption}</span>
        </div>

        <div>
          <span className="block text-[9px] sm:text-[10px] text-slate-400 dark:text-zinc-500 uppercase tracking-wider truncate">Proximity</span>
          <span className={`block truncate ${distanceKm != null ? 'font-semibold text-rose-600 dark:text-rose-400' : 'text-slate-400 dark:text-zinc-500'}`}>
            {distanceKm != null ? `${distanceKm.toFixed(0)} km` : 'Set loc'}
          </span>
        </div>
      </div>
    </article>
  )
}

export default VolcanoCard
