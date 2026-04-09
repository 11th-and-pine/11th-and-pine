import { useNavigate } from 'react-router-dom'
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet'
import 'leaflet/dist/leaflet.css'
import L from 'leaflet'

// fix default marker icon bug in Leaflet + Vite
delete L.Icon.Default.prototype._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
})

// Westlake Station to Cal Anderson Park stops
const stops = [
  { id: 1, name: 'Westlake Station', position: [47.6131, -122.3371] },
  { id: 2, name: '11th & Pine', position: [47.6152, -122.3189] },
  { id: 3, name: 'Cal Anderson Park', position: [47.6165, -122.3197] },
]

function MapExplore() {
  const navigate = useNavigate()
  return (
    <div style={{ height: '100vh', width: '100%' }}>
      <MapContainer
        center={[47.6145, -122.3280]}
        zoom={15}
        style={{ height: '100%', width: '100%' }}
      >
        <TileLayer
          attribution='&copy; OpenStreetMap contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {stops.map(stop => (
          <Marker key={stop.id} position={stop.position}>
            <Popup>
              <strong>{stop.name}</strong>
              <br />
              <button onClick={() => navigate('/map/navigate')}>Start here</button>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  )
}

export default MapExplore