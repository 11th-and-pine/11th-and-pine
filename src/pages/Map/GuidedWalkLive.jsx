import { useState, useEffect, useRef } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import Map, { Source, Layer, Marker } from 'react-map-gl'
import 'mapbox-gl/dist/mapbox-gl.css'
import PinIcon from '../../components/PinIcon'
import NavCircleButton from '../../components/NavCircleButton'

const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_TOKEN
const MAP_STYLE = 'mapbox://styles/mapbox/light-v11'

const DEFAULT_ROUTE_COLOR = '#5272FF'
const WRONG_ROUTE_COLOR = '#ef4444'

// GPS thresholds (feet). Tune after first field test.
//   POI_TRIGGER_FT — within this many feet of a POI, its audio starts.
//                    City GPS accuracy is ~16–50 ft, so don't go too low.
//   OFF_ROUTE_FT   — farther than this from the route's nearest segment
//                    triggers the off-route alert.
//   ARRIVED_FT     — within this distance of the last route point ⇒ done.
const POI_TRIGGER_FT = 50
const OFF_ROUTE_FT = 80
const ARRIVED_FT = 50

const INITIAL_ZOOM = 16
const FOLLOW_ZOOM = 17.5

const WESTLAKE_ROUTE = [
  [47.61208726167953, -122.33701558200671], // Westlake Center
  [47.6117017475211, -122.33664367843423],
  [47.61217739456354, -122.33554583325099],
  [47.61311511374411, -122.33330990771319],
  [47.61357524872394, -122.33220631461666],
  [47.61528546767674, -122.32803424183338],
  [47.61532231916068, -122.32569616528335],
  [47.61534637433494, -122.31998484534672], // Cal Anderson Park
]

const POIS = [
  {
    id: 1,
    position: [47.6120, -122.3358],
    audioUrl: '/audio/westlake-plaza.mp3',
    name: 'Westlake Plaza',
    title: 'Where the March Began',
    desc: 'On June 1st, 2020, thousands gathered at Westlake Plaza before marching east up Pine Street. Speakers read names of those lost to police violence as the crowd swelled past the monorail and spilled into the streets.'
  },
  {
    id: 2,
    position: [47.6136, -122.3318],
    audioUrl: '/audio/pike-pine.mp3',
    name: 'Pike/Pine Corridor',
    title: 'From Auto Row to Activism',
    desc: 'Once lined with car showrooms in the 1920s, Pike/Pine became the heart of Seattle\'s queer community by the 1990s. The corridor\'s brick warehouses and late-night venues made it a natural gathering point during the 2020 uprising.'
  },
  {
    id: 3,
    position: [47.6153, -122.3240],
    audioUrl: '/audio/cal-anderson.mp3',
    name: 'Cal Anderson Park',
    title: 'The Autonomous Zone',
    desc: 'For nearly a month in June 2020, several blocks around Cal Anderson Park became the Capitol Hill Organized Protest — a self-declared police-free zone with community gardens, open mics, and a No Cop Co-op. Named for Washington\'s first openly gay legislator, the park remains a site of memory and mobilization.'
  },
]

const toLngLat = ([lat, lng]) => [lng, lat]

function makeInitialViewState(route) {
  return {
    longitude: toLngLat(route[0])[0],
    latitude: toLngLat(route[0])[1],
    zoom: INITIAL_ZOOM,
  }
}

function formatTime(seconds) {
  if (!seconds || isNaN(seconds) || !isFinite(seconds)) return '00:00'
  const minutes = Math.floor(seconds / 60)
  const remainingSeconds = Math.floor(seconds % 60)

  return `${String(minutes).padStart(2, '0')}:${String(remainingSeconds).padStart(2, '0')}`
}

function makeLine(points) {
  if (points.length < 2) {
    return {
      type: 'FeatureCollection',
      features: [],
    }
  }

  return {
    type: 'Feature',
    geometry: {
      type: 'LineString',
      coordinates: points.map(toLngLat),
    },
  }
}

function calcBearing([lat1, lng1], [lat2, lng2]) {
  const toRad = degree => degree * Math.PI / 180

  const y = Math.sin(toRad(lng2 - lng1)) * Math.cos(toRad(lat2))
  const x =
    Math.cos(toRad(lat1)) * Math.sin(toRad(lat2)) -
    Math.sin(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.cos(toRad(lng2 - lng1))

  return (Math.atan2(y, x) * 180 / Math.PI + 360) % 360
}

function distanceFeet([lat1, lng1], [lat2, lng2]) {
  const earthRadiusFeet = 20902231
  const toRad = degree => degree * Math.PI / 180

  const dLat = toRad(lat2 - lat1)
  const dLng = toRad(lng2 - lng1)

  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) *
      Math.cos(toRad(lat2)) *
      Math.sin(dLng / 2) ** 2

  return earthRadiusFeet * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}

// Min distance from point to any vertex on the route. Good enough for
// a coarse off-route check; for finer accuracy, do point-to-segment.
function distanceToRoute(point, route) {
  let minDist = Infinity
  for (let i = 0; i < route.length; i++) {
    minDist = Math.min(minDist, distanceFeet(point, route[i]))
  }
  return minDist
}

// Find the index of the route vertex closest to `point`. Used to draw
// the "official" traveled portion of the planned route, alongside the
// raw GPS trail.
function nearestRouteIndex(point, route) {
  let bestIdx = 0
  let bestDist = Infinity
  for (let i = 0; i < route.length; i++) {
    const d = distanceFeet(point, route[i])
    if (d < bestDist) {
      bestDist = d
      bestIdx = i
    }
  }
  return bestIdx
}

// Error sound using Web Audio API
function playErrorSound() {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)()
    const playTone = (freq, start, duration, type = 'sine') => {
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      osc.connect(gain)
      gain.connect(ctx.destination)
      osc.type = type
      osc.frequency.setValueAtTime(freq, ctx.currentTime + start)
      gain.gain.setValueAtTime(0.4, ctx.currentTime + start)
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + start + duration)
      osc.start(ctx.currentTime + start)
      osc.stop(ctx.currentTime + start + duration)
    }
    playTone(880, 0, 0.18, 'square')
    playTone(660, 0.22, 0.18, 'square')
    playTone(440, 0.44, 0.28, 'square')
  } catch {
    // AudioContext not available
  }
}

export default function GuidedWalkLive() {
  const navigate = useNavigate()
  const location = useLocation()
  const mapRef = useRef()
  const audioRef = useRef(null)
  const playedPOIs = useRef(new Set())
  const watchIdRef = useRef(null)

  const branchRoute = location.state ? location.state.route : null
  const route = branchRoute ? branchRoute.path : WESTLAKE_ROUTE
  const routeColor = branchRoute ? branchRoute.color : DEFAULT_ROUTE_COLOR

  // Real GPS state
  const [userLocation, setUserLocation] = useState(null)   // [lat, lng]
  const [userHeading, setUserHeading] = useState(null)     // degrees, may be null
  const [gpsTrail, setGpsTrail] = useState([])             // raw breadcrumbs
  // Lazy initializer — checks browser capability at mount without needing
  // to call setLocationError from inside an effect body.
  const [locationError, setLocationError] = useState(() =>
    typeof navigator !== 'undefined' && navigator.geolocation
      ? null
      : 'This browser does not support geolocation.'
  )

  const [done, setDone] = useState(false)
  const [openPOI, setOpenPOI] = useState(null)
  const [offRouteAlert, setOffRouteAlert] = useState(false)
  const [alertDismissed, setAlertDismissed] = useState(false)

  // Refs that mirror state so the watchPosition callback (a long-lived
  // subscription set up once on mount) can read fresh values without
  // re-creating the subscription every time the state changes.
  const doneRef = useRef(false)
  const alertDismissedRef = useRef(false)
  const offRouteAlertRef = useRef(false)
  useEffect(() => { doneRef.current = done }, [done])
  useEffect(() => { alertDismissedRef.current = alertDismissed }, [alertDismissed])
  useEffect(() => { offRouteAlertRef.current = offRouteAlert }, [offRouteAlert])

  // Derived: is the user currently off-route? Computed every render, no state.
  const offRoute = userLocation && !done
    ? distanceToRoute(userLocation, route) > OFF_ROUTE_FT
    : false

  // Audio player state — identical to GuidedWalk.jsx
  const [audioPlaying, setAudioPlaying] = useState(false)
  const [audioProgress, setAudioProgress] = useState(0)
  const [audioDuration, setAudioDuration] = useState(0)
  const [audioCurrentTime, setAudioCurrentTime] = useState(0)
  const [currentAudioPOI, setCurrentAudioPOI] = useState(null)

  const currentPoint = userLocation || route[0]

  // ──────────────────────────────────────────────────────────
  // Geolocation: start watching on mount, stop on unmount.
  // All position-driven side effects (POI trigger, off-route alert,
  // arrival) live inside the watchPosition callback so setState happens
  // in a subscription callback, not in an effect body.
  // ──────────────────────────────────────────────────────────
  useEffect(() => {
    if (!navigator.geolocation) return  // locationError set via initializer

    watchIdRef.current = navigator.geolocation.watchPosition(
      pos => {
        const next = [pos.coords.latitude, pos.coords.longitude]
        setUserLocation(next)
        if (typeof pos.coords.heading === 'number' && !isNaN(pos.coords.heading)) {
          setUserHeading(pos.coords.heading)
        }
        setLocationError(null)

        // Append to trail, but skip jitter (< 5 ft from last point)
        setGpsTrail(prev => {
          if (prev.length === 0) return [next]
          const last = prev[prev.length - 1]
          if (distanceFeet(last, next) < 5) return prev
          return [...prev, next]
        })

        // ── POI audio trigger by proximity ──
        const poi = POIS.find(p =>
          !playedPOIs.current.has(p.id) &&
          distanceFeet(next, p.position) < POI_TRIGGER_FT
        )
        if (poi) {
          playedPOIs.current.add(poi.id)
          setCurrentAudioPOI(poi)
          const a = audioRef.current
          if (a) {
            a.src = poi.audioUrl
            a.currentTime = 0
            a.play()
              .then(() => setAudioPlaying(true))
              .catch(() => setAudioPlaying(false))
          }
        }

        // ── Arrival detection ──
        if (!doneRef.current) {
          const endpoint = route[route.length - 1]
          if (distanceFeet(next, endpoint) < ARRIVED_FT) {
            setDone(true)
          }
        }

        // ── Off-route alert ──
        if (!doneRef.current) {
          const isOff = distanceToRoute(next, route) > OFF_ROUTE_FT
          if (isOff && !alertDismissedRef.current && !offRouteAlertRef.current) {
            setOffRouteAlert(true)
            if (navigator.vibrate) navigator.vibrate([300, 150, 300, 150, 300])
            playErrorSound()
          }
          if (!isOff && alertDismissedRef.current) {
            setAlertDismissed(false)
          }
        }
      },
      err => {
        setLocationError(err.message || 'Could not get your location.')
      },
      {
        enableHighAccuracy: true,
        maximumAge: 0,
        timeout: 15000,
      }
    )

    return () => {
      if (watchIdRef.current != null) {
        navigator.geolocation.clearWatch(watchIdRef.current)
        watchIdRef.current = null
      }
    }
  }, [route])

  // Sync audioPlaying state with the actual <audio> element (for the ▶/⏸ button)
  useEffect(() => {
    const a = audioRef.current
    if (!a || !a.src) return
    if (audioPlaying) a.play().catch(() => setAudioPlaying(false))
    else a.pause()
  }, [audioPlaying])

  // ──────────────────────────────────────────────────────────
  // Camera follows the user
  // ──────────────────────────────────────────────────────────
  useEffect(() => {
    if (!mapRef.current || !userLocation) return

    // Use device heading if we have it, otherwise infer from last segment
    let bearing = userHeading
    if (bearing == null && gpsTrail.length >= 2) {
      bearing = calcBearing(
        gpsTrail[gpsTrail.length - 2],
        gpsTrail[gpsTrail.length - 1],
      )
    }

    mapRef.current.easeTo({
      center: toLngLat(userLocation),
      zoom: FOLLOW_ZOOM,
      pitch: 50,
      bearing: bearing ?? mapRef.current.getBearing?.() ?? 0,
      duration: 1200,
    })
  }, [userLocation, userHeading, gpsTrail])

  // Reset state when route changes (same pattern as GuidedWalk.jsx)
  const [prevRoute, setPrevRoute] = useState(route)
  if (prevRoute !== route) {
    setPrevRoute(route)
    setDone(false)
    setOffRouteAlert(false)
    setAlertDismissed(false)
    setGpsTrail([])
    setCurrentAudioPOI(null)
    setAudioPlaying(false)
    setAudioProgress(0)
    setAudioCurrentTime(0)
    setAudioDuration(0)
  }

  // Clear played-POI tracking and reset the <audio> element on route change.
  useEffect(() => {
    playedPOIs.current.clear()
    const a = audioRef.current
    if (a) {
      a.pause()
      a.removeAttribute('src')
      a.load()
    }
  }, [route])

  function dismissOffRouteAlert() {
    setOffRouteAlert(false)
    setAlertDismissed(true)
  }

  function closePOI() {
    setOpenPOI(null)
  }

  // For the on-map "traveled" line, prefer the actual GPS trail if we have
  // enough points; otherwise fall back to a slice of the planned route up
  // to the user's nearest vertex (looks cleaner before GPS warms up).
  const traveled = gpsTrail.length >= 2
    ? gpsTrail
    : userLocation
      ? route.slice(0, nearestRouteIndex(userLocation, route) + 1)
      : []

  return (
    <div style={styles.page}>
      <style>{animationStyles}</style>

      <Map
        ref={mapRef}
        mapboxAccessToken={MAPBOX_TOKEN}
        initialViewState={makeInitialViewState(route)}
        style={styles.map}
        mapStyle={MAP_STYLE}
        attributionControl={false}
      >
        {/* Full route — faint preview */}
        <Source id="full-route" type="geojson" data={makeLine(route)}>
          <Layer
            id="full-route-line"
            type="line"
            layout={styles.routeLineLayout}
            paint={styles.fullRoutePaint(routeColor)}
          />
        </Source>

        {/* Traveled path (real GPS trail) */}
        <Source id="traveled" type="geojson" data={makeLine(traveled)}>
          <Layer
            id="traveled-line"
            type="line"
            layout={styles.routeLineLayout}
            paint={styles.traveledRoutePaint(routeColor, offRoute)}
          />
        </Source>

        {/* Start marker */}
        <Marker
          longitude={toLngLat(route[0])[0]}
          latitude={toLngLat(route[0])[1]}
          anchor="center"
        >
          <div style={styles.routeMarker(routeColor)} />
        </Marker>

        {/* End marker */}
        <Marker
          longitude={toLngLat(route[route.length - 1])[0]}
          latitude={toLngLat(route[route.length - 1])[1]}
          anchor="center"
        >
          <div style={styles.routeMarker(routeColor)} />
        </Marker>

        {/* POI markers */}
        {POIS.map(poi => (
          <Marker
            key={poi.id}
            longitude={poi.position[1]}
            latitude={poi.position[0]}
            anchor="bottom"
          >
            <div onClick={() => setOpenPOI(poi)} style={styles.poiMarker}>
              <PinIcon size={24} />
            </div>
          </Marker>
        ))}

        {/* Walker dot — only render once we have a real GPS fix */}
        {!done && userLocation && (
          <Marker
            longitude={toLngLat(currentPoint)[0]}
            latitude={toLngLat(currentPoint)[1]}
            anchor="center"
          >
            <div style={styles.walkerWrapper}>
              <div style={styles.walkerPulse(routeColor, offRoute)} />
              <div style={styles.walkerDot(routeColor, offRoute)} />
            </div>
          </Marker>
        )}
      </Map>

      {/* Top bar */}
      <div style={styles.topBar}>
        <div style={styles.topBarContent}>
          <NavCircleButton onClick={() => navigate(-1)} />

          <NavCircleButton
            direction="next"
            onClick={() => navigate('/map/explore')}
          />
        </div>
      </div>

      {/* GPS status pill (top center) — only shown until first fix */}
      {!userLocation && !locationError && (
        <div style={styles.gpsStatusPill}>
          Locating you…
        </div>
      )}

      {/* Permission / GPS error overlay */}
      {locationError && (
        <div style={styles.gpsErrorOverlay}>
          <div style={styles.gpsErrorCard}>
            <div style={styles.gpsErrorTitle}>Location unavailable</div>
            <div style={styles.gpsErrorBody}>
              {locationError}
              <br /><br />
              Make sure location is enabled for this site, then refresh.
            </div>
            <button
              onClick={() => window.location.reload()}
              style={styles.gpsErrorButton}
            >
              Try again
            </button>
          </div>
        </div>
      )}

      {/* Hidden HTML5 audio element — drives the player bar below */}
      <audio
        ref={audioRef}
        preload="auto"
        onLoadedMetadata={() => {
          if (audioRef.current) setAudioDuration(audioRef.current.duration)
        }}
        onTimeUpdate={() => {
          const a = audioRef.current
          if (!a || !a.duration) return
          setAudioCurrentTime(a.currentTime)
          setAudioProgress((a.currentTime / a.duration) * 100)
        }}
        onPlay={() => setAudioPlaying(true)}
        onPause={() => setAudioPlaying(false)}
        onEnded={() => {
          setAudioPlaying(false)
          setAudioProgress(100)
        }}
      />

      {/* Audio player bar */}
      {!done && (
        <div style={styles.audioBar}>
          <div style={styles.audioContent}>
            <button
              onClick={() => {
                const a = audioRef.current
                if (!a || !a.src) return
                if (a.paused) a.play().catch(() => {})
                else a.pause()
              }}
              style={styles.audioPlayButton}
            >
              {audioPlaying ? '⏸' : '▶'}
            </button>

            <div style={styles.audioInfo}>
              <div style={styles.audioTitle}>
                {currentAudioPOI ? currentAudioPOI.title : 'Title'}
              </div>

              <div style={styles.audioRouteTitle(routeColor)}>
                {currentAudioPOI
                  ? currentAudioPOI.name
                  : (branchRoute ? branchRoute.title : 'Westlake Route')}
              </div>

              <div style={styles.audioProgressTrack}>
                <div style={styles.audioProgressFill(audioProgress)} />
              </div>

              <div style={styles.audioTimeRow}>
                <span style={styles.audioTime}>
                  {formatTime(audioCurrentTime)}
                </span>

                <span style={styles.audioTime}>
                  {formatTime(audioDuration)}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Off-route alert */}
      {offRouteAlert && (
        <div style={styles.alertOverlay}>
          <div style={styles.alertBackdrop} />

          <div style={styles.alertCard}>
            <div style={styles.alertIconCircle}>
              <svg
                width="32"
                height="32"
                viewBox="0 0 32 32"
                fill="none"
                style={styles.alertIcon}
              >
                <path
                  d="M10 20 C10 14 16 10 22 10 L22 6 L28 12 L22 18 L22 14 C18 14 14 17 14 22"
                  stroke="#dc2626"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  fill="none"
                />
              </svg>
            </div>

            <div style={styles.alertTitle}>
              Off Route Alert
            </div>

            <div style={styles.alertSubtitle}>
              Please return to the original route.
            </div>

            <button onClick={dismissOffRouteAlert} style={styles.alertButton}>
              Got it
            </button>
          </div>
        </div>
      )}

      {/* POI detail card */}
      {openPOI && (
        <div onClick={closePOI} style={styles.poiOverlay}>
          <div
            onClick={event => event.stopPropagation()}
            style={styles.poiCard}
          >
            <div style={styles.poiCardTexture} />

            <div style={styles.poiCardIcon}>
              <PinIcon size={72} />
            </div>

            <button onClick={closePOI} style={styles.poiCloseButton}>
              ✕
            </button>

            <div style={styles.poiCardContent}>
              <div style={styles.poiLocationPill}>
                <PinIcon size={14} shadow={false} />

                <span style={styles.poiLocationText}>
                  {openPOI.name}
                </span>
              </div>

              <h2 style={styles.poiTitle}>
                {openPOI.title}
              </h2>

              <p style={styles.poiDescription}>
                {openPOI.desc}
              </p>

              <div style={styles.poiButtonRow}>
                <button style={styles.poiTagButton}>Firsthand</button>
                <button style={styles.poiTagButton}>Context</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Main route complete */}
      {done && !branchRoute && (
        <div style={styles.mainCompleteSheet}>
          <div style={styles.sheetHandle} />

          <div style={styles.mainCompleteTitle}>
            Westlake route complete!
          </div>

          <div style={styles.mainCompleteSubtitle}>
            Now choose a perspective to explore.
          </div>

          <button
            onClick={() => navigate('/map/explore')}
            style={styles.mainCompleteButton}
          >
            Choose a CHOP Route →
          </button>
        </div>
      )}

      {/* Branch route complete */}
      {done && branchRoute && (
        <div style={styles.branchCompleteOverlay}>
          <div style={styles.arrivedBar}>
            Arrived
          </div>

          <div style={styles.branchCompleteContent}>
            <div style={styles.completePill}>
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                <circle cx="8" cy="8" r="8" fill="#0049C5" />
                <path
                  d="M4.5 8.2 L7 10.7 L11.5 5.8"
                  stroke="white"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  fill="none"
                />
              </svg>

              <span style={styles.completePillText}>
                JOURNEY COMPLETE
              </span>
            </div>

            <div style={styles.branchCompleteTitle}>
              You've completed this perspective
            </div>

            <div style={styles.branchCompleteButtonGroup}>
              <button
                onClick={() => navigate('/map/explore')}
                style={styles.newRouteButton}
              >
                New Route

                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                  <path
                    d="M21 3 L3 10.5 L10.5 13.5 L13.5 21 L21 3 Z"
                    stroke="white"
                    strokeWidth="1.8"
                    strokeLinejoin="round"
                    fill="none"
                  />
                </svg>
              </button>

              <button
                onClick={() => navigate(`/perspectives/${branchRoute.perspectiveId || '1'}`)}
                style={styles.archiveButton}
              >
                Digital Archive <span style={styles.archiveIcon}>📖</span>
              </button>

              <button
                onClick={() => navigate('/map/overview')}
                style={styles.homeButton}
              >
                Home
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

const animationStyles = `
  @keyframes walkerPulse {
    0% { transform: scale(1); opacity: 0.7; }
    70% { transform: scale(2.2); opacity: 0; }
    100% { transform: scale(1); opacity: 0; }
  }

  @keyframes alertSlideUp {
    from { transform: translateY(40px) scale(0.94); opacity: 0; }
    to { transform: translateY(0) scale(1); opacity: 1; }
  }

  @keyframes alertPulse {
    0%, 100% { box-shadow: 0 0 0 0 rgba(220, 38, 38, 0.4); }
    50% { box-shadow: 0 0 0 18px rgba(220, 38, 38, 0); }
  }

  @keyframes iconSpin {
    0% { transform: rotate(-15deg); }
    50% { transform: rotate(15deg); }
    100% { transform: rotate(-15deg); }
  }

  @keyframes wrongWalkerPulse {
    0% { transform: scale(1); opacity: 0.8; }
    70% { transform: scale(2.5); opacity: 0; }
    100% { transform: scale(1); opacity: 0; }
  }
`

const styles = {
  page: {
    height: '100%',
    width: '100%',
    position: 'relative',
    overflow: 'hidden',
  },

  map: {
    width: '100%',
    height: '100%',
  },

  routeLineLayout: {
    'line-cap': 'round',
    'line-join': 'round',
  },

  fullRoutePaint: color => ({
    'line-color': color,
    'line-width': 4,
    'line-opacity': 0.25,
  }),

  traveledRoutePaint: (color, offRoute) => ({
    'line-color': offRoute ? WRONG_ROUTE_COLOR : color,
    'line-width': 5,
    'line-opacity': 0.9,
  }),

  routeMarker: color => ({
    width: 10,
    height: 10,
    background: color,
    border: '2.5px solid white',
    borderRadius: '50%',
  }),

  poiMarker: {
    cursor: 'pointer',
    lineHeight: 0,
  },

  walkerWrapper: {
    position: 'relative',
    width: 26,
    height: 26,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },

  walkerPulse: (routeColor, offRoute) => ({
    position: 'absolute',
    inset: 0,
    background: offRoute ? 'rgba(239,68,68,0.3)' : `${routeColor}33`,
    borderRadius: '50%',
    animation: offRoute
      ? 'wrongWalkerPulse 1.2s ease-out infinite'
      : 'walkerPulse 1.8s ease-out infinite',
  }),

  walkerDot: (routeColor, offRoute) => ({
    width: 14,
    height: 14,
    background: offRoute ? WRONG_ROUTE_COLOR : routeColor,
    border: '3px solid white',
    borderRadius: '50%',
    boxShadow: offRoute
      ? '0 2px 10px rgba(239,68,68,0.7)'
      : `0 2px 10px ${routeColor}b3`,
  }),

  topBar: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 1000,
    padding: '52px 16px 16px',
  },

  topBarContent: {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
  },

  gpsStatusPill: {
    position: 'absolute',
    top: 56,
    left: '50%',
    transform: 'translateX(-50%)',
    zIndex: 1100,
    background: 'rgba(0,0,0,0.7)',
    color: 'white',
    fontSize: 12,
    fontWeight: 600,
    padding: '6px 14px',
    borderRadius: 999,
    backdropFilter: 'blur(8px)',
  },

  gpsErrorOverlay: {
    position: 'absolute',
    inset: 0,
    zIndex: 4000,
    background: 'rgba(0,0,0,0.55)',
    backdropFilter: 'blur(6px)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '0 32px',
  },

  gpsErrorCard: {
    width: 'min(340px, 86vw)',
    background: 'white',
    borderRadius: 24,
    padding: '32px 28px 24px',
    textAlign: 'center',
    boxShadow: '0 16px 48px rgba(0,0,0,0.25)',
  },

  gpsErrorTitle: {
    fontSize: 20,
    fontWeight: 800,
    color: '#0a0a0a',
    marginBottom: 12,
  },

  gpsErrorBody: {
    fontSize: 14,
    color: '#4b5563',
    lineHeight: 1.6,
    marginBottom: 24,
  },

  gpsErrorButton: {
    width: '100%',
    padding: '14px',
    background: '#1d4ed8',
    color: 'white',
    fontSize: 15,
    fontWeight: 700,
    borderRadius: 999,
    border: 'none',
    cursor: 'pointer',
  },

  audioBar: {
    position: 'absolute',
    bottom: 24,
    left: 16,
    right: 16,
    zIndex: 1000,
    background: 'white',
    borderRadius: 32,
    boxShadow: '0 12px 48px rgba(0, 73, 197, 0.1)',
    padding: '6px 16px',
  },

  audioContent: {
    display: 'flex',
    alignItems: 'center',
    gap: 16,
  },

  audioPlayButton: {
    width: 48,
    height: 48,
    borderRadius: '50%',
    background: '#1d4ed8',
    color: 'white',
    fontSize: 20,
    cursor: 'pointer',
    flexShrink: 0,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    border: 'none',
  },

  audioInfo: {
    flex: 1,
    minWidth: 0,
  },

  audioTitle: {
    fontSize: 16,
    fontWeight: 700,
    color: '#111827',
    marginBottom: 2,
  },

  audioRouteTitle: routeColor => ({
    fontSize: 12,
    color: routeColor,
    marginBottom: 10,
  }),

  audioProgressTrack: {
    height: 6,
    background: '#e5e7eb',
    borderRadius: 3,
    overflow: 'hidden',
  },

  audioProgressFill: progress => ({
    height: '100%',
    borderRadius: 3,
    background: '#1d4ed8',
    width: `${progress}%`,
    transition: 'width 0.15s linear',
  }),

  audioTimeRow: {
    display: 'flex',
    justifyContent: 'space-between',
    marginTop: 6,
  },

  audioTime: {
    fontSize: 12,
    color: '#9ca3af',
  },

  alertOverlay: {
    position: 'absolute',
    inset: 0,
    zIndex: 3000,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '0 32px',
    pointerEvents: 'none',
  },

  alertBackdrop: {
    position: 'absolute',
    inset: 0,
    background: 'rgba(0,0,0,0.18)',
    backdropFilter: 'blur(3px)',
    WebkitBackdropFilter: 'blur(3px)',
    pointerEvents: 'auto',
  },

  alertCard: {
    position: 'relative',
    zIndex: 1,
    width: 'min(340px, 86vw)',
    background: 'rgba(255,255,255,0.96)',
    backdropFilter: 'blur(20px)',
    WebkitBackdropFilter: 'blur(20px)',
    borderRadius: 28,
    padding: '36px 28px 28px',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    boxShadow: '0 20px 60px rgba(0,0,0,0.18), 0 0 0 1px rgba(255,255,255,0.5)',
    animation: 'alertSlideUp 0.35s cubic-bezier(0.34,1.56,0.64,1)',
    pointerEvents: 'auto',
  },

  alertIconCircle: {
    width: 72,
    height: 72,
    borderRadius: '50%',
    border: '2.5px solid #dc2626',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 22,
    animation: 'alertPulse 1.6s ease-in-out infinite',
    background: 'rgba(254,242,242,0.6)',
  },

  alertIcon: {
    animation: 'iconSpin 2s ease-in-out infinite',
  },

  alertTitle: {
    fontSize: 22,
    fontWeight: 800,
    color: '#0a0a0a',
    textAlign: 'center',
    marginBottom: 10,
    letterSpacing: '-0.3px',
  },

  alertSubtitle: {
    fontSize: 15,
    color: '#6b7280',
    textAlign: 'center',
    lineHeight: 1.5,
    marginBottom: 28,
  },

  alertButton: {
    width: '100%',
    padding: '14px',
    background: '#dc2626',
    color: 'white',
    fontSize: 16,
    fontWeight: 700,
    borderRadius: 999,
    border: 'none',
    cursor: 'pointer',
    letterSpacing: '-0.2px',
    boxShadow: '0 4px 16px rgba(220,38,38,0.35)',
  },

  poiOverlay: {
    position: 'absolute',
    inset: 0,
    zIndex: 2500,
    background: 'rgba(0,0,0,0.55)',
    backdropFilter: 'blur(6px)',
    WebkitBackdropFilter: 'blur(6px)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },

  poiCard: {
    width: 'min(346px, 88vw)',
    height: 'min(538px, 75vh)',
    borderRadius: 40,
    overflow: 'hidden',
    position: 'relative',
    flexShrink: 0,
    background: 'linear-gradient(160deg, #3d3d3d 0%, #1a1a1a 100%)',
  },

  poiCardTexture: {
    position: 'absolute',
    inset: 0,
    background: 'rgba(255,255,255,0.03)',
  },

  poiCardIcon: {
    position: 'absolute',
    top: 80,
    left: 0,
    right: 0,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    opacity: 0.35,
  },

  poiCloseButton: {
    position: 'absolute',
    top: 20,
    right: 20,
    zIndex: 10,
    width: 34,
    height: 34,
    borderRadius: '50%',
    background: 'rgba(0,0,0,0.4)',
    backdropFilter: 'blur(8px)',
    border: '1px solid rgba(255,255,255,0.2)',
    color: 'white',
    fontSize: 15,
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },

  poiCardContent: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    background: 'linear-gradient(to top, rgba(0,0,0,0.92) 0%, rgba(0,0,0,0.75) 55%, transparent 100%)',
    padding: '48px 28px 36px',
  },

  poiLocationPill: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 6,
    marginBottom: 12,
    background: 'rgba(255,255,255,0.12)',
    border: '1px solid rgba(255,255,255,0.25)',
    padding: '4px 12px',
    borderRadius: 99,
  },

  poiLocationText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 600,
  },

  poiTitle: {
    color: 'white',
    fontSize: 26,
    fontWeight: 700,
    margin: '0 0 10px',
    lineHeight: 1.2,
  },

  poiDescription: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 14,
    lineHeight: 1.65,
    margin: '0 0 26px',
  },

  poiButtonRow: {
    display: 'flex',
    gap: 10,
  },

  poiTagButton: {
    padding: '10px 22px',
    borderRadius: 99,
    background: 'rgba(255,255,255,0.14)',
    backdropFilter: 'blur(8px)',
    border: '1.5px solid rgba(255,255,255,0.38)',
    color: 'white',
    fontSize: 14,
    fontWeight: 500,
    cursor: 'pointer',
  },

  mainCompleteSheet: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    zIndex: 2000,
    background: 'white',
    borderRadius: '22px 22px 0 0',
    boxShadow: '0 -4px 24px rgba(0,0,0,0.10)',
    padding: '20px 24px 44px',
  },

  sheetHandle: {
    width: 40,
    height: 4,
    background: '#d1d5db',
    borderRadius: 2,
    margin: '0 auto 20px',
  },

  mainCompleteTitle: {
    fontSize: 20,
    fontWeight: 700,
    color: '#111827',
    marginBottom: 8,
  },

  mainCompleteSubtitle: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 24,
  },

  mainCompleteButton: {
    width: '100%',
    padding: '16px',
    background: DEFAULT_ROUTE_COLOR,
    borderRadius: 16,
    fontSize: 16,
    fontWeight: 600,
    color: 'white',
    cursor: 'pointer',
    border: 'none',
  },

  branchCompleteOverlay: {
    position: 'absolute',
    inset: 0,
    zIndex: 2000,
    background: 'rgba(255,255,255,0.10)',
    backdropFilter: 'blur(12px)',
    WebkitBackdropFilter: 'blur(12px)',
    display: 'flex',
    flexDirection: 'column',
  },

  arrivedBar: {
    flexShrink: 0,
    width: '100%',
    minHeight: 64,
    padding: '20px 24px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    textAlign: 'center',
    borderBottom: '1px solid rgba(0,0,0,0.08)',
    fontSize: 16,
    fontWeight: 700,
    color: '#0049C5',
    letterSpacing: '-0.2px',
  },

  branchCompleteContent: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '0 32px',
  },

  completePill: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    background: 'white',
    borderRadius: 999,
    padding: '7px 16px 7px 10px',
    marginBottom: 20,
    boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
  },

  completePillText: {
    fontSize: 11,
    fontWeight: 700,
    letterSpacing: '0.08em',
    color: '#0049C5',
  },

  branchCompleteTitle: {
    fontSize: 'clamp(26px, 7vw, 32px)',
    fontWeight: 800,
    color: '#0a0a0a',
    textAlign: 'center',
    lineHeight: 1.15,
    letterSpacing: '-0.8px',
    marginBottom: 48,
  },

  branchCompleteButtonGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: 12,
    width: '100%',
    alignItems: 'center',
  },

  newRouteButton: {
    width: '100%',
    padding: '16px',
    background: '#1d4ed8',
    borderRadius: 999,
    fontSize: 16,
    fontWeight: 600,
    color: 'white',
    cursor: 'pointer',
    border: 'none',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    boxShadow: '0 6px 16px rgba(29,78,216,0.25)',
  },

  archiveButton: {
    width: '100%',
    padding: '16px',
    background: '#E7E7F4',
    borderRadius: 999,
    fontSize: 16,
    fontWeight: 600,
    color: '#111827',
    cursor: 'pointer',
    border: 'none',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },

  archiveIcon: {
    fontSize: 18,
  },

  homeButton: {
    background: 'none',
    border: 'none',
    fontSize: 14,
    color: '#8F8F8F',
    cursor: 'pointer',
    marginTop: 6,
    textDecoration: 'underline',
    textUnderlineOffset: '3px',
    padding: '4px 12px',
  },
}
