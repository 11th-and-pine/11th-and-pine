import { useNavigate } from 'react-router-dom'

function MapWalking() {
  const navigate = useNavigate()
  return (
    <div>
      <h1>You are walking</h1>
      <p>Audio will trigger as you move along the route. Nearby areas will highlight as you approach.</p>
      <button onClick={() => navigate('/complete')}>Finish Route</button>
    </div>
  )
}

export default MapWalking