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

// ~10ft ≈ 0.000030 degrees latitude offset — walker drifts slightly off route
const WRONG_PATH_ROUTE = [
  [47.61208726167953, -122.33701558200671], // same start
  [47.61215, -122.33680], // slight drift
  [47.61240, -122.33590], // drifting further off
  [47.61290, -122.33450], // clearly off route
  [47.61320, -122.33350], // deep off route
]

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

const POIS = [
  {
    id: 1,
    position: [47.6120, -122.3358],
    triggerStep: 1,
    icon: '📍',
    name: 'Pin1',
    title: 'Title1',
    desc: 'Description1'
  },
  {
    id: 2,
    position: [47.6136, -122.3318],
    triggerStep: 3,
    icon: '📍',
    name: 'Pin2',
    title: 'Title2',
    desc: 'Description2'
  },
  {
    id: 3,
    position: [47.6153, -122.3240],
    triggerStep: 6,
    icon: '📍',
    name: 'Pin3',
    title: 'Title3',
    desc: 'Description3'
  },
]

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

// Haversine distance in feet between two [lat, lng] points
function distanceFeet([lat1, lng1], [lat2, lng2]) {
  const R = 20902231 // Earth radius in feet
  const toRad = d => d * Math.PI / 180
  const dLat = toRad(lat2 - lat1)
  const dLng = toRad(lng2 - lng1)
  const a = Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}

// Min distance from point to any segment on the route
function distanceToRoute(point, route) {
  let minDist = Infinity
  for (let i = 0; i < route.length - 1; i++) {
    minDist = Math.min(minDist, distanceFeet(point, route[i]))
  }
  return minDist
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
    // Descending alert tones
    playTone(880, 0, 0.18, 'square')
    playTone(660, 0.22, 0.18, 'square')
    playTone(440, 0.44, 0.28, 'square')
  } catch (e) {
    // AudioContext not available
  }
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
  const [triggeredPOIs, setTriggeredPOIs] = useState(new Set())
  const [pendingPOI, setPendingPOI] = useState(null)
  const [openPOI, setOpenPOI] = useState(null)

  // Wrong path simulation state
  const [wrongPathMode, setWrongPathMode] = useState(false)
  const [wrongStep, setWrongStep] = useState(0)
  const [offRouteAlert, setOffRouteAlert] = useState(false)
  const [alertDismissed, setAlertDismissed] = useState(false)
  const wrongSimTimer = useRef(null)

  // Audio player state
  const [audioPlaying, setAudioPlaying] = useState(false)
  const [audioProgress, setAudioProgress] = useState(0)
  const audioTimer = useRef(null)

  useEffect(() => {
    if (audioPlaying) {
      audioTimer.current = setInterval(() => {
        setAudioProgress(p => {
          if (p >= 100) { setAudioPlaying(false); return 100 }
          return p + 0.125
        })
      }, 150)
    } else {
      clearInterval(audioTimer.current)
    }
    return () => clearInterval(audioTimer.current)
  }, [audioPlaying])

  const simTimer = useRef(null)

  // Current position: wrong path overrides normal position
  const normalPoint = route[step] || route[route.length - 1] || MAIN_ROUTE[0]
  const wrongPoint = WRONG_PATH_ROUTE[Math.min(wrongStep, WRONG_PATH_ROUTE.length - 1)]
  const currentPoint = wrongPathMode ? wrongPoint : normalPoint
  const [curLat, curLng] = currentPoint
  const activeRegion = getActiveRegion(curLat, curLng)

  const traveled = wrongPathMode
    ? WRONG_PATH_ROUTE.slice(0, wrongStep + 1)
    : route.slice(0, step + 1)

  // Camera
  useEffect(() => {
    if (!mapRef.current || !currentPoint) return
    const isMoving = simulating || wrongPathMode

    if (isMoving) {
      const currentRoute = wrongPathMode ? WRONG_PATH_ROUTE : route
      const currentStep = wrongPathMode ? wrongStep : step
      const nextIdx = Math.min(currentStep + 1, currentRoute.length - 1)
      const bearing = currentStep < currentRoute.length - 1
        ? calcBearing(currentRoute[currentStep], currentRoute[nextIdx])
        : mapRef.current.getBearing?.() ?? 0

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
  }, [step, wrongStep, simulating, wrongPathMode, route, currentPoint])

  // Normal walk simulation
  useEffect(() => {
    if (simulating && !done && !wrongPathMode) {
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
      }, 1800)
    } else {
      clearInterval(simTimer.current)
      simTimer.current = null
    }
    return () => { clearInterval(simTimer.current); simTimer.current = null }
  }, [simulating, done, wrongPathMode, route])

  // Wrong path simulation
  useEffect(() => {
    if (wrongPathMode) {
      wrongSimTimer.current = setInterval(() => {
        setWrongStep(prev => {
          const next = prev + 1
          if (next >= WRONG_PATH_ROUTE.length) {
            clearInterval(wrongSimTimer.current)
            return prev
          }

          // Check distance from main route
          const newPos = WRONG_PATH_ROUTE[next]
          const distFt = distanceToRoute(newPos, MAIN_ROUTE)

          if (distFt > 15 && !alertDismissed) {
            setOffRouteAlert(true)
            // Vibrate: 3 short bursts
            if (navigator.vibrate) navigator.vibrate([300, 150, 300, 150, 300])
            playErrorSound()
          }

          return next
        })
      }, 1800)
    } else {
      clearInterval(wrongSimTimer.current)
    }
    return () => clearInterval(wrongSimTimer.current)
  }, [wrongPathMode, alertDismissed])

  const startWrongPath = () => {
    // Reset everything first
    setSimulating(false)
    setDone(false)
    setOffRouteAlert(false)
    setAlertDismissed(false)
    setWrongStep(0)
    clearInterval(simTimer.current)
    clearInterval(wrongSimTimer.current)
    // Small delay before starting
    setTimeout(() => setWrongPathMode(true), 300)
  }

  const stopWrongPath = () => {
    setWrongPathMode(false)
    setOffRouteAlert(false)
    setAlertDismissed(false)
    setWrongStep(0)
    clearInterval(wrongSimTimer.current)
  }

  const dismissOffRouteAlert = () => {
    setOffRouteAlert(false)
    setAlertDismissed(true)
  }

  // Reset on route change
  useEffect(() => {
    setStep(0)
    setSimulating(false)
    setDone(false)
    setTriggeredPOIs(new Set())
    setPendingPOI(null)
    setWrongPathMode(false)
    setOffRouteAlert(false)
    setAlertDismissed(false)
    setWrongStep(0)
    clearInterval(simTimer.current)
    clearInterval(wrongSimTimer.current)
    simTimer.current = null
  }, [route])

  // POI proximity
  useEffect(() => {
    POIS.forEach(poi => {
      if (step >= poi.triggerStep && !triggeredPOIs.has(poi.id)) {
        setTriggeredPOIs(prev => new Set([...prev, poi.id]))
        setPendingPOI(poi)
        if (navigator.vibrate) navigator.vibrate([200, 100, 200])
        setTimeout(() => setPendingPOI(p => (p?.id === poi.id ? null : p)), 6000)
      }
    })
  }, [step, triggeredPOIs])

  return (
    <div style={{ height: '100%', width: '100%', position: 'relative', overflow: 'hidden' }}>
      <style>{`
        @keyframes walkerPulse {
          0% { transform: scale(1); opacity: 0.7; }
          70% { transform: scale(2.2); opacity: 0; }
          100% { transform: scale(1); opacity: 0; }
        }
        @keyframes slideDown {
          from { transform: translateY(-16px); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
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
      `}</style>

      <Map
        ref={mapRef}
        mapboxAccessToken={MAPBOX_TOKEN}
        initialViewState={{ longitude: toLngLat(route[0])[0], latitude: toLngLat(route[0])[1], zoom: 16 }}
        style={{ width: '100%', height: '100%' }}
        mapStyle="mapbox://styles/mapbox/light-v11"
        attributionControl={false}
      >
        {/* Full route — faint preview */}
        <Source id="full-route" type="geojson" data={makeLine(route)}>
          <Layer id="full-route-line" type="line"
            layout={{ 'line-cap': 'round', 'line-join': 'round' }}
            paint={{ 'line-color': routeColor, 'line-width': 4, 'line-opacity': 0.25 }}
          />
        </Source>

        {/* Traveled path */}
        <Source id="traveled" type="geojson" data={makeLine(traveled)}>
          <Layer id="traveled-line" type="line"
            layout={{ 'line-cap': 'round', 'line-join': 'round' }}
            paint={{
              'line-color': wrongPathMode ? '#ef4444' : routeColor,
              'line-width': 5,
              'line-opacity': 0.9
            }}
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

        {/* POI markers */}
        {POIS.map(poi => (
          <Marker key={poi.id} longitude={poi.position[1]} latitude={poi.position[0]} anchor="center">
            <div
              onClick={() => setOpenPOI(poi)}
              style={{ fontSize: 28, cursor: 'pointer', lineHeight: 1 }}
            >{poi.icon}</div>
          </Marker>
        ))}

        {/* Walker dot */}
        {!done && (
          <Marker longitude={toLngLat(currentPoint)[0]} latitude={toLngLat(currentPoint)[1]} anchor="center">
            <div style={{ position: 'relative', width: 26, height: 26, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <div style={{
                position: 'absolute', inset: 0,
                background: wrongPathMode ? 'rgba(239,68,68,0.3)' : `${routeColor}33`,
                borderRadius: '50%',
                animation: wrongPathMode ? 'wrongWalkerPulse 1.2s ease-out infinite' : 'walkerPulse 1.8s ease-out infinite'
              }} />
              <div style={{
                width: 14, height: 14,
                background: wrongPathMode ? '#ef4444' : routeColor,
                border: '3px solid white',
                borderRadius: '50%',
                boxShadow: wrongPathMode
                  ? '0 2px 10px rgba(239,68,68,0.7)'
                  : `0 2px 10px ${routeColor}b3`
              }} />
            </div>
          </Marker>
        )}
      </Map>

      {/* Top bar */}
      <div style={{
        position: 'absolute', top: 0, left: 0, right: 0, zIndex: 1000,
        padding: '52px 16px 16px',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <button onClick={() => navigate(-1)} style={{
            width: 38, height: 38, borderRadius: '50%', flexShrink: 0,
            background: 'white', boxShadow: '0 0 0 6px rgba(0,0,0,0.06)',
            border: 'none', cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M10 3L5 8L10 13" stroke="#111827" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
          <button onClick={() => navigate('/map/explore')} style={{
            width: 38, height: 38, borderRadius: '50%', flexShrink: 0,
            background: 'white', boxShadow: '0 0 0 6px rgba(0,0,0,0.06)',
            border: 'none', cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M6 3L11 8L6 13" stroke="#111827" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>

          <div style={{
            flex: 1, minWidth: 0,
            background: wrongPathMode ? 'rgba(254,242,242,0.95)' : 'white',
            backdropFilter: 'blur(12px)',
            WebkitBackdropFilter: 'blur(12px)',
            borderRadius: 14,
            padding: '6px 14px',
            border: wrongPathMode ? '1px solid rgba(252,165,165,0.5)' : 'none',
            transition: 'background 0.3s, border 0.3s',
          }}>
            {wrongPathMode ? (
              <>
                <div style={{ color: '#dc2626', fontSize: 10, fontWeight: 700, letterSpacing: '0.1em' }}>SIMULATION</div>
                <div style={{ color: '#dc2626', fontSize: 13, fontWeight: 600 }}>Wrong Path Active</div>
              </>
            ) : activeRegion ? (
              <>
                <div style={{ color: '#2D4258', fontSize: 10, fontWeight: 700, letterSpacing: '0.1em' }}>NOW IN</div>
                <div style={{ color: routeColor, fontSize: 13, fontWeight: 600 }}>{activeRegion.label}</div>
              </>
            ) : (
              <div style={{ color: '#6b7280', fontSize: 13 }}>
                {done ? '🎉 Route complete!' : step === 0 ? 'Press ▶ to start' : 'Walking…'}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* POI notification banner */}
      {pendingPOI && !done && (
        <div style={{
          position: 'absolute', top: 108, left: 16, right: 16, zIndex: 1001,
          background: 'rgba(219,234,254,0.95)', backdropFilter: 'blur(14px)',
          WebkitBackdropFilter: 'blur(14px)',
          border: '1px solid rgba(147,197,253,0.5)',
          borderRadius: 18, padding: '12px 14px',
          display: 'flex', alignItems: 'center', gap: 12,
          boxShadow: '0 4px 24px rgba(59,130,246,0.12)',
          animation: 'slideDown 0.3s ease',
        }}>
          <div style={{
            width: 42, height: 42, flexShrink: 0,
            background: 'rgba(255,255,255,0.6)', border: '1px solid rgba(147,197,253,0.4)',
            borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20,
          }}>{pendingPOI.icon}</div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ color: '#3b82f6', fontSize: 10, fontWeight: 700, letterSpacing: '0.08em' }}>📳 NEARBY</div>
            <div style={{ color: '#111827', fontSize: 13, fontWeight: 600 }}>{pendingPOI.name}</div>
          </div>
          <div style={{ display: 'flex', gap: 7 }}>
            <button
              onClick={() => { setOpenPOI(pendingPOI); setPendingPOI(null) }}
              style={{
                background: 'white', color: '#111827', border: 'none',
                padding: '6px 14px', borderRadius: 20, fontSize: 13, fontWeight: 600, cursor: 'pointer',
              }}
            >View</button>
            <button
              onClick={() => setPendingPOI(null)}
              style={{
                background: 'rgba(0,0,0,0.08)', color: '#374151', border: 'none',
                width: 30, height: 30, borderRadius: '50%', fontSize: 14, cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}
            >✕</button>
          </div>
        </div>
      )}

      {/* Simulate button */}
      {!done && !wrongPathMode && (
        <div style={{ position: 'absolute', right: 14, bottom: 200, zIndex: 1000, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
          <button onClick={() => setSimulating(v => !v)} style={{
            width: 50, height: 50, borderRadius: '50%',
            background: '#7D92A7',
            backdropFilter: 'blur(8px)', color: 'white', fontSize: 18, cursor: 'pointer',
            boxShadow: '0 3px 14px rgba(0,0,0,0.45)',
            display: 'flex', alignItems: 'center', justifyContent: 'center'
          }}>{simulating ? '⏸' : '▶'}</button>
          <span style={{ color: 'white', fontSize: 10, fontWeight: 600, background: 'rgba(0,0,0,0.45)', padding: '2px 7px', borderRadius: 8, maxWidth: 64 }}>Walking Simulation</span>
        </div>
      )}

      {/* Wrong Path button */}
      {!done && (
        <div style={{
          position: 'absolute', right: 14, bottom: wrongPathMode ? 200 : 290,
          zIndex: 1000, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6,
          transition: 'bottom 0.3s ease',
        }}>
          {wrongPathMode ? (
            <>
              <button onClick={stopWrongPath} style={{
                width: 50, height: 50, borderRadius: '50%',
                background: '#ef4444',
                color: 'white', fontSize: 18, cursor: 'pointer',
                boxShadow: '0 3px 14px rgba(239,68,68,0.55)',
                border: 'none',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                animation: 'alertPulse 1.8s infinite',
              }}>⏹</button>
              <span style={{ color: 'white', fontSize: 10, fontWeight: 600, background: 'rgba(220,38,38,0.8)', padding: '2px 7px', borderRadius: 8 }}>Stop Test</span>
            </>
          ) : (
            <>
              <button onClick={startWrongPath} style={{
                width: 50, height: 50, borderRadius: '50%',
                background: 'rgba(239,68,68,0.85)',
                backdropFilter: 'blur(8px)', color: 'white', fontSize: 20, cursor: 'pointer',
                boxShadow: '0 3px 14px rgba(239,68,68,0.45)',
                border: 'none',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>⚠️</button>
              <span style={{ color: 'white', fontSize: 10, fontWeight: 600, background: 'rgba(0,0,0,0.45)', padding: '2px 7px', borderRadius: 8, textAlign: 'center', maxWidth: 64 }}>Wrong Path Simulation</span>
            </>
          )}
        </div>
      )}

      {/* Audio player bar */}
      {!done && (
        <div style={{
          position: 'absolute', bottom: 24, left: 16, right: 16, zIndex: 1000,
          background: 'white', borderRadius: 32,
          boxShadow: '0 4px 24px rgba(0,0,0,0.15)',
          padding: '10px 16px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <button
              onClick={() => setAudioPlaying(v => !v)}
              style={{
                width: 56, height: 56, borderRadius: '50%',
                background: '#1d4ed8', color: 'white',
                fontSize: 20, cursor: 'pointer', flexShrink: 0,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                border: 'none',
              }}
            >
              {audioPlaying ? '⏸' : '▶'}
            </button>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 15, fontWeight: 700, color: '#111827', marginBottom: 2 }}>Title</div>
              <div style={{ fontSize: 13, color: routeColor, marginBottom: 10 }}>
                {branchRoute ? branchRoute.title : 'Main Route'}
              </div>
              <div style={{ height: 6, background: '#e5e7eb', borderRadius: 3, overflow: 'hidden' }}>
                <div style={{
                  height: '100%', borderRadius: 3,
                  background: '#1d4ed8',
                  width: `${audioProgress}%`,
                  transition: 'width 0.15s linear'
                }} />
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 6 }}>
                <span style={{ fontSize: 12, color: '#9ca3af' }}>
                  {(() => { const s = Math.floor(audioProgress * 1.2); return `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}` })()}
                </span>
                <span style={{ fontSize: 12, color: '#9ca3af' }}>2:00</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════ */}
      {/* OFF ROUTE ALERT MODAL                     */}
      {/* ══════════════════════════════════════════ */}
      {offRouteAlert && (
        <div style={{
          position: 'absolute', inset: 0, zIndex: 3000,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          padding: '0 32px',
          pointerEvents: 'none',
        }}>
          {/* Blurred map tint */}
          <div style={{
            position: 'absolute', inset: 0,
            background: 'rgba(0,0,0,0.18)',
            backdropFilter: 'blur(3px)',
            WebkitBackdropFilter: 'blur(3px)',
            pointerEvents: 'auto',
          }} />

          {/* Card */}
          <div style={{
            position: 'relative', zIndex: 1,
            width: '100%', maxWidth: 340,
            background: 'rgba(255,255,255,0.96)',
            backdropFilter: 'blur(20px)',
            WebkitBackdropFilter: 'blur(20px)',
            borderRadius: 28,
            padding: '36px 28px 28px',
            display: 'flex', flexDirection: 'column', alignItems: 'center',
            boxShadow: '0 20px 60px rgba(0,0,0,0.18), 0 0 0 1px rgba(255,255,255,0.5)',
            animation: 'alertSlideUp 0.35s cubic-bezier(0.34,1.56,0.64,1)',
            pointerEvents: 'auto',
          }}>
            {/* Pulsing red icon circle */}
            <div style={{
              width: 72, height: 72,
              borderRadius: '50%',
              border: '2.5px solid #dc2626',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              marginBottom: 22,
              animation: 'alertPulse 1.6s ease-in-out infinite',
              background: 'rgba(254,242,242,0.6)',
            }}>
              {/* Turn-back arrow icon matching the mockup */}
              <svg width="32" height="32" viewBox="0 0 32 32" fill="none"
                style={{ animation: 'iconSpin 2s ease-in-out infinite' }}>
                <path
                  d="M10 20 C10 14 16 10 22 10 L22 6 L28 12 L22 18 L22 14 C18 14 14 17 14 22"
                  stroke="#dc2626" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
                  fill="none"
                />
              </svg>
            </div>

            {/* Title */}
            <div style={{
              fontSize: 22, fontWeight: 800,
              color: '#0a0a0a',
              textAlign: 'center',
              marginBottom: 10,
              letterSpacing: '-0.3px',
            }}>
              Off Route Alert
            </div>

            {/* Subtitle */}
            <div style={{
              fontSize: 15, color: '#6b7280',
              textAlign: 'center',
              lineHeight: 1.5,
              marginBottom: 28,
            }}>
              Please return to the original route.
            </div>

            {/* Dismiss button */}
            <button
              onClick={dismissOffRouteAlert}
              style={{
                width: '100%',
                padding: '14px',
                background: '#dc2626',
                color: 'white',
                fontSize: 16, fontWeight: 700,
                borderRadius: 999,
                border: 'none', cursor: 'pointer',
                letterSpacing: '-0.2px',
                boxShadow: '0 4px 16px rgba(220,38,38,0.35)',
              }}
            >
              Got it
            </button>
          </div>
        </div>
      )}

      {/* POI detail card */}
      {openPOI && (
        <div
          onClick={() => setOpenPOI(null)}
          style={{
            position: 'absolute', inset: 0, zIndex: 2500,
            background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(6px)',
            WebkitBackdropFilter: 'blur(6px)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}
        >
          <div
            onClick={e => e.stopPropagation()}
            style={{
              width: 346, height: 538,
              borderRadius: 40, overflow: 'hidden',
              position: 'relative', flexShrink: 0,
              background: 'linear-gradient(160deg, #3d3d3d 0%, #1a1a1a 100%)',
            }}
          >
            <div style={{ position: 'absolute', inset: 0, background: 'rgba(255,255,255,0.03)' }} />
            <div style={{
              position: 'absolute', top: 80, left: 0, right: 0,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 80, opacity: 0.35,
            }}>{openPOI.icon}</div>
            <button
              onClick={() => setOpenPOI(null)}
              style={{
                position: 'absolute', top: 20, right: 20, zIndex: 10,
                width: 34, height: 34, borderRadius: '50%',
                background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(8px)',
                border: '1px solid rgba(255,255,255,0.2)',
                color: 'white', fontSize: 15, cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}
            >✕</button>
            <div style={{
              position: 'absolute', bottom: 0, left: 0, right: 0,
              background: 'linear-gradient(to top, rgba(0,0,0,0.92) 0%, rgba(0,0,0,0.75) 55%, transparent 100%)',
              padding: '48px 28px 36px',
            }}>
              <div style={{
                display: 'inline-flex', alignItems: 'center', gap: 6, marginBottom: 12,
                background: 'rgba(255,255,255,0.12)', border: '1px solid rgba(255,255,255,0.25)',
                padding: '4px 12px', borderRadius: 99,
              }}>
                <span style={{ fontSize: 13 }}>{openPOI.icon}</span>
                <span style={{ color: 'white', fontSize: 12, fontWeight: 600 }}>{openPOI.name}</span>
              </div>
              <h2 style={{ color: 'white', fontSize: 26, fontWeight: 700, margin: '0 0 10px', lineHeight: 1.2 }}>
                {openPOI.title}
              </h2>
              <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: 14, lineHeight: 1.65, margin: '0 0 26px' }}>
                {openPOI.desc}
              </p>
              <div style={{ display: 'flex', gap: 10 }}>
                <button style={{
                  padding: '10px 22px', borderRadius: 99,
                  background: 'rgba(255,255,255,0.14)', backdropFilter: 'blur(8px)',
                  border: '1.5px solid rgba(255,255,255,0.38)',
                  color: 'white', fontSize: 14, fontWeight: 500, cursor: 'pointer',
                }}>Firsthand</button>
                <button style={{
                  padding: '10px 22px', borderRadius: 99,
                  background: 'rgba(255,255,255,0.14)', backdropFilter: 'blur(8px)',
                  border: '1.5px solid rgba(255,255,255,0.38)',
                  color: 'white', fontSize: 14, fontWeight: 500, cursor: 'pointer',
                }}>Context</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Main route complete */}
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
              background: '#5272FF',
              borderRadius: 16, fontSize: 16, fontWeight: 600,
              color: 'white', cursor: 'pointer', border: 'none',
            }}
          >
            Choose a Path →
          </button>
        </div>
      )}

      {/* Branch route complete */}
      {done && branchRoute && (
        <div style={{
          position: 'absolute', inset: 0, zIndex: 2000,
          background: 'rgba(255,255,255,0.10)',
          backdropFilter: 'blur(12px)',
          display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center',
          padding: '0 32px',
        }}>
          <div style={{
            display: 'flex', alignItems: 'center', gap: 6,
            background: 'white', border: '1px solid #FFFFFF',
            borderRadius: 999, padding: '6px 14px', marginBottom: 28,
          }}>
            <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.08em', color: '#0049C5' }}>DESTINATION REACHED</span>
          </div>
          <div style={{ fontSize: 28, fontWeight: 800, color: '#0a0a0a', textAlign: 'center', lineHeight: 1.2, marginBottom: 60 }}>
            You've reached<br />your destination!
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12, width: '100%' }}>
            <button
              onClick={() => navigate('/map/explore')}
              style={{
                width: '100%', padding: '17px',
                background: '#1d4ed8',
                borderRadius: 999, fontSize: 16, fontWeight: 600,
                color: 'white', cursor: 'pointer', border: 'none',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
              }}
            >
              New Route <span style={{ fontSize: 18 }}>➤</span>
            </button>
            <button
              onClick={() => navigate('/perspectives')}
              style={{
                width: '100%', padding: '17px',
                background: '#E7E7F4',
                borderRadius: 999, fontSize: 16, fontWeight: 600,
                color: '#111827', cursor: 'pointer', border: 'none',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
              }}
            >
              Digital Archive <span style={{fontSize: 18}}>📖</span>
            </button>
            <button
              onClick={() => navigate('/map/overview')}
              style={{
                background: 'none', border: 'none', fontSize: 18, color: '#8F8F8F', cursor: 'pointer', marginTop: 4 }}
            >
              Home
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
