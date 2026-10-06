import { getHeatCategory } from '../utils/phHeatIndex'

function HeatCard({ station, distanceKm, isSelected, onSelect }) {
  const category = getHeatCategory(station.heatIndex)

  return (
    <article
      onClick={() => onSelect && onSelect(station.id)}
      className={`group relative overflow-hidden rounded-2xl border p-4 shadow-sm backdrop-blur-md transition-all cursor-pointer ${
        isSelected
          ? 'border-amber-500 bg-amber-50/90 dark:bg-zinc-900/90 dark:border-amber-500 ring-2 ring-amber-500/50 shadow-md'
          : 'border-slate-200/80 dark:border-zinc-800 bg-white/80 dark:bg-zinc-900/80 hover:border-amber-500/40 hover:bg-amber-50/50 dark:hover:bg-zinc-800/80 hover:shadow-md'
      }`}
    >
      {/* Top row: Heat Index Badge & Category */}
      <div className="mb-2 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className={`inline-flex items-center gap-1 rounded-xl px-3 py-1 text-sm font-bold shadow-2xs ${category.badgeColor}`}>
            🌡️ {station.heatIndex}°C
          </span>

          <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-[11px] font-semibold ${category.color}`}>
            {category.shortLabel}
          </span>
        </div>

        <p className="text-xs text-slate-500 dark:text-zinc-400 font-medium">
          {station.time}
        </p>
      </div>

      {/* Station Location Header */}
      <h3 className="text-sm font-semibold text-slate-800 dark:text-zinc-100 group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors">
        📍 {station.station}
      </h3>

      <p className="mt-1 text-xs text-slate-600 dark:text-zinc-400 italic">
        "{category.advice}"
      </p>

      {/* Detail statistics grid */}
      <div className="mt-3 grid grid-cols-3 gap-1.5 sm:gap-2 text-[11px] sm:text-xs font-medium text-slate-600 dark:text-zinc-300 pt-2 border-t border-slate-100 dark:border-zinc-800">
        <div>
          <span className="block text-[9px] sm:text-[10px] text-slate-400 dark:text-zinc-500 uppercase tracking-wider truncate">Air Temp</span>
          <span className="block truncate font-semibold text-slate-800 dark:text-zinc-200">{station.temp}°C</span>
        </div>

        <div>
          <span className="block text-[9px] sm:text-[10px] text-slate-400 dark:text-zinc-500 uppercase tracking-wider truncate">Humidity</span>
          <span className="block truncate font-semibold text-slate-800 dark:text-zinc-200">{station.humidity}%</span>
        </div>

        <div>
          <span className="block text-[9px] sm:text-[10px] text-slate-400 dark:text-zinc-500 uppercase tracking-wider truncate">Proximity</span>
          <span className={`block truncate ${distanceKm != null ? 'font-semibold text-amber-600 dark:text-amber-400' : 'text-slate-400 dark:text-zinc-500'}`}>
            {distanceKm != null ? `${distanceKm.toFixed(0)} km` : 'Set loc'}
          </span>
        </div>
      </div>
    </article>
  )
}

export default HeatCard
