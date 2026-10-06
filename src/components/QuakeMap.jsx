import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { CircleMarker, MapContainer, Marker, Popup, TileLayer } from 'react-leaflet'
import { getHeatCategory } from '../utils/phHeatIndex'


delete L.Icon.Default.prototype._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
})

const PH_CENTER = [12.8797, 121.774]

function QuakeMap({
  mode = 'earthquake',
  quakes = [],
  heatData = [],
  volcanoData = [],
  userLocation,
  activeId,
  onSelect,
}) {
  return (
    <div className="relative h-[340px] sm:h-[440px] w-full overflow-hidden rounded-2xl border border-cyan-500/20 bg-slate-100 dark:bg-zinc-900 shadow-xl transition-all">
      <MapContainer center={PH_CENTER} zoom={5.5} className="h-full w-full">
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {/* Earthquake Markers */}
        {mode === 'earthquake' &&
          quakes.slice(0, 40).map((quake) => {
            const isSelected = activeId === quake.id
            const isSignificant = quake.magnitude >= 5.0

            let circleColor = '#06b6d4' // Cyan / Moderate
            if (quake.magnitude >= 5.0) circleColor = '#f43f5e' // Rose / High
            else if (quake.magnitude >= 4.0) circleColor = '#f59e0b' // Amber

            return (
              <CircleMarker
                key={quake.id}
                center={[quake.lat, quake.lng]}
                radius={isSelected ? Math.max(12, quake.magnitude * 2.8) : Math.max(6, quake.magnitude * 2)}
                pathOptions={{
                  color: circleColor,
                  fillColor: circleColor,
                  fillOpacity: isSelected ? 0.8 : 0.5,
                  weight: isSelected || isSignificant ? 3 : 1.5,
                }}
                eventHandlers={{
                  click: () => onSelect && onSelect(quake.id),
                }}
              >
                <Popup className="custom-leaflet-popup">
                  <div className="p-1 space-y-1 text-slate-900">
                    <div className="flex items-center gap-1.5 font-bold text-sm">
                      <span
                        className={`inline-block px-1.5 py-0.5 rounded text-white text-xs ${
                          quake.magnitude >= 5 ? 'bg-rose-600' : quake.magnitude >= 4 ? 'bg-amber-600' : 'bg-cyan-600'
                        }`}
                      >
                        M {quake.magnitude.toFixed(1)}
                      </span>
                      <span>{quake.location}</span>
                    </div>
                    <div className="text-xs text-slate-600 space-y-0.5">
                      <div>Depth: <strong>{quake.depthKm.toFixed(1)} km</strong></div>
                      <div>Time: {quake.dateTime}</div>
                    </div>
                  </div>
                </Popup>
              </CircleMarker>
            )
          })}

        {/* Heat Index Station Markers */}
        {mode === 'heat' &&
          heatData.map((station) => {
            const isSelected = activeId === station.id
            const category = getHeatCategory(station.heatIndex)

            let circleColor = '#10b981' // Green Normal
            if (station.heatIndex >= 52) circleColor = '#b91c1c'
            else if (station.heatIndex >= 42) circleColor = '#f43f5e'
            else if (station.heatIndex >= 33) circleColor = '#f59e0b'
            else if (station.heatIndex >= 27) circleColor = '#eab308'

            return (
              <CircleMarker
                key={station.id}
                center={[station.lat, station.lng]}
                radius={isSelected ? 14 : 9}
                pathOptions={{
                  color: circleColor,
                  fillColor: circleColor,
                  fillOpacity: isSelected ? 0.85 : 0.6,
                  weight: isSelected ? 3 : 2,
                }}
                eventHandlers={{
                  click: () => onSelect && onSelect(station.id),
                }}
              >
                <Popup className="custom-leaflet-popup">
                  <div className="p-1 space-y-1 text-slate-900">
                    <div className="flex items-center gap-1.5 font-bold text-sm">
                      <span className="inline-block px-1.5 py-0.5 rounded bg-amber-600 text-white text-xs">
                        🌡️ {station.heatIndex}°C
                      </span>
                      <span>{station.station}</span>
                    </div>
                    <div className="text-xs text-slate-600 space-y-0.5">
                      <div>Category: <strong>{category.shortLabel}</strong></div>
                      <div>Air Temp: {station.temp}°C | Humidity: {station.humidity}%</div>
                    </div>
                  </div>
                </Popup>
              </CircleMarker>
            )
          })}

        {/* Volcano Markers */}
        {mode === 'volcano' &&
          volcanoData.map((volcano) => {
            const isSelected = activeId === volcano.id

            let circleColor = '#10b981' // Normal Level 0

            if (volcano.alertLevel >= 3) circleColor = '#f43f5e'
            else if (volcano.alertLevel === 2) circleColor = '#f59e0b'
            else if (volcano.alertLevel === 1) circleColor = '#eab308'

            return (
              <CircleMarker
                key={volcano.id}
                center={[volcano.lat, volcano.lng]}
                radius={isSelected ? 16 : 10 + volcano.alertLevel * 2}
                pathOptions={{
                  color: circleColor,
                  fillColor: circleColor,
                  fillOpacity: isSelected ? 0.85 : 0.65,
                  weight: volcano.alertLevel > 0 ? 3 : 1.5,
                }}
                eventHandlers={{
                  click: () => onSelect && onSelect(volcano.id),
                }}
              >
                <Popup className="custom-leaflet-popup">
                  <div className="p-1 space-y-1 text-slate-900">
                    <div className="flex items-center gap-1.5 font-bold text-sm">
                      <span className="inline-block px-1.5 py-0.5 rounded bg-rose-600 text-white text-xs">
                        🌋 Level {volcano.alertLevel}
                      </span>
                      <span>{volcano.name}</span>
                    </div>
                    <div className="text-xs text-slate-600 space-y-0.5">
                      <div>Status: <strong>{volcano.status}</strong></div>
                      <div>Province: {volcano.province}</div>
                      <div>Type: {volcano.type}</div>
                    </div>
                  </div>
                </Popup>
              </CircleMarker>
            )
          })}

        {userLocation ? (
          <Marker position={[userLocation.lat, userLocation.lng]}>
            <Popup>
              <strong>📍 Your Selected Location</strong>
            </Popup>
          </Marker>
        ) : null}
      </MapContainer>
    </div>
  )
}

export default QuakeMap