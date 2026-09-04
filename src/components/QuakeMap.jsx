import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { CircleMarker, MapContainer, Marker, Popup, TileLayer } from 'react-leaflet'

delete L.Icon.Default.prototype._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
})

const PH_CENTER = [12.8797, 121.774]

function QuakeMap({ quakes = [], userLocation, activeQuakeId, onSelectQuake }) {
  return (
    <div className="relative h-[340px] sm:h-[440px] w-full overflow-hidden rounded-2xl border border-cyan-500/20 bg-slate-100 dark:bg-zinc-900 shadow-xl transition-all">

      <MapContainer center={PH_CENTER} zoom={5.5} className="h-full w-full">
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {quakes.slice(0, 40).map((quake) => {
          const isSelected = activeQuakeId === quake.id
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
                click: () => onSelectQuake && onSelectQuake(quake.id),
              }}
            >
              <Popup className="custom-leaflet-popup">
                <div className="p-1 space-y-1 text-slate-900">
                  <div className="flex items-center gap-1.5 font-bold text-sm">
                    <span className={`inline-block px-1.5 py-0.5 rounded text-white text-xs ${
                      quake.magnitude >= 5 ? 'bg-rose-600' : quake.magnitude >= 4 ? 'bg-amber-600' : 'bg-cyan-600'
                    }`}>
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
