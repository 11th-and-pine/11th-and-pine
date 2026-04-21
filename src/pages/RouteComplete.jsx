import { useNavigate } from 'react-router-dom'

function RouteComplete() {
  const navigate = useNavigate()

  return (
    <div style={{
      height: '100%', width: '100%',
      background: '#f3f3f1',
      display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      padding: '32px 24px',
      boxSizing: 'border-box',
    }}>
      <div style={{ fontSize: 56, marginBottom: 20 }}>🎉</div>

      <h1 style={{
        fontSize: 28, fontWeight: 700, color: '#111827',
        textAlign: 'center', marginBottom: 12,
      }}>
        Route Complete!
      </h1>

      <p style={{
        fontSize: 16, color: '#6b7280', lineHeight: 1.6,
        textAlign: 'center', marginBottom: 40, maxWidth: 300,
      }}>
        You've finished exploring this route. Dive deeper into individual perspectives or try another route.
      </p>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 12, width: '100%', maxWidth: 320 }}>
        <button
          onClick={() => navigate('/perspectives')}
          style={{
            padding: '15px', background: '#111827', color: 'white',
            border: 'none', borderRadius: 14, fontSize: 16, fontWeight: 600, cursor: 'pointer',
          }}
        >
          Explore Perspectives
        </button>
        <button
          onClick={() => navigate('/map/explore')}
          style={{
            padding: '15px', background: '#e5e7eb', color: '#111827',
            border: 'none', borderRadius: 14, fontSize: 16, fontWeight: 600, cursor: 'pointer',
          }}
        >
          Try Another Route
        </button>
      </div>
    </div>
  )
}

export default RouteComplete
