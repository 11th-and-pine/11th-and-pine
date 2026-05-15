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
    'line-color': '#4b8cff',
    'line-width': 5,
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

  const playAudio = () => {
    const audio = document.getElementById('perspective-audio-player')
    if (audio && !audioError) {
      audio.play().catch(() => setAudioError(true))
    }
  }

  return (
    <div style={styles.page}>
      <div style={styles.scrollArea}>
        <section style={styles.hero}>
          <img
            src={perspective.imageUrl}
            alt={perspective.name}
            style={styles.heroImage}
          />
          <div style={styles.heroOverlay} />

          <NavCircleButton
            onClick={() => navigate('/perspectives')}
            style={styles.backCircle}
          />

          <div style={styles.heroTextBlock}>
            <h1 style={styles.heroTitle}>
              <span style={styles.redText}>PROTEST</span>
              <span style={styles.whiteText}> and</span>
              <br />
              <span style={styles.redText}>CONFLICT</span>
            </h1>

            <p style={styles.locationText}>IN Capitol Hill</p>

            <p style={styles.heroDescription}>
              {perspective.fullBio}
            </p>
          </div>
        </section>

        <section style={styles.content}>
          <h2 style={styles.sectionTitle}>Perspective</h2>

          <div style={styles.perspectiveRow}>
            <img
              src={perspective.imageUrl}
              alt={perspective.name}
              style={styles.avatar}
            />

            <div style={styles.personText}>
              <h3 style={styles.personName}>
                {perspective.name === 'Westlake' ? 'Jordan XXX' : `${perspective.name} XXX`}
              </h3>
              <p style={styles.personRole}>
                {perspective.role || 'Community Volunteer'}
              </p>
            </div>

            <button
              style={styles.playButton}
              disabled={audioError || !perspective.audioUrl}
              onClick={playAudio}
              aria-label="Play audio"
            >
              ▶
            </button>
          </div>

          <p style={styles.bioText}>
            {perspective.name === 'Westlake'
              ? 'Alex joined community supply efforts during the CHOP protests and spent much of his time helping organize food distribution and mutual aid stations around Westlake.'
              : perspective.shortBio}
          </p>

          <h2 style={styles.routeTitle}>Route Info</h2>

          <div style={styles.mapCard}>
            <Map
              mapboxAccessToken={MAPBOX_TOKEN}
              initialViewState={{
                longitude: mapCenter.longitude,
                latitude: mapCenter.latitude,
                zoom: 14,
              }}
              style={styles.map}
              mapStyle="mapbox://styles/mapbox/streets-v12"
              attributionControl={false}
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
        </section>
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
    backgroundColor: '#000',
    overflow: 'hidden',
    color: '#fff',
  },
  scrollArea: {
    height: '100%',
    overflowY: 'auto',
    WebkitOverflowScrolling: 'touch',
    backgroundColor: '#000',
  },
  hero: {
    position: 'relative',
    minHeight: '620px',
    width: '100%',
    overflow: 'hidden',
  },
  heroImage: {
    position: 'absolute',
    inset: 0,
    width: '100%',
    height: '100%',
    objectFit: 'cover',
  },
  heroOverlay: {
    position: 'absolute',
    inset: 0,
    background:
      'linear-gradient(to bottom, rgba(0,0,0,0.05) 0%, rgba(0,0,0,0.35) 45%, rgba(0,0,0,0.96) 100%)',
  },
  backCircle: {
    position: 'absolute',
    top: '24px',
    left: '24px',
    zIndex: 10,
  },
  heroTextBlock: {
    position: 'absolute',
    left: '30px',
    right: '28px',
    bottom: '28px',
    zIndex: 2,
    textAlign: 'right',
  },
  heroTitle: {
    margin: 0,
    fontSize: '44px',
    lineHeight: 1.05,
    fontWeight: 900,
    letterSpacing: '-1px',
  },
  redText: {
    color: '#d64532',
  },
  whiteText: {
    color: '#fff',
    fontWeight: 700,
  },
  locationText: {
    margin: '8px 0 22px',
    fontSize: '15px',
    fontStyle: 'italic',
    color: 'rgba(255,255,255,0.75)',
  },
  heroDescription: {
    margin: 0,
    textAlign: 'center',
    fontSize: '16px',
    lineHeight: 1.2,
    fontWeight: 700,
    color: '#fff',
  },
  content: {
    padding: '28px 30px 48px',
    backgroundColor: '#000',
  },
  sectionTitle: {
    margin: '0 0 26px',
    fontSize: '30px',
    fontWeight: 900,
    color: '#fff',
  },
  perspectiveRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '22px',
    marginBottom: '28px',
  },
  avatar: {
    width: '120px',
    height: '120px',
    borderRadius: '50%',
    objectFit: 'cover',
    flexShrink: 0,
  },
  personText: {
    flex: 1,
    minWidth: 0,
  },
  personName: {
    margin: '0 0 18px',
    fontSize: '24px',
    fontWeight: 800,
    color: '#fff',
  },
  personRole: {
    margin: 0,
    fontSize: '15px',
    fontWeight: 600,
    color: '#fff',
  },
  playButton: {
    border: 'none',
    background: 'transparent',
    color: '#fff',
    fontSize: '46px',
    cursor: 'pointer',
    lineHeight: 1,
    padding: 0,
  },
  bioText: {
    margin: '0 0 58px',
    fontSize: '16px',
    lineHeight: 1.25,
    color: '#fff',
  },
  routeTitle: {
    margin: '0 0 28px',
    fontSize: '30px',
    fontWeight: 900,
    color: '#fff',
  },
  mapCard: {
    width: '100%',
    height: '350px',
    overflow: 'hidden',
    backgroundColor: '#ddd',
  },
  map: {
    width: '100%',
    height: '100%',
  },
  markerDot: {
    width: '18px',
    height: '18px',
    borderRadius: '50%',
    backgroundColor: '#4b8cff',
    border: '3px solid white',
    boxShadow: '0 2px 8px rgba(0,0,0,0.25)',
  },
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