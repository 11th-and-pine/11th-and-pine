import { useNavigate } from 'react-router-dom'

function Onboarding1() {
  const navigate = useNavigate()
  return (
    <div>
      <h1>Welcome to 11th & Pine</h1>
      <p>Discover the story of CHOP through an immersive walking tour.</p>
      <button onClick={() => navigate('/onboarding/2')}>Next</button>
    </div>
  )
}

export default Onboarding1