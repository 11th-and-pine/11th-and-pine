import { useNavigate } from 'react-router-dom'
import { getPerspectives } from '../../services/dataService'

function PerspectivesList() {
  const navigate = useNavigate()
  const perspectives = getPerspectives()

  return (
    <div>
      <h1>Perspectives</h1>
      <p>Explore the route through the eyes of those who were there.</p>
      {perspectives.map(p => (
        <div key={p.id} onClick={() => navigate(`/perspectives/${p.id}`)}>
          <h2>{p.name}</h2>
          <p>{p.role}</p>
          <p>{p.shortBio}</p>
        </div>
      ))}
    </div>
  )
}

export default PerspectivesList