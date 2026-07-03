const normalize = (value) => value.replace(/\s+/g, ' ').trim()

const toNumber = (value) => {
  const clean = value.replace(/[^\d.-]/g, '')
  return Number.parseFloat(clean)
}

export function parsePhivolcsHtml(html) {
  const parser = new DOMParser()
  const doc = parser.parseFromString(html, 'text/html')
  const rows = [...doc.querySelectorAll('tr')]

  return rows
    .map((row) => [...row.querySelectorAll('td')].map((cell) => normalize(cell.textContent || '')))
    .filter((cells) => cells.length >= 6)
    .map((cells) => {
      const dateTime = cells[0]
      const lat = toNumber(cells[1])
      const lng = toNumber(cells[2])
      const depthKm = toNumber(cells[3])
      const magnitude = toNumber(cells[4])
      const location = cells[5]

      if (!dateTime || !location) return null
      if ([lat, lng, depthKm, magnitude].some((v) => Number.isNaN(v))) return null

      return {
        id: `${dateTime}-${location}-${magnitude}`,
        dateTime,
        location,
        magnitude,
        depthKm,
        lat,
        lng,
      }
    })
    .filter(Boolean)
}

export function calcDistanceKm(lat1, lng1, lat2, lng2) {
  const r = 6371
  const dLat = ((lat2 - lat1) * Math.PI) / 180
  const dLng = ((lng2 - lng1) * Math.PI) / 180

  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) ** 2

  return 2 * r * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}

export function playAlertSound() {
  const context = new (window.AudioContext || window.webkitAudioContext)()
  const oscillator = context.createOscillator()
  const gainNode = context.createGain()

  oscillator.type = 'sine'
  oscillator.frequency.value = 880
  gainNode.gain.value = 0.001

  oscillator.connect(gainNode)
  gainNode.connect(context.destination)

  oscillator.start()
  gainNode.gain.exponentialRampToValueAtTime(0.3, context.currentTime + 0.05)
  gainNode.gain.exponentialRampToValueAtTime(0.001, context.currentTime + 0.8)
  oscillator.stop(context.currentTime + 0.8)
}