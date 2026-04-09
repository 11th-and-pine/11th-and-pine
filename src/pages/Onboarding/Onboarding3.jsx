import { useNavigate } from 'react-router-dom'

function Onboarding3() {
  const navigate = useNavigate()
  return (
    <div>
      <h1>Choose your route</h1>
      <p>Follow the main route or explore branching paths along the way.</p>
      <button onClick={() => navigate('/onboarding/4')}>Next</button>
    </div>
  )
}

export default Onboarding3