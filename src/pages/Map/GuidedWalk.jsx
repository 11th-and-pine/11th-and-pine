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
  const [triggeredPOIs, setTriggeredPOIs] = useState(new Set())
  const [pendingPOI, setPendingPOI] = useState(null)
  const [openPOI, setOpenPOI] = useState(null)

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

  const currentPoint = route[step] || route[route.length - 1] || MAIN_ROUTE[0]
  const [curLat, curLng] = currentPoint
  const activeRegion = getActiveRegion(curLat, curLng)

  const traveled = route.slice(0, step + 1)

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
    setTriggeredPOIs(new Set())
    setPendingPOI(null)

    clearInterval(simTimer.current)
    simTimer.current = null
  }, [route])

  // POI proximity — trigger once per POI when step passes its triggerStep
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
        {!done && <Marker longitude={toLngLat(currentPoint)[0]} latitude={toLngLat(currentPoint)[1]} anchor="center">
          <div style={{ position: 'relative', width: 26, height: 26, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <div style={{
              position: 'absolute', inset: 0,
              background: `${routeColor}33`,
              borderRadius: '50%',
              animation: 'walkerPulse 1.8s ease-out infinite'
            }} />
            <div style={{ width: 14, height: 14, background: routeColor, border: '3px solid white', 
              borderRadius: '50%', boxShadow: `0 2px 10px ${routeColor}b3` 
            }} />
          </div>
        </Marker>}
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
            background: 'white',
            backdropFilter: 'blur(12px)',
            WebkitBackdropFilter: 'blur(12px)',
            borderRadius: 14,
            padding: '6px 14px',
          }}>
            {activeRegion ? (
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
      {!done && (
        <div style={{ position: 'absolute', right: 14, bottom: 200, zIndex: 1000, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
          <button onClick={() => setSimulating(v => !v)} style={{
            width: 50, height: 50, borderRadius: '50%', 
            background: '#7D92A7',
            backdropFilter: 'blur(8px)', color: 'white', fontSize: 18, cursor: 'pointer',
            boxShadow: '0 3px 14px rgba(0,0,0,0.45)',
            display: 'flex', alignItems: 'center', justifyContent: 'center'
          }}>{simulating ? '⏸' : '▶'}</button>
          <span style={{ color: 'white', fontSize: 10, fontWeight: 600, background: 'rgba(0,0,0,0.45)', padding: '2px 7px', borderRadius: 8 }}>Walking Simulation</span>
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
            {/* Play/pause button */}
            <button
              onClick={() => setAudioPlaying(v => !v)}
              style={{
                width: 56, height: 56, borderRadius: '50%',
                background: '#1d4ed8', color: 'white',
                fontSize: 20, cursor: 'pointer', flexShrink: 0,
                display: 'flex', alignItems: 'center', justifyContent: 'center'
              }}
            >
              {audioPlaying ? '⏸' : '▶'}
            </button>

            {/* Track info + progress */}
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 15, fontWeight: 700, color: '#111827', marginBottom: 2 }}>Title</div>
              <div style={{ fontSize: 13, color: routeColor, marginBottom: 10 }}>
                {branchRoute ? branchRoute.title : 'Main Route'}
              </div>
              {/* Progress bar */}
              <div style={{ height: 6, background: '#e5e7eb', borderRadius: 3, overflow: 'hidden' }}>
                <div style={{
                  height: '100%', borderRadius: 3,
                  background: '#1d4ed8',
                  width: `${audioProgress}%`,
                  transition: 'width 0.15s linear'
                }} />
              </div>
              {/* Time */}
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

            {/* Large emoji centered in top portion */}
            <div style={{
              position: 'absolute', top: 80, left: 0, right: 0,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 80, opacity: 0.35,
            }}>{openPOI.icon}</div>

            {/* X close button */}
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

            {/* Bottom content over gradient */}
            <div style={{
              position: 'absolute', bottom: 0, left: 0, right: 0,
              background: 'linear-gradient(to top, rgba(0,0,0,0.92) 0%, rgba(0,0,0,0.75) 55%, transparent 100%)',
              padding: '48px 28px 36px',
            }}>
              {/* Tag */}
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
              background: '#5272FF',
              borderRadius: 16, fontSize: 16, fontWeight: 600,
              color: 'white', cursor: 'pointer'
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
          background: 'rgba(255,255,255,0.10)',
          backdropFilter: 'blur(12px)',
          display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center',
          padding: '0 32px',
        }}>
          {/* Top label */}
          <div style={{
            display: 'flex', alignItems: 'center', gap: 6,
            background: 'white', border: '1px solid #FFFFFF',
            borderRadius: 999, padding: '6px 14px', marginBottom: 28,
          }}>
            <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.08em', color: '#0049C5' }}>DESTINATION REACHED</span>
          </div>

          {/* Main text */}
          <div style={{ fontSize: 28, fontWeight: 800, color: '#0a0a0a', textAlign: 'center', lineHeight: 1.2, marginBottom: 60 }}>
            You've reached<br />your destination!
          </div>

          {/* Buttons */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12, width: '100%' }}>
            <button
              onClick={() => navigate('/map/explore')}
              style={{
                width: '100%', padding: '17px',
                background: '#1d4ed8',
                borderRadius: 999, fontSize: 16, fontWeight: 600,
                color: 'white', cursor: 'pointer',
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
                color: '#111827', cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
              }}
            >
              Digital Archive <span style={{fontSize: 18}}>📖</span>
            </button>
            <button
              onClick={() => navigate('/map/overview')}
              style={{
                background: 'none', fontSize: 18, color: '#8F8F8F', cursor: 'pointer', marginTop: 4 }}
            >
              Home
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
