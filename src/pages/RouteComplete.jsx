import { useNavigate } from 'react-router-dom'
import { MapContainer, TileLayer, Marker, Popup, Polyline } from 'react-leaflet'
import 'leaflet/dist/leaflet.css'
import L from 'leaflet'
import { useEffect, useState } from 'react'

delete L.Icon.Default.prototype._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
})

const mainRoute = [
  [47.6131, -122.3371], 
  [47.6138, -122.3340],
  [47.6145, -122.3300],
  [47.6152, -122.3250],
  [47.6158, -122.3220],
  [47.6165, -122.3197], 
]

const stops = [
  { id: 1, name: 'Westlake Station', description: 'Starting point of your journey.', position: [47.6131, -122.3371] },
  { id: 2, name: '11th & Pine', description: 'The heart of CHOP.', position: [47.6152, -122.3250] },
  { id: 3, name: 'Cal Anderson Park', description: 'Final destination.', position: [47.6165, -122.3197] },
]

function RouteComplete() {
  const navigate = useNavigate()
  const [userLocation, setUserLocation] = useState(null)

  useEffect(() => {
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setUserLocation([position.coords.latitude, position.coords.longitude])
      },
      () => {
        setUserLocation([47.6165, -122.3197])
      }
    )
  }, [])

  return (
    <div style={styles.container}>
      <MapContainer
        center={userLocation || [47.6148, -122.3280]}
        zoom={15}
        style={styles.map}
      >
        <TileLayer
          attribution='&copy; OpenStreetMap contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        <Polyline positions={mainRoute} color="blue" weight={4} />

        {stops.map((stop) => (
          <Marker key={stop.id} position={stop.position}>
            <Popup>
              <strong>{stop.name}</strong>
              <br />
              {stop.description}
            </Popup>
          </Marker>
        ))}

        {userLocation && (
          <Marker position={userLocation}>
            <Popup>You are here</Popup>
          </Marker>
        )}
      </MapContainer>

      <div style={styles.overlay}>
        <div style={styles.card}>
          <h1 style={styles.title}>Route Complete!</h1>
          <p style={styles.text}>
            You have finished exploring this route. Dive deeper into individual
            perspectives or try another route.
          </p>

          <div style={styles.buttonGroup}>
            <button
              style={styles.primaryButton}
              onClick={() => navigate('/perspectives')}
            >
              Explore Perspectives
            </button>
            <button
              style={styles.secondaryButton}
              onClick={() => navigate('/map')}
            >
              Try Another Route
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

const styles = {
  container: {
    height: '100vh',
    width: '100%',
    position: 'relative',
  },
  map: {
    height: '100%',
    width: '100%',
  },
  overlay: {
    position: 'absolute',
    inset: 0,
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
    zIndex: 1000,
  },
  card: {
    backgroundColor: 'white',
    padding: '32px',
    borderRadius: '16px',
    textAlign: 'center',
    maxWidth: '420px',
    boxShadow: '0 4px 16px rgba(0,0,0,0.15)',
  },
  title: {
    marginBottom: '12px',
    fontSize: '28px',
  },
  text: {
    marginBottom: '24px',
    color: '#555',
    lineHeight: 1.5,
  },
  buttonGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
  },
  primaryButton: {
    padding: '12px 16px',
    backgroundColor: '#111',
    color: '#fff',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    fontSize: '16px',
  },
  secondaryButton: {
    padding: '12px 16px',
    backgroundColor: '#e5e5e5',
    color: '#111',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    fontSize: '16px',
  },
}

export default RouteComplete