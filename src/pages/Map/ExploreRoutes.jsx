import { useState, useRef } from 'react'
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
    ],
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
    ],
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
    ],
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
    ],
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
    ],
  },
]

export default function ExploreRoutes() {
  const navigate = useNavigate()
  const [selectedId, setSelectedId] = useState(null)
  const mapRef = useRef()

  const activeRoute = ROUTES.find(r => r.id === selectedId) || null

  function onMapLoad() {
    const allPoints = ROUTES.flatMap(r => r.path)
    const lngs = allPoints.map(p => p[1])
    const lats = allPoints.map(p => p[0])
    if (mapRef.current) {
      mapRef.current.fitBounds(
        [[Math.min.apply(null, lngs), Math.min.apply(null, lats)], [Math.max.apply(null, lngs), Math.max.apply(null, lats)]], 
        {padding: { top: 60, bottom: 260, left: 40, right: 40 }, duration: 600}
      )
    }
  }

  function onMapClick(e) {
    const routeId = e.features && e.features[0] && e.features[0].properties.routeId
    if (routeId != null) toggleRoute(routeId)
  }

  function toggleRoute(id) {
    setSelectedId(prev => {
      if (prev === id) {
        return null
      } else {
        return id
      }
    })
  }

  const btnBg = activeRoute ? activeRoute.color : '#e5e7eb'
  const btnColor = activeRoute ? 'white' : '#9ca3af'
  const btnLabel = activeRoute ? `Start ${activeRoute.title} →` : 'Select a route to begin'

  return (
    <div style={{height: '100%', width: '100%', position: 'relative', overflow: 'hidden'}}>
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
            <div style={{ width: 11, height: 11, background: route.color, border: '2.5px solid white', borderRadius: '50%', 
              boxShadow: '0 1px 6px rgba(0,0,0,0.5)', cursor: 'pointer' 
            }} />
          </Marker>
        ))}

        {/* End dots */}
        {ROUTES.map(route => {
          const end = route.path[route.path.length - 1]
          return (
            <Marker key={`end-${route.id}`} longitude={end[1]} latitude={end[0]} anchor="center">
              <div style={{ width: 10, height: 10, background: route.color, border: '2.5px solid white', 
                borderRadius: '50%', boxShadow: `0 2px 8px ${route.color}88` 
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
        <button onClick={() => navigate(-1)} style={{
            width: 42, height: 42, borderRadius: '50%', flexShrink: 0,
            background: 'white', boxShadow: '0 0 0 6px rgba(0,0,0,0.06)',
            border: 'none', cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M10 3L5 8L10 13" stroke="#111827" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
        </button>
      </div>

      {/* Bottom drawer */}
      <div style={{
        position: 'absolute', bottom: 0, left: 0, right: 0, zIndex: 1000,
        background: 'white', borderRadius: '24px 24px 0 0',
        boxShadow: '0 -4px 24px rgba(0,0,0,0.10)',
        padding: '12px 0 36px',
      }}>
        <div style={{ width: 40, height: 4, background: '#d1d5db', borderRadius: 2, margin: '0 auto 16px' }} />

        <div style={{ padding: '0 20px 12px' }}>
          <div style={{ color: '#111827', fontWeight: 700, fontSize: 16 }}>Choose your path</div>
          <div style={{ color: '#6b7280', fontSize: 13, marginTop: 3 }}>Each route tells a different story</div>
        </div>

        {/* Scrollable route cards */}
        <div style={{ display: 'flex', gap: 10, overflowX: 'auto', padding: '0 20px 4px', scrollbarWidth: 'none' }}>
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
                  <div style={{ width: 28, height: 28, borderRadius: 8, flexShrink: 0, background: `${route.color}18`, border: `1px solid ${route.color}44`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
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

        {/* Start button */}
        <div style={{padding: '14px 20px 0'}}>
          <button
            disabled={!activeRoute}
            onClick={() => activeRoute && navigate('/map/walking', {state: {route: activeRoute}})}
            style={{
              width: '100%',
              background: btnBg,
              color: btnColor,
              padding: '15px', borderRadius: 16,
              fontSize: 16, fontWeight: 600,
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
