import { useState, useRef, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import Map, { Source, Layer, Marker } from 'react-map-gl'
import 'mapbox-gl/dist/mapbox-gl.css'

const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_TOKEN

const toLngLat = ([lat, lng]) => [lng, lat]

const ROUTES = [
  {
    id: 1,
    title: "Alex's Route",
    role: 'Community Organizer',
    desc: 'Follow the path of the first organizers on the ground.',
    color: '#f59e0b',
    path: [
      [47.61534637433494, -122.31998484534672],
      [47.61537792391303, -122.31834587334546],
      [47.615189438501694, -122.318284960829],
      [47.61518751104897, -122.31702045803209],
      [47.61507232602374, -122.31699950222341],
      [47.61756130800152, -122.31705670186719],
      [47.617590861940066, -122.31830937728371]
    ]
  },
  {
    id: 2,
    title: "Jordan's Route",
    role: 'Local Resident',
    desc: 'See the neighborhood through the eyes of someone who lived it.',
    color: '#8b5cf6',
    path: [
      [47.61534637433494, -122.31998484534672],
      [47.6153546928591, -122.31972629234374],
      [47.616353487308146, -122.31971489484106],
      [47.61669915254774, -122.31993723533854],
      [47.61694097312205, -122.31973907492669],
      [47.61699624623915, -122.3191343440146],
      [47.61803690317238, -122.31941907806251],
      [47.618674847206655, -122.320057007748]
    ]
  },
  {
    id: 3,
    title: "Sam's Route",
    role: 'Street Medic',
    desc: 'From the park entrance past Oddfellows, down to the East Precinct and Broadway.',
    color: '#22c55e',
    path: [
      [47.61534637433494, -122.31998484534672],
      [47.61537792391303, -122.31834587334546],
      [47.61644970344747, -122.31829245310354],
      [47.618667480923264, -122.3183265120806],
      [47.61871203860535, -122.31707799892192]
    ]
  },
  {
    id: 4,
    title: 'Neighborhood Loop',
    role: 'Local Witness',
    desc: 'Circle the park exterior via Victrola, a residential block, and Rhein Haus.',
    color: '#ec4899',
    path: [
      [47.61534637433494, -122.31998484534672],
      [47.618724352103335, -122.32003383177313],
      [47.6186916006176, -122.31948316444459],
      [47.6183586260147, -122.31872194784339],
      [47.61810752901002, -122.31941028200404]
    ]
  },
  {
    id: 5,
    title: 'The Vigil Walk',
    role: 'Community Elder',
    desc: 'Trace the candlelit path of nightly vigils through the north side of the zone.',
    color: '#06b6d4',
    path: [
      [47.61534637433494, -122.31998484534672],
      [47.61539797647727, -122.3197373210817],
      [47.616384131027495, -122.31970265459985],
      [47.61642619407816, -122.31846159454928],
      [47.61758057794659, -122.31837839488288],
      [47.61865081390424, -122.31837146158365],
      [47.61871624246526, -122.31962638822698]
    ]
  },
]

// Compute responsive snap point heights (in px) from a viewport height.
// Returns the *visible* height of the sheet at each snap position.
// Two snap positions: peek (handle + title only) and full (handle + title + cards + button).
function computeSnaps(vh) {
  const peek = 96                                                     // just handle + title peek
  const full = Math.round(Math.min(Math.max(vh * 0.40, 320), 360))    // tight: handle + title + cards + button
  return { peek, full }
}

export default function ExploreRoutes() {
  const navigate = useNavigate()
  const mapRef = useRef()
  const [selectedId, setSelectedId] = useState(null)

  // Track viewport height so the sheet adapts when the window resizes / rotates.
  const [vh, setVh] = useState(() => (typeof window !== 'undefined' ? window.innerHeight : 800))
  useEffect(() => {
    const onResize = () => setVh(window.innerHeight)
    window.addEventListener('resize', onResize)
    window.addEventListener('orientationchange', onResize)
    return () => {
      window.removeEventListener('resize', onResize)
      window.removeEventListener('orientationchange', onResize)
    }
  }, [])

  const snaps = computeSnaps(vh)
  // Track which snap we're on (0=peek, 1=full) plus an optional drag override.
  const [snapIndex, setSnapIndex] = useState(1) // start fully open
  const [dragH, setDragH] = useState(null) // non-null while user is dragging
  const [dragging, setDragging] = useState(false)
  const dragRef = useRef({ startClientY: 0, startH: 0, lastClientY: 0, lastT: 0, v: 0 })

  const snapHeights = [snaps.peek, snaps.full]
  // Current visible height: use drag override if present, otherwise the current snap.
  const sheetH = dragH != null ? dragH : snapHeights[snapIndex]

  const snapTo = useCallback((px) => {
    const s = computeSnaps(window.innerHeight)
    const candidates = [s.peek, s.full]
    let bestIdx = 0
    let bestDist = Infinity
    for (let i = 0; i < candidates.length; i++) {
      const d = Math.abs(candidates[i] - px)
      if (d < bestDist) {
        bestDist = d
        bestIdx = i
      }
    }
    setSnapIndex(bestIdx)
    setDragH(null)
  }, [])

  function onPointerDown(e) {
    // Only left mouse / touch / pen
    if (e.button !== undefined && e.button !== 0) return
    dragRef.current = {
      startClientY: e.clientY,
      startH: sheetH,
      lastClientY: e.clientY,
      lastT: performance.now(),
      v: 0,
    }
    setDragging(true)
    setDragH(dragRef.current.startH)
    // setPointerCapture may throw on some browsers; safe to ignore.
    if (e.currentTarget && e.currentTarget.setPointerCapture) {
      try { e.currentTarget.setPointerCapture(e.pointerId) } catch (err) { void err }
    }
  }

  function onPointerMove(e) {
    if (!dragging) return
    const now = performance.now()
    const dt = Math.max(1, now - dragRef.current.lastT)
    dragRef.current.v = (e.clientY - dragRef.current.lastClientY) / dt // px/ms, positive = moving down
    dragRef.current.lastClientY = e.clientY
    dragRef.current.lastT = now

    // Dragging down -> shrink height; dragging up -> grow height.
    const rawH = dragRef.current.startH - (e.clientY - dragRef.current.startClientY)
    // Allow a little rubber-banding past the bounds.
    const clamped = Math.max(snaps.peek - 20, Math.min(snaps.full + 30, rawH))
    setDragH(clamped)
  }

  function onPointerUp(e) {
    if (!dragging) return
    setDragging(false)
    if (e.currentTarget && e.currentTarget.releasePointerCapture) {
      try { e.currentTarget.releasePointerCapture(e.pointerId) } catch (err) { void err }
    }

    const v = dragRef.current.v // px/ms, positive = moving down (shrink)
    const cur = sheetH
    const { peek, full } = snaps

    let target
    if (Math.abs(v) > 0.6) {
      // Flick: prefer direction of motion.
      target = v > 0 ? peek : full
    } else {
      // Slow release: snap to nearest of the two positions.
      target = Math.abs(peek - cur) < Math.abs(full - cur) ? peek : full
    }
    snapTo(target)
  }

  const activeRoute = ROUTES.find(r => r.id === selectedId) || null

  function onMapLoad() {
    const allPoints = ROUTES.flatMap(r => r.path)
    const lngs = allPoints.map(p => p[1])
    const lats = allPoints.map(p => p[0])
    if (mapRef.current) {
      mapRef.current.fitBounds(
        [[Math.min.apply(null, lngs), Math.min.apply(null, lats)], [Math.max.apply(null, lngs), Math.max.apply(null, lats)]],
        { padding: { top: 60, bottom: Math.min(snaps.full + 20, vh * 0.6), left: 40, right: 40 }, duration: 600 }
      )
    }
  }

  function onMapClick(e) {
    const routeId = e.features && e.features[0] && e.features[0].properties.routeId
    if (routeId != null) toggleRoute(routeId)
  }

  function toggleRoute(id) {
    setSelectedId(prev => (prev === id ? null : id))
  }

  const btnBg = activeRoute ? activeRoute.color : '#e5e7eb'
  const btnColor = activeRoute ? 'white' : '#9ca3af'
  const btnLabel = activeRoute ? `Start ${activeRoute.title} →` : 'Select a route to begin'


  return (
    <div style={{ height: '100%', width: '100%', position: 'relative', overflow: 'hidden' }}>
      <Map
        ref={mapRef}
        mapboxAccessToken={MAPBOX_TOKEN}
        initialViewState={{ longitude: -122.3185, latitude: 47.6165, zoom: 15 }}
        style={{ width: '100%', height: '100%' }}
        mapStyle="mapbox://styles/mapbox/light-v11"
        onLoad={onMapLoad}
        interactiveLayerIds={ROUTES.map(r => `route-line-${r.id}`)}
        onClick={onMapClick}
        attributionControl={false}
      >
        {ROUTES.map(route => {
          const active = selectedId === route.id
          const lineWidth = active ? 6 : 4
          const lineOpacity = active ? 1 : 0.35
          const glowOpacity = active ? 0.15 : 0

          return (
            <Source key={route.id} id={`route-${route.id}`} type="geojson" data={{
              type: 'Feature',
              properties: { routeId: route.id },
              geometry: { type: 'LineString', coordinates: route.path.map(toLngLat) },
            }}>
              <Layer id={`route-glow-${route.id}`} type="line"
                layout={{ 'line-cap': 'round', 'line-join': 'round' }}
                paint={{ 'line-color': route.color, 'line-width': 18, 'line-opacity': glowOpacity }}
              />
              <Layer id={`route-line-${route.id}`} type="line"
                layout={{ 'line-cap': active ? 'round' : 'butt', 'line-join': 'round' }}
                paint={{
                  'line-color': route.color,
                  'line-width': lineWidth,
                  'line-opacity': lineOpacity,
                  ...(!active && { 'line-dasharray': [2, 2] }),
                }}
              />
            </Source>
          )
        })}

        {/* Start dots */}
        {ROUTES.map(route => (
          <Marker key={`start-${route.id}`} longitude={route.path[0][1]} latitude={route.path[0][0]} anchor="center"
            onClick={() => toggleRoute(route.id)}>
            <div style={{
              width: 11, height: 11, background: route.color, border: '2.5px solid white', borderRadius: '50%',
              boxShadow: '0 1px 6px rgba(0,0,0,0.5)', cursor: 'pointer',
            }} />
          </Marker>
        ))}

        {/* End dots */}
        {ROUTES.map(route => {
          const end = route.path[route.path.length - 1]
          return (
            <Marker key={`end-${route.id}`} longitude={end[1]} latitude={end[0]} anchor="center">
              <div style={{
                width: 10, height: 10, background: route.color, border: '2.5px solid white',
                borderRadius: '50%', boxShadow: `0 2px 8px ${route.color}88`,
              }} />
            </Marker>
          )
        })}
      </Map>

      {/* Back button */}
      <div style={{
        position: 'absolute', top: 0, left: 0, right: 0, zIndex: 1000,
        padding: '18px 16px 16px',
      }}>
        <button onClick={() => navigate(-1)} aria-label="Back" style={{
          width: 39, height: 39, borderRadius: '50%', flexShrink: 0,
          background: '#ffffff', boxShadow: '0 0 0 4px rgba(0,0,0,0.06)',
          border: 'none', cursor: 'pointer', padding: 0,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <svg width="16" height="18" viewBox="0 0 16 16" fill="none">
            <path d="M10 3L5 8L10 13" stroke="#111827" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
      </div>

      {/* Draggable bottom sheet */}
      <div
        style={{
          position: 'absolute', left: 0, right: 0, bottom: 0, zIndex: 1000,
          height: sheetH,
          background: 'white',
          borderRadius: '24px 24px 0 0',
          boxShadow: '0 -4px 24px rgba(0,0,0,0.10)',
          transition: dragging ? 'none' : 'height 0.32s cubic-bezier(0.22, 1, 0.36, 1)',
          display: 'flex', flexDirection: 'column',
          overflow: 'hidden',
          touchAction: 'none',
          willChange: 'height',
        }}
      >
        {/* Drag handle / header (draggable area) */}
        <div
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerCancel={onPointerUp}
          onDoubleClick={() => snapTo(sheetH < (snaps.peek + snaps.full) / 2 ? snaps.full : snaps.peek)}
          style={{
            padding: '10px 20px 12px',
            cursor: dragging ? 'grabbing' : 'grab',
            userSelect: 'none',
            flexShrink: 0,
          }}
        >
          <div style={{
            width: 40, height: 4, background: dragging ? '#9ca3af' : '#d1d5db',
            borderRadius: 2, margin: '2px auto 12px',
            transition: 'background 0.2s',
          }} />
          <div style={{ color: '#111827', fontWeight: 700, fontSize: 16 }}>Choose your path</div>
          <div style={{ color: '#6b7280', fontSize: 13, marginTop: 3 }}>Each route tells a different story</div>
        </div>

        {/* Horizontal card strip (fades out when the sheet is collapsed to peek) */}
        <div style={{
          flexShrink: 0,
          overflow: 'hidden',
          opacity: sheetH > snaps.peek + 20 ? 1 : 0,
          transition: 'opacity 0.2s',
          pointerEvents: sheetH > snaps.peek + 20 ? 'auto' : 'none',
        }}>
          <div style={{
            display: 'flex',
            gap: 10,
            overflowX: 'auto',
            padding: '0 20px 4px',
            scrollbarWidth: 'none',
          }}>
            {ROUTES.map(route => {
              const active = selectedId === route.id
              const cardBg = active ? route.color + '12' : '#f9fafb'
              const cardBorder = active ? route.color + '80' : '#e5e7eb'
              const roleColor = active ? route.color : '#6b7280'

              return (
                <button key={route.id} onClick={() => toggleRoute(route.id)} style={{
                  flexShrink: 0, width: 150, textAlign: 'left',
                  background: cardBg,
                  border: `1.5px solid ${cardBorder}`,
                  borderRadius: 16, padding: '12px', cursor: 'pointer', transition: 'all 0.2s',
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 8 }}>
                    <div style={{
                      width: 28, height: 28, borderRadius: 8, flexShrink: 0, background: `${route.color}18`,
                      border: `1px solid ${route.color}44`, display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>
                      <div style={{ width: 8, height: 8, borderRadius: '50%', background: route.color }} />
                    </div>
                    <span style={{ color: '#9ca3af', fontSize: 11 }}>Route {route.id}</span>
                  </div>
                  <div style={{ color: '#111827', fontSize: 13, fontWeight: 600, marginBottom: 2 }}>{route.title}</div>
                  <div style={{ color: roleColor, fontSize: 11, marginBottom: 6 }}>{route.role}</div>
                  <div style={{ color: '#9ca3af', fontSize: 11, lineHeight: 1.4 }}>{route.desc}</div>
                </button>
              )
            })}
          </div>
        </div>

        {/* Flexible spacer so any extra vertical room sits below the button, not between card and button */}
        <div style={{ flex: 1, minHeight: 0 }} />

        {/* Start button pinned to bottom of sheet (hidden at peek) */}
        <div style={{
          padding: '12px 20px calc(16px + env(safe-area-inset-bottom, 0px))',
          flexShrink: 0,
          background: 'white',
          opacity: sheetH > snaps.peek + 20 ? 1 : 0,
          transition: 'opacity 0.2s',
          pointerEvents: sheetH > snaps.peek + 20 ? 'auto' : 'none',
        }}>
          <button
            disabled={!activeRoute}
            onClick={() => activeRoute && navigate('/map/walking', { state: { route: activeRoute } })}
            style={{
              width: '100%',
              background: btnBg,
              color: btnColor,
              padding: '15px', borderRadius: 16,
              fontSize: 16, fontWeight: 600,
              border: 'none',
              cursor: activeRoute ? 'pointer' : 'default',
              transition: 'all 0.25s',
            }}
          >
            {btnLabel}
          </button>
        </div>
      </div>
    </div>
  )
}
