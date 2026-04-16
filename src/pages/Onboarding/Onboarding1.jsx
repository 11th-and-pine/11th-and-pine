import { useNavigate } from 'react-router-dom'

function Onboarding1() {
  const navigate = useNavigate()
  return (
    <div>
      <h1>Immersive Experience</h1>
      <p>Wear headphones for the best experience. Stay aware of your surroundings.</p>
      <button onClick={() => navigate('/onboarding/2')}>Next</button>
    </div>
  )
}

export default Onboarding1