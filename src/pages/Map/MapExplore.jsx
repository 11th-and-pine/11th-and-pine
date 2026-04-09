import { useNavigate } from 'react-router-dom'

function MapExplore() {
  const navigate = useNavigate()
  return (
    <div>
      <h1>Explore the Route</h1>
      <p>View the main route and branching paths from Westlake Station to Cal Anderson Park.</p>
      <button onClick={() => navigate('/map/navigate')}>Start Navigation</button>
    </div>
  )
}

export default MapExplore