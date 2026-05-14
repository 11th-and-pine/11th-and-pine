import { useCallback, useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Map, { Source, Layer, Marker } from 'react-map-gl'
import 'mapbox-gl/dist/mapbox-gl.css'
import PinIcon from '../../components/PinIcon'
import BottomNav from '../../components/BottomNav'
import westlakeCardImage from '../../assets/images/Westlake-card.png'
import chopCardImage from '../../assets/images/CHOP-card.png'
import introIcon from '../../assets/images/intro-icon.png'

const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_TOKEN
const INITIAL_VIEW_STATE = {longitude: -122.328, latitude: 47.6148, zoom: 15}
const MAP_STYLE = 'mapbox://styles/mapbox/light-v11'
const ROUTE_LINE_LAYOUT = {
  'line-cap': 'round',
  'line-join': 'round',
}
const MAIN_ROUTE_PAINT = {
  'line-color': '#84C4FF',
  'line-width': 5,
  'line-opacity': 0.9,
}

const getExploreRoutePaint = color => ({
  'line-color': color,
  'line-width': 3,
  'line-opacity': 0.6,
  'line-dasharray': [2, 1.5],
})

const getSelectedRoutePaint = color => ({
  'line-color': color,
  'line-width': 5,
  'line-opacity': 1,
})

const HIT_TARGET_PAINT = {
  'line-color': '#000',
  'line-width': 22,
  'line-opacity': 0,
}

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
  {
    id: 1,
    perspectiveId: '2',
    title: "Alex's Route",
    role: 'Community Organizer',
    desc: 'Follow the path of the first organizers on the ground.',
    color: '#EED05D',
    path: [
    [47.61534637433494, -122.31998484534672],
    [47.61537792391303, -122.31834587334546],
    [47.615189438501694, -122.318284960829],
    [47.61518751104897, -122.31702045803209],
    [47.61507232602374, -122.31699950222341],
    [47.61756130800152, -122.31705670186719],
    [47.617590861940066, -122.31830937728371]
  ]},
  {
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
  ]},
  {
    color: '#22c55e',
    path: [
    [47.61534637433494, -122.31998484534672],
    [47.61537792391303, -122.31834587334546],
    [47.61644970344747, -122.31829245310354],
    [47.618667480923264, -122.3183265120806],
    [47.61871203860535, -122.31707799892192]
  ]},
  {
    color: '#ec4899',
    path: [
    [47.61534637433494, -122.31998484534672],
    [47.618724352103335, -122.32003383177313],
    [47.6186916006176, -122.31948316444459],
    [47.6183586260147, -122.31872194784339],
    [47.61810752901002, -122.31941028200404]
  ]},
  {
    color: '#06b6d4',
    path: [
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

const CAPITOL_POIS = [
  {
    ...POIS[2],
    id: 'capitol-park',
    position: [47.6172, -122.3194],
    name: 'Cal Anderson Park',
  },
  {
    ...POIS[1],
    id: 'capitol-east',
    position: [47.6163, -122.3180],
    name: 'East Precinct',
  },
  {
    ...POIS[0],
    id: 'capitol-core',
    position: [47.6152, -122.3207],
    name: 'CHOP Core',
  },
]

const toLngLat = ([lat, lng]) => [lng, lat]

function MenuGlyph() {
  return (
    <svg
      className="hamburger-icon"
      xmlns="http://www.w3.org/2000/svg"
      width="17"
      height="14"
      viewBox="0 0 17 14"
      fill="none"
      aria-hidden="true"
    >
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M0 0.875C0 0.391751 0.380558 0 0.85 0H16.15C16.6194 0 17 0.391751 17 0.875C17 1.35825 16.6194 1.75 16.15 1.75H0.85C0.380558 1.75 0 1.35825 0 0.875ZM0 7C0 6.51675 0.380558 6.125 0.85 6.125H16.15C16.6194 6.125 17 6.51675 17 7C17 7.48325 16.6194 7.875 16.15 7.875H0.85C0.380558 7.875 0 7.48325 0 7ZM0 13.125C0 12.6418 0.380558 12.25 0.85 12.25H16.15C16.6194 12.25 17 12.6418 17 13.125C17 13.6082 16.6194 14 16.15 14H0.85C0.380558 14 0 13.6082 0 13.125Z"
        fill="#979797"
      />
    </svg>
  )
}

function SidebarIcon({ type }) {
  if (type === 'settings') {
    return (
      <svg
        className="sidebar-settings-icon"
        xmlns="http://www.w3.org/2000/svg"
        width="28"
        height="28"
        viewBox="0 0 28 28"
        fill="none"
        aria-hidden="true"
      >
        <g clipPath="url(#sidebar-settings-clip)">
          <path
            d="M14.0073 19.25C11.0323 19.25 8.75732 16.975 8.75732 14C8.75732 11.025 11.0323 8.75 14.0073 8.75C16.9823 8.75 19.2573 11.025 19.2573 14C19.2573 16.975 16.9823 19.25 14.0073 19.25ZM14.0073 10.5C12.0823 10.5 10.5073 12.075 10.5073 14C10.5073 15.925 12.0823 17.5 14.0073 17.5C15.9323 17.5 17.5073 15.925 17.5073 14C17.5073 12.075 15.9323 10.5 14.0073 10.5Z"
            fill="black"
          />
          <path
            d="M17.5071 28H10.5071C9.98209 28 9.63209 27.65 9.63209 27.125V23.8C8.93209 23.45 8.23209 23.1 7.70709 22.75L4.90709 24.5C4.55709 24.675 4.03209 24.675 3.68209 24.15L0.182091 18.025C-0.167909 17.5 0.00709071 16.975 0.532091 16.8L3.33209 15.05V12.95L0.532091 11.2C0.00709071 11.025 -0.167909 10.5 0.182091 9.975L3.68209 3.85C3.85709 3.5 4.38209 3.325 4.90709 3.675L7.70709 5.425C8.23209 5.075 8.93209 4.55 9.63209 4.375V0.875C9.63209 0.35 9.98209 0 10.5071 0H17.5071C18.0321 0 18.3821 0.35 18.3821 0.875V4.2C19.0821 4.55 19.7821 4.9 20.3071 5.25L23.1071 3.5C23.4571 3.325 23.9821 3.325 24.3321 3.85L27.8321 9.975C28.1821 10.5 28.0071 11.025 27.4821 11.2L24.6821 12.95V15.05L27.4821 16.8C27.8321 16.975 28.0071 17.5 27.8321 18.025L24.3321 24.15C24.1571 24.5 23.6321 24.675 23.1071 24.5L20.3071 22.75C19.7821 23.1 19.0821 23.625 18.3821 23.8V27.125C18.3821 27.65 18.0321 28 17.5071 28ZM11.3821 26.25H16.6321V23.275C16.6321 22.925 16.8071 22.575 17.1571 22.4C18.0321 22.05 18.9071 21.525 19.6071 21C19.9571 20.825 20.3071 20.825 20.6571 21L23.2821 22.575L25.9071 18.025L23.2821 16.45C22.9321 16.1 22.7571 15.75 22.9321 15.4C22.9321 14.875 23.1071 14.525 23.1071 14C23.1071 13.475 23.1071 13.125 22.9321 12.6C22.9321 12.25 23.1071 11.9 23.2821 11.725L25.9071 10.15L23.2821 5.6L20.6571 7.175C20.3071 7.35 19.9571 7.35 19.6071 7.175C18.9071 6.65 18.0321 6.125 17.1571 5.775C16.8071 5.425 16.6321 5.075 16.6321 4.725V1.75H11.3821V4.725C11.3821 5.075 11.2071 5.425 10.8571 5.6C9.98209 5.95 9.10709 6.475 8.40709 7C8.05709 7.175 7.70709 7.175 7.35709 7L4.73209 5.6L2.10709 10.15L4.73209 11.725C5.08209 11.9 5.25709 12.25 5.08209 12.6C5.08209 13.125 4.90709 13.475 4.90709 14C4.90709 14.525 4.90709 14.875 5.08209 15.4C5.25709 15.75 5.08209 16.1 4.73209 16.275L2.10709 17.85L4.73209 22.4L7.35709 20.825C7.70709 20.65 8.05709 20.65 8.40709 20.825C9.10709 21.35 9.98209 21.875 10.8571 22.225C11.2071 22.4 11.3821 22.75 11.3821 23.1V26.25Z"
            fill="black"
          />
        </g>
        <defs>
          <clipPath id="sidebar-settings-clip">
            <rect width="28" height="28" fill="white" />
          </clipPath>
        </defs>
      </svg>
    )
  }

  const commonProps = {
    className: 'sidebar-item-icon',
    xmlns: 'http://www.w3.org/2000/svg',
    width: '24',
    height: '24',
    viewBox: '0 0 24 24',
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: '1.8',
    strokeLinecap: 'round',
    strokeLinejoin: 'round',
    'aria-hidden': 'true',
  }

  if (type === 'home') {
    return (
      <svg {...commonProps}>
        <path d="M3 10.8L12 3.5l9 7.3" />
        <path d="M5.5 9.8V20h13V9.8" />
        <path d="M9.5 20v-5.2a2.5 2.5 0 0 1 5 0V20" />
      </svg>
    )
  }

  if (type === 'info') {
    return (
      <svg {...commonProps}>
        <circle cx="12" cy="12" r="10" />
        <path d="M12 10.8v6" />
        <path d="M12 7h.01" />
      </svg>
    )
  }

  if (type === 'privacy') {
    return (
      <svg {...commonProps}>
        <path d="M12 3.2l7 2.6v5.4c0 4.2-2.8 7.8-7 9.3-4.2-1.5-7-5.1-7-9.3V5.8l7-2.6Z" />
        <path d="M9 12l2 2 4-4" />
      </svg>
    )
  }

  if (type === 'mail') {
    return (
      <svg {...commonProps}>
        <rect x="3" y="5" width="18" height="14" rx="2" />
        <path d="M4 7l8 6 8-6" />
      </svg>
    )
  }

  if (type === 'support') {
    return (
      <svg {...commonProps}>
        <path d="M4.5 13v-1a7.5 7.5 0 0 1 15 0v1" />
        <path d="M4.5 13.5h2v4h-2a1 1 0 0 1-1-1v-2a1 1 0 0 1 1-1Z" />
        <path d="M19.5 13.5h-2v4h2a1 1 0 0 0 1-1v-2a1 1 0 0 0-1-1Z" />
        <path d="M17.5 17.5c0 1.4-1.2 2.5-2.6 2.5H13" />
      </svg>
    )
  }

  return null
}

function getRouteBounds(area = 'westlake') {
  const allPoints = area === 'capitol'
    ? CHOP_ROUTES.flatMap(route => route.path)
    : WESTLAKE_ROUTE

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
  const [openPOI, setOpenPOI] = useState(null)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [downloadPromptOpen, setDownloadPromptOpen] = useState(false)
  const [selectedArea, setSelectedArea] = useState('westlake')
  const [selectedChopRouteIndex, setSelectedChopRouteIndex] = useState(null)

  const isCapitolSelected = selectedArea === 'capitol'
  const displayPOIS = isCapitolSelected ? CAPITOL_POIS : POIS

  const interactiveLayerIds = isCapitolSelected
    ? CHOP_ROUTES.map((_, i) => `explore-hit-${i}`)
    : []

  function handleMapClick(e) {
    if (!isCapitolSelected) return
    const features = e.features || []
    if (features.length === 0) return
    const layerId = features[0].layer.id
    const match = layerId.match(/explore-hit-(\d+)/)
    if (match) {
      setSelectedChopRouteIndex(parseInt(match[1], 10))
    }
  }

  const fitMapToArea = useCallback((area, duration = 600) => {
    if (!mapRef.current) {
      return
    }

    mapRef.current.fitBounds(
      getRouteBounds(area),
      {
        padding: area === 'capitol'
          ? {
            top: 42,
            bottom: 250,
            left: 26,
            right: 26,
          }
          : {
            top: 34,
            bottom: 300,
            left: 8,
            right: 8,
          },
        duration,
      },
    )
  }, [])

  useEffect(() => {
    fitMapToArea(selectedArea, 500)
  }, [fitMapToArea, selectedArea])

  function handleMapLoad() {
    fitMapToArea(selectedArea)
  }

  function handleOpenPOI(poi) {
    setOpenPOI(poi)
  }

  function handleDownloadConfirm() {
    if (isCapitolSelected) {
      const routeIndex = selectedChopRouteIndex ?? 0
      navigate('/map/navigate', {
        state: {
          route: CHOP_ROUTES[routeIndex],
          guideToStart: true,
        },
      })
      return
    }

    navigate('/map/navigate')
  }

  return (
    <div className="route-overview-page">
      <div className="route-overview-map">
        <Map
          ref={mapRef}
          mapboxAccessToken={MAPBOX_TOKEN}
          initialViewState={INITIAL_VIEW_STATE}
          mapStyle={MAP_STYLE}
          onLoad={handleMapLoad}
          attributionControl={false}
          interactiveLayerIds={interactiveLayerIds}
          onClick={handleMapClick}
          cursor={isCapitolSelected ? 'pointer' : 'auto'}
        >
          {CHOP_ROUTES.map((route, index) => {
            const isSelected = selectedChopRouteIndex === index
            return (
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
                  layout={ROUTE_LINE_LAYOUT}
                  paint={isSelected ? getSelectedRoutePaint(route.color) : getExploreRoutePaint(route.color)}
                />
                {/* Wider invisible hit target for easier clicking */}
                <Layer
                  id={`explore-hit-${index}`}
                  type="line"
                  layout={ROUTE_LINE_LAYOUT}
                  paint={HIT_TARGET_PAINT}
                />
              </Source>
            )
          })}

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
              layout={ROUTE_LINE_LAYOUT}
              paint={MAIN_ROUTE_PAINT}
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
                <div
                  className="explore-end-marker"
                  style={{ '--marker-color': route.color }}
                />
              </Marker>
            )
          })}

          {/* POI markers */}
          {displayPOIS.map(poi => (
            <Marker
              key={poi.id}
              longitude={poi.position[1]}
              latitude={poi.position[0]}
              anchor="bottom"
            >
              <div
                onClick={() => handleOpenPOI(poi)}
                className="poi-marker"
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
            <div className="route-start-marker" />
          </Marker>

          {/* End marker */}
          <Marker
            longitude={WESTLAKE_ROUTE[WESTLAKE_ROUTE.length - 1][1]}
            latitude={WESTLAKE_ROUTE[WESTLAKE_ROUTE.length - 1][0]}
            anchor="center"
          >
            <div className="route-end-marker" />
          </Marker>
        </Map>
      </div>

      {/* POI detail card */}
      {openPOI && (
        <div onClick={() => setOpenPOI(null)} className="poi-overlay">
          <div onClick={e => e.stopPropagation()} className="poi-card">
            <div className="poi-card-texture" />
            <div className="poi-card-icon">
              <PinIcon size={72} />
            </div>

            <button
              onClick={() => setOpenPOI(null)}
              className="poi-close-button"
            >
              ✕
            </button>

            <div className="poi-card-content">
              <div className="poi-location-pill">
                <PinIcon size={14} shadow={false} />

                <span className="poi-location-text">
                  {openPOI.name}
                </span>
              </div>

              <h2 className="poi-title">
                {openPOI.title}
              </h2>

              <p className="poi-description">
                {openPOI.desc}
              </p>
            </div>
          </div>
        </div>
      )}

      <button
        className="overview-menu"
        type="button"
        aria-label="Open menu"
        aria-expanded={sidebarOpen}
        onClick={() => setSidebarOpen(true)}
      >
        <MenuGlyph />
      </button>

      {sidebarOpen && (
        <>
          <button
            className="sidebar-scrim"
            type="button"
            aria-label="Close menu"
            onClick={() => setSidebarOpen(false)}
          />
          <aside className="overview-sidebar" aria-label="Sidebar navigation">
            <button
              className="sidebar-menu-button"
              type="button"
              aria-label="Close menu"
              onClick={() => setSidebarOpen(false)}
            >
              <MenuGlyph />
            </button>

            <div className="sidebar-brand">
              <img src={introIcon} alt="" />
              <span>11Th & Pine</span>
            </div>

            <nav className="sidebar-nav" aria-label="Menu">
              <button
                className="sidebar-nav-item sidebar-nav-item-active"
                type="button"
                onClick={() => setSidebarOpen(false)}
              >
                <SidebarIcon type="home" />
                <span>Dashboard</span>
              </button>

              <button className="sidebar-nav-item" type="button">
                <SidebarIcon type="info" />
                <span>About Us</span>
              </button>

              <button className="sidebar-nav-item" type="button">
                <SidebarIcon type="privacy" />
                <span>Privacy</span>
              </button>

              <div className="sidebar-divider" />

              <button className="sidebar-nav-item" type="button">
                <SidebarIcon type="mail" />
                <span>Connect</span>
              </button>

              <button className="sidebar-nav-item" type="button">
                <SidebarIcon type="support" />
                <span>Support</span>
              </button>
            </nav>

            <button className="sidebar-settings" type="button" aria-label="Settings">
              <SidebarIcon type="settings" />
            </button>
          </aside>
        </>
      )}

      {downloadPromptOpen && (
        <div className="route-download-overlay" role="presentation">
          <div className="route-download-dialog" role="dialog" aria-modal="true" aria-labelledby="route-download-title">
            <h2 id="route-download-title">
              Get Ready to Start
            </h2>

            <p>
              Download this route to unlock audio and location-based experiences.
            </p>

            <div className="route-download-actions">
              <button
                className="route-download-cancel"
                type="button"
                onClick={() => setDownloadPromptOpen(false)}
              >
                Cancel
              </button>

              <button
                className="route-download-confirm"
                type="button"
                onClick={handleDownloadConfirm}
              >
                Download
              </button>
            </div>
          </div>
        </div>
      )}

      <section className="bottom-sheet" aria-label="Route choices">
        <svg
          className="bottom-sheet-bg"
          xmlns="http://www.w3.org/2000/svg"
          width="390"
          height="251"
          viewBox="0 0 390 251"
          preserveAspectRatio="none"
          fill="none"
          aria-hidden="true"
        >
          <g filter="url(#route-overview-sheet-shadow)">
            <path
              d="M0 20C0 8.95431 8.95431 0 20 0H168.163C175.463 0 182.183 3.97732 185.696 10.3767L190.86 19.7864C194.373 26.1858 201.093 30.1631 208.393 30.1631H212.633H246.343H307.021H344.362H370C381.046 30.1631 390 39.1174 390 50.1631V146.506V231C390 242.046 381.046 251 370 251H20C8.9543 251 0 242.046 0 231V20Z"
              fill="#F3F3F1"
            />
            <path
              d="M20 0.650391H168.163C175.226 0.65044 181.728 4.49807 185.126 10.6895L190.29 20.0986C193.917 26.7059 200.855 30.8134 208.393 30.8135H370C380.687 30.8135 389.35 39.4764 389.35 50.1631V231C389.35 241.687 380.687 250.35 370 250.35H20C9.31329 250.35 0.650392 241.687 0.650391 231V20C0.650391 9.31329 9.31329 0.650391 20 0.650391Z"
              stroke="#EAEAEA"
              strokeWidth="1.3"
            />
          </g>
          <defs>
            <filter
              id="route-overview-sheet-shadow"
              x="-4"
              y="0"
              width="398"
              height="259"
              filterUnits="userSpaceOnUse"
              colorInterpolationFilters="sRGB"
            >
              <feFlood floodOpacity="0" result="BackgroundImageFix" />
              <feColorMatrix
                in="SourceAlpha"
                type="matrix"
                values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0"
                result="hardAlpha"
              />
              <feOffset dy="4" />
              <feGaussianBlur stdDeviation="2" />
              <feComposite in2="hardAlpha" operator="out" />
              <feColorMatrix
                type="matrix"
                values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0.25 0"
              />
              <feBlend mode="normal" in2="BackgroundImageFix" result="effect1_dropShadow_1433_290" />
              <feBlend mode="normal" in="SourceGraphic" in2="effect1_dropShadow_1433_290" result="shape" />
            </filter>
          </defs>
        </svg>

        <div className="bottom-sheet-content">
          <p className="overview-title">
            Explore CHOP
          </p>
          <p className="overview-subtitle">
            Select a location to begin
          </p>
        </div>

        <button
          className="start-button"
          onClick={() => setDownloadPromptOpen(true)}
        >
          Start Journey
        </button>

        <div className="route-cards-row">
          <button
            className={`route-card route-card-westlake ${selectedArea === 'westlake' ? 'route-card-active' : 'route-card-inactive'}`}
            type="button"
            aria-pressed={selectedArea === 'westlake'}
            onClick={() => {
              setSelectedArea('westlake')
              setSelectedChopRouteIndex(null)
            }}
          >
            <p className="route-card-title">
              Westlake
            </p>
            <p className="route-card-subtitle">
              Start at Downtown
            </p>
            <img src={westlakeCardImage} alt="" />
          </button>

          <button
            className={`route-card route-card-chop ${isCapitolSelected ? 'route-card-active' : 'route-card-inactive'}`}
            type="button"
            aria-pressed={isCapitolSelected}
            onClick={() => setSelectedArea('capitol')}
          >
            <p className="route-card-title">
              Capitol Hill
            </p>
            <p className="route-card-subtitle">
              Start at CHOP Zone
            </p>
            <img src={chopCardImage} alt="" />
          </button>
        </div>

        <BottomNav active="home" />
      </section>

    </div>
  )
}
