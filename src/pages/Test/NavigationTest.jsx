import { useNavigate } from 'react-router-dom'
import NavCircleButton from '../../components/NavCircleButton'

// Hard-coded test route used to exercise the navigation flow end-to-end.
// Start and end are the coordinates requested for the nav test fixture.
const TEST_ROUTE = {
  id: 'nav-test',
  title: 'Navigation Test Route',
  color: '#0EA5E9', // teal — distinct from sim purple and the main red
  perspectiveId: '1',
  path: [
    [47.664413, -122.311997], // start
    [47.661450, -122.312084], // end
  ],
}

function formatCoord(coord) {
  return `${coord[0].toFixed(6)}, ${coord[1].toFixed(6)}`
}

export default function NavigationTest() {
  const navigate = useNavigate()
  const start = TEST_ROUTE.path[0]
  const end = TEST_ROUTE.path[TEST_ROUTE.path.length - 1]

  return (
    <div style={styles.page}>
      <div style={styles.topBar}>
        <NavCircleButton onClick={() => navigate('/map/overview')} />
      </div>

      <div style={styles.content}>
        <h1 style={styles.title}>Navigation Test</h1>

        <p style={styles.subtitle}>
          Fixture route for testing the navigate-to-start and live walking flows.
        </p>

        <div style={styles.card}>
          <div style={styles.row}>
            <span style={styles.label}>Start</span>
            <span style={styles.value}>{formatCoord(start)}</span>
          </div>

          <div style={styles.divider} />

          <div style={styles.row}>
            <span style={styles.label}>End</span>
            <span style={styles.value}>{formatCoord(end)}</span>
          </div>
        </div>

        <button
          style={styles.primaryButton}
          type="button"
          onClick={() => navigate('/map/navigate', { state: { route: TEST_ROUTE } })}
        >
          Test Navigate to Start
        </button>

        <button
          style={styles.secondaryButton}
          type="button"
          onClick={() => navigate('/map/walking/live', { state: { route: TEST_ROUTE } })}
        >
          Skip to Live Walking
        </button>

        <p style={styles.hint}>
          “Test Navigate to Start” opens the navigation page that guides the user
          from their current GPS position to the start coordinate. “Skip to Live
          Walking” jumps straight into the guided-walk screen using this fixture
          route.
        </p>
      </div>
    </div>
  )
}

const styles = {
  page: {
    width: '100%',
    height: '100%',
    position: 'relative',
    background: '#F7F6F2',
    overflow: 'auto',
  },

  topBar: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 10,
    padding: '52px 16px 16px',
    display: 'flex',
    alignItems: 'center',
    gap: 10,
  },

  content: {
    padding: '120px 24px 48px',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'stretch',
    gap: 18,
    maxWidth: 480,
    margin: '0 auto',
  },

  title: {
    margin: 0,
    fontSize: 28,
    fontWeight: 800,
    color: '#111827',
    letterSpacing: '-0.4px',
  },

  subtitle: {
    margin: 0,
    color: '#4b5563',
    fontSize: 14,
    lineHeight: 1.55,
  },

  card: {
    background: 'white',
    borderRadius: 18,
    padding: '16px 20px',
    boxShadow: '0 6px 20px rgba(15, 23, 42, 0.06)',
    border: '1px solid rgba(15, 23, 42, 0.05)',
    marginTop: 6,
  },

  row: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    padding: '8px 0',
  },

  label: {
    fontSize: 13,
    fontWeight: 700,
    color: '#6b7280',
    letterSpacing: '0.4px',
    textTransform: 'uppercase',
  },

  value: {
    fontSize: 14,
    color: '#111827',
    fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, "Cascadia Mono", monospace',
  },

  divider: {
    height: 1,
    background: 'rgba(15, 23, 42, 0.06)',
    margin: '2px 0',
  },

  primaryButton: {
    width: '100%',
    height: 54,
    border: 0,
    borderRadius: 999,
    background: '#C53E2C',
    color: 'white',
    fontSize: 16,
    fontWeight: 800,
    cursor: 'pointer',
    boxShadow: '0 8px 22px rgba(197, 62, 44, 0.25)',
    marginTop: 4,
  },

  secondaryButton: {
    width: '100%',
    height: 54,
    border: '1px solid rgba(15, 23, 42, 0.12)',
    borderRadius: 999,
    background: 'white',
    color: '#111827',
    fontSize: 16,
    fontWeight: 700,
    cursor: 'pointer',
  },

  hint: {
    margin: '8px 4px 0',
    color: '#6b7280',
    fontSize: 12,
    lineHeight: 1.55,
  },
}
