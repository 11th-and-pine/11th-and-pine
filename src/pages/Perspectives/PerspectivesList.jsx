import { useNavigate } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { getPerspectives } from '../../services/dataService'

function PerspectivesList() {
  const navigate = useNavigate()
  const perspectives = getPerspectives()
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    const timer = setTimeout(() => setLoaded(true), 80)
    return () => clearTimeout(timer)
  }, [])

  return (
    <div style={styles.page}>
      <div style={styles.container}>
        <div style={styles.topLabel}>PERSPECTIVES</div>

        <div style={styles.headerRow}>
          <h1 style={styles.title}>Choose a perspective</h1>
          <p style={styles.subtitle}>
            Explore the route through the voices of people connected to these events.
          </p>
        </div>

        <div style={styles.list}>
          {perspectives.map((p, index) => (
            <div
              key={p.id}
              role="button"
              tabIndex={0}
              onClick={() => navigate(`/perspectives/${p.id}`)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  navigate(`/perspectives/${p.id}`)
                }
              }}
              style={{
                ...styles.card,
                opacity: loaded ? 1 : 0,
                transform: loaded ? 'translateY(0)' : 'translateY(18px)',
                transition: `all 0.45s ease ${index * 0.08}s`,
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-4px)'
                e.currentTarget.style.boxShadow = '0 10px 24px rgba(0,0,0,0.08)'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)'
                e.currentTarget.style.boxShadow = '0 4px 14px rgba(0,0,0,0.04)'
              }}
            >
              <div style={styles.cardLeft}>
                <div style={styles.iconBox}>
                  <span style={styles.iconText}>
                    {p.name?.charAt(0)?.toUpperCase() || '?'}
                  </span>
                </div>
              </div>

              <div style={styles.cardContent}>
                <h2 style={styles.cardTitle}>{p.name}</h2>
                <p style={styles.role}>{p.role}</p>
                <p style={styles.bio}>{p.shortBio}</p>
                <p style={styles.helperText}>Tap to view story and map</p>
              </div>

              <div style={styles.arrow}>→</div>
            </div>
          ))}
        </div>
      </div>

      <div style={styles.bottomBar}>
        <button style={styles.primaryButton} onClick={() => navigate(-1)}>
          Back
        </button>
      </div>
    </div>
  )
}

const styles = {
  page: {
    minHeight: '100%',
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
  headerRow: {
    marginBottom: '30px',
  },
  title: {
    fontFamily: 'Georgia, "Times New Roman", serif',
    fontSize: '52px',
    lineHeight: 1.05,
    fontWeight: '700',
    color: '#2f2f2f',
    margin: '0 0 14px 0',
  },
  subtitle: {
    fontSize: '22px',
    lineHeight: 1.5,
    color: '#66635f',
    maxWidth: '720px',
    margin: 0,
  },
  list: {
    display: 'flex',
    flexDirection: 'column',
    gap: '18px',
    marginTop: '28px',
  },
  card: {
    display: 'flex',
    alignItems: 'center',
    gap: '20px',
    backgroundColor: '#ffffff',
    borderRadius: '22px',
    padding: '22px',
    cursor: 'pointer',
    boxShadow: '0 4px 14px rgba(0,0,0,0.04)',
    outline: 'none',
  },
  cardLeft: {
    flexShrink: 0,
  },
  iconBox: {
    width: '64px',
    height: '64px',
    borderRadius: '14px',
    backgroundColor: '#efd05c',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconText: {
    fontSize: '28px',
    fontWeight: '700',
    color: '#4b4b4b',
    fontFamily: 'Georgia, "Times New Roman", serif',
  },
  cardContent: {
    flex: 1,
  },
  cardTitle: {
    fontFamily: 'Georgia, "Times New Roman", serif',
    fontSize: '34px',
    lineHeight: 1.1,
    color: '#2f2f2f',
    margin: '0 0 8px 0',
  },
  role: {
    fontSize: '18px',
    color: '#8a5b52',
    margin: '0 0 10px 0',
    fontWeight: '600',
  },
  bio: {
    fontSize: '20px',
    lineHeight: 1.5,
    color: '#66635f',
    margin: 0,
  },
  helperText: {
    fontSize: '15px',
    color: '#9a9892',
    margin: '10px 0 0 0',
  },
  arrow: {
    fontSize: '28px',
    color: '#9a9892',
    flexShrink: 0,
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

export default PerspectivesList