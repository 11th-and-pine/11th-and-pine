import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import Map, { Source, Layer, Marker } from 'react-map-gl'
import 'mapbox-gl/dist/mapbox-gl.css'
import NavCircleButton from '../../components/NavCircleButton'

const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_TOKEN
const MAP_STYLE = 'mapbox://styles/mapbox/light-v11'

const START_POS = [47.61208726167953, -122.33701558200671]

const START_RADIUS_METERS = 80
const AT_START_DISTANCE_KM = 0.08

const INITIAL_ZOOM = 14

const toLngLat = ([lat, lng]) => [lng, lat]

function getMidpoint(pointA, pointB) {
  return [
    (pointA[0] + pointB[0]) / 2,
    (pointA[1] + pointB[1]) / 2,
  ]
}

function makeInitialViewState(center) {
  return {
    longitude: center[1],
    latitude: center[0],
    zoom: INITIAL_ZOOM,
  }
}

function circlePolygon([lat, lng], radiusM, steps = 64) {
  const coords = []

  for (let i = 0; i < steps; i++) {
    const angle = (i / steps) * 2 * Math.PI
    const dLat = (radiusM / 111320) * Math.cos(angle)
    const dLng = (radiusM / (111320 * Math.cos(lat * Math.PI / 180))) * Math.sin(angle)

    coords.push([lng + dLng, lat + dLat])
  }

  coords.push(coords[0])

  return {
    type: 'Feature',
    geometry: {
      type: 'Polygon',
      coordinates: [coords],
    },
  }
}

function makeNavLine(userPos) {
  return {
    type: 'Feature',
    geometry: {
      type: 'LineString',
      coordinates: [
        toLngLat(userPos),
        toLngLat(START_POS),
      ],
    },
  }
}


function distanceKm([lat1, lon1], [lat2, lon2]) {
  const earthRadiusKm = 6371
  const dLat = (lat2 - lat1) * Math.PI / 180
  const dLon = (lon2 - lon1) * Math.PI / 180

  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1 * Math.PI / 180) *
      Math.cos(lat2 * Math.PI / 180) *
      Math.sin(dLon / 2) ** 2

  return earthRadiusKm * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}


export default function NavigateToStart() {
  const navigate = useNavigate()
  const mapRef = useRef()

  const [userPos, setUserPos] = useState(null)
  // Lazy-initialize so we don't need a setState-in-effect when the API is missing.
  const [gpsError, setGpsError] = useState(
    () => typeof navigator !== 'undefined' && !navigator.geolocation,
  )

  const dist = userPos ? distanceKm(userPos, START_POS) : null
  const atStart = dist !== null && dist < AT_START_DISTANCE_KM

  const mapCenter = userPos ? getMidpoint(userPos, START_POS) : START_POS

  useEffect(() => {
    if (!navigator.geolocation) {
      return
    }

    navigator.geolocation.getCurrentPosition(
      position => {
        setUserPos([
          position.coords.latitude,
          position.coords.longitude,
        ])
      },
      () => setGpsError(true),
      { timeout: 10000 },
    )
  }, [])

  useEffect(() => {
    if (!userPos) {
      return
    }

    const midpoint = getMidpoint(userPos, START_POS)

    mapRef.current?.flyTo({
      center: toLngLat(midpoint),
      zoom: INITIAL_ZOOM,
      duration: 600,
    })
  }, [userPos])

  return (
    <div style={styles.page}>
      <style>{animationStyles}</style>

      <Map
        ref={mapRef}
        mapboxAccessToken={MAPBOX_TOKEN}
        initialViewState={makeInitialViewState(mapCenter)}
        style={styles.map}
        mapStyle={MAP_STYLE}
        attributionControl={false}
      >
        {/* Dashed line from user to start */}
        {userPos && (
          <Source id="nav-line" type="geojson" data={makeNavLine(userPos)}>
            <Layer
              id="nav-line-layer"
              type="line"
              layout={styles.routeLineLayout}
              paint={styles.navLinePaint}
            />
          </Source>
        )}

        {/* Proximity circle around start */}
        <Source
          id="start-circle"
          type="geojson"
          data={circlePolygon(START_POS, START_RADIUS_METERS)}
        >
          <Layer
            id="start-circle-fill"
            type="fill"
            paint={styles.startCircleFillPaint}
          />

          <Layer
            id="start-circle-outline"
            type="line"
            paint={styles.startCircleOutlinePaint}
          />
        </Source>

        {/* User dot */}
        {userPos && (
          <Marker
            longitude={userPos[1]}
            latitude={userPos[0]}
            anchor="center"
          >
            <div style={styles.userMarker}>
              <div style={styles.userMarkerPing} />
              <div style={styles.userMarkerDot} />
            </div>
          </Marker>
        )}

        {/* Start marker */}
        <Marker
          longitude={START_POS[1]}
          latitude={START_POS[0]}
          anchor="center"
        >
          <div style={styles.startMarker} />
        </Marker>
      </Map>

      {/* Top bar */}
      <div style={styles.topBar}>
        <NavCircleButton onClick={() => navigate(-1)} />

        <div style={styles.gpsStatus}>
          <div style={styles.gpsStatusDot(userPos)} />

          <span style={styles.gpsStatusText}>
            {userPos ? 'Live GPS' : 'Locating…'}
          </span>
        </div>
      </div>

      {/* Bottom panel */}
      <div style={styles.bottomPanel}>
        <div style={styles.panelHandle} />

        {!userPos && !gpsError && (
          <div style={styles.messageBlock}>
            <div style={styles.loadingText}>
              Getting your location…
            </div>
          </div>
        )}

        {gpsError && (
          <div style={styles.messageBlock}>
            <div style={styles.errorText}>
              Could not access GPS. Please enable location permissions.
            </div>
          </div>
        )}

        {atStart && (
          <div style={styles.messageBlock}>
            <div style={styles.successIcon}>✅</div>

            <div style={styles.successTitle}>
              You're at the starting point!
            </div>

            <div style={styles.successSubtitle}>
              Westlake Center — ready to begin
            </div>
          </div>
        )}

        <button 
          onClick={() => navigate('/map/walking')} 
          style={styles.startButton}
        >
          {atStart ? 'Begin Walk →' : 'Begin Walk Anyway →'}
        </button>
      </div>
    </div>
  )
}

const animationStyles = `
  @keyframes userPing {
    0% { transform: scale(1); opacity: 0.8; }
    70% { transform: scale(2); opacity: 0; }
    100% { transform: scale(1); opacity: 0; }
  }
`

const styles = {
  page: {
    height: '100%',
    width: '100%',
    position: 'relative',
  },

  map: {
    width: '100%',
    height: '100%',
  },

  routeLineLayout: {
    'line-cap': 'round',
    'line-join': 'round',
  },

  navLinePaint: {
    'line-color': '#3b82f6',
    'line-width': 2,
    'line-opacity': 0.65,
    'line-dasharray': [2.5, 2],
  },

  startCircleFillPaint: {
    'fill-color': '#22c55e',
    'fill-opacity': 0.08,
  },

  startCircleOutlinePaint: {
    'line-color': '#22c55e',
    'line-width': 1.5,
    'line-opacity': 0.6,
    'line-dasharray': [2, 2],
  },

  userMarker: {
    position: 'relative',
    width: 24,
    height: 24,
  },

  userMarkerPing: {
    position: 'absolute',
    inset: 0,
    background: 'rgba(59,130,246,0.35)',
    borderRadius: '50%',
    animation: 'userPing 2s ease-in-out infinite',
  },

  userMarkerDot: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: 'translate(-50%,-50%)',
    width: 13,
    height: 13,
    background: '#3b82f6',
    border: '3px solid white',
    borderRadius: '50%',
    boxShadow: '0 2px 10px rgba(59,130,246,0.7)',
  },

  startMarker: {
    width: 18,
    height: 18,
    background: '#22c55e',
    border: '3px solid white',
    borderRadius: '50%',
    boxShadow: '0 2px 10px rgba(34,197,94,0.6)',
  },

  topBar: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 1000,
    padding: '18px 16px 16px',
    display: 'flex',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },

  gpsStatus: {
    background: 'rgba(0,0,0,0.45)',
    backdropFilter: 'blur(12px)',
    WebkitBackdropFilter: 'blur(12px)',
    border: '1px solid rgba(255,255,255,0.18)',
    borderRadius: 20,
    padding: '6px 12px',
    display: 'flex',
    alignItems: 'center',
    gap: 6,
  },

  gpsStatusDot: userPos => ({
    width: 7,
    height: 7,
    borderRadius: '50%',
    background: userPos ? '#22c55e' : '#f59e0b',
  }),

  gpsStatusText: {
    color: 'white',
    fontSize: 12,
  },

  bottomPanel: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    zIndex: 1000,
    background: 'white',
    borderRadius: '24px 24px 0 0',
    boxShadow: '0 -4px 24px rgba(0,0,0,0.10)',
    padding: '14px 20px 44px',
  },

  panelHandle: {
    width: 40,
    height: 4,
    background: '#d1d5db',
    borderRadius: 2,
    margin: '0 auto 20px',
  },

  messageBlock: {
    textAlign: 'center',
    marginBottom: 20,
  },

  loadingText: {
    color: '#6b7280',
    fontSize: 14,
  },

  errorText: {
    color: '#ef4444',
    fontWeight: 600,
    fontSize: 14,
  },

  successIcon: {
    fontSize: 36,
    marginBottom: 8,
  },

  successTitle: {
    color: '#111827',
    fontWeight: 700,
    fontSize: 18,
  },

  successSubtitle: {
    color: '#6b7280',
    fontSize: 14,
    marginTop: 4,
  },

  startButton: {
    width: '100%',
    background: '#84C4FF',
    color: '#0a0a0a',
    padding: '15px',
    borderRadius: 16,
    fontSize: 16,
    fontWeight: 600,
    cursor: 'pointer',
    border: 'none',
  },
}
