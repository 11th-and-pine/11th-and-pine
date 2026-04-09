import { useNavigate } from 'react-router-dom'

function Onboarding2() {
  const navigate = useNavigate()
  return (
    <div>
      <h1>Put on your headphones</h1>
      <p>For the best experience, wear headphones throughout the tour.</p>
      <button onClick={() => navigate('/onboarding/3')}>Next</button>
    </div>
  )
}

export default Onboarding2