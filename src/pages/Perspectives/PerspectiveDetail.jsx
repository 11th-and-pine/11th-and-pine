import { useNavigate, useParams } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { getPerspectiveById } from '../../services/dataService'

function PerspectiveDetail() {
  const navigate = useNavigate()
  const { id } = useParams()
  const perspective = getPerspectiveById(id)
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    const timer = setTimeout(() => setLoaded(true), 80)
    return () => clearTimeout(timer)
  }, [])

  if (!perspective) {
    return (
      <div style={styles.page}>
        <div style={styles.container}>
          <div style={styles.topLabel}>PERSPECTIVE</div>
          <h1 style={styles.title}>Perspective not found</h1>
          <p style={styles.subtitle}>
            We couldn’t find the story you were looking for.
          </p>
        </div>

        <div style={styles.bottomBar}>
          <button style={styles.primaryButton} onClick={() => navigate('/perspectives')}>
            Back
          </button>
        </div>
      </div>
    )
  }

  return (
    <div style={styles.page}>
      <div
        style={{
          ...styles.container,
          opacity: loaded ? 1 : 0,
          transform: loaded ? 'translateY(0)' : 'translateY(18px)',
          transition: 'all 0.45s ease',
        }}
      >
        <div style={styles.topLabel}>PERSPECTIVE</div>

        <div style={styles.heroRow}>
          <div style={styles.iconBox}>
            <span style={styles.iconText}>
              {perspective.name?.charAt(0)?.toUpperCase() || '?'}
            </span>
          </div>

          <div>
            <h1 style={styles.title}>{perspective.name}</h1>
            <p style={styles.role}>{perspective.role}</p>
          </div>
        </div>

        <div style={styles.section}>
          <p style={styles.bodyText}>{perspective.fullBio}</p>
        </div>

        <div style={styles.section}>
          <h2 style={styles.sectionTitle}>Listen</h2>
          {perspective.audioUrl ? (
            <audio controls src={perspective.audioUrl} style={styles.audioPlayer}>
              Your browser does not support the audio element.
            </audio>
          ) : (
            <p style={styles.audioFallback}>
              Audio is not available for this perspective yet.
            </p>
          )}
        </div>
      </div>

      <div style={styles.bottomBar}>
        <button style={styles.primaryButton} onClick={() => navigate('/perspectives')}>
          Back
        </button>
      </div>
    </div>
  )
}

const styles = {
  page: {
    minHeight: '100vh',
    backgroundColor: '#f3f3f1',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'space-between',
    padding: '24px 24px 32px',
    boxSizing: 'border-box',
  },
  container: {
    maxWidth: '900px',
    width: '100%',
    margin: '0 auto',
  },
  topLabel: {
    fontSize: '14px',
    letterSpacing: '2px',
    fontWeight: '700',
    color: '#db5c49',
    marginBottom: '28px',
  },
  heroRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '20px',
    marginBottom: '26px',
  },
  iconBox: {
    width: '68px',
    height: '68px',
    borderRadius: '14px',
    backgroundColor: '#9cc8eb',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  iconText: {
    fontSize: '30px',
    fontWeight: '700',
    color: '#3b3b3b',
    fontFamily: 'Georgia, "Times New Roman", serif',
  },
  title: {
    fontFamily: 'Georgia, "Times New Roman", serif',
    fontSize: '52px',
    lineHeight: 1.05,
    fontWeight: '700',
    color: '#2f2f2f',
    margin: 0,
  },
  role: {
    margin: '10px 0 0 0',
    fontSize: '22px',
    color: '#66635f',
  },
  subtitle: {
    fontSize: '22px',
    lineHeight: 1.5,
    color: '#66635f',
    margin: 0,
  },
  section: {
    marginTop: '24px',
  },
  bodyText: {
    fontSize: '24px',
    lineHeight: 1.65,
    color: '#66635f',
    margin: 0,
    maxWidth: '820px',
  },
  sectionTitle: {
    fontFamily: 'Georgia, "Times New Roman", serif',
    fontSize: '28px',
    color: '#2f2f2f',
    margin: '0 0 14px 0',
  },
  audioPlayer: {
    width: '100%',
    maxWidth: '520px',
  },
  audioFallback: {
    fontSize: '18px',
    color: '#66635f',
    margin: 0,
  },
  bottomBar: {
    maxWidth: '900px',
    width: '100%',
    margin: '36px auto 0',
  },
  primaryButton: {
    width: '100%',
    backgroundColor: '#c73d2c',
    color: '#ffffff',
    border: 'none',
    borderRadius: '12px',
    padding: '18px 20px',
    fontSize: '18px',
    fontWeight: '700',
    cursor: 'pointer',
  },
}

export default PerspectiveDetail