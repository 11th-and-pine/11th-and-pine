import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import Map, { Layer, Marker, Source } from 'react-map-gl'
import 'mapbox-gl/dist/mapbox-gl.css'
import { getPerspectiveById, getRouteById } from '../../services/dataService'
import NavCircleButton from '../../components/NavCircleButton'
import { CHOP_ROUTES_BY_PERSPECTIVE_ID } from '../../data/chopRoutes'
import jordanProfile from '../../assets/images/perspective-westlake-jordan-avatar.jpg'

const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_TOKEN
const MAP_STYLE = 'mapbox://styles/mapbox/light-v11'
const PREVIEW_INTERVAL_MS = 700
const WALKING_DIRECTIONS_PROFILE = 'mapbox/walking'

const FALLBACK_ROUTE_PATH = [
  [47.61246495850918, -122.33745074674492],
  [47.6117017475211, -122.33664367843423],
  [47.61217739456354, -122.33554583325099],
  [47.61311511374411, -122.33330990771319],
  [47.61357524872394, -122.33220631461666],
  [47.613380, -122.331806],
  [47.61528546767674, -122.32803424183338],
  [47.61532231916068, -122.32569616528335],
  [47.61534637433494, -122.31998484534672],
]

const toLngLat = ([lat, lng]) => [lng, lat]
const toLatLng = ([lng, lat]) => [lat, lng]

function makeLine(points) {
  const coordinates = points.length > 1
    ? points.map(toLngLat)
    : [toLngLat(points[0]), toLngLat(points[0])]

  return {
    type: 'Feature',
    geometry: {
      type: 'LineString',
      coordinates,
    },
  }
}

function getBounds(points) {
  const lngs = points.map(point => point[1])
  const lats = points.map(point => point[0])

  return [
    [Math.min(...lngs), Math.min(...lats)],
    [Math.max(...lngs), Math.max(...lats)],
  ]
}

function RouteMiniSimulation({ route, chopRoute }) {
  const mapRef = useRef(null)
  const timerRef = useRef(null)
  const [step, setStep] = useState(0)
  const [playing, setPlaying] = useState(false)
  const [directionsResult, setDirectionsResult] = useState({
    routeKey: null,
    path: null,
  })

  // Capitol Hill perspectives get their own colored branch route; everyone
  // else falls back to the main Westlake → Cal Anderson route.
  const waypointPath = useMemo(() => (
    chopRoute?.path?.length > 1
      ? chopRoute.path
      : route?.id === 'main'
      ? FALLBACK_ROUTE_PATH
      : route?.stops?.length > 1
      ? route.stops.map(stop => stop.position)
      : FALLBACK_ROUTE_PATH
  ), [chopRoute, route])
  const routeKey = useMemo(
    () => waypointPath.map(point => point.join(',')).join(';'),
    [waypointPath],
  )
  const path =
    directionsResult.routeKey === routeKey && directionsResult.path?.length > 1
      ? directionsResult.path
      : waypointPath
  const fullRouteColor = chopRoute?.color || '#EED05D'
  const previewPoint = path[Math.min(step, path.length - 1)]
  const traveledPath = path.slice(0, Math.max(step + 1, 1))
  const complete = step >= path.length - 1

  useEffect(() => {
    if (!MAPBOX_TOKEN || waypointPath.length < 2) {
      return
    }

    const controller = new AbortController()
    const coordinates = waypointPath.map(point => toLngLat(point).join(',')).join(';')
    const params = new URLSearchParams({
      access_token: MAPBOX_TOKEN,
      geometries: 'geojson',
      overview: 'full',
      steps: 'false',
    })

    Promise.resolve()
      .then(() => fetch(
        `https://api.mapbox.com/directions/v5/${WALKING_DIRECTIONS_PROFILE}/${coordinates}?${params.toString()}`,
        { signal: controller.signal },
      ))
      .then(response => {
        if (!response.ok) {
          throw new Error('Preview route request failed')
        }

        return response.json()
      })
      .then(data => {
        const coordinatesLngLat = data.routes?.[0]?.geometry?.coordinates

        if (!coordinatesLngLat?.length) {
          throw new Error('Preview route missing geometry')
        }

        setDirectionsResult({
          routeKey,
          path: coordinatesLngLat.map(toLatLng),
        })
      })
      .catch(error => {
        if (error.name !== 'AbortError') {
          setDirectionsResult({
            routeKey,
            path: null,
          })
        }
      })

    return () => {
      controller.abort()
    }
  }, [routeKey, waypointPath])

  useEffect(() => {
    if (!mapRef.current || path.length < 2) {
      return
    }

    mapRef.current.fitBounds(getBounds(path), {
      padding: 42,
      duration: 0,
    })
  }, [path])

  useEffect(() => {
    return () => {
      clearInterval(timerRef.current)
    }
  }, [])

  useEffect(() => {
    clearInterval(timerRef.current)

    if (!playing) {
      return
    }

    timerRef.current = setInterval(() => {
      setStep(currentStep => {
        const nextStep = currentStep + 1

        if (nextStep >= path.length - 1) {
          setPlaying(false)
          return path.length - 1
        }

        return nextStep
      })
    }, PREVIEW_INTERVAL_MS)

    return () => {
      clearInterval(timerRef.current)
    }
  }, [path.length, playing])

  function handleMapLoad() {
    mapRef.current?.fitBounds(getBounds(path), {
      padding: 42,
      duration: 0,
    })
  }

  function togglePreview() {
    if (complete) {
      setStep(0)
      setPlaying(true)
      return
    }

    setPlaying(value => !value)
  }

  return (
    <div style={styles.previewMapWrap}>
      <Map
        ref={mapRef}
        mapboxAccessToken={MAPBOX_TOKEN}
        initialViewState={{
          longitude: toLngLat(path[0])[0],
          latitude: toLngLat(path[0])[1],
          zoom: 14,
        }}
        mapStyle={MAP_STYLE}
        style={styles.previewMap}
        attributionControl={false}
        interactive={false}
        onLoad={handleMapLoad}
      >
        <Source id="preview-full-route" type="geojson" data={makeLine(path)}>
          <Layer
            id="preview-full-route-layer"
            type="line"
            layout={styles.previewLineLayout}
            paint={{
              'line-color': fullRouteColor,
              'line-width': 5,
              'line-opacity': 0.35,
            }}
          />
        </Source>

        <Source id="preview-traveled-route" type="geojson" data={makeLine(traveledPath)}>
          <Layer
            id="preview-traveled-route-layer"
            type="line"
            layout={styles.previewLineLayout}
            paint={styles.previewTraveledRoutePaint}
          />
        </Source>

        <Marker
          longitude={path[0][1]}
          latitude={path[0][0]}
          anchor="center"
        >
          <div style={styles.previewStartMarker} />
        </Marker>

        <Marker
          longitude={path[path.length - 1][1]}
          latitude={path[path.length - 1][0]}
          anchor="center"
        >
          <div style={styles.previewEndMarker} />
        </Marker>

        <Marker
          longitude={previewPoint[1]}
          latitude={previewPoint[0]}
          anchor="center"
        >
          <div style={styles.previewUserMarker} />
        </Marker>
      </Map>

      <button
        type="button"
        onClick={togglePreview}
        style={styles.previewPlayButton}
      >
        {complete ? 'Replay Preview' : playing ? 'Pause Preview' : 'Preview Route'}
      </button>
    </div>
  )
}

function PerspectiveDetail() {
  const navigate = useNavigate()
  const { id } = useParams()
  const perspective = getPerspectiveById(Number(id))
  const route = perspective ? getRouteById(perspective.routeId || 'main') : null
  // Capitol Hill perspectives use the matching colored branch route for the
  // Route Info preview; Westlake (id "1") falls back to the main route.
  const chopRoute = perspective ? CHOP_ROUTES_BY_PERSPECTIVE_ID[perspective.id] : null

  if (!perspective) {
    return (
      <div style={styles.page}>
        <div style={styles.notFoundWrap}>
          <NavCircleButton
            onClick={() => navigate('/perspectives')}
            style={styles.backCircleFallback}
          />
          <h1 style={styles.notFoundTitle}>Perspective not found</h1>
        </div>
      </div>
    )
  }

  const avatarImage =
    perspective.name === 'Westlake' ? jordanProfile : perspective.imageUrl

  return (
    <div style={styles.page}>
      <div style={styles.scrollArea}>
        <section style={styles.hero}>
          <img
            src={perspective.imageUrl}
            alt={perspective.name}
            style={styles.heroImage}
          />
          <div style={styles.heroOverlay} />

          <NavCircleButton
            onClick={() => navigate('/perspectives')}
            style={styles.backCircle}
          />

          <div style={styles.heroTextBlock}>
            <h1 style={styles.heroTitle}>
              <span style={styles.redText}>PROTEST</span>
              <span style={styles.whiteText}> and</span>
              <br />
              <span style={styles.redText}>CONFLICT</span>
            </h1>

            <p style={styles.locationText}>IN Capitol Hill</p>
            <p style={styles.heroDescription}>{perspective.fullBio}</p>
          </div>
        </section>

        <section style={styles.content}>
          <h2 style={styles.sectionTitle}>Perspective</h2>

          <div style={styles.perspectiveRow}>
            <img
              src={avatarImage}
              alt={perspective.name}
              style={styles.avatar}
            />

            <div style={styles.personText}>
              <h3 style={styles.personName}>
                {perspective.name === 'Westlake'
                  ? 'Jordan XXX'
                  : `${perspective.name} XXX`}
              </h3>
              <p style={styles.personRole}>
                {perspective.role || 'Community Volunteer'}
              </p>
            </div>

          </div>

          <p style={styles.bioText}>
            {perspective.name === 'Westlake'
              ? 'Jordan supported community efforts during the CHOP protests, helping with food distribution and mutual aid in Capitol Hill. Her perspective highlights care, cooperation, and community action during the summer of 2020.'
              : perspective.shortBio}
          </p>

          <h2 style={styles.routeTitle}>Route Info</h2>

          <div style={styles.mapCard}>
            <RouteMiniSimulation
              key={perspective.id}
              route={route}
              chopRoute={chopRoute}
            />
          </div>
        </section>
      </div>

    </div>
  )
}

const styles = {
  page: {
    position: 'relative',
    height: '100%',
    backgroundColor: '#000',
    overflow: 'hidden',
    color: '#fff',
  },
  scrollArea: {
    height: '100%',
    overflowY: 'auto',
    WebkitOverflowScrolling: 'touch',
    backgroundColor: '#000',
  },
  hero: {
    position: 'relative',
    minHeight: '620px',
    width: '100%',
    overflow: 'hidden',
  },
  heroImage: {
    position: 'absolute',
    inset: 0,
    width: '100%',
    height: '100%',
    objectFit: 'cover',
  },
  heroOverlay: {
    position: 'absolute',
    inset: 0,
    background:
      'linear-gradient(to bottom, rgba(0,0,0,0.05) 0%, rgba(0,0,0,0.35) 45%, rgba(0,0,0,0.96) 100%)',
  },
  backCircle: {
    position: 'absolute',
    top: '24px',
    left: '24px',
    zIndex: 10,
  },
  heroTextBlock: {
    position: 'absolute',
    left: '30px',
    right: '28px',
    bottom: '28px',
    zIndex: 2,
    textAlign: 'right',
  },
  heroTitle: {
    margin: 0,
    fontSize: '44px',
    lineHeight: 1.05,
    fontWeight: 900,
    letterSpacing: '-1px',
  },
  redText: {
    color: '#d64532',
  },
  whiteText: {
    color: '#fff',
    fontWeight: 700,
  },
  locationText: {
    margin: '8px 0 22px',
    fontSize: '15px',
    fontStyle: 'italic',
    color: 'rgba(255,255,255,0.75)',
  },
  heroDescription: {
    margin: 0,
    textAlign: 'right',
    fontSize: '15px',
    lineHeight: 1.2,
    fontWeight: 700,
    color: '#fff',
  },
  content: {
    padding: '28px 30px 48px',
    backgroundColor: '#000',
  },
  sectionTitle: {
    margin: '0 0 26px',
    fontSize: '30px',
    fontWeight: 900,
    color: '#fff',
  },
  perspectiveRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '22px',
    marginBottom: '28px',
  },
  avatar: {
    width: '120px',
    height: '120px',
    borderRadius: '50%',
    objectFit: 'cover',
    objectPosition: '55% 20%',
    flexShrink: 0,
  },
  personText: {
    flex: 1,
    minWidth: 0,
  },
  personName: {
    margin: '0 0 18px',
    fontSize: '22px',
    fontWeight: 800,
    color: '#fff',
  },
  personRole: {
    margin: 0,
    fontSize: '12px',
    fontWeight: 600,
    color: '#fff',
  },
  bioText: {
    margin: '0 0 58px',
    fontSize: '16px',
    lineHeight: 1.25,
    color: '#fff',
  },
  routeTitle: {
    margin: '0 0 28px',
    fontSize: '30px',
    fontWeight: 900,
    color: '#fff',
  },
  mapCard: {
    width: '100%',
    height: '380px',
    overflow: 'hidden',
    backgroundColor: '#000',
  },
  previewMapWrap: {
    position: 'relative',
    width: '100%',
    height: '100%',
    overflow: 'hidden',
    background: '#111',
  },
  previewMap: {
    width: '100%',
    height: '100%',
  },
  previewLineLayout: {
    'line-cap': 'round',
    'line-join': 'round',
  },
  previewFullRoutePaint: {
    'line-color': '#EED05D',
    'line-width': 5,
    'line-opacity': 0.35,
  },
  previewTraveledRoutePaint: {
    'line-color': '#C53E2C',
    'line-width': 5,
    'line-opacity': 0.95,
  },
  previewStartMarker: {
    width: 14,
    height: 14,
    borderRadius: '50%',
    background: '#0C79FE',
    border: '3px solid #fff',
    boxShadow: '0 2px 12px rgba(12, 121, 254, 0.45)',
  },
  previewEndMarker: {
    width: 14,
    height: 14,
    borderRadius: '50%',
    background: '#C53E2C',
    border: '3px solid #fff',
    boxShadow: '0 2px 12px rgba(197, 62, 44, 0.55)',
  },
  previewUserMarker: {
    width: 16,
    height: 16,
    borderRadius: '50%',
    background: '#0C79FE',
    border: '3px solid #fff',
    boxShadow: '0 0 0 8px rgba(12, 121, 254, 0.18)',
  },
  previewPlayButton: {
    position: 'absolute',
    left: '50%',
    bottom: 18,
    transform: 'translateX(-50%)',
    zIndex: 10,
    minWidth: 138,
    height: 42,
    padding: '0 18px',
    border: 0,
    borderRadius: 999,
    background: '#C53E2C',
    color: '#fff',
    fontSize: 14,
    fontWeight: 800,
    boxShadow: '0 8px 24px rgba(0, 0, 0, 0.22)',
    cursor: 'pointer',
  },
  notFoundWrap: {
    padding: '24px',
  },
  backCircleFallback: {
    marginBottom: '20px',
  },
  notFoundTitle: {
    fontSize: '28px',
    margin: 0,
  },
}

export default PerspectiveDetail
