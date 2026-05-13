import { useRef, useState, useLayoutEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import Map, { Source, Layer, Marker } from 'react-map-gl'
import 'mapbox-gl/dist/mapbox-gl.css'
import PinIcon from '../../components/PinIcon'

const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_TOKEN
const INITIAL_VIEW_STATE = {longitude: -122.328, latitude: 47.6148, zoom: 15}
const MAP_STYLE = 'mapbox://styles/mapbox/light-v11'

// Height of the "peek" area visible when the sheet is collapsed (drag handle + title)
const COLLAPSED_PEEK = 88

const WESTLAKE_ROUTE = [
  [47.61208726167953, -122.33701558200671],
  [47.6117017475211, -122.33664367843423],
  [47.61217739456354, -122.33554583325099],
  [47.61311511374411, -122.33330990771319],
  [47.61357524872394, -122.33220631461666],
  [47.61528546767674, -122.32803424183338],
  [47.61532231916068, -122.32569616528335],
  [47.61534637433494, -122.31998484534672]
]

const CHOP_ROUTES = [
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

const POIS = [
  {
    id: 1,
    position: [47.6120, -122.3358],
    name: 'Westlake Plaza',
    title: 'Where the March Began',
    desc: 'On June 1st, 2020, thousands gathered at Westlake Plaza before marching east up Pine Street. Speakers read names of those lost to police violence as the crowd swelled past the monorail and spilled into the streets.'
  },
  {
    id: 2,
    position: [47.6136, -122.3318],
    name: 'Pike/Pine Corridor',
    title: 'From Auto Row to Activism',
    desc: 'Once lined with car showrooms in the 1920s, Pike/Pine became the heart of Seattle\'s queer community by the 1990s. The corridor\'s brick warehouses and late-night venues made it a natural gathering point during the 2020 uprising.'
  },
  {
    id: 3,
    position: [47.6153, -122.3240],
    name: 'Cal Anderson Park',
    title: 'The Autonomous Zone',
    desc: 'For nearly a month in June 2020, several blocks around Cal Anderson Park became the Capitol Hill Organized Protest — a self-declared police-free zone with community gardens, open mics, and a No Cop Co-op. Named for Washington\'s first openly gay legislator, the park remains a site of memory and mobilization.'
  }
]

const toLngLat = ([lat, lng]) => [lng, lat]

function getRouteBounds() {
  const allPoints = [
    ...WESTLAKE_ROUTE,
    ...CHOP_ROUTES.flatMap(route => route.path),
  ]

  const lngs = allPoints.map(point => point[1])
  const lats = allPoints.map(point => point[0])

  return [
    [Math.min(...lngs), Math.min(...lats)],
    [Math.max(...lngs), Math.max(...lats)],
  ]
}


export default function RouteOverview() {
  const navigate = useNavigate()
  const mapRef = useRef()
  const containerRef = useRef()
  const sheetRef = useRef()
  const drag = useRef({ 
    active: false, 
    startY: 0, 
    startCollapsed: false 
  })

  // collapsed = true means sheet is pushed down showing only the peek area
  const [collapsed, setCollapsed] = useState(false)
  const [dragOffset, setDragOffset] = useState(0)   // live drag delta in px
  const [sheetHeight, setSheetHeight] = useState(0)
  const [openPOI, setOpenPOI] = useState(null)
  // Mirrors drag.current.active so the render output can react to drag start/end
  // without reading a ref during render.
  const [dragging, setDragging] = useState(false)

  // Measure sheet height (updates on content changes / window resize / orientation change)
  useLayoutEffect(() => {
    if (!sheetRef.current) {
      return
    }

    const node = sheetRef.current
    const update = () => setSheetHeight(node.offsetHeight)

    update()

    const ro = new ResizeObserver(update)
    ro.observe(node)

    window.addEventListener('resize', update)

    return () => {
      ro.disconnect()
      window.removeEventListener('resize', update)
    }
  }, [])

  // Sheet sizes itself to content; we translateY to collapse/expand
  const collapsedTranslate = Math.max(0, sheetHeight - COLLAPSED_PEEK)
  const baseTranslate = collapsed ? collapsedTranslate : 0
  const translateY = Math.min(
    collapsedTranslate,
    Math.max(0, baseTranslate + dragOffset),
  )

  const isAnimating = !dragging

  function handleMapLoad() {
    if (mapRef.current) {
      mapRef.current.fitBounds(
        getRouteBounds(),
        {
          padding: {
            top: 50,
            bottom: 180,
            left: 30,
            right: 30,
          },
          duration: 600,
        },
      )
    }
  }


  const onPointerDown = (e) => {
    drag.current = {
      active: true,
      startY: e.clientY,
      startCollapsed: collapsed,
    }
    setDragging(true)
    setDragOffset(0)
    e.currentTarget.setPointerCapture(e.pointerId)
  }

  const onPointerMove = (e) => {
    if (!drag.current.active) {
      return
    }
    setDragOffset(e.clientY - drag.current.startY)
  }

  const onPointerUp = () => {
    if (!drag.current.active) {
      return
    }
    drag.current.active = false
    setDragging(false)

    const startTranslate = drag.current.startCollapsed ? collapsedTranslate : 0
    const finalTranslate = startTranslate + dragOffset

    setCollapsed(finalTranslate > collapsedTranslate / 2)
    setDragOffset(0)
  }

  function handleOpenPOI(poi) {
    setOpenPOI(poi)
  }

  return (
    <div ref={containerRef} style={styles.page}>
      <Map
        ref={mapRef}
        mapboxAccessToken={MAPBOX_TOKEN}
        initialViewState={INITIAL_VIEW_STATE}
        style={styles.map}
        mapStyle={MAP_STYLE}
        onLoad={handleMapLoad}
        attributionControl={false}
      >
        {CHOP_ROUTES.map((route, index) => (
          <Source
            key={index}
            id={`explore-${index}`}
            type="geojson"
            data={{
              type: 'Feature',
              geometry: {
                type: 'LineString',
                coordinates: route.path.map(toLngLat),
              }
            }}
          >
            <Layer
              id={`explore-layer-${index}`}
              type="line"
              layout={styles.routeLineLayout}
              paint={styles.exploreRoutePaint(route.color)}
            />
          </Source>
        ))}

        <Source
          id="main-route"
          type="geojson"
          data={{
            type: 'Feature',
            geometry: {
              type: 'LineString',
              coordinates: WESTLAKE_ROUTE.map(toLngLat),
            },
          }}
        >
          <Layer
            id="main-route-layer"
            type="line"
            layout={styles.routeLineLayout}
            paint={styles.mainRoutePaint}
          />
        </Source>

        {CHOP_ROUTES.map((route, index) => {
          const end = route.path[route.path.length - 1]

          return (
            <Marker
              key={`end-${index}`}
              longitude={end[1]}
              latitude={end[0]}
              anchor="center"
            >
              <div style={styles.exploreEndMarker(route.color)} />
            </Marker>
          )
        })}

        {/* POI markers */}
        {POIS.map(poi => (
          <Marker
            key={poi.id}
            longitude={poi.position[1]}
            latitude={poi.position[0]}
            anchor="bottom"
          >
            <div
              onClick={() => handleOpenPOI(poi)}
              style={styles.poiMarker}
            >
              <PinIcon size={24} />
            </div>
          </Marker>
        ))}

        {/* Start marker */}
        <Marker 
          longitude={WESTLAKE_ROUTE[0][1]} 
          latitude={WESTLAKE_ROUTE[0][0]} 
          anchor="center"
        >
          <div style={styles.startMarker} />
        </Marker>

        {/* End marker */}
        <Marker 
          longitude={WESTLAKE_ROUTE[WESTLAKE_ROUTE.length - 1][1]} 
          latitude={WESTLAKE_ROUTE[WESTLAKE_ROUTE.length - 1][0]} 
          anchor="center"
        >
          <div style={styles.endMarker} /> 
        </Marker>
      </Map>

      {/* POI detail card */}
      {openPOI && (
        <div onClick={() => setOpenPOI(null)} style={styles.poiOverlay}>
          <div onClick={e => e.stopPropagation()} style={styles.poiCard}>
            <div style={styles.poiCardTexture} />
            <div style={styles.poiCardIcon}>
              <PinIcon size={72} />
            </div>

            <button
              onClick={() => setOpenPOI(null)}
              style={styles.poiCloseButton}
            >
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
                <button style={styles.poiTagButton}>
                  Firsthand
                </button>

                <button style={styles.poiTagButton}>
                  Context
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Draggable bottom sheet (auto-sized to content) ── */}
      <div ref={sheetRef} style={styles.bottomSheet(translateY, isAnimating)}>
        {/* Drag handle */}
        <div
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerCancel={onPointerUp}
          style={styles.sheetHandleArea}
        >
          <div style={styles.sheetHandle} />
        </div>

        {/* Content */}
        <div style={styles.sheetContent}>
          <div style={styles.title}>
            Explore CHOP
          </div>

          <p style={styles.description}>
            Select a location to begin
          </p>

          <div style={styles.buttonRow}>
            <button
              onClick={() => navigate('/map/navigate')}
              style={styles.startButton}
            >
              Start Journey
            </button>

            <button
              onClick={() => navigate('/perspectives')}
              style={styles.archiveButton}
            >
              📖
            </button>
          </div>
        </div>
      </div>

    </div>
  )
}

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

  exploreRoutePaint: color => ({
    'line-color': color,
    'line-width': 3,
    'line-opacity': 0.6,
    'line-dasharray': [2, 1.5],
  }),

  mainRoutePaint: {
    'line-color': '#84C4FF',
    'line-width': 5,
    'line-opacity': 0.9,
  },

  exploreEndMarker: color => ({
    width: 10,
    height: 10,
    background: color,
    border: '2.5px solid white',
    borderRadius: '50%',
    boxShadow: `0 2px 8px ${color}88`,
  }),

  poiMarker: {
    cursor: 'pointer',
    lineHeight: 0,
  },

  startMarker: {
    width: 14,
    height: 14,
    background: '#22c55e',
    border: '3px solid white',
    borderRadius: '50%',
    boxShadow: '0 2px 8px rgba(34,197,94,0.6)',
  },

  endMarker: {
    width: 14,
    height: 14,
    background: '#ef4444',
    border: '3px solid white',
    borderRadius: '50%',
    boxShadow: '0 2px 8px rgba(239,68,68,0.6)',
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

  bottomSheet: (translateY, isAnimating) => ({
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    transform: `translateY(${translateY}px)`,
    background: 'white',
    borderRadius: '22px 22px 0 0',
    boxShadow: '0 -6px 32px rgba(0,0,0,0.13)',
    transition: isAnimating ? 'transform 0.3s cubic-bezier(0.32,0.72,0,1)' : 'none',
    zIndex: 10,
    display: 'flex',
    flexDirection: 'column',
    maxHeight: '80dvh',
  }),

  sheetHandleArea: {
    padding: '14px 0 8px',
    cursor: 'grab',
    touchAction: 'none',
    flexShrink: 0,
  },

  sheetHandle: {
    width: 40,
    height: 4,
    background: '#d1d5db',
    borderRadius: 2,
    margin: '0 auto',
  },

  sheetContent: {
    padding: '8px 24px max(24px, env(safe-area-inset-bottom))',
    overflowY: 'auto',
  },

  title: {
    fontSize: 28,
    fontWeight: 800,
    color: '#0a0a0a',
    marginBottom: 16,
    letterSpacing: '-0.5px',
    textAlign: 'center',
  },

  tagRow: {
    display: 'flex',
    gap: 8,
    marginBottom: 20,
    flexWrap: 'wrap',
    justifyContent: 'center',
  },

  tag: {
    padding: '6px 16px',
    border: '1.5px solid #1d4ed8',
    borderRadius: 16,
    fontSize: 13,
    fontWeight: 500,
    color: '#374151',
  },

  description: {
    fontSize: 15,
    fontWeight: 600,
    color: '#111827',
    lineHeight: 1.6,
    margin: '0 0 28px',
    textAlign: 'center',
  },

  buttonRow: {
    display: 'flex',
    gap: 12,
  },

  startButton: {
    flex: 1,
    background: '#1d4ed8',
    color: 'white',
    padding: '16px',
    borderRadius: 16,
    fontSize: 16,
    fontWeight: 600,
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    border: 'none',
  },

  archiveButton: {
    width: 56,
    height: 56,
    background: '#f3f4f6',
    borderRadius: 16,
    fontSize: 22,
    cursor: 'pointer',
    flexShrink: 0,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    border: 'none',
  },
}
