import { useNavigate, useParams } from 'react-router-dom'
import { getPerspectiveById } from '../../services/dataService'

function PerspectiveDetail() {
  const navigate = useNavigate()
  const { id } = useParams()
  const perspective = getPerspectiveById(id)

  if (!perspective) return <p>Perspective not found.</p>

  return (
    <div>
      <button onClick={() => navigate('/perspectives')}>Back</button>
      <h1>{perspective.name}</h1>
      <p>{perspective.role}</p>
      <p>{perspective.fullBio}</p>
      <audio controls src={perspective.audioUrl} />
    </div>
  )
}

export default PerspectiveDetail