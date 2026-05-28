import { useNavigate } from 'react-router-dom'
import NavCircleButton from '../components/NavCircleButton'

export default function PrivacyPolicy() {
  const navigate = useNavigate()

  return (
    <div className="privacy-page">
      <NavCircleButton
        onClick={() => navigate(-1)}
        style={{
          position: 'absolute',
          top: 'calc(24px + var(--safe-top, 0px))',
          left: 24,
          zIndex: 2,
        }}
      />

      <main className="privacy-content">
        <section className="privacy-section">
          <h2>Location Data</h2>
          <p>
            11th & Pine uses your location only while the app is open to show
            your position, guide routes, and trigger route alerts.
          </p>
          <p>
            We do not collect, store, sell, or record your location data.
          </p>
        </section>

        <section className="privacy-section">
          <p>
            We do not track your movement after you close the app.
          </p>
        </section>
      </main>
    </div>
  )
}
