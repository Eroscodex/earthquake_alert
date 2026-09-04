function ThemeToggle({ theme, onToggleTheme }) {
  const isDark = theme === 'dark'

  return (
    <button
      onClick={onToggleTheme}
      type="button"
      className="inline-flex items-center justify-center gap-1.5 rounded-full border border-cyan-500/30 dark:border-zinc-700 bg-white/90 dark:bg-zinc-800 px-2.5 sm:px-3.5 py-1.5 text-xs font-semibold text-slate-700 dark:text-cyan-200 shadow-sm backdrop-blur-md transition-all hover:border-cyan-500/60 hover:bg-cyan-50 dark:hover:bg-zinc-700 active:scale-95 cursor-pointer truncate"
      title={`Switch to ${isDark ? 'Light' : 'Dark'} Mode`}
      aria-label="Toggle theme mode"
    >
      {isDark ? (
        <>
          <span className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-amber-400/20 text-amber-400">
            ☀️
          </span>
          <span className="truncate">Light</span>
        </>
      ) : (
        <>
          <span className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-cyan-100 text-cyan-600 dark:bg-cyan-900/50">
            🌙
          </span>
          <span className="truncate">Dark</span>
        </>
      )}
    </button>

  )
}

export default ThemeToggle

