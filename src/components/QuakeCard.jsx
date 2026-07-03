function QuakeCard({ quake, distanceKm, isSignificant }) {
  return (
    <article className="rounded-xl border border-slate-800 bg-slate-900/80 p-4 shadow-lg shadow-slate-950/30">
      <div className="mb-2 flex items-start justify-between gap-2">
        <p className="text-sm text-slate-300">{quake.dateTime}</p>
        {isSignificant ? (
          <span className="rounded-full border border-rose-500/60 bg-rose-500/20 px-2 py-0.5 text-xs font-medium text-rose-200">
            Significant
          </span>
        ) : null}
      </div>

      <h2 className="text-base font-semibold text-white">M {quake.magnitude.toFixed(1)}</h2>
      <p className="mt-1 text-sm text-slate-200">{quake.location}</p>

      <div className="mt-3 grid grid-cols-2 gap-2 text-xs text-slate-300 sm:grid-cols-3">
        <p>Depth: {quake.depthKm.toFixed(1)} km</p>
        <p>Lat: {quake.lat.toFixed(2)}</p>
        <p>Lng: {quake.lng.toFixed(2)}</p>
        <p className="col-span-2 sm:col-span-3">
          Distance: {distanceKm ? `${distanceKm.toFixed(1)} km` : 'Enable location'}
        </p>
      </div>
    </article>
  )
}

export default QuakeCard