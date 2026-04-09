import { useNavigate } from 'react-router-dom'
import { MapContainer, TileLayer, Marker, Popup, Polyline } from 'react-leaflet'
import 'leaflet/dist/leaflet.css'
import L from 'leaflet'

delete L.Icon.Default.prototype._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
})

const mainRoute = [
  [47.6131, -122.3371], // Westlake Station
  [47.6138, -122.3340],
  [47.6145, -122.3300],
  [47.6152, -122.3250],
  [47.6158, -122.3220],
  [47.6165, -122.3197], // Cal Anderson Park
]

const stops = [
  { id: 1, name: 'Westlake Station', description: 'Starting point of your journey.', position: [47.6131, -122.3371] },
  { id: 2, name: '11th & Pine', description: 'The heart of CHOP.', position: [47.6152, -122.3250] },
  { id: 3, name: 'Cal Anderson Park', description: 'Final destination.', position: [47.6165, -122.3197] },
]

function MapExplore() {
  const navigate = useNavigate()

  return (
    <div style={{ height: '100vh', width: '100%', position: 'relative' }}>
      <MapContainer
        center={[47.6148, -122.3280]}
        zoom={15}
        style={{ height: '100%', width: '100%' }}
      >
        <TileLayer
          attribution='&copy; OpenStreetMap contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <Polyline positions={mainRoute} color="blue" weight={4} />
        {stops.map(stop => (
          <Marker key={stop.id} position={stop.position}>
            <Popup>
              <strong>{stop.name}</strong>
              <br />
              {stop.description}
            </Popup>
          </Marker>
        ))}
      </MapContainer>

      <div style={{
        position: 'absolute',
        bottom: 32,
        left: '50%',
        transform: 'translateX(-50%)',
        zIndex: 1000,
        display: 'flex',
        gap: 12,
      }}>
        <button onClick={() => navigate('/map/navigate')}>Start Navigation</button>
        <button onClick={() => navigate('/perspectives')}>View Perspectives</button>
      </div>
    </div>
  )
}

export default MapExplore