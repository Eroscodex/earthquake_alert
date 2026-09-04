function Footer() {
  return (
    <footer className="mt-12 border-t border-slate-200/80 dark:border-zinc-800 bg-white/80 dark:bg-zinc-950 backdrop-blur-md transition-all">
      <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-6 px-6 py-8 text-center md:flex-row md:text-left">
        <div>
          <div className="flex items-center justify-center md:justify-start gap-2">
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-cyan-500 text-white font-bold text-sm shadow-sm">
              🌐
            </span>
            <h2 className="text-lg font-bold text-slate-800 dark:text-cyan-400">
              PH Earthquake Alert
            </h2>
          </div>

          <p className="mt-2 text-sm text-slate-600 dark:text-zinc-400 max-w-md">
            Real-time earthquake monitoring, magnitude alerts, and proximity visualization for the Philippines.
          </p>

          <p className="mt-2 text-xs text-slate-500 dark:text-zinc-500">
            Data source:{' '}
            <a
              href="https://earthquake.usgs.gov"
              target="_blank"
              rel="noopener noreferrer"
              className="font-medium text-cyan-600 hover:text-cyan-700 dark:text-cyan-400 dark:hover:text-cyan-300 hover:underline"
            >
              USGS FDSN & PHIVOLCS DOST Data Feed
            </a>
          </p>
        </div>

        <div className="flex flex-col items-center md:items-end gap-2 text-xs text-slate-600 dark:text-zinc-400">
          <div className="flex items-center gap-2 rounded-xl bg-slate-100 dark:bg-zinc-900 px-3.5 py-1.5 border border-slate-200 dark:border-zinc-800">
            <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></span>
            <span>Live Monitor: <strong>Active (10s sync)</strong></span>
          </div>

          <p className="text-slate-500 dark:text-zinc-400 text-center md:text-right">
            Browser Notifications & Audio Siren Alerting Enabled
          </p>
        </div>
      </div>

      <div className="border-t border-slate-200/60 dark:border-zinc-800 py-4 bg-slate-50/50 dark:bg-black">
        <p className="text-center text-xs text-slate-500 dark:text-zinc-400 font-medium">
          © {new Date().getFullYear()} PH Quake Alert • Real-Time Philippine Seismic Network
        </p>

        <p className="mt-1 text-center text-xs text-slate-400 dark:text-zinc-500">
          Developed by <span className="font-semibold text-cyan-600 dark:text-cyan-400">Karl Nicko Alondra</span>
        </p>
      </div>
    </footer>
  )
}



export default Footer