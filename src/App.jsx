import { useEffect, useMemo, useRef, useState } from 'react'
import QuakeCard from './components/QuakeCard'
import QuakeMap from './components/QuakeMap'
import Footer from './components/Footer'
import { calcDistanceKm, playAlertSound } from './utils/phivolcs'

const REFRESH_MS = 10000
const SIGNIFICANT_MAG = 5

function App() {
  const [quakes, setQuakes] = useState([])
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)
  const [updatedAt, setUpdatedAt] = useState(null)
  const [userLocation, setUserLocation] = useState(null)

  const [permission, setPermission] = useState(() => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      return Notification.permission
    }
    return 'denied'
  })

  const seenAlertIds = useRef(new Set())

  const latestSignificant = useMemo(() => {
    if (!Array.isArray(quakes)) return null
    return quakes.find(q => q.magnitude >= SIGNIFICANT_MAG)
  }, [quakes])

  const askNotificationPermission = async () => {
    if (!('Notification' in window)) return
    const result = await Notification.requestPermission()
    setPermission(result)
  }

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

    if (!res.ok) throw new Error(`HTTP ${res.status}`)

    const data = await res.json()

    if (!data?.features || !Array.isArray(data.features)) {
      throw new Error('Invalid USGS response')
    }

    const parsed = data.features
      .filter(item => {
        const coords = item?.geometry?.coordinates
        if (!coords) return false

        const [lng, lat] = coords

        // 🇵🇭 PH ONLY FILTER
        return lat >= 4 && lat <= 22 && lng >= 116 && lng <= 127
      })
      .map(item => {
        const [lng, lat, depth] = item.geometry.coordinates

        return {
          id: item.id,
          time: item.properties.time, // ⚡ raw timestamp (for correct sorting)
          dateTime: new Date(item.properties.time).toLocaleString(),
          location: item.properties.place || 'Unknown',
          magnitude: Number(item.properties.mag) || 0,
          depthKm: Number(depth) || 0,
          lat,
          lng,
        }
      })
      // ⚡ correct + fast sorting
      .sort((a, b) => b.time - a.time)

    setQuakes(parsed)
    setUpdatedAt(new Date())
  } catch (err) {
    setError(err?.message || 'Failed to load earthquake data')
    setQuakes([])
  } finally {
    setLoading(false)
  }
}

  useEffect(() => {
    if (!navigator.geolocation) return

    navigator.geolocation.getCurrentPosition(
      pos => {
        setUserLocation({
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
        })
      },
      () => {},
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 60000,
      }
    )
  }, [])

  useEffect(() => {
    fetchQuakes()
    const timer = setInterval(fetchQuakes, REFRESH_MS)
    return () => clearInterval(timer)
  }, [])

  useEffect(() => {
    if (!latestSignificant) return
    if (seenAlertIds.current.has(latestSignificant.id)) return

    seenAlertIds.current.add(latestSignificant.id)
    playAlertSound()

    if ('Notification' in window && permission === 'granted') {
      new Notification(
        `PH Quake Alert M${latestSignificant.magnitude}`,
        {
          body: `${latestSignificant.location} | Depth ${latestSignificant.depthKm} km`,
        }
      )
    }
  }, [latestSignificant, permission])

  return (
    <main className="flex min-h-screen flex-col bg-slate-950 text-slate-100">
      <div className="mx-auto w-full max-w-6xl flex-1 px-4 py-6 sm:px-6 lg:px-8">

        <header className="mb-6 rounded-2xl border border-slate-800 bg-gradient-to-br from-slate-900 via-slate-900 to-cyan-950/50 p-5 shadow-xl shadow-cyan-950/20">
          <p className="text-xs tracking-[0.2em] text-cyan-300">
            REAL-TIME MONITORING AND VISUALIZATION OF EARTHQUAKES IN THE PHILIPPINES
          </p>

          <h1 className="mt-1 text-2xl font-semibold sm:text-3xl">
            PH Earthquake Alert
          </h1>

          <div className="mt-4 flex flex-wrap items-center gap-2 text-sm text-slate-300">

            <span className="rounded-full border border-slate-700 px-3 py-1">
              Auto-refresh: 30s
            </span>

            <span className="rounded-full border border-slate-700 px-3 py-1">
              Updated: {updatedAt ? updatedAt.toLocaleTimeString() : 'Loading...'}
            </span>

            <button
              onClick={askNotificationPermission}
              className="rounded-full border border-cyan-500/60 bg-cyan-500/10 px-3 py-1 text-cyan-200 hover:bg-cyan-500/20"
            >
              Notifications: {permission}
            </button>

          </div>

          {error && (
            <p className="mt-3 text-sm text-rose-300">{error}</p>
          )}
        </header>

        <section className="grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">

          <div className="order-2 lg:order-1">
            <QuakeMap quakes={quakes} userLocation={userLocation} />
          </div>

          <div className="order-1 space-y-3 lg:order-2">

            {loading && quakes.length === 0 && (
              <p className="rounded-xl border border-slate-800 bg-slate-900/80 p-4 text-sm text-slate-300">
                Loading latest earthquakes...
              </p>
            )}

            {quakes.slice(0, 8).map(quake => {
              const distanceKm = userLocation
                ? calcDistanceKm(
                    userLocation.lat,
                    userLocation.lng,
                    quake.lat,
                    quake.lng
                  )
                : null

              return (
                <QuakeCard
                  key={quake.id}
                  quake={quake}
                  distanceKm={distanceKm}
                  isSignificant={quake.magnitude >= SIGNIFICANT_MAG}
                />
              )
            })}

          </div>

        </section>

      </div>

      <Footer />
    </main>
  )
}

export default App