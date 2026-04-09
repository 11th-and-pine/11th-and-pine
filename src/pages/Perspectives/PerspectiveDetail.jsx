import { useNavigate } from 'react-router-dom'

function PerspectiveDetail() {
  const navigate = useNavigate()
  return (
    <div>
      <h1>Perspective</h1>
      <p>A first-hand account of life inside CHOP.</p>
      <button onClick={() => navigate('/perspectives')}>Back</button>
    </div>
  )
}

export default PerspectiveDetail