function ThemeToggle({ theme, onToggleTheme }) {
  const isDark = theme === 'dark'

  return (
    <button
      onClick={onToggleTheme}
      type="button"
      className="inline-flex items-center gap-2 rounded-full border border-cyan-500/30 bg-white/90 dark:bg-slate-800/90 px-3.5 py-1.5 text-xs font-semibold text-slate-700 dark:text-cyan-200 shadow-sm backdrop-blur-md transition-all hover:border-cyan-500/60 hover:bg-cyan-50 dark:hover:bg-slate-700/80 active:scale-95 cursor-pointer"
      title={`Switch to ${isDark ? 'Light' : 'Dark'} Mode`}
      aria-label="Toggle theme mode"
    >
      {isDark ? (
        <>
          <span className="flex h-4 w-4 items-center justify-center rounded-full bg-amber-400/20 text-amber-400">
            ☀️
          </span>
          <span>Light Mode</span>
        </>
      ) : (
        <>
          <span className="flex h-4 w-4 items-center justify-center rounded-full bg-cyan-100 text-cyan-600 dark:bg-cyan-900/50">
            🌙
          </span>
          <span>Dark Mode</span>
        </>
      )}
    </button>
  )
}

export default ThemeToggle

