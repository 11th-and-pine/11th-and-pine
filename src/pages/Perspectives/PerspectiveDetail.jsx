import { useNavigate, useParams } from 'react-router-dom'
import Map, { Marker, Source, Layer } from 'react-map-gl'
import 'mapbox-gl/dist/mapbox-gl.css'
import { getPerspectiveById } from '../../services/dataService'

const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_TOKEN

const mainRoute = [
  [-122.3371, 47.6131],
  [-122.3340, 47.6138],
  [-122.33, 47.6145],
  [-122.325, 47.6152],
  [-122.322, 47.6158],
  [-122.3197, 47.6165],
]

const routeGeoJSON = {
  type: 'Feature',
  geometry: {
    type: 'LineString',
    coordinates: mainRoute,
  },
}

const routeLayer = {
  id: 'route-line',
  type: 'line',
  paint: {
    'line-color': '#2563eb',
    'line-width': 4,
  },
}

function PerspectiveDetail() {
  const navigate = useNavigate()
  const { id } = useParams()
  const perspective = getPerspectiveById(Number(id))

  if (!perspective) {
    return (
      <div style={styles.page}>
        <div style={styles.notFoundWrap}>
          <button style={styles.backCircleFallback} onClick={() => navigate('/perspectives')}>
            ←
          </button>
          <h1 style={styles.notFoundTitle}>Perspective not found</h1>
        </div>
      </div>
    )
  }

  const mapCenter = perspective.location
    ? { longitude: perspective.location[1], latitude: perspective.location[0] }
    : { longitude: -122.328, latitude: 47.6148 }

  const audioDuration = perspective.previewDuration || '0:30'
  const durationText = perspective.durationText || '25 Minutes'
  const tapCount = perspective.tapCount || '10 Points'

  return (
    <div style={styles.page}>
      <div style={styles.scrollArea}>
        <div style={styles.hero}>
          <img
            src={
              perspective.imageUrl ||
              'https://images.unsplash.com/photo-1593113598332-cd59a93a9c98?auto=format&fit=crop&w=1200&q=80'
            }
            alt={perspective.name}
            style={styles.heroImage}
          />

          <button style={styles.backCircle} onClick={() => navigate('/perspectives')}>
            ←
          </button>

          <div style={styles.mapPreviewCard}>
            <div style={styles.mapPreviewInner}>
              <Map
                mapboxAccessToken={MAPBOX_TOKEN}
                initialViewState={{
                  longitude: mapCenter.longitude,
                  latitude: mapCenter.latitude,
                  zoom: 14,
                }}
                style={styles.miniMap}
                mapStyle="mapbox://styles/mapbox/streets-v12"
                attributionControl={false}
                dragPan={false}
                scrollZoom={false}
                doubleClickZoom={false}
                touchZoomRotate={false}
                keyboard={false}
              >
                <Source id="route" type="geojson" data={routeGeoJSON}>
                  <Layer {...routeLayer} />
                </Source>

                {perspective.location && (
                  <Marker
                    longitude={perspective.location[1]}
                    latitude={perspective.location[0]}
                    anchor="bottom"
                  >
                    <div style={styles.markerDot} />
                  </Marker>
                )}
              </Map>
            </div>
          </div>

          <div style={styles.heroTitleWrap}>
            <h1 style={styles.heroTitle}>
              {perspective.featuredShortTitle || perspective.name}
            </h1>
          </div>
        </div>

        <div style={styles.content}>
          <h2 style={styles.sectionTitle}>Description</h2>

          <div style={styles.metaRow}>
            <div style={styles.metaItem}>
              <div style={styles.metaIcon}>◔</div>
              <div>
                <p style={styles.metaLabel}>Time</p>
                <p style={styles.metaValue}>{durationText}</p>
              </div>
            </div>

            <div style={styles.metaItem}>
              <div style={styles.metaIcon}>⌖</div>
              <div>
                <p style={styles.metaLabel}>Taps</p>
                <p style={styles.metaValue}>{tapCount}</p>
              </div>
            </div>
          </div>

          <p style={styles.descriptionText}>{perspective.fullBio}</p>
        </div>
      </div>

      <div style={styles.audioBar}>
        <div style={styles.audioInfo}>
          <p style={styles.audioLabel}>Preview</p>
          <p style={styles.audioTime}>0:00 / {audioDuration}</p>
        </div>

        {perspective.audioUrl ? (
          <button
            style={styles.playButton}
            onClick={() => {
              const audio = document.getElementById('perspective-audio-player')
              if (audio) audio.play()
            }}
          >
            ▶
          </button>
        ) : (
          <button style={{ ...styles.playButton, opacity: 0.5 }} disabled>
            ▶
          </button>
        )}
      </div>

      {perspective.audioUrl && (
        <audio
          id="perspective-audio-player"
          src={perspective.audioUrl}
          preload="metadata"
          style={{ display: 'none' }}
        />
      )}
    </div>
  )
}

const styles = {
  page: {
    height: '100%',
    display: 'flex',
    flexDirection: 'column',
    backgroundColor: '#f3f3f1',
    overflow: 'hidden',
  },
  scrollArea: {
    flex: 1,
    overflowY: 'auto',
    WebkitOverflowScrolling: 'touch',
  },
  hero: {
    position: 'relative',
    width: '100%',
    height: '540px',
    overflow: 'hidden',
    borderBottomLeftRadius: '36px',
    borderBottomRightRadius: '36px',
  },
  heroImage: {
    width: '100%',
    height: '100%',
    objectFit: 'cover',
    display: 'block',
  },
  backCircle: {
    position: 'absolute',
    top: '20px',
    left: '20px',
    width: '56px',
    height: '56px',
    borderRadius: '50%',
    border: 'none',
    backgroundColor: 'rgba(255,255,255,0.92)',
    boxShadow: '0 4px 12px rgba(0,0,0,0.12)',
    fontSize: '30px',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: '#111',
    zIndex: 3,
  },
  mapPreviewCard: {
    position: 'absolute',
    right: '18px',
    bottom: '26px',
    width: '118px',
    height: '118px',
    borderRadius: '22px',
    backgroundColor: '#ffffff',
    padding: '4px',
    boxShadow: '0 8px 18px rgba(0,0,0,0.2)',
    zIndex: 2,
  },
  mapPreviewInner: {
    width: '100%',
    height: '100%',
    overflow: 'hidden',
    borderRadius: '18px',
  },
  miniMap: {
    width: '100%',
    height: '100%',
  },
  markerDot: {
    width: '16px',
    height: '16px',
    borderRadius: '50%',
    backgroundColor: '#1560f2',
    border: '3px solid white',
    boxShadow: '0 2px 8px rgba(0,0,0,0.25)',
  },
  heroTitleWrap: {
    position: 'absolute',
    left: '20px',
    bottom: '34px',
    right: '150px',
    zIndex: 2,
  },
  heroTitle: {
    margin: 0,
    color: '#fff',
    fontSize: '42px',
    lineHeight: 1.02,
    fontWeight: '800',
    letterSpacing: '-1px',
  },
  content: {
    padding: '22px 20px 28px',
  },
  sectionTitle: {
    fontSize: '30px',
    lineHeight: 1.1,
    fontWeight: '800',
    color: '#000',
    margin: '0 0 22px 0',
  },
  metaRow: {
    display: 'flex',
    gap: '34px',
    marginBottom: '26px',
  },
  metaItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
  },
  metaIcon: {
    width: '34px',
    height: '34px',
    borderRadius: '50%',
    border: '2px solid #5c84ff',
    color: '#5c84ff',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '20px',
    flexShrink: 0,
  },
  metaLabel: {
    margin: 0,
    fontSize: '12px',
    color: '#9a9a9a',
    fontWeight: '600',
  },
  metaValue: {
    margin: 0,
    fontSize: '18px',
    color: '#2d2d2d',
    fontWeight: '700',
  },
  descriptionText: {
    margin: 0,
    fontSize: '18px',
    lineHeight: 1.28,
    color: '#111',
  },
  audioBar: {
    height: '112px',
    minHeight: '112px',
    backgroundColor: '#f8f8f8',
    borderTop: '1px solid #d9d9d9',
    padding: '14px 20px 18px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    flexShrink: 0,
  },
  audioInfo: {
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
  },
  audioLabel: {
    margin: 0,
    fontSize: '14px',
    color: '#a1a1a1',
  },
  audioTime: {
    margin: '8px 0 0 0',
    fontSize: '28px',
    lineHeight: 1,
    fontWeight: '800',
    color: '#000',
  },
  playButton: {
    width: '72px',
    height: '72px',
    borderRadius: '50%',
    border: 'none',
    backgroundColor: '#1560f2',
    color: '#fff',
    fontSize: '34px',
    cursor: 'pointer',
    boxShadow: '0 6px 14px rgba(21,96,242,0.3)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    paddingLeft: '6px',
  },
  notFoundWrap: {
    padding: '24px',
  },
  backCircleFallback: {
    width: '56px',
    height: '56px',
    borderRadius: '50%',
    border: 'none',
    backgroundColor: '#fff',
    fontSize: '30px',
    cursor: 'pointer',
    marginBottom: '20px',
  },
  notFoundTitle: {
    fontSize: '28px',
    margin: 0,
  },
}

export default PerspectiveDetail