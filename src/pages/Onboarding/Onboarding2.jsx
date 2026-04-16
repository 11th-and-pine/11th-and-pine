import { useNavigate } from 'react-router-dom'

function Onboarding2() {
  const navigate = useNavigate()
  return (
    <div>
      <h1>Background</h1>
      <p>In 2020, CHOP transformed this neighborhood into a space for protest, community, and reflection.</p>
      <button onClick={() => navigate('/onboarding/3')}>Next</button>
    </div>
  )
}

export default Onboarding2