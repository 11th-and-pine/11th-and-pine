import { useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Map, { Source, Layer, Marker } from 'react-map-gl'
import 'mapbox-gl/dist/mapbox-gl.css'

const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_TOKEN

const MAIN_ROUTE = [
  [47.61208726167953, -122.33701558200671],
  [47.6117017475211, -122.33664367843423],
  [47.61217739456354, -122.33554583325099],
  [47.61311511374411, -122.33330990771319],
  [47.61357524872394, -122.33220631461666],
  [47.61528546767674, -122.32803424183338],
  [47.61532231916068, -122.32569616528335],
  [47.61534637433494, -122.31998484534672]
]

const EXPLORE_ROUTES = [
  { color: '#f59e0b', path: [
    [47.61534637433494, -122.31998484534672],
    [47.61537792391303, -122.31834587334546],
    [47.615189438501694, -122.318284960829],
    [47.61518751104897, -122.31702045803209],
    [47.61507232602374, -122.31699950222341],
    [47.61756130800152, -122.31705670186719],
    [47.617590861940066, -122.31830937728371]
  ]},
  { color: '#8b5cf6', path: [
    [47.61534637433494, -122.31998484534672],
    [47.6153546928591, -122.31972629234374],
    [47.616353487308146, -122.31971489484106],
    [47.61669915254774, -122.31993723533854],
    [47.61694097312205, -122.31973907492669],
    [47.61699624623915, -122.3191343440146],
    [47.61803690317238, -122.31941907806251],
    [47.618674847206655, -122.320057007748]
  ]},
  { color: '#22c55e', path: [
    [47.61534637433494, -122.31998484534672],
    [47.61537792391303, -122.31834587334546],
    [47.61644970344747, -122.31829245310354],
    [47.618667480923264, -122.3183265120806],
    [47.61871203860535, -122.31707799892192]
  ]},
  { color: '#ec4899', path: [
    [47.61534637433494, -122.31998484534672],
    [47.618724352103335, -122.32003383177313],
    [47.6186916006176, -122.31948316444459],
    [47.6183586260147, -122.31872194784339],
    [47.61810752901002, -122.31941028200404]
  ]},
  { color: '#06b6d4', path: [
    [47.61534637433494, -122.31998484534672],
    [47.61539797647727, -122.3197373210817],
    [47.616384131027495, -122.31970265459985],
    [47.61642619407816, -122.31846159454928],
    [47.61758057794659, -122.31837839488288],
    [47.61865081390424, -122.31837146158365],
    [47.61871624246526, -122.31962638822698]
  ]},
]

const toLngLat = ([lat, lng]) => [lng, lat]

// tags on the sheet
const TAGS = ['Uprising', 'Movement', 'Resistance']

// Snap positions as fraction of container height (sheet top)
const SheetOrigin = 0.60
const SheetCollapsed = 0.90

export default function RouteOverview() {
  const navigate = useNavigate()
  const mapRef = useRef()
  const containerRef = useRef()

  const [sheetFraction, setSheetFraction] = useState(SheetOrigin)
  const sheetFractionRef = useRef(SheetOrigin)
  const drag = useRef({ active: false, startY: 0, startFraction: SheetOrigin})

  const handleMapLoad = () => {
    const allPoints = [...MAIN_ROUTE, ...EXPLORE_ROUTES.flatMap(r => r.path)]
    const lngs = allPoints.map(p => p[1])
    const lats = allPoints.map(p => p[0])
    if (mapRef.current) {
      mapRef.current.fitBounds(
        [[Math.min(...lngs), Math.min(...lats)], [Math.max(...lngs), Math.max(...lats)]],
        { padding: { top: 50, bottom: 180, left: 30, right: 30 }, duration: 600 }
      )
    }
  }

  const onPointerDown = (e) => {
    drag.current = { active: true, startY: e.clientY, startFraction: sheetFraction }
    e.currentTarget.setPointerCapture(e.pointerId)
  }

  const onPointerMove = (e) => {
    if (!drag.current.active) return
    let h = 800
    if (containerRef.current) {
      h = containerRef.current.offsetHeight
    }
    const delta = (e.clientY - drag.current.startY) / h
    const newFraction = Math.min(
      SheetCollapsed,
      Math.max(0.18, drag.current.startFraction + delta)
    )
    setSheetFraction(newFraction)
    sheetFractionRef.current = newFraction
  }

  const onPointerUp = () => {
    if (!drag.current.active) return
    drag.current.active = false
    const mid = (SheetOrigin + SheetCollapsed) / 2
    const current = sheetFractionRef.current
    setSheetFraction(current < mid ? SheetOrigin : SheetCollapsed)
  }

  const isAnimating = !drag.current.active

  return (
    <div ref={containerRef} style={{ height: '100%', width: '100%', position: 'relative', overflow: 'hidden' }}>

      {/* ── Full-height interactive map ── */}
      <Map
        ref={mapRef}
        mapboxAccessToken={MAPBOX_TOKEN}
        initialViewState={{ longitude: -122.328, latitude: 47.6148, zoom: 13 }}
        style={{ width: '100%', height: '100%' }}
        mapStyle="mapbox://styles/mapbox/light-v11"
        onLoad={handleMapLoad}
        attributionControl={false}
      >
        {EXPLORE_ROUTES.map((route, i) => (
          <Source key={i} id={`explore-${i}`} type="geojson"
            data={{ type: 'Feature', geometry: { type: 'LineString', coordinates: route.path.map(toLngLat) } }}
          >
            <Layer id={`explore-layer-${i}`} type="line"
              layout={{ 'line-cap': 'round', 'line-join': 'round' }}
              paint={{ 'line-color': route.color, 'line-width': 3, 'line-opacity': 0.6, 'line-dasharray': [2, 1.5] }}
            />
          </Source>
        ))}

        <Source id="main-route" type="geojson"
          data={{ type: 'Feature', geometry: { type: 'LineString', coordinates: MAIN_ROUTE.map(toLngLat) } }}
        >
          <Layer id="main-route-layer" type="line"
            layout={{ 'line-cap': 'round', 'line-join': 'round' }}
            paint={{ 'line-color': '#5272FF', 'line-width': 5, 'line-opacity': 0.9 }}
          />
        </Source>

        {EXPLORE_ROUTES.map((route, i) => {
          const end = route.path[route.path.length - 1]
          return (
            <Marker key={`end-${i}`} longitude={end[1]} latitude={end[0]} anchor="center">
              <div style={{ width: 10, height: 10, background: route.color, border: '2.5px solid white', borderRadius: '50%', boxShadow: `0 2px 8px ${route.color}88` }} />
            </Marker>
          )
        })}

        <Marker longitude={MAIN_ROUTE[0][1]} latitude={MAIN_ROUTE[0][0]} anchor="center">
          <div style={{ width: 14, height: 14, background: '#5272FF', border: '3px solid white', borderRadius: '50%', boxShadow: '0 2px 8px rgba(82,114,255,0.6)' }} />
        </Marker>

        <Marker longitude={MAIN_ROUTE[MAIN_ROUTE.length - 1][1]} latitude={MAIN_ROUTE[MAIN_ROUTE.length - 1][0]} anchor="center">
          <div style={{ width: 14, height: 14, background: '#5272FF', border: '3px solid white', borderRadius: '50%', boxShadow: '0 2px 8px rgba(82,114,255,0.6)' }} />
        </Marker>
      </Map>

      {/* ── Draggable bottom sheet ── */}
      <div style={{
        position: 'absolute',
        top: `${sheetFraction * 100}%`,
        left: 0, right: 0, bottom: 0,
        background: 'white',
        borderRadius: '22px 22px 0 0',
        boxShadow: '0 -6px 32px rgba(0,0,0,0.13)',
        transition: isAnimating ? 'top 0.3s cubic-bezier(0.32,0.72,0,1)' : 'none',
        zIndex: 10,
        display: 'flex', flexDirection: 'column',
      }}>
        {/* Drag handle */}
        <div
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerCancel={onPointerUp}
          style={{ padding: '14px 0 8px', cursor: 'grab', touchAction: 'none', flexShrink: 0 }}
        >
          <div style={{ width: 40, height: 4, background: '#d1d5db', borderRadius: 2, margin: '0 auto' }} />
        </div>

        {/* Content */}
        <div style={{ padding: '8px 24px 36px', overflowY: 'auto', flex: 1 }}>
          <div style={{ fontSize: 28, fontWeight: 800, color: '#0a0a0a', marginBottom: 16, letterSpacing: '-0.5px', textAlign: 'center' }}>
            Your Journey
          </div>

          <div style={{ display: 'flex', gap: 8, marginBottom: 20, flexWrap: 'wrap', justifyContent: 'center' }}>
            {TAGS.map(tag => (
              <span key={tag} style={{
                padding: '6px 16px',
                border: '1.5px solid #d1d5db',
                borderRadius: 999,
                fontSize: 13, fontWeight: 500,
                color: '#374151',
              }}>
                {tag}
              </span>
            ))}
          </div>

          <p style={{ fontSize: 15, fontWeight: 600, color: '#111827', lineHeight: 1.6, margin: '0 0 28px', textAlign: 'center' }}>
            Follow the main route first, then choose your own path to explore different perspectives.
          </p>

          <button
            onClick={() => navigate('/map/navigate')}
            style={{
              width: '100%',
              background: '#84C4FF',
              color: '#0a0a0a', border: 'none',
              padding: '16px', borderRadius: 16,
              fontSize: 16, fontWeight: 600,
              cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
            }}
          >
            Let's Start →
          </button>
        </div>
      </div>

    </div>
  )
}
