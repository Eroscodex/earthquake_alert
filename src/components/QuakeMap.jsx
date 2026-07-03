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

function QuakeMap({ quakes, userLocation }) {
  return (
    <div className="h-[420px] overflow-hidden rounded-2xl border border-slate-800">
      <MapContainer center={PH_CENTER} zoom={5.5} className="h-full w-full">
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {quakes.slice(0, 30).map((quake) => (
          <CircleMarker
            key={quake.id}
            center={[quake.lat, quake.lng]}
            radius={Math.max(5, quake.magnitude * 1.8)}
            pathOptions={{ color: quake.magnitude >= 5 ? '#ff0026' : '#2600ff' }}
          >
            <Popup>
              <strong>M {quake.magnitude.toFixed(1)}</strong>
              <br />
              {quake.location}
              <br />
              Depth: {quake.depthKm.toFixed(1)} km
              <br />
              {quake.dateTime}
            </Popup>
          </CircleMarker>
        ))}

        {userLocation ? (
          <Marker position={[userLocation.lat, userLocation.lng]}>
            <Popup>Your location</Popup>
          </Marker>
        ) : null}
      </MapContainer>
    </div>
  )
}

export default QuakeMap