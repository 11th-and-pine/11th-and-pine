import { useNavigate } from 'react-router-dom'

function PerspectivesList() {
  const navigate = useNavigate()
  return (
    <div>
      <h1>Perspectives</h1>
      <p>Explore the route through the eyes of those who were there.</p>
      <button onClick={() => navigate('/perspectives/1')}>View Perspective</button>
    </div>
  )
}

export default PerspectivesList