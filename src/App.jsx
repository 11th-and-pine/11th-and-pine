import { Navigate, Routes, Route } from 'react-router-dom'
import Intro from './pages/Onboarding/Intro'
import Onboarding1 from './pages/Onboarding/Onboarding1'
import Onboarding2 from './pages/Onboarding/Onboarding2'
import Onboarding3 from './pages/Onboarding/Onboarding3'
import RouteOverview from './pages/Map/RouteOverview'
import NavigateToStart from './pages/Map/NavigateToStart'
import GuidedWalk from './pages/Map/GuidedWalk'
import ExploreRoutes from './pages/Map/ExploreRoutes'
import PerspectivesList from './pages/Perspectives/PerspectivesList'
import PerspectiveDetail from './pages/Perspectives/PerspectiveDetail'

function App() {
  return (
    <div className="phone-shell">
      <Routes>
        <Route path="/" element={<Navigate to="/onboarding/intro" replace />} />
        <Route path="/onboarding/intro" element={<Intro />} />
        <Route path="/onboarding/1" element={<Onboarding1 />} />
        <Route path="/onboarding/2" element={<Onboarding2 />} />
        <Route path="/onboarding/3" element={<Onboarding3 />} />
        <Route path="/map/overview" element={<RouteOverview />} />
        <Route path="/map/navigate" element={<NavigateToStart />} />
        <Route path="/map/walking" element={<GuidedWalk />} />
        <Route path="/map/explore" element={<ExploreRoutes />} />
        <Route path="/perspectives" element={<PerspectivesList />} />
        <Route path="/perspectives/:id" element={<PerspectiveDetail />} />
      </Routes>
    </div>
  )
}

export default App
