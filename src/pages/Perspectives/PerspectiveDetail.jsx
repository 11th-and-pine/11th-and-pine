import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import Map, { Marker, Source, Layer } from 'react-map-gl'
import 'mapbox-gl/dist/mapbox-gl.css'
import { getPerspectiveById } from '../../services/dataService'
import NavCircleButton from '../../components/NavCircleButton'

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
  const [audioError, setAudioError] = useState(false)

  if (!perspective) {
    return (
      <div style={styles.page}>
        <div style={styles.notFoundWrap}>
          <NavCircleButton
            onClick={() => navigate('/perspectives')}
            style={styles.backCircleFallback}
          />
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
      {/* Floating back button — lives outside the scroll area so it stays pinned while content scrolls */}
      <NavCircleButton
        onClick={() => navigate('/perspectives')}
        style={styles.backCircle}
      />

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

          <div style={styles.mapPreviewCard}>
            <div style={styles.mapPreviewInner}>
              <Map
                key="thumb-map"
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
                interactive={false}
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
          <p style={styles.audioLabel}>{audioError ? 'Missing audio file' : 'Preview'}</p>
          <p style={styles.audioTime}>{audioError ? 'Unavailable' : `0:00 / ${audioDuration}`}</p>
        </div>

        {perspective.audioUrl ? (
          <button
            disabled={audioError}
            style={styles.playButton(audioError)}
            onClick={() => {
              const audio = document.getElementById('perspective-audio-player')
              if (audio && !audioError) audio.play().catch(() => setAudioError(true))
            }}
          >
            ▶
          </button>
        ) : (
          <button style={styles.playButton(true)} disabled>
            ▶
          </button>
        )}
      </div>

      {perspective.audioUrl && (
        <audio
          id="perspective-audio-player"
          src={perspective.audioUrl}
          preload="metadata"
          onLoadedMetadata={() => setAudioError(false)}
          onError={() => setAudioError(true)}
          style={{ display: 'none' }}
        />
      )}
    </div>
  )
}

const styles = {
  page: {
    position: 'relative',
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
  height: 'min(360px, 45vh)', 
  minHeight: '260px',         
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
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 50,
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
    maxWidth: 'calc(100% - 170px)',
    zIndex: 2,
  },
  heroTitle: {
    margin: 0,
    color: '#fff',
    fontSize: 'clamp(32px, 10vw, 42px)',
    lineHeight: 1.02,
    fontWeight: '800',
    letterSpacing: '-1px',
    wordBreak: 'break-word',
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
    fontSize: '16px',
    lineHeight: 1.28,
    color: '#111',
  },
  audioBar: {
    height: '80px',
    minHeight: '80px',
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
    fontSize: '13px',
    color: '#a1a1a1',
  },
  audioTime: {
    margin: '8px 0 0 0',
    fontSize: '24px',
    lineHeight: 1,
    fontWeight: '800',
    color: '#000',
  },
  playButton: disabled => ({
    width: '49px',
    height: '49px',
    borderRadius: '50%',
    border: 'none',
    backgroundColor: '#C53E2C',
    color: '#fff',
    fontSize: '34px',
    cursor: disabled ? 'not-allowed' : 'pointer',
    opacity: disabled ? 0.5 : 1,
    boxShadow: '0 6px 14px rgba(197, 62, 44, 0.30)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    paddingLeft: '6px',
  }),
  notFoundWrap: {
    padding: '24px',
  },
  backCircleFallback: {
    marginBottom: '20px',
  },
  notFoundTitle: {
    fontSize: '28px',
    margin: 0,
  },
}

export default PerspectiveDetail
