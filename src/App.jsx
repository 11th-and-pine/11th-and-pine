import { Routes, Route } from 'react-router-dom'
import Onboarding1 from './pages/Onboarding/Onboarding1'
import Onboarding2 from './pages/Onboarding/Onboarding2'
import Onboarding3 from './pages/Onboarding/Onboarding3'
import Onboarding4 from './pages/Onboarding/Onboarding4'
import Tutorial1 from './pages/Onboarding/tutorial1'
import Tutorial2 from './pages/Onboarding/tutorial2'
import Tutorial3 from './pages/Onboarding/tutorial3'
import MapExplore from './pages/Map/MapExplore'
import MapNavigate from './pages/Map/MapNavigate'
import MapWalking from './pages/Map/MapWalking'
import PerspectivesList from './pages/Perspectives/PerspectivesList'
import PerspectiveDetail from './pages/Perspectives/PerspectiveDetail'
import RouteComplete from './pages/RouteComplete'

function App() {
  return (
    <Routes>
      <Route path="/" element={<Onboarding1 />} />
      <Route path="/onboarding/2" element={<Onboarding2 />} />
      <Route path="/onboarding/3" element={<Onboarding3 />} />
      <Route path="/onboarding/4" element={<Onboarding4 />} />
      <Route path="/tutorial/1" element={<Tutorial1 />} />
      <Route path="/tutorial/2" element={<Tutorial2 />} />
      <Route path="/tutorial/3" element={<Tutorial3 />} />
      <Route path="/map" element={<MapExplore />} />
      <Route path="/map/navigate" element={<MapNavigate />} />
      <Route path="/map/walking" element={<MapWalking />} />
      <Route path="/perspectives" element={<PerspectivesList />} />
      <Route path="/perspectives/:id" element={<PerspectiveDetail />} />
      <Route path="/complete" element={<RouteComplete />} />
    </Routes>
  )
}

export default App