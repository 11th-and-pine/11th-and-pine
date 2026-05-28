import { useState, useEffect, useRef } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import Map, { Source, Layer, Marker } from 'react-map-gl'
import 'mapbox-gl/dist/mapbox-gl.css'
import NavCircleButton from '../../components/NavCircleButton'

const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_TOKEN
const MAP_STYLE = 'mapbox://styles/mapbox/light-v11'

const START_POS = [47.61246495850918, -122.33745074674492]

const START_RADIUS_METERS = 80
const AT_START_DISTANCE_KM = 0.08

const INITIAL_ZOOM = 14
const WALKING_DIRECTIONS_PROFILE = 'mapbox/walking'
const SIM_ROUTE_COLOR = '#8b5cf6'
const DEFAULT_ROUTE_COLOR = '#D9603F'

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

function makeNavLine(userPos, startPos) {
  return {
    type: 'Feature',
    geometry: {
      type: 'LineString',
      coordinates: [
        toLngLat(userPos),
        toLngLat(startPos),
      ],
    },
  }
}

function makeRouteFeature(coordinates) {
  return {
    type: 'Feature',
    geometry: {
      type: 'LineString',
      coordinates,
    },
  }
}

function getLineBounds(coordinates) {
  const lngs = coordinates.map(point => point[0])
  const lats = coordinates.map(point => point[1])

  return [
    [Math.min(...lngs), Math.min(...lats)],
    [Math.max(...lngs), Math.max(...lats)],
  ]
}

function formatDuration(seconds) {
  if (!seconds || !Number.isFinite(seconds)) return null

  const minutes = Math.max(1, Math.round(seconds / 60))

  return `${minutes} min walk`
}

function formatDistance(meters) {
  if (!meters || !Number.isFinite(meters)) return null

  const miles = meters / 1609.344

  if (miles < 0.1) {
    return `${Math.round(meters)} m`
  }

  return `${miles.toFixed(1)} mi`
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
  const location = useLocation()
  const mapRef = useRef()
  const route = location.state?.route
  const startPos = route?.path?.[0] || START_POS
  const routeColor = route?.color || DEFAULT_ROUTE_COLOR
  const isSimRoute = route?.color === SIM_ROUTE_COLOR

  const [userPos, setUserPos] = useState(() => (isSimRoute ? startPos : null))
  const [walkingRoute, setWalkingRoute] = useState(null)
  const [directionsLoading, setDirectionsLoading] = useState(false)
  const [directionsError, setDirectionsError] = useState(false)
  // Lazy-initialize so we don't need a setState-in-effect when the API is missing.
  const [gpsError, setGpsError] = useState(
    () => !isSimRoute && typeof navigator !== 'undefined' && !navigator.geolocation,
  )
  // Countdown shown after arriving at start; when it hits 0 we auto-navigate
  // into the live walking screen so the user doesn't need to tap a button.
  const [autoStartCountdown, setAutoStartCountdown] = useState(null)

  const dist = userPos ? distanceKm(userPos, startPos) : null
  const atStart = dist !== null && dist < AT_START_DISTANCE_KM

  const mapCenter = userPos ? getMidpoint(userPos, startPos) : startPos
  const routeFeature = isSimRoute
    ? null
    : walkingRoute?.geometry?.coordinates?.length > 1
    ? walkingRoute
    : userPos
      ? makeNavLine(userPos, startPos)
      : null
  const routeDurationText = formatDuration(walkingRoute?.properties?.duration)
  const routeDistanceText = formatDistance(walkingRoute?.properties?.distance)

  useEffect(() => {
    if (isSimRoute) {
      return
    }

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
  }, [isSimRoute])

  useEffect(() => {
    if (!userPos) {
      return
    }

    const coordinates = routeFeature?.geometry?.coordinates

    if (coordinates?.length > 1) {
      mapRef.current?.fitBounds(getLineBounds(coordinates), {
        padding: {
          top: 90,
          right: 42,
          bottom: 240,
          left: 42,
        },
        duration: 600,
      })
      return
    }

    mapRef.current?.flyTo({
      center: toLngLat(getMidpoint(userPos, startPos)),
      zoom: INITIAL_ZOOM,
      duration: 600,
    })
  }, [routeFeature, startPos, userPos])

  useEffect(() => {
    if (!userPos || !MAPBOX_TOKEN || isSimRoute) {
      return
    }

    const controller = new AbortController()
    const [userLng, userLat] = toLngLat(userPos)
    const [startLng, startLat] = toLngLat(startPos)
    const coordinates = `${userLng},${userLat};${startLng},${startLat}`
    const params = new URLSearchParams({
      access_token: MAPBOX_TOKEN,
      geometries: 'geojson',
      overview: 'full',
      steps: 'false',
    })

    Promise.resolve()
      .then(() => {
        setDirectionsLoading(true)
        setDirectionsError(false)

        return fetch(
          `https://api.mapbox.com/directions/v5/${WALKING_DIRECTIONS_PROFILE}/${coordinates}?${params.toString()}`,
          { signal: controller.signal },
        )
      })
      .then(response => {
        if (!response.ok) {
          throw new Error('Directions request failed')
        }

        return response.json()
      })
      .then(data => {
        const firstRoute = data.routes?.[0]

        if (!firstRoute?.geometry?.coordinates?.length) {
          throw new Error('Directions route missing')
        }

        setWalkingRoute({
          ...makeRouteFeature(firstRoute.geometry.coordinates),
          properties: {
            distance: firstRoute.distance,
            duration: firstRoute.duration,
          },
        })
      })
      .catch(error => {
        if (error.name === 'AbortError') {
          return
        }

        setWalkingRoute(null)
        setDirectionsError(true)
      })
      .finally(() => {
        if (!controller.signal.aborted) {
          setDirectionsLoading(false)
        }
      })

    return () => {
      controller.abort()
    }
  }, [isSimRoute, startPos, userPos])

  // Auto-start the walk 5 seconds after the user arrives at the starting
  // point. All state updates happen inside subscription callbacks (setInterval
  // / setTimeout) — never synchronously in the effect body — so we stay
  // compliant with react-hooks/set-state-in-effect.
  useEffect(() => {
    if (!atStart) return

    let remaining = 5
    // Seed the displayed countdown on the next microtask so the initial set
    // happens in a subscription callback, not the effect body.
    const initId = setTimeout(() => setAutoStartCountdown(remaining), 0)

    const tickId = setInterval(() => {
      remaining -= 1
      if (remaining > 0) {
        setAutoStartCountdown(remaining)
      } else {
        clearInterval(tickId)
        navigate('/map/walking/live', {
          state: route ? { route } : undefined,
        })
      }
    }, 1000)

    return () => {
      clearTimeout(initId)
      clearInterval(tickId)
    }
  }, [atStart, navigate, route])

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
        {/* Walking directions route from user to start. Falls back to a straight line if Directions fails. */}
        {routeFeature && (
          <Source id="nav-line" type="geojson" data={routeFeature}>
            <Layer
              id="nav-line-layer"
              type="line"
              layout={styles.routeLineLayout}
              paint={walkingRoute ? styles.directionsRoutePaint : styles.fallbackNavLinePaint}
            />
          </Source>
        )}

        {/* Proximity circle around start */}
        <Source
          id="start-circle"
          type="geojson"
          data={circlePolygon(startPos, START_RADIUS_METERS)}
        >
          <Layer
            id="start-circle-fill"
            type="fill"
            paint={styles.startCircleFillPaint(routeColor)}
          />

          <Layer
            id="start-circle-outline"
            type="line"
            paint={styles.startCircleOutlinePaint(routeColor)}
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
          longitude={startPos[1]}
          latitude={startPos[0]}
          anchor="center"
        >
          <div style={styles.startMarker(routeColor)} />
        </Marker>
      </Map>

      {/* Top bar */}
      <div style={styles.topBar}>
        <NavCircleButton onClick={() => navigate(-1)} />

        <div style={styles.gpsStatus}>
          <div style={styles.gpsStatusDot(userPos)} />

          <span style={styles.gpsStatusText}>
            {gpsError ? 'GPS unavailable' : userPos ? 'Live GPS' : 'Locating…'}
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
            <div style={styles.successTitle}>
              You're at the starting point!
            </div>

            <div style={styles.successSubtitle}>
              {route ? `${route.title || 'Selected route'} — ready to begin` : 'Westlake Tower — ready to begin'}
            </div>
          </div>
        )}

        {atStart ? (
          <div style={styles.autoStartHint}>
            Starting walk in {autoStartCountdown ?? 5} second
            {(autoStartCountdown ?? 5) === 1 ? '' : 's'}…
          </div>
        ) : (
          <>
            <div style={styles.walkChoiceLabel}>
              Please head to the starting point to begin.
            </div>

            {userPos && (
              <div style={styles.routeStatusText(directionsError)}>
                {directionsLoading && 'Finding walking route…'}
                {!directionsLoading && !directionsError && routeDurationText && routeDistanceText && (
                  `${routeDurationText} • ${routeDistanceText}`
                )}
                {!directionsLoading && directionsError && 'Showing direct line to the starting point.'}
              </div>
            )}

            <button
              onClick={() => navigate('/map/walking/live', {
                state: route ? { route } : undefined,
              })}
              style={styles.walkButton}
            >
              Start Walk
            </button>
          </>
        )}
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

  directionsRoutePaint: {
    'line-color': DEFAULT_ROUTE_COLOR,
    'line-width': 5,
    'line-opacity': 0.9,
  },

  fallbackNavLinePaint: {
    'line-color': DEFAULT_ROUTE_COLOR,
    'line-width': 2,
    'line-opacity': 0.55,
    'line-dasharray': [2.5, 2],
  },

  startCircleFillPaint: color => ({
    'fill-color': color,
    'fill-opacity': 0.14,
  }),

  startCircleOutlinePaint: color => ({
    'line-color': color,
    'line-width': 1.5,
    'line-opacity': 0.8,
    'line-dasharray': [2, 2],
  }),

  userMarker: {
    position: 'relative',
    width: 24,
    height: 24,
  },

  userMarkerPing: {
    position: 'absolute',
    inset: 0,
    background: 'rgba(197, 62, 44, 0.22)',
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
    background: '#C53E2C',
    border: '3px solid white',
    borderRadius: '50%',
    boxShadow: '0 2px 10px rgba(197, 62, 44, 0.55)',
  },

  startMarker: color => ({
    width: 18,
    height: 18,
    background: color,
    border: '3px solid white',
    borderRadius: '50%',
    boxShadow: `0 2px 10px ${color}99`,
  }),

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
    background: userPos ? '#22c55e' : '#EED05D',
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

  walkChoiceLabel: {
    marginBottom: 10,
    color: '#6b7280',
    fontSize: 13,
    fontWeight: 600,
    textAlign: 'center',
  },

  autoStartHint: {
    margin: '4px 0 18px',
    color: '#6b7280',
    fontSize: 13,
    fontWeight: 600,
    textAlign: 'center',
  },

  routeStatusText: hasError => ({
    minHeight: 18,
    margin: '-2px 0 14px',
    color: hasError ? '#9ca3af' : '#505F76',
    fontSize: 12,
    fontWeight: 600,
    textAlign: 'center',
  }),

  walkButton: {
    width: '100%',
    height: 52,
    background: '#C53E2C',
    color: '#fff',
    borderRadius: 9999,
    fontSize: 16,
    fontWeight: 700,
    cursor: 'pointer',
    border: 'none',
    boxShadow: '0 8px 24px rgba(197, 62, 44, 0.28)',
  },
}
