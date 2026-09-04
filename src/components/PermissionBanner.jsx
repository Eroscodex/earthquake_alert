import { PH_PRESET_CITIES } from '../utils/phivolcs'

function PermissionBanner({
  locationStatus,
  onRequestLocation,
  notificationStatus,
  onRequestNotification,
  onSelectPresetCity,
  currentPresetName,
}) {
  return (
    <div className="mb-6 overflow-hidden rounded-2xl border border-cyan-500/20 bg-gradient-to-r from-cyan-50/80 via-white to-blue-50/80 dark:from-slate-900/90 dark:via-slate-900/90 dark:to-cyan-950/40 p-4 sm:p-5 shadow-lg backdrop-blur-md transition-all">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        
        {/* Left info area */}
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-cyan-500/10 text-cyan-600 dark:bg-cyan-500/20 dark:text-cyan-400">
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </div>

          <div>
            <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-100">
              Site Location & Emergency Alert Permissions
            </h3>
            <p className="text-xs text-slate-600 dark:text-slate-300 mt-0.5 max-w-xl">
              Enable location services to calculate your proximity to earthquake epicenters. Enable notifications to receive immediate sound & pop-up alerts.
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex flex-wrap items-center gap-2">
          
          {/* Location button / status */}
          {locationStatus === 'granted' ? (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/15 px-3 py-1 text-xs font-semibold text-emerald-700 dark:text-emerald-300 border border-emerald-500/30">
              <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></span>
              {currentPresetName ? `City: ${currentPresetName}` : 'GPS Location Active'}
            </span>
          ) : (
            <button
              onClick={onRequestLocation}
              disabled={locationStatus === 'requesting'}
              className="inline-flex items-center gap-1.5 rounded-full border border-cyan-500/40 bg-cyan-600 px-3.5 py-1.5 text-xs font-semibold text-white shadow-sm hover:bg-cyan-700 active:scale-95 transition-all cursor-pointer disabled:opacity-50"
            >
              <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4-1.79-4-4-4zm8.94 3A8.994 8.994 0 0013 3.06V1h-2v2.06A8.994 8.994 0 003.06 11H1v2h2.06A8.994 8.994 0 0011 20.94V23h2v-2.06A8.994 8.994 0 0020.94 13H23v-2h-2.06z" />
              </svg>
              {locationStatus === 'requesting' ? 'Locating...' : 'Enable Location'}
            </button>
          )}

          {/* Notification Button */}
          {notificationStatus === 'granted' ? (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-500/15 px-3 py-1 text-xs font-semibold text-blue-700 dark:text-blue-300 border border-blue-500/30">
              🔔 Notifications On
            </span>
          ) : (
            <button
              onClick={onRequestNotification}
              className="inline-flex items-center gap-1.5 rounded-full border border-indigo-500/40 bg-indigo-600 px-3.5 py-1.5 text-xs font-semibold text-white shadow-sm hover:bg-indigo-700 active:scale-95 transition-all cursor-pointer"
            >
              🔔 {notificationStatus === 'denied' ? 'Notifications Blocked (Info)' : 'Enable Push Alerts'}
            </button>
          )}

        </div>
      </div>

      {/* Preset Cities Fallback if Location is Denied or User Wants Manual City */}
      {(locationStatus === 'denied' || locationStatus === 'idle' || currentPresetName) && (
        <div className="mt-3.5 pt-3 border-t border-slate-200/80 dark:border-slate-800 flex flex-wrap items-center gap-2 text-xs">
          <span className="font-medium text-slate-500 dark:text-slate-400">
            {locationStatus === 'denied' ? '⚠️ Permission blocked in browser settings. Pick your nearest city:' : 'Or set a preset location:'}
          </span>
          <div className="flex flex-wrap gap-1.5">
            {PH_PRESET_CITIES.map(city => (
              <button
                key={city.name}
                onClick={() => onSelectPresetCity(city)}
                className={`rounded-full px-2.5 py-0.5 text-xs transition-all cursor-pointer ${
                  currentPresetName === city.name
                    ? 'bg-cyan-500 text-white font-semibold shadow-xs'
                    : 'bg-white/80 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-cyan-50 dark:hover:bg-slate-700'
                }`}
              >
                {city.name}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

export default PermissionBanner
