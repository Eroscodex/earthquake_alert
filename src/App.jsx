import { useEffect, useMemo, useRef, useState } from 'react'
import QuakeCard from './components/QuakeCard'
import HeatCard from './components/HeatCard'
import VolcanoCard from './components/VolcanoCard'
import QuakeMap from './components/QuakeMap'
import Footer from './components/Footer'
import ThemeToggle from './components/ThemeToggle'
import PermissionBanner from './components/PermissionBanner'
import AlarmModal from './components/AlarmModal'
import { calcDistanceKm, playAlertSound, unlockAudioContext } from './utils/phivolcs'
import { PH_HEAT_INDEX_STATIONS } from './utils/phHeatIndex'
import { PH_VOLCANOES } from './utils/phVolcanoes'

const REFRESH_INTERVAL_SEC = 10
const SIGNIFICANT_MAG = 5.0

function App() {
  const [theme, setTheme] = useState(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('ph-quake-theme')
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
    localStorage.setItem('ph-quake-theme', theme)
  }, [theme])

  const toggleTheme = () => {
    setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'))
  }

  // Active Multi-Hazard Tab: 'earthquake' | 'heat' | 'volcano'
  const [activeTab, setActiveTab] = useState('earthquake')

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
  const [heatFilter, setHeatFilter] = useState('all') // all, danger, extreme_caution
  const [volcanoFilter, setVolcanoFilter] = useState('all') // all, unrest, elevated
  const [searchQuery, setSearchQuery] = useState('')
  const [sortBy, setSortBy] = useState('time') // time, mag, distance
  const [activeId, setActiveId] = useState(null)

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
    if (minMagFilter === '4.0') list = list.filter((q) => q.magnitude >= 4.0)
    else if (minMagFilter === '5.0') list = list.filter((q) => q.magnitude >= 5.0)

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase()
      list = list.filter((item) => item.location.toLowerCase().includes(q))
    }

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

  // Filtered & Sorted Heat Index Stations
  const filteredHeatStations = useMemo(() => {
    let list = [...PH_HEAT_INDEX_STATIONS]
    if (heatFilter === 'danger') list = list.filter((s) => s.heatIndex >= 42)
    else if (heatFilter === 'extreme_caution') list = list.filter((s) => s.heatIndex >= 33)

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase()
      list = list.filter((s) => s.station.toLowerCase().includes(q) || s.province.toLowerCase().includes(q))
    }

    if (sortBy === 'heat') {
      list.sort((a, b) => b.heatIndex - a.heatIndex)
    } else if (sortBy === 'temp') {
      list.sort((a, b) => b.temp - a.temp)
    } else if (sortBy === 'distance' && userLocation) {
      list.sort((a, b) => {
        const distA = calcDistanceKm(userLocation.lat, userLocation.lng, a.lat, a.lng) ?? 9999
        const distB = calcDistanceKm(userLocation.lat, userLocation.lng, b.lat, b.lng) ?? 9999
        return distA - distB
      })
    } else {
      list.sort((a, b) => b.heatIndex - a.heatIndex)
    }
    return list
  }, [heatFilter, searchQuery, sortBy, userLocation])

  // Filtered & Sorted Volcanoes
  const filteredVolcanoes = useMemo(() => {
    let list = [...PH_VOLCANOES]
    if (volcanoFilter === 'unrest') list = list.filter((v) => v.alertLevel >= 1)
    else if (volcanoFilter === 'elevated') list = list.filter((v) => v.alertLevel >= 2)

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase()
      list = list.filter((v) => v.name.toLowerCase().includes(q) || v.province.toLowerCase().includes(q))
    }

    if (sortBy === 'level') {
      list.sort((a, b) => b.alertLevel - a.alertLevel)
    } else if (sortBy === 'distance' && userLocation) {
      list.sort((a, b) => {
        const distA = calcDistanceKm(userLocation.lat, userLocation.lng, a.lat, a.lng) ?? 9999
        const distB = calcDistanceKm(userLocation.lat, userLocation.lng, b.lat, b.lng) ?? 9999
        return distA - distB
      })
    } else {
      list.sort((a, b) => b.alertLevel - a.alertLevel)
    }
    return list
  }, [volcanoFilter, searchQuery, sortBy, userLocation])

  // Summary statistics per tab
  const stats = useMemo(() => {
    if (activeTab === 'earthquake') {
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
    } else if (activeTab === 'heat') {
      const maxHeat = Math.max(...PH_HEAT_INDEX_STATIONS.map((s) => s.heatIndex))
      const hottest = PH_HEAT_INDEX_STATIONS.find((s) => s.heatIndex === maxHeat)
      let closest = null
      if (userLocation) {
        let minDistance = Infinity
        PH_HEAT_INDEX_STATIONS.forEach((s) => {
          const dist = calcDistanceKm(userLocation.lat, userLocation.lng, s.lat, s.lng)
          if (dist !== null && dist < minDistance) {
            minDistance = dist
            closest = { station: s, dist }
          }
        })
      }
      return { total: PH_HEAT_INDEX_STATIONS.length, maxHeat, hottest, closest }
    } else {
      const maxAlert = Math.max(...PH_VOLCANOES.map((v) => v.alertLevel))
      const activeUnrestCount = PH_VOLCANOES.filter((v) => v.alertLevel >= 1).length
      let closest = null
      if (userLocation) {
        let minDistance = Infinity
        PH_VOLCANOES.forEach((v) => {
          const dist = calcDistanceKm(userLocation.lat, userLocation.lng, v.lat, v.lng)
          if (dist !== null && dist < minDistance) {
            minDistance = dist
            closest = { volcano: v, dist }
          }
        })
      }
      return { total: PH_VOLCANOES.length, maxAlert, activeUnrestCount, closest }
    }
  }, [activeTab, quakes, userLocation])

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
                REAL-TIME PHILIPPINE MULTI-HAZARD MONITOR
              </div>

              <h1 className="mt-2 text-2xl font-extrabold sm:text-3xl text-slate-900 dark:text-white">
                PH Disaster & Weather Alert
              </h1>
              <p className="mt-1 text-xs sm:text-sm text-slate-600 dark:text-zinc-400">
                Real-time tracking of Earthquakes, PAGASA Heat Index, and PHIVOLCS Active Volcanoes.
              </p>
            </div>

            {/* Header Controls */}
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

          {/* REAL-TIME HAZARD SWITCHER NAVIGATION TABS */}
          <div className="mt-5 pt-4 border-t border-cyan-200 dark:border-zinc-800">
            <div className="grid grid-cols-3 gap-2 rounded-2xl bg-slate-200/70 dark:bg-zinc-900 p-1.5 border border-slate-300/80 dark:border-zinc-800">
              
              <button
                onClick={() => {
                  setActiveTab('earthquake')
                  setActiveId(null)
                  setSortBy('time')
                }}
                className={`inline-flex items-center justify-center gap-1.5 rounded-xl py-2 px-3 text-xs sm:text-sm font-bold transition-all cursor-pointer ${
                  activeTab === 'earthquake'
                    ? 'bg-cyan-600 text-white shadow-md scale-[1.02]'
                    : 'text-slate-700 dark:text-zinc-300 hover:bg-slate-300/60 dark:hover:bg-zinc-800/80'
                }`}
              >
                ⚡ <span className="truncate">Earthquakes</span>
              </button>

              <button
                onClick={() => {
                  setActiveTab('heat')
                  setActiveId(null)
                  setSortBy('heat')
                }}
                className={`inline-flex items-center justify-center gap-1.5 rounded-xl py-2 px-3 text-xs sm:text-sm font-bold transition-all cursor-pointer ${
                  activeTab === 'heat'
                    ? 'bg-amber-600 text-white shadow-md scale-[1.02]'
                    : 'text-slate-700 dark:text-zinc-300 hover:bg-slate-300/60 dark:hover:bg-zinc-800/80'
                }`}
              >
                🌡️ <span className="truncate">Heat Index</span>
              </button>

              <button
                onClick={() => {
                  setActiveTab('volcano')
                  setActiveId(null)
                  setSortBy('level')
                }}
                className={`inline-flex items-center justify-center gap-1.5 rounded-xl py-2 px-3 text-xs sm:text-sm font-bold transition-all cursor-pointer ${
                  activeTab === 'volcano'
                    ? 'bg-rose-600 text-white shadow-md scale-[1.02]'
                    : 'text-slate-700 dark:text-zinc-300 hover:bg-slate-300/60 dark:hover:bg-zinc-800/80'
                }`}
              >
                🌋 <span className="truncate">Volcanoes</span>
              </button>

            </div>
          </div>

          {/* Sync Stats & Refresh Bar */}
          <div className="mt-4 flex flex-wrap items-center justify-between gap-2 pt-3 text-xs font-medium text-slate-600 dark:text-zinc-400">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 dark:bg-zinc-800/80 px-2.5 sm:px-3 py-1 border border-slate-200 dark:border-zinc-700 text-[11px] sm:text-xs whitespace-nowrap">
                🔄 Live Feed Sync: <strong>{countdown}s</strong>
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
              {loading ? 'Refreshing...' : '⚡ Refresh Feeds'}
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
          {activeTab === 'earthquake' && (
            <>
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
            </>
          )}

          {activeTab === 'heat' && (
            <>
              <div className="rounded-2xl border border-slate-200/80 dark:border-zinc-800 bg-white/80 dark:bg-zinc-900 p-3 sm:p-3.5 shadow-xs backdrop-blur-md">
                <span className="text-[10px] sm:text-[11px] font-semibold text-slate-400 dark:text-zinc-500 uppercase tracking-wider block truncate">PAGASA Stations</span>
                <div className="text-lg sm:text-xl font-bold text-amber-600 dark:text-amber-400 mt-0.5">{stats.total}</div>
                <span className="text-[10px] text-slate-500 dark:text-zinc-500 block truncate">Key PH Cities</span>
              </div>

              <div className="rounded-2xl border border-slate-200/80 dark:border-zinc-800 bg-white/80 dark:bg-zinc-900 p-3 sm:p-3.5 shadow-xs backdrop-blur-md">
                <span className="text-[10px] sm:text-[11px] font-semibold text-slate-400 dark:text-zinc-500 uppercase tracking-wider block truncate">Peak Heat Index</span>
                <div className="text-lg sm:text-xl font-bold text-rose-600 dark:text-rose-400 mt-0.5">
                  {stats.maxHeat}°C
                </div>
                <span className="text-[10px] text-slate-500 dark:text-zinc-500 block truncate">{stats.hottest ? stats.hottest.station : 'Danger Zone'}</span>
              </div>

              <div className="rounded-2xl border border-slate-200/80 dark:border-zinc-800 bg-white/80 dark:bg-zinc-900 p-3 sm:p-3.5 shadow-xs backdrop-blur-md">
                <span className="text-[10px] sm:text-[11px] font-semibold text-slate-400 dark:text-zinc-500 uppercase tracking-wider block truncate">Nearest Station</span>
                <div className="text-lg sm:text-xl font-bold text-amber-600 dark:text-amber-400 mt-0.5 truncate">
                  {stats.closest ? `${stats.closest.dist.toFixed(0)} km` : 'Set Loc'}
                </div>
                <span className="text-[10px] text-slate-500 dark:text-zinc-500 truncate block">
                  {stats.closest ? `${stats.closest.station.station} (${stats.closest.station.heatIndex}°C)` : 'Enable location'}
                </span>
              </div>

              <div className="rounded-2xl border border-slate-200/80 dark:border-zinc-800 bg-white/80 dark:bg-zinc-900 p-3 sm:p-3.5 shadow-xs backdrop-blur-md">
                <span className="text-[10px] sm:text-[11px] font-semibold text-slate-400 dark:text-zinc-500 uppercase tracking-wider block truncate">PAGASA Advisory</span>
                <div className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white mt-0.5">Danger</div>
                <span className="text-[10px] text-slate-500 dark:text-zinc-500 block truncate">Stay Hydrated</span>
              </div>
            </>
          )}

          {activeTab === 'volcano' && (
            <>
              <div className="rounded-2xl border border-slate-200/80 dark:border-zinc-800 bg-white/80 dark:bg-zinc-900 p-3 sm:p-3.5 shadow-xs backdrop-blur-md">
                <span className="text-[10px] sm:text-[11px] font-semibold text-slate-400 dark:text-zinc-500 uppercase tracking-wider block truncate">Active Volcanoes</span>
                <div className="text-lg sm:text-xl font-bold text-rose-600 dark:text-rose-400 mt-0.5">{stats.total}</div>
                <span className="text-[10px] text-slate-500 dark:text-zinc-500 block truncate">PHIVOLCS Monitored</span>
              </div>

              <div className="rounded-2xl border border-slate-200/80 dark:border-zinc-800 bg-white/80 dark:bg-zinc-900 p-3 sm:p-3.5 shadow-xs backdrop-blur-md">
                <span className="text-[10px] sm:text-[11px] font-semibold text-slate-400 dark:text-zinc-500 uppercase tracking-wider block truncate">Under Unrest</span>
                <div className="text-lg sm:text-xl font-bold text-amber-600 dark:text-amber-400 mt-0.5">
                  {stats.activeUnrestCount}
                </div>
                <span className="text-[10px] text-slate-500 dark:text-zinc-500 block truncate">Level 1+ Unrest</span>
              </div>

              <div className="rounded-2xl border border-slate-200/80 dark:border-zinc-800 bg-white/80 dark:bg-zinc-900 p-3 sm:p-3.5 shadow-xs backdrop-blur-md">
                <span className="text-[10px] sm:text-[11px] font-semibold text-slate-400 dark:text-zinc-500 uppercase tracking-wider block truncate">Highest Alert</span>
                <div className="text-lg sm:text-xl font-bold text-rose-600 dark:text-rose-400 mt-0.5">
                  Level {stats.maxAlert}
                </div>
                <span className="text-[10px] text-slate-500 dark:text-zinc-500 block truncate">Moderate Unrest</span>
              </div>

              <div className="rounded-2xl border border-slate-200/80 dark:border-zinc-800 bg-white/80 dark:bg-zinc-900 p-3 sm:p-3.5 shadow-xs backdrop-blur-md">
                <span className="text-[10px] sm:text-[11px] font-semibold text-slate-400 dark:text-zinc-500 uppercase tracking-wider block truncate">Nearest Volcano</span>
                <div className="text-lg sm:text-xl font-bold text-cyan-600 dark:text-cyan-400 mt-0.5 truncate">
                  {stats.closest ? `${stats.closest.dist.toFixed(0)} km` : 'Set Loc'}
                </div>
                <span className="text-[10px] text-slate-500 dark:text-zinc-500 truncate block">
                  {stats.closest ? stats.closest.volcano.name : 'Enable location'}
                </span>
              </div>
            </>
          )}
        </section>

        {/* Filters and Search Toolbar */}
        <section className="mb-4 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 rounded-2xl border border-slate-200/80 dark:border-zinc-800 bg-white/80 dark:bg-zinc-900 p-3 sm:p-3.5 shadow-xs">
          
          {/* Search Input */}
          <div className="relative w-full sm:flex-1">
            <input
              type="text"
              placeholder={
                activeTab === 'earthquake'
                  ? 'Search city, province, or region (e.g. Davao, Cotabato)...'
                  : activeTab === 'heat'
                  ? 'Search PAGASA weather station or city...'
                  : 'Search volcano name or province (e.g. Mayon, Taal)...'
              }
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-xl border border-slate-200 dark:border-zinc-700 bg-slate-50 dark:bg-zinc-800 px-3.5 py-1.5 text-xs text-slate-800 dark:text-zinc-100 placeholder-slate-400 dark:placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/50"
            />
          </div>

          {/* Dynamic Filter Controls per Tab */}
          <div className="flex flex-wrap items-center justify-between sm:justify-end gap-2 sm:gap-3 w-full sm:w-auto">
            
            {activeTab === 'earthquake' && (
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
            )}

            {activeTab === 'heat' && (
              <div className="flex items-center gap-1 rounded-xl bg-slate-100 dark:bg-zinc-800 p-1 border border-slate-200 dark:border-zinc-700 shrink-0">
                <button
                  onClick={() => setHeatFilter('all')}
                  className={`rounded-lg px-2.5 sm:px-3 py-1.5 text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                    heatFilter === 'all'
                      ? 'bg-amber-600 text-white shadow-xs'
                      : 'text-slate-600 dark:text-zinc-300 hover:bg-slate-200/60 dark:hover:bg-zinc-700/60'
                  }`}
                >
                  All Stations
                </button>
                <button
                  onClick={() => setHeatFilter('danger')}
                  className={`rounded-lg px-2.5 sm:px-3 py-1.5 text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                    heatFilter === 'danger'
                      ? 'bg-rose-600 text-white shadow-xs'
                      : 'text-slate-600 dark:text-zinc-300 hover:bg-slate-200/60 dark:hover:bg-zinc-700/60'
                  }`}
                >
                  Danger (≥42°C)
                </button>
              </div>
            )}

            {activeTab === 'volcano' && (
              <div className="flex items-center gap-1 rounded-xl bg-slate-100 dark:bg-zinc-800 p-1 border border-slate-200 dark:border-zinc-700 shrink-0">
                <button
                  onClick={() => setVolcanoFilter('all')}
                  className={`rounded-lg px-2.5 sm:px-3 py-1.5 text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                    volcanoFilter === 'all'
                      ? 'bg-rose-600 text-white shadow-xs'
                      : 'text-slate-600 dark:text-zinc-300 hover:bg-slate-200/60 dark:hover:bg-zinc-700/60'
                  }`}
                >
                  All Volcanoes
                </button>
                <button
                  onClick={() => setVolcanoFilter('unrest')}
                  className={`rounded-lg px-2.5 sm:px-3 py-1.5 text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                    volcanoFilter === 'unrest'
                      ? 'bg-amber-600 text-white shadow-xs'
                      : 'text-slate-600 dark:text-zinc-300 hover:bg-slate-200/60 dark:hover:bg-zinc-700/60'
                  }`}
                >
                  Unrest (Level 1+)
                </button>
              </div>
            )}

            {/* Sort selector */}
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="rounded-xl border border-slate-200 dark:border-zinc-700 bg-slate-50 dark:bg-zinc-800 px-3 py-1.5 text-xs font-semibold text-slate-700 dark:text-zinc-200 focus:outline-none cursor-pointer shrink-0"
            >
              {activeTab === 'earthquake' && (
                <>
                  <option value="time">Latest First</option>
                  <option value="mag">Highest Mag</option>
                  {userLocation && <option value="distance">Nearest Me</option>}
                </>
              )}
              {activeTab === 'heat' && (
                <>
                  <option value="heat">Highest Heat Index</option>
                  <option value="temp">Highest Air Temp</option>
                  {userLocation && <option value="distance">Nearest Me</option>}
                </>
              )}
              {activeTab === 'volcano' && (
                <>
                  <option value="level">Highest Alert Level</option>
                  {userLocation && <option value="distance">Nearest Me</option>}
                </>
              )}
            </select>

          </div>

        </section>


        {/* Content Layout: Left Map, Right List */}
        <section className="grid gap-6 lg:grid-cols-[1.25fr_0.75fr]">
          
          {/* Map Column */}
          <div className="order-2 lg:order-1 space-y-3">
            <div className="flex items-center justify-between gap-2">
              <h2 className="text-xs sm:text-sm font-bold text-slate-800 dark:text-zinc-100 uppercase tracking-wider flex items-center gap-1.5 whitespace-nowrap">
                {activeTab === 'earthquake' && <span>⚡ Seismic Epicenter Map</span>}
                {activeTab === 'heat' && <span>🌡️ PAGASA Heat Index Map</span>}
                {activeTab === 'volcano' && <span>🌋 PHIVOLCS Volcano Map</span>}
              </h2>
              <span className="text-xs font-semibold text-cyan-600 dark:text-cyan-400 bg-cyan-500/10 px-2.5 py-0.5 rounded-full border border-cyan-500/20 whitespace-nowrap">
                {activeTab === 'earthquake' && `${filteredQuakes.length} mapped`}
                {activeTab === 'heat' && `${filteredHeatStations.length} stations`}
                {activeTab === 'volcano' && `${filteredVolcanoes.length} volcanoes`}
              </span>
            </div>

            <QuakeMap
              mode={activeTab}
              quakes={filteredQuakes}
              heatData={filteredHeatStations}
              volcanoData={filteredVolcanoes}
              userLocation={userLocation}
              activeId={activeId}
              onSelect={(id) => setActiveId(id)}
            />
          </div>

          {/* List Column */}
          <div className="order-1 lg:order-2 space-y-3">
            <div className="flex items-center justify-between gap-2">
              <h2 className="text-xs sm:text-sm font-bold text-slate-800 dark:text-zinc-100 uppercase tracking-wider whitespace-nowrap">
                {activeTab === 'earthquake' && `⚡ Earthquake Feed (${filteredQuakes.length})`}
                {activeTab === 'heat' && `🌡️ Heat Index Stations (${filteredHeatStations.length})`}
                {activeTab === 'volcano' && `🌋 Active Volcanoes (${filteredVolcanoes.length})`}
              </h2>
            </div>

            <div className="space-y-3 max-h-[600px] overflow-y-auto pr-1">
              {activeTab === 'earthquake' &&
                filteredQuakes.map((quake) => {
                  const distanceKm = userLocation
                    ? calcDistanceKm(userLocation.lat, userLocation.lng, quake.lat, quake.lng)
                    : null
                  return (
                    <QuakeCard
                      key={quake.id}
                      quake={quake}
                      distanceKm={distanceKm}
                      isSignificant={quake.magnitude >= SIGNIFICANT_MAG}
                      isSelected={activeId === quake.id}
                      onSelect={(id) => setActiveId(id)}
                    />
                  )
                })}

              {activeTab === 'heat' &&
                filteredHeatStations.map((station) => {
                  const distanceKm = userLocation
                    ? calcDistanceKm(userLocation.lat, userLocation.lng, station.lat, station.lng)
                    : null
                  return (
                    <HeatCard
                      key={station.id}
                      station={station}
                      distanceKm={distanceKm}
                      isSelected={activeId === station.id}
                      onSelect={(id) => setActiveId(id)}
                    />
                  )
                })}

              {activeTab === 'volcano' &&
                filteredVolcanoes.map((volcano) => {
                  const distanceKm = userLocation
                    ? calcDistanceKm(userLocation.lat, userLocation.lng, volcano.lat, volcano.lng)
                    : null
                  return (
                    <VolcanoCard
                      key={volcano.id}
                      volcano={volcano}
                      distanceKm={distanceKm}
                      isSelected={activeId === volcano.id}
                      onSelect={(id) => setActiveId(id)}
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