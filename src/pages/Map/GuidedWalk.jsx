import { useState, useEffect, useRef } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import Map, { Source, Layer, Marker } from 'react-map-gl'
import 'mapbox-gl/dist/mapbox-gl.css'

const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_TOKEN

const toLngLat = ([lat, lng]) => [lng, lat]

const MAIN_ROUTE = [
  [47.61208726167953, -122.33701558200671], // Westlake Center
  [47.6117017475211, -122.33664367843423],
  [47.61217739456354, -122.33554583325099],
  [47.61311511374411, -122.33330990771319],
  [47.61357524872394, -122.33220631461666],
  [47.61528546767674, -122.32803424183338],
  [47.61532231916068, -122.32569616528335],
  [47.61534637433494, -122.31998484534672], // Cal Anderson Park
]

// Regions defined purely by geography — no step coupling
const REGIONS = [
  {
    id: 'westlake',
    label: 'Westlake',
    polygon: [
      [-122.340, 47.608],
      [-122.340, 47.616],
      [-122.333, 47.616],
      [-122.333, 47.608],
    ],
  },
  {
    id: 'capitol-hill',
    label: 'Capitol Hill',
    polygon: [
      [-122.336, 47.610],
      [-122.336, 47.618],
      [-122.324, 47.618],
      [-122.324, 47.610],
    ],
  },
  {
    id: 'cal-anderson',
    label: 'Cal Anderson',
    polygon: [
      [-122.329, 47.613],
      [-122.329, 47.620],
      [-122.318, 47.620],
      [-122.318, 47.613],
    ],
  },
]

// Ray-casting point-in-polygon (lng, lat order)
function pointInPolygon(lng, lat, polygon) {
  let inside = false
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const [xi, yi] = polygon[i]
    const [xj, yj] = polygon[j]
    const intersect = ((yi > lat) !== (yj > lat)) &&
      (lng < (xj - xi) * (lat - yi) / (yj - yi) + xi)
    if (intersect) inside = !inside
  }
  return inside
}

function getActiveRegion(lat, lng) {
  return REGIONS.find(r => pointInPolygon(lng, lat, r.polygon)) || null
}

function makeLine(points) {
  if (points.length < 2) return { type: 'FeatureCollection', features: [] }
  return { type: 'Feature', geometry: { type: 'LineString', coordinates: points.map(toLngLat) } }
}

function calcBearing([lat1, lng1], [lat2, lng2]) {
  const toRad = d => d * Math.PI / 180
  const y = Math.sin(toRad(lng2 - lng1)) * Math.cos(toRad(lat2))
  const x = Math.cos(toRad(lat1)) * Math.sin(toRad(lat2)) -
            Math.sin(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.cos(toRad(lng2 - lng1))
  return (Math.atan2(y, x) * 180 / Math.PI + 360) % 360
}

export default function GuidedWalk() {
  const navigate = useNavigate()
  const location = useLocation()
  const mapRef = useRef()

  let branchRoute = null
  if (location.state) {
    branchRoute = location.state.route
  }

  const route = branchRoute ? branchRoute.path : MAIN_ROUTE
  const routeColor = branchRoute ? branchRoute.color : '#5272FF'
  const [step, setStep] = useState(0)
  const [simulating, setSimulating] = useState(false)
  const [done, setDone] = useState(false)

  // Audio player state
  const [audioPlaying, setAudioPlaying] = useState(false)
  const [audioProgress, setAudioProgress] = useState(0)
  const audioTimer = useRef(null)

  useEffect(() => {
    if (audioPlaying) {
      audioTimer.current = setInterval(() => {
        setAudioProgress(p => {
          if (p >= 100) { setAudioPlaying(false); return 100 }
          return p + 0.5
        })
      }, 150)
    } else {
      clearInterval(audioTimer.current)
    }
    return () => clearInterval(audioTimer.current)
  }, [audioPlaying])

  const simTimer = useRef(null)

  const currentPoint = route[step] || route[route.length - 1] || MAIN_ROUTE[0]
  const [curLat, curLng] = currentPoint
  const activeRegion = getActiveRegion(curLat, curLng)

  const traveled = route.slice(0, step + 1)
  const progress = route.length > 1 ? (step / (route.length - 1)) * 100 : 0

  // Arrow bearing: point toward next waypoint (or keep last bearing at end)
  const arrowBearing = step < route.length - 1
    ? calcBearing(route[step], route[step + 1])
    : step > 0
      ? calcBearing(route[step - 1], route[step])
      : 0

  const simBtnBg = simulating ? 'rgba(239,68,68,0.88)' : 'rgba(59,130,246,0.88)'

  // Camera
  useEffect(() => {
    if (!mapRef.current || !currentPoint) return

    if (simulating) {
      const nextIdx = Math.min(step + 1, route.length - 1)
      const bearing = step < route.length - 1
        ? calcBearing(route[step], route[nextIdx])
        : mapRef.current.getBearing()

      mapRef.current.easeTo({
        center: toLngLat(currentPoint),
        zoom: 17.5,
        pitch: 55,
        bearing,
        duration: 1200,
      })
    } else {
      mapRef.current.easeTo({
        center: toLngLat(currentPoint),
        zoom: 15.5,
        pitch: 0,
        bearing: 0,
        duration: 700,
      })
    }
  }, [step, simulating, route, currentPoint])

  // Walk simulation
  useEffect(() => {
    if (simulating && !done) {
      simTimer.current = setInterval(() => {
        setStep(prev => {
          const next = prev + 1

          if (next >= route.length - 1) {
            setSimulating(false)
            setDone(true)
            return route.length - 1
          }

          return next
        })
      }, 1400)
    } else {
      clearInterval(simTimer.current)
      simTimer.current = null
    }

    return () => {
      clearInterval(simTimer.current)
      simTimer.current = null
    }
  }, [simulating, done, route])

  useEffect(() => {
    setStep(0)
    setSimulating(false)
    setDone(false)

    clearInterval(simTimer.current)
    simTimer.current = null
  }, [route])

  return (
    <div style={{ height: '100%', width: '100%', position: 'relative', overflow: 'hidden' }}>
      <Map
        ref={mapRef}
        mapboxAccessToken={MAPBOX_TOKEN}
        initialViewState={{ longitude: toLngLat(route[0])[0], latitude: toLngLat(route[0])[1], zoom: 16 }}
        style={{ width: '100%', height: '100%' }}
        mapStyle="mapbox://styles/mapbox/light-v11"
        attributionControl={false}
      >

        {/* Full route — faint (unwalked preview) */}
        <Source id="full-route" type="geojson" data={makeLine(route)}>
          <Layer id="full-route-line" type="line"
            layout={{ 'line-cap': 'round', 'line-join': 'round' }}
            paint={{ 'line-color': routeColor, 'line-width': 4, 'line-opacity': 0.25 }}
          />
        </Source>

        {/* Traveled path — same color, much higher opacity = visually darker */}
        <Source id="traveled" type="geojson" data={makeLine(traveled)}>
          <Layer id="traveled-line" type="line"
            layout={{ 'line-cap': 'round', 'line-join': 'round' }}
            paint={{ 'line-color': routeColor, 'line-width': 5, 'line-opacity': 0.9 }}
          />
        </Source>

        {/* Start marker */}
        <Marker longitude={toLngLat(route[0])[0]} latitude={toLngLat(route[0])[1]} anchor="center">
          <div style={{ width: 10, height: 10, background: routeColor, border: '2.5px solid white', borderRadius: '50%' }} />
        </Marker>

        {/* End marker */}
        <Marker longitude={toLngLat(route[route.length - 1])[0]} latitude={toLngLat(route[route.length - 1])[1]} anchor="center">
          <div style={{ width: 10, height: 10, background: routeColor, border: '2.5px solid white', borderRadius: '50%' }} />
        </Marker>

        {/* Walker arrow */}
        {!done && <Marker longitude={toLngLat(currentPoint)[0]} latitude={toLngLat(currentPoint)[1]} anchor="center">
          <div style={{ position: 'relative', width: 40, height: 40, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            {/* Pulse ring */}
            <div style={{
              position: 'absolute', inset: 0,
              background: `${routeColor}33`,
              borderRadius: '50%',
              animation: 'walkerPulse 1.8s ease-out infinite',
            }} />
            {/* Directional arrow */}
            <div style={{ transform: `rotate(${arrowBearing}deg)`, transition: 'transform 0.4s ease', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <svg width="24" height="30" viewBox="0 0 24 30" fill="none" xmlns="http://www.w3.org/2000/svg">
                {/* Shadow / outline */}
                <path d="M12 2 L23 26 L12 20 L1 26 Z" fill="white" />
                {/* Main arrow */}
                <path d="M12 4 L22 25 L12 19.5 L2 25 Z" fill={routeColor} />
              </svg>
            </div>
          </div>
        </Marker>}
      </Map>

      {/* Top bar */}
      <div style={{
        position: 'absolute', top: 0, left: 0, right: 0, zIndex: 1000,
        background: 'linear-gradient(to bottom, rgba(0,0,0,0.85) 0%, transparent 100%)',
        padding: '52px 16px 44px',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <button onClick={() => navigate(-1)} style={{
            background: 'rgba(255,255,255,0.12)', border: 'none', color: 'white',
            width: 34, height: 34, borderRadius: '50%', fontSize: 15, cursor: 'pointer',
            flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>←</button>

          <div style={{ flex: 1, minWidth: 0 }}>
            {activeRegion ? (
              <>
                <div style={{ color: 'rgba(255,255,255,0.6)', fontSize: 10, fontWeight: 700, letterSpacing: '0.1em' }}>NOW IN</div>
                <div style={{ color: routeColor, fontSize: 13, fontWeight: 600 }}>{activeRegion.label}</div>
              </>
            ) : (
              <div style={{ color: 'rgba(255,255,255,0.6)', fontSize: 13 }}>
                {done ? '🎉 Route complete!' : step === 0 ? 'Press ▶ to start' : 'Walking…'}
              </div>
            )}
          </div>
        </div>

        {/* Progress bar */}
        <div style={{ marginTop: 10, height: 2, background: 'rgba(255,255,255,0.1)', borderRadius: 1 }}>
          <div style={{ height: '100%', width: `${progress}%`, background: 'rgba(255,255,255,0.45)', borderRadius: 1, transition: 'width 0.5s ease' }} />
        </div>
      </div>

      {/* Simulate button */}
      {!done && (
        <div style={{ position: 'absolute', right: 14, bottom: 110, zIndex: 1000, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
          <button onClick={() => setSimulating(v => !v)} style={{
            width: 50, height: 50, borderRadius: '50%', border: 'none',
            background: simBtnBg,
            backdropFilter: 'blur(8px)', color: 'white', fontSize: 18, cursor: 'pointer',
            boxShadow: '0 3px 14px rgba(0,0,0,0.45)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>{simulating ? '⏸' : '▶'}</button>
          <span style={{ color: 'white', fontSize: 10, fontWeight: 600, background: 'rgba(0,0,0,0.45)', padding: '2px 7px', borderRadius: 8 }}>Walking Simulation</span>
        </div>
      )}

      {/* Audio player bar */}
      {!done && (
        <div style={{
          position: 'absolute', bottom: 0, left: 0, right: 0, zIndex: 1000,
          background: 'white', borderRadius: '20px 20px 0 0',
          boxShadow: '0 -4px 20px rgba(0,0,0,0.10)',
          padding: '14px 20px 32px',
        }}>
          <div style={{ width: 36, height: 4, background: '#d1d5db', borderRadius: 2, margin: '0 auto 14px' }} />

          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            {/* Play/pause */}
            <button
              onClick={() => setAudioPlaying(v => !v)}
              style={{
                width: 42, height: 42, borderRadius: '50%', border: 'none',
                background: routeColor, color: 'white',
                fontSize: 16, cursor: 'pointer', flexShrink: 0,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}
            >
              {audioPlaying ? '⏸' : '▶'}
            </button>

            {/* Track info + progress */}
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: '#111827', marginBottom: 6 }}>
                {branchRoute ? branchRoute.title : 'Main Route Audio'}
              </div>
              {/* Progress bar */}
              <div style={{ height: 4, background: '#e5e7eb', borderRadius: 2, overflow: 'hidden' }}>
                <div style={{
                  height: '100%', borderRadius: 2,
                  background: routeColor,
                  width: `${audioProgress}%`,
                  transition: 'width 0.15s linear',
                }} />
              </div>
              {/* Time */}
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 4 }}>
                <span style={{ fontSize: 11, color: '#9ca3af' }}>
                  {(() => { const s = Math.floor(audioProgress * 0.3); return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}` })()}
                </span>
                <span style={{ fontSize: 11, color: '#9ca3af' }}>0:30</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Main route complete — prompt to choose a branch */}
      {done && !branchRoute && (
        <div style={{
          position: 'absolute', bottom: 0, left: 0, right: 0, zIndex: 2000,
          background: 'white', borderRadius: '22px 22px 0 0',
          boxShadow: '0 -4px 24px rgba(0,0,0,0.10)',
          padding: '20px 24px 44px',
        }}>
          <div style={{ width: 40, height: 4, background: '#d1d5db', borderRadius: 2, margin: '0 auto 20px' }} />
          <div style={{ fontSize: 20, fontWeight: 700, color: '#111827', marginBottom: 8 }}>Main route complete!</div>
          <div style={{ fontSize: 14, color: '#6b7280', marginBottom: 24 }}>Now choose a perspective to explore.</div>
          <button
            onClick={() => navigate('/map/explore')}
            style={{
              width: '100%', padding: '16px',
              background: '#5272FF', border: 'none',
              borderRadius: 16, fontSize: 16, fontWeight: 600,
              color: 'white', cursor: 'pointer',
            }}
          >
            Choose a Path →
          </button>
        </div>
      )}

      {/* Branch route complete overlay */}
      {done && branchRoute && (
        <div style={{
          position: 'absolute', inset: 0, zIndex: 2000,
          background: 'transparent',
          display: 'flex', flexDirection: 'column',
          justifyContent: 'space-between',
          padding: '0 32px 140px',
        }}>
          {/* Title + quote */}
          <div style={{ marginTop: '58%', textAlign: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, marginBottom: 32 }}>
              <div style={{
                width: 44, height: 44, borderRadius: '50%',
                background: '#22c55e',
                display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
              }}>
                <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
                  <path d="M4 11.5L9 16.5L18 6" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>
              <span style={{ fontSize: 34, fontWeight: 800, color: '#22c55e', letterSpacing: '-0.5px' }}>
                Route Complete
              </span>
            </div>
            <p style={{ fontSize: 22, fontWeight: 600, color: '#111827', lineHeight: 1.4, margin: 0 }}>
              "You've reached the end of {branchRoute.title}"
            </p>
          </div>

          {/* Buttons */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <button
              onClick={() => navigate('/perspectives')}
              style={{
                width: '100%', padding: '18px',
                background: 'white', border: '1.5px solid #e5e7eb',
                borderRadius: 16, fontSize: 16, fontWeight: 600,
                color: '#111827', cursor: 'pointer',
              }}
            >
              View Full Archive
            </button>
            <button
              onClick={() => navigate('/map/explore')}
              style={{
                width: '100%', padding: '18px',
                background: 'white', border: '1.5px solid #e5e7eb',
                borderRadius: 16, fontSize: 16, fontWeight: 600,
                color: '#111827', cursor: 'pointer',
              }}
            >
              Choose Another Path
            </button>
            <button
              onClick={() => navigate('/map/overview')}
              style={{
                background: 'none', border: 'none',
                fontSize: 20, color: '#9ca3af',
                textDecoration: 'underline', cursor: 'pointer',
                marginTop: 4,
              }}
            >
              Home
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
