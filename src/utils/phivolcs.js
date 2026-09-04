export function calcDistanceKm(lat1, lng1, lat2, lng2) {
  if (lat1 == null || lng1 == null || lat2 == null || lng2 == null) return null
  const R = 6371
  const dLat = ((lat2 - lat1) * Math.PI) / 180
  const dLng = ((lng2 - lng1) * Math.PI) / 180

  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) ** 2

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  return R * c
}

let audioCtx = null

export function unlockAudioContext() {
  if (typeof window === 'undefined') return
  const AudioContextClass = window.AudioContext || window.webkitAudioContext
  if (!AudioContextClass) return
  if (!audioCtx) {
    audioCtx = new AudioContextClass()
  }
  if (audioCtx.state === 'suspended') {
    audioCtx.resume()
  }
}

export function playAlertSound(type = 'alarm') {
  if (typeof window === 'undefined') return
  try {
    unlockAudioContext()
    if (!audioCtx) return

    const now = audioCtx.currentTime
    const osc = audioCtx.createOscillator()
    const gain = audioCtx.createGain()

    osc.type = type === 'beep' ? 'sine' : 'sawtooth'
    
    if (type === 'alarm') {
      osc.frequency.setValueAtTime(880, now)
      osc.frequency.exponentialRampToValueAtTime(440, now + 0.3)
      osc.frequency.exponentialRampToValueAtTime(880, now + 0.6)
      gain.gain.setValueAtTime(0.3, now)
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.8)
      osc.connect(gain)
      gain.connect(audioCtx.destination)
      osc.start(now)
      osc.stop(now + 0.8)
    } else {
      osc.frequency.setValueAtTime(600, now)
      gain.gain.setValueAtTime(0.15, now)
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.2)
      osc.connect(gain)
      gain.connect(audioCtx.destination)
      osc.start(now)
      osc.stop(now + 0.2)
    }
  } catch (err) {
    console.warn('Audio playback failed:', err)
  }
}

export const PH_PRESET_CITIES = [
  { name: 'Metro Manila', lat: 14.5995, lng: 120.9842 },
  { name: 'Cebu City', lat: 10.3157, lng: 123.8854 },
  { name: 'Davao City', lat: 7.1907, lng: 125.4553 },
  { name: 'Cagayan de Oro', lat: 8.4542, lng: 124.6319 },
  { name: 'Baguio City', lat: 16.4023, lng: 120.5960 },
  { name: 'Iloilo City', lat: 10.7202, lng: 122.5621 },
  { name: 'Zamboanga City', lat: 6.9214, lng: 122.0790 },
]