import { useNavigate } from 'react-router-dom'

function Onboarding3() {
  const navigate = useNavigate()
  return (
    <div>
      <h1>How it works</h1>
      <p>Your phone will vibrate when you approach an audio trigger point. Tap to explore highlights along the route.</p>
      <button onClick={() => navigate('/map/overview')}>Start Walking</button>
    </div>
  )
}

export default Onboarding3