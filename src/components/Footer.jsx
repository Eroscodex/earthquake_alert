function Footer() {
  return (
    <footer className="mt-8 border-t border-slate-800 bg-slate-900/80 backdrop-blur">
      <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-6 py-6 text-center md:flex-row md:text-left">
        <div>
          <h2 className="text-lg font-semibold text-cyan-300">
            PH Quake Alert
          </h2>

          <p className="mt-1 text-sm text-slate-400">
            Real-time earthquake monitoring and visualization for the
            Philippines.
          </p>

          <p className="mt-1 text-xs text-slate-500">
            Data source:{' '}
            <a
              href="https://earthquake.phivolcs.dost.gov.ph"
              target="_blank"
              rel="noopener noreferrer"
              className="text-cyan-400 hover:text-cyan-300 hover:underline"
            >
              PHIVOLCS-DOST
            </a>
          </p>
        </div>

        <div className="text-sm text-slate-400">
          <p>
            <span className="font-medium text-slate-300">Auto Refresh:</span>{' '}
            Every 30 seconds
          </p>

          <p>
            <span className="font-medium text-slate-300">Notifications:</span>{' '}
            Browser Supported
          </p>
        </div>
      </div>

      <div className="border-t border-slate-800 py-4">
        <p className="text-center text-xs text-slate-500">
          © {new Date().getFullYear()} PH Quake Alert. All Rights Reserved.
        </p>

        <p className="mt-1 text-center text-xs text-slate-600">
          Developed by <span className="font-medium text-cyan-400">Karl Nicko Alondra</span>
        </p>
      </div>
    </footer>
  )
}

export default Footer