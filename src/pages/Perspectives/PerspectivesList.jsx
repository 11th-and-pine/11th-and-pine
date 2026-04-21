import { useNavigate } from 'react-router-dom'
import { getPerspectives } from '../../services/dataService'

function PerspectivesList() {
  const navigate = useNavigate()
  const perspectives = getPerspectives()

  const featuredPerspective =
    perspectives.find(
      (p) =>
        p.featuredTitle === 'WESTLAKE PROTEST' ||
        p.name?.toLowerCase().includes('westlake')
    ) || perspectives[0]

  const remainingPerspectives = perspectives.filter(
    (p) => p.id !== featuredPerspective?.id
  )

  return (
    <div style={styles.page}>
      <div style={styles.topBar}>
        <button style={styles.backButton} onClick={() => navigate('/complete')}>
          ←
        </button>
        <h1 style={styles.topBarTitle}>PERSPECTIVES</h1>
        <div style={styles.topBarSpacer} />
      </div>

      <div style={styles.scrollArea}>
        <div style={styles.content}>
          <p style={styles.eyebrow}>NEIGHBORHOOD LENS</p>

          <h2 style={styles.heroTitle}>
            Explore the
            <br />
            Routes
          </h2>

          <p style={styles.description}>
            This part provides background context and deeper insights that
            complement the audio you hear as you move through the space.
          </p>

          {featuredPerspective && (
            <div
              style={styles.featuredCard}
              onClick={() => navigate(`/perspectives/${featuredPerspective.id}`)}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  navigate(`/perspectives/${featuredPerspective.id}`)
                }
              }}
            >
              <img
                src={
                  featuredPerspective.imageUrl ||
                  'https://images.unsplash.com/photo-1593113598332-cd59a93a9c98?auto=format&fit=crop&w=1200&q=80'
                }
                alt={featuredPerspective.name}
                style={styles.featuredImage}
              />
              <div style={styles.featuredOverlay} />
              <div style={styles.featuredTextWrap}>
                <p style={styles.featuredLabel}>CORE NARRATIVE</p>
                <h3 style={styles.featuredTitle}>WESTLAKE PROTEST</h3>
              </div>
            </div>
          )}

          <div style={styles.sectionHeader}>
            <h3 style={styles.sectionTitle}>CHOP</h3>
            <div style={styles.sectionLine} />
          </div>

          <div style={styles.grid}>
            {remainingPerspectives.map((p) => (
              <div
                key={p.id}
                style={styles.smallCard}
                onClick={() => navigate(`/perspectives/${p.id}`)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    navigate(`/perspectives/${p.id}`)
                  }
                }}
              >
                <img
                  src={
                    p.imageUrl ||
                    'https://images.unsplash.com/photo-1517048676732-d65bc937f952?auto=format&fit=crop&w=900&q=80'
                  }
                  alt={p.name}
                  style={styles.smallImage}
                />
                <div style={styles.smallOverlay} />
                <div style={styles.smallTextWrap}>
                  <h4 style={styles.smallTitle}>{p.name}</h4>
                  <p style={styles.smallBio}>{p.shortBio}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

const styles = {
  page: {
    height: '100%',
    display: 'flex',
    flexDirection: 'column',
    backgroundColor: '#f3f3f1',
    color: '#1f2937',
  },
  topBar: {
    height: '78px',
    minHeight: '78px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '0 16px',
    borderBottom: '1px solid #ddd9d2',
    backgroundColor: '#f3f3f1',
    flexShrink: 0,
  },
  backButton: {
    width: '40px',
    height: '40px',
    border: 'none',
    background: 'transparent',
    fontSize: '28px',
    lineHeight: 1,
    cursor: 'pointer',
    color: '#111827',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  topBarTitle: {
    fontSize: '20px',
    fontWeight: '800',
    letterSpacing: '0.5px',
    color: '#1f2a44',
    margin: 0,
  },
  topBarSpacer: {
    width: '40px',
    height: '40px',
  },
  scrollArea: {
    flex: 1,
    overflowY: 'auto',
    WebkitOverflowScrolling: 'touch',
  },
  content: {
    padding: '28px 20px 28px',
  },
  eyebrow: {
    fontSize: '10px',
    letterSpacing: '2.8px',
    color: '#586a97',
    marginBottom: '18px',
  },
  heroTitle: {
    fontSize: '52px',
    lineHeight: 0.95,
    fontWeight: '800',
    color: '#2f3431',
    margin: '0 0 22px 0',
    letterSpacing: '-1.5px',
  },
  description: {
    fontSize: '16px',
    lineHeight: 1.55,
    color: '#626664',
    marginBottom: '28px',
  },
  featuredCard: {
    position: 'relative',
    width: '100%',
    height: '370px',
    overflow: 'hidden',
    marginBottom: '28px',
    cursor: 'pointer',
    backgroundColor: '#ccc',
  },
  featuredImage: {
    width: '100%',
    height: '100%',
    objectFit: 'cover',
    display: 'block',
  },
  featuredOverlay: {
    position: 'absolute',
    inset: 0,
    background:
      'linear-gradient(to top, rgba(0,0,0,0.72) 12%, rgba(0,0,0,0.18) 52%, rgba(0,0,0,0.04) 100%)',
  },
  featuredTextWrap: {
    position: 'absolute',
    left: '18px',
    right: '18px',
    bottom: '24px',
  },
  featuredLabel: {
    fontSize: '10px',
    letterSpacing: '3px',
    color: 'rgba(255,255,255,0.75)',
    marginBottom: '12px',
  },
  featuredTitle: {
    fontSize: '34px',
    lineHeight: 1.02,
    fontWeight: '800',
    color: '#ffffff',
    margin: 0,
    textTransform: 'uppercase',
  },
  sectionHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
    marginBottom: '18px',
  },
  sectionTitle: {
    fontSize: '28px',
    fontWeight: '800',
    color: '#2f3431',
    margin: 0,
  },
  sectionLine: {
    flex: 1,
    height: '1px',
    backgroundColor: '#d8d4cd',
    marginTop: '4px',
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '14px',
    paddingBottom: '24px',
  },
  smallCard: {
    position: 'relative',
    height: '390px',
    borderRadius: '8px',
    overflow: 'hidden',
    cursor: 'pointer',
    backgroundColor: '#d7d7d7',
  },
  smallImage: {
    width: '100%',
    height: '100%',
    objectFit: 'cover',
    display: 'block',
  },
  smallOverlay: {
    position: 'absolute',
    inset: 0,
    background:
      'linear-gradient(to top, rgba(0,0,0,0.78) 10%, rgba(0,0,0,0.18) 56%, rgba(0,0,0,0.04) 100%)',
  },
  smallTextWrap: {
    position: 'absolute',
    left: '14px',
    right: '14px',
    bottom: '16px',
  },
  smallTitle: {
    fontSize: '24px',
    fontWeight: '800',
    color: '#ffffff',
    margin: '0 0 8px 0',
    textTransform: 'uppercase',
  },
  smallBio: {
    fontSize: '13px',
    lineHeight: 1.25,
    color: 'rgba(255,255,255,0.88)',
    margin: 0,
  },
}

export default PerspectivesList