import { useNavigate } from 'react-router-dom'

function MapNavigate() {
  const navigate = useNavigate()
  return (
    <div>
      <h1>Navigate</h1>
      <p>See your current location and distance from the starting point.</p>
      <button onClick={() => navigate('/map/walking')}>Begin Walk</button>
    </div>
  )
}

export default MapNavigate