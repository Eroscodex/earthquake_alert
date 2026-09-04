import { useEffect, useMemo, useRef, useState } from 'react'
import QuakeCard from './components/QuakeCard'
import QuakeMap from './components/QuakeMap'
import Footer from './components/Footer'
import ThemeToggle from './components/ThemeToggle'
import PermissionBanner from './components/PermissionBanner'
import AlarmModal from './components/AlarmModal'
import { calcDistanceKm, playAlertSound, unlockAudioContext } from './utils/phivolcs'

const REFRESH_INTERVAL_SEC = 10
const SIGNIFICANT_MAG = 5.0

function App() {
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
    setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'))
  }

  const [quakes, setQuakes] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [updatedAt, setUpdatedAt] = useState(null)
  const [countdown, setCountdown] = useState(REFRESH_INTERVAL_SEC)


  // Location state
  const [userLocation, setUserLocation] = useState(null)
  const [locationStatus, setLocationStatus] = useState('idle') // idle, requesting, granted, denied
  const [currentPresetName, setCurrentPresetName] = useState(null)

  // Notification state
  const [notificationStatus, setNotificationStatus] = useState(() => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      return Notification.permission
    }
    return 'denied'
  })

  // Controls & Filters
  const [minMagFilter, setMinMagFilter] = useState('all') // all, 4.0, 5.0
  const [searchQuery, setSearchQuery] = useState('')
  const [sortBy, setSortBy] = useState('time') // time, mag, distance
  const [activeQuakeId, setActiveQuakeId] = useState(null)
  
  // Alarm & Sound state
  const [isSoundMuted, setIsSoundMuted] = useState(false)
  const [alertQuake, setAlertQuake] = useState(null)
  const [isTestAlarm, setIsTestAlarm] = useState(false)

  const seenAlertIds = useRef(new Set())

  // Web Audio Context unlock on first user interaction
  useEffect(() => {
    const handleUserInteraction = () => {
      unlockAudioContext()
    }
    window.addEventListener('click', handleUserInteraction, { once: true })
    window.addEventListener('touchstart', handleUserInteraction, { once: true })
    return () => {
      window.removeEventListener('click', handleUserInteraction)
      window.removeEventListener('touchstart', handleUserInteraction)
    }
  }, [])

  // Geolocation Permission Query
  useEffect(() => {
    if (typeof navigator === 'undefined' || !navigator.geolocation) {
      setLocationStatus('denied')
      return
    }

    if (navigator.permissions && navigator.permissions.query) {
      navigator.permissions
        .query({ name: 'geolocation' })
        .then((permissionStatus) => {
          if (permissionStatus.state === 'granted') {
            requestUserLocation()
          } else if (permissionStatus.state === 'denied') {
            setLocationStatus('denied')
          }
          permissionStatus.onchange = () => {
            if (permissionStatus.state === 'granted') requestUserLocation()
            else if (permissionStatus.state === 'denied') setLocationStatus('denied')
          }
        })
        .catch(() => {})
    }
  }, [])

  const requestUserLocation = () => {
    if (!navigator.geolocation) {
      setLocationStatus('denied')
      return
    }

    setLocationStatus('requesting')
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setUserLocation({
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
        })
        setLocationStatus('granted')
        setCurrentPresetName(null)
      },
      (err) => {
        console.warn('Geolocation denied or failed:', err.message)
        setLocationStatus('denied')
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 60000,
      }
    )
  }

  const handleSelectPresetCity = (city) => {
    setUserLocation({ lat: city.lat, lng: city.lng })
    setLocationStatus('granted')
    setCurrentPresetName(city.name)
  }

  const askNotificationPermission = async () => {
    if (!('Notification' in window)) return
    try {
      const result = await Notification.requestPermission()
      setNotificationStatus(result)
    } catch (err) {
      console.warn('Notification permission error:', err)
    }
  }

  // Fetch Quakes API
  const fetchQuakes = async () => {
    try {
      setError('')
      const url =
        'https://earthquake.usgs.gov/fdsnws/event/1/query' +
        '?format=geojson' +
        '&minlatitude=4&maxlatitude=22' +
        '&minlongitude=116&maxlongitude=127' +
        '&orderby=time' +
        '&limit=50' +
        '&minmagnitude=3'

      const res = await fetch(url, { cache: 'no-store' })
      if (!res.ok) throw new Error(`HTTP Error ${res.status}`)

      const data = await res.json()
      if (!data?.features || !Array.isArray(data.features)) {
        throw new Error('Invalid earthquake data structure')
      }

      const parsed = data.features
        .filter((item) => {
          const coords = item?.geometry?.coordinates
          if (!coords) return false
          const [lng, lat] = coords
          return lat >= 4 && lat <= 22 && lng >= 116 && lng <= 127
        })
        .map((item) => {
          const [lng, lat, depth] = item.geometry.coordinates
          return {
            id: item.id,
            time: item.properties.time,
            dateTime: new Date(item.properties.time).toLocaleString([], {
              dateStyle: 'medium',
              timeStyle: 'short',
            }),
            location: item.properties.place || 'Philippine Region',
            magnitude: Number(item.properties.mag) || 0,
            depthKm: Number(depth) || 0,
            lat,
            lng,
          }
        })
        .sort((a, b) => b.time - a.time)

      setQuakes(parsed)
      setUpdatedAt(new Date())
      setCountdown(REFRESH_INTERVAL_SEC)
    } catch (err) {
      setError(err?.message || 'Unable to load live earthquake data')
    } finally {
      setLoading(false)
    }
  }

  // Auto-refresh timer & countdown
  useEffect(() => {
    fetchQuakes()
    const timer = setInterval(fetchQuakes, REFRESH_INTERVAL_SEC * 1000)
    const countdownTimer = setInterval(() => {
      setCountdown((prev) => (prev > 1 ? prev - 1 : REFRESH_INTERVAL_SEC))
    }, 1000)

    return () => {
      clearInterval(timer)
      clearInterval(countdownTimer)
    }
  }, [])

  // Emergency Alarm Trigger for Significant Earthquakes
  useEffect(() => {
    if (!quakes || quakes.length === 0) return
    const latestSignificant = quakes.find((q) => q.magnitude >= SIGNIFICANT_MAG)

    if (latestSignificant && !seenAlertIds.current.has(latestSignificant.id)) {
      seenAlertIds.current.add(latestSignificant.id)

      if (!isSoundMuted) {
        playAlertSound('alarm')
      }

      setAlertQuake(latestSignificant)

      if ('Notification' in window && notificationStatus === 'granted') {
        new Notification(`⚠️ M${latestSignificant.magnitude.toFixed(1)} Earthquake Alert`, {
          body: `${latestSignificant.location} | Depth ${latestSignificant.depthKm.toFixed(1)} km`,
          icon: '/earthquake.png',
        })
      }
    }
  }, [quakes, notificationStatus, isSoundMuted])

  // Filtered & Sorted Quakes
  const filteredQuakes = useMemo(() => {
    let list = [...quakes]

    // Magnitude Filter
    if (minMagFilter === '4.0') list = list.filter((q) => q.magnitude >= 4.0)
    else if (minMagFilter === '5.0') list = list.filter((q) => q.magnitude >= 5.0)

    // Search Query Filter
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase()
      list = list.filter((item) => item.location.toLowerCase().includes(q))
    }

    // Sort By
    if (sortBy === 'mag') {
      list.sort((a, b) => b.magnitude - a.magnitude)
    } else if (sortBy === 'distance' && userLocation) {
      list.sort((a, b) => {
        const distA = calcDistanceKm(userLocation.lat, userLocation.lng, a.lat, a.lng) ?? 9999
        const distB = calcDistanceKm(userLocation.lat, userLocation.lng, b.lat, b.lng) ?? 9999
        return distA - distB
      })
    } else {
      list.sort((a, b) => b.time - a.time)
    }

    return list
  }, [quakes, minMagFilter, searchQuery, sortBy, userLocation])

  // Summary statistics
  const stats = useMemo(() => {
    if (quakes.length === 0) return { total: 0, maxMag: 0, closest: null }
    const maxMag = Math.max(...quakes.map((q) => q.magnitude))
    let closest = null
    if (userLocation) {
      let minDistance = Infinity
      quakes.forEach((q) => {
        const dist = calcDistanceKm(userLocation.lat, userLocation.lng, q.lat, q.lng)
        if (dist !== null && dist < minDistance) {
          minDistance = dist
          closest = { quake: q, dist }
        }
      })
    }
    return { total: quakes.length, maxMag, closest }
  }, [quakes, userLocation])

  const triggerTestAlarm = () => {
    setIsTestAlarm(true)
    if (!isSoundMuted) {
      playAlertSound('alarm')
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-black text-slate-900 dark:text-zinc-100 flex flex-col font-sans transition-colors duration-300">
      
      {/* Emergency Alarm Overlay */}
      {(alertQuake || isTestAlarm) && (
        <AlarmModal
          quake={alertQuake}
          isTest={isTestAlarm}
          isMuted={isSoundMuted}
          onMute={() => setIsSoundMuted(!isSoundMuted)}
          onClose={() => {
            setAlertQuake(null)
            setIsTestAlarm(false)
          }}
        />
      )}

      {/* Main Container */}
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-6 sm:px-6 lg:px-8">
        
        {/* Top Header Card */}
        <header className="relative mb-6 overflow-hidden rounded-3xl border border-cyan-200 dark:border-zinc-800 bg-gradient-to-br from-cyan-50 via-white to-sky-100 dark:from-zinc-950 dark:via-zinc-900 dark:to-zinc-950 p-4 sm:p-6 shadow-lg dark:shadow-2xl backdrop-blur-xl transition-all">
          
          <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
            
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-cyan-500/30 bg-cyan-500/10 px-3 py-1 text-[11px] sm:text-xs font-bold uppercase tracking-wider text-cyan-600 dark:text-cyan-400">
                <span className="h-2 w-2 rounded-full bg-cyan-500 animate-ping"></span>
                REAL-TIME PHILIPPINE SEISMIC MONITOR
              </div>

              <h1 className="mt-2 text-2xl font-extrabold sm:text-3xl text-slate-900 dark:text-white">
                PH Earthquake Alert
              </h1>
              <p className="mt-1 text-xs sm:text-sm text-slate-600 dark:text-zinc-400">
                Instant seismic tracking, epicentral distance calculation, and emergency alarms.
              </p>
            </div>

            {/* Header Controls (Grid 3 cols on mobile) */}
            <div className="grid grid-cols-3 sm:flex items-center gap-2 w-full md:w-auto">
              <ThemeToggle theme={theme} onToggleTheme={toggleTheme} />

              <button
                onClick={triggerTestAlarm}
                type="button"
                className="inline-flex items-center justify-center gap-1 rounded-full border border-rose-500/40 bg-rose-500/10 px-2.5 sm:px-3.5 py-1.5 text-xs font-semibold text-rose-600 dark:text-rose-400 hover:bg-rose-500/20 active:scale-95 transition-all cursor-pointer truncate"
                title="Test emergency sound alarm"
              >
                🔔 <span className="hidden xs:inline">Test</span> Alarm
              </button>

              <button
                onClick={() => setIsSoundMuted(!isSoundMuted)}
                type="button"
                className="inline-flex items-center justify-center gap-1 rounded-full border border-slate-300 dark:border-zinc-700 bg-white/80 dark:bg-zinc-800 px-2.5 sm:px-3 py-1.5 text-xs font-semibold text-slate-700 dark:text-zinc-200 hover:bg-slate-100 dark:hover:bg-zinc-700 active:scale-95 transition-all cursor-pointer truncate"
              >
                {isSoundMuted ? '🔇 Muted' : '🔊 Sound'}
              </button>
            </div>

          </div>

          {/* Sync Stats & Refresh Bar */}
          <div className="mt-4 flex flex-wrap items-center justify-between gap-2 pt-3.5 border-t border-cyan-200 dark:border-zinc-800 text-xs font-medium text-slate-600 dark:text-zinc-400">
            
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 dark:bg-zinc-800/80 px-2.5 sm:px-3 py-1 border border-slate-200 dark:border-zinc-700 text-[11px] sm:text-xs whitespace-nowrap">
                🔄 Sync: <strong>{countdown}s</strong>
              </span>

              <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 dark:bg-zinc-800/80 px-2.5 sm:px-3 py-1 border border-slate-200 dark:border-zinc-700 text-[11px] sm:text-xs whitespace-nowrap">
                Updated: <strong>{updatedAt ? updatedAt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }) : 'Syncing...'}</strong>
              </span>
            </div>

            <button
              onClick={fetchQuakes}
              disabled={loading}
              className="inline-flex items-center gap-1.5 rounded-full bg-cyan-600 text-white px-3.5 py-1 text-xs font-semibold hover:bg-cyan-700 active:scale-95 transition-all cursor-pointer disabled:opacity-50 whitespace-nowrap"
            >
              {loading ? 'Refreshing...' : '⚡ Refresh Now'}
            </button>
          </div>

          {error && (
            <div className="mt-3 rounded-xl bg-rose-500/10 border border-rose-500/30 p-3 text-xs text-rose-600 dark:text-rose-400">
              ⚠️ {error}
            </div>
          )}

        </header>

        {/* Permission Banner for Geolocation & Notifications */}
        <PermissionBanner
          locationStatus={locationStatus}
          onRequestLocation={requestUserLocation}
          notificationStatus={notificationStatus}
          onRequestNotification={askNotificationPermission}
          onSelectPresetCity={handleSelectPresetCity}
          currentPresetName={currentPresetName}
        />

        {/* Quick Statistics Strip */}
        <section className="mb-6 grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-3.5">
          
          <div className="rounded-2xl border border-slate-200/80 dark:border-zinc-800 bg-white/80 dark:bg-zinc-900 p-3 sm:p-3.5 shadow-xs backdrop-blur-md">
            <span className="text-[10px] sm:text-[11px] font-semibold text-slate-400 dark:text-zinc-500 uppercase tracking-wider block truncate">Total Quakes</span>
            <div className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white mt-0.5">{stats.total}</div>
            <span className="text-[10px] text-slate-500 dark:text-zinc-500 block truncate">Past 24-48 Hours</span>
          </div>

          <div className="rounded-2xl border border-slate-200/80 dark:border-zinc-800 bg-white/80 dark:bg-zinc-900 p-3 sm:p-3.5 shadow-xs backdrop-blur-md">
            <span className="text-[10px] sm:text-[11px] font-semibold text-slate-400 dark:text-zinc-500 uppercase tracking-wider block truncate">Highest Mag</span>
            <div className={`text-lg sm:text-xl font-bold mt-0.5 ${stats.maxMag >= 5 ? 'text-rose-600 dark:text-rose-400' : 'text-cyan-600 dark:text-cyan-400'}`}>
              M {stats.maxMag > 0 ? stats.maxMag.toFixed(1) : '-'}
            </div>
            <span className="text-[10px] text-slate-500 dark:text-zinc-500 block truncate">{stats.maxMag >= 5 ? 'Significant Alert' : 'Moderate'}</span>
          </div>

          <div className="rounded-2xl border border-slate-200/80 dark:border-zinc-800 bg-white/80 dark:bg-zinc-900 p-3 sm:p-3.5 shadow-xs backdrop-blur-md">
            <span className="text-[10px] sm:text-[11px] font-semibold text-slate-400 dark:text-zinc-500 uppercase tracking-wider block truncate">Nearest Epicenter</span>
            <div className="text-lg sm:text-xl font-bold text-cyan-600 dark:text-cyan-400 mt-0.5 truncate">
              {stats.closest ? `${stats.closest.dist.toFixed(0)} km` : 'Set Loc'}
            </div>
            <span className="text-[10px] text-slate-500 dark:text-zinc-500 truncate block">
              {stats.closest ? stats.closest.quake.location : 'Enable location'}
            </span>
          </div>

          <div className="rounded-2xl border border-slate-200/80 dark:border-zinc-800 bg-white/80 dark:bg-zinc-900 p-3 sm:p-3.5 shadow-xs backdrop-blur-md">
            <span className="text-[10px] sm:text-[11px] font-semibold text-slate-400 dark:text-zinc-500 uppercase tracking-wider block truncate">Sound Sirens</span>
            <div className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white mt-0.5">
              {isSoundMuted ? 'Muted' : 'Active'}
            </div>
            <span className="text-[10px] text-slate-500 dark:text-zinc-500 block truncate">Auto Sound Alert</span>
          </div>

        </section>

        {/* Filters and Search Toolbar */}
        <section className="mb-4 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 rounded-2xl border border-slate-200/80 dark:border-zinc-800 bg-white/80 dark:bg-zinc-900 p-3 sm:p-3.5 shadow-xs">
          
          {/* Search Input */}
          <div className="relative w-full sm:flex-1">
            <input
              type="text"
              placeholder="Search city, province, or region (e.g. Davao, Cotabato)..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-xl border border-slate-200 dark:border-zinc-700 bg-slate-50 dark:bg-zinc-800 px-3.5 py-1.5 text-xs text-slate-800 dark:text-zinc-100 placeholder-slate-400 dark:placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/50"
            />
          </div>

          {/* Controls row: Magnitude pills & Sort */}
          <div className="flex flex-wrap items-center justify-between sm:justify-end gap-2 sm:gap-3 w-full sm:w-auto">
            {/* Magnitude Pills */}
            <div className="flex items-center gap-1 rounded-xl bg-slate-100 dark:bg-zinc-800 p-1 border border-slate-200 dark:border-zinc-700 shrink-0">
              {['all', '4.0', '5.0'].map((val) => (
                <button
                  key={val}
                  onClick={() => setMinMagFilter(val)}
                  className={`rounded-lg px-2.5 sm:px-3 py-1.5 text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                    minMagFilter === val
                      ? 'bg-cyan-500 text-white shadow-xs'
                      : 'text-slate-600 dark:text-zinc-300 hover:bg-slate-200/60 dark:hover:bg-zinc-700/60'
                  }`}
                >
                  {val === 'all' ? 'All M3+' : `M${val}+`}
                </button>
              ))}
            </div>

            {/* Sort selector */}
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="rounded-xl border border-slate-200 dark:border-zinc-700 bg-slate-50 dark:bg-zinc-800 px-3 py-1.5 text-xs font-semibold text-slate-700 dark:text-zinc-200 focus:outline-none cursor-pointer shrink-0"
            >
              <option value="time">Latest First</option>
              <option value="mag">Highest Mag</option>
              {userLocation && <option value="distance">Nearest Me</option>}
            </select>
          </div>

        </section>


        {/* Content Layout: Left Map, Right List */}
        <section className="grid gap-6 lg:grid-cols-[1.25fr_0.75fr]">
          
          {/* Map Column */}
          <div className="order-2 lg:order-1 space-y-3">
            <div className="flex items-center justify-between gap-2">
              <h2 className="text-xs sm:text-sm font-bold text-slate-800 dark:text-zinc-100 uppercase tracking-wider flex items-center gap-1.5 whitespace-nowrap">
                <span>🗺️ Epicenter Map</span>
              </h2>
              <span className="text-xs font-semibold text-cyan-600 dark:text-cyan-400 bg-cyan-500/10 px-2.5 py-0.5 rounded-full border border-cyan-500/20 whitespace-nowrap">
                {filteredQuakes.length} mapped
              </span>
            </div>

            <QuakeMap
              quakes={filteredQuakes}
              userLocation={userLocation}
              activeQuakeId={activeQuakeId}
              onSelectQuake={(id) => setActiveQuakeId(id)}
            />
          </div>

          {/* List Column */}
          <div className="order-1 lg:order-2 space-y-3">
            <div className="flex items-center justify-between gap-2">
              <h2 className="text-xs sm:text-sm font-bold text-slate-800 dark:text-zinc-100 uppercase tracking-wider whitespace-nowrap">
                ⚡ Earthquake Feed ({filteredQuakes.length})
              </h2>
            </div>


            {loading && quakes.length === 0 && (
              <div className="rounded-2xl border border-slate-200 dark:border-zinc-800 bg-white/80 dark:bg-zinc-900 p-8 text-center text-xs text-slate-500 dark:text-zinc-400">
                <div className="mx-auto h-6 w-6 animate-spin rounded-full border-2 border-cyan-500 border-t-transparent mb-2"></div>
                Syncing Philippine earthquake data...
              </div>
            )}

            {!loading && filteredQuakes.length === 0 && (
              <div className="rounded-2xl border border-slate-200 dark:border-zinc-800 bg-white/80 dark:bg-zinc-900 p-8 text-center text-xs text-slate-500 dark:text-zinc-400">
                No earthquakes match your current filters.
              </div>
            )}

            <div className="space-y-3 max-h-[600px] overflow-y-auto pr-1">
              {filteredQuakes.map((quake) => {
                const distanceKm = userLocation
                  ? calcDistanceKm(userLocation.lat, userLocation.lng, quake.lat, quake.lng)
                  : null

                return (
                  <QuakeCard
                    key={quake.id}
                    quake={quake}
                    distanceKm={distanceKm}
                    isSignificant={quake.magnitude >= SIGNIFICANT_MAG}
                    isSelected={activeQuakeId === quake.id}
                    onSelect={(id) => setActiveQuakeId(id)}
                  />
                )
              })}
            </div>

          </div>

        </section>

      </main>

      <Footer />
    </div>
  )
}

export default App