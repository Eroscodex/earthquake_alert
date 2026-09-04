import { useEffect, useState } from 'react'

function ThemeToggle() {
  const [theme, setTheme] = useState(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('hw-theme')
      if (stored) return stored
      return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
    }
    return 'light'
  })

  useEffect(() => {
    const root = document.documentElement
    if (theme === 'dark') {
      root.classList.add('dark')
    } else {
      root.classList.remove('dark')
    }
    localStorage.setItem('hw-theme', theme)
  }, [theme])

  const toggleTheme = () => {
    setTheme(prev => (prev === 'dark' ? 'light' : 'dark'))
  }

  return (
    <button
      onClick={toggleTheme}
      type="button"
      className="inline-flex items-center gap-2 rounded-full border border-cyan-500/30 bg-white/90 dark:bg-slate-800/90 px-3.5 py-1.5 text-xs font-semibold text-slate-700 dark:text-cyan-200 shadow-sm backdrop-blur-md transition-all hover:border-cyan-500/60 hover:bg-cyan-50 dark:hover:bg-slate-700/80 active:scale-95 cursor-pointer"
      title={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} Mode`}
      aria-label="Toggle theme mode"
    >
      {theme === 'dark' ? (
        <>
          <span className="flex h-4 w-4 items-center justify-center rounded-full bg-amber-400/20 text-amber-300">
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
