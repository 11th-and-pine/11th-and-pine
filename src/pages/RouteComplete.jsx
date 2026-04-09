import { useNavigate } from 'react-router-dom'

function RouteComplete() {
  const navigate = useNavigate()
  return (
    <div>
      <h1>Route Complete!</h1>
      <p>You have finished exploring this route. Dive deeper into individual perspectives or try another route.</p>
      <button onClick={() => navigate('/perspectives')}>Explore Perspectives</button>
      <button onClick={() => navigate('/map')}>Try Another Route</button>
    </div>
  )
}

export default RouteComplete