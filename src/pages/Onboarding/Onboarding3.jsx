import { useNavigate } from 'react-router-dom'
import { useEffect, useRef, useState } from 'react'

import heroImg from '../../assets/images/onboarding1-3.webp'

function Onboarding3() {
  const navigate = useNavigate()
  const [visible, setVisible] = useState(false)
  const touchStartX = useRef(null)

  useEffect(() => {
    const timer = setTimeout(() => setVisible(true), 100)
    return () => clearTimeout(timer)
  }, [])

  const handleSwipe = (diff) => {
    if (diff < -70) {
      navigate('/onboarding/2')
    }
  }

  return (
    <div
      className="onboarding-page"
      onTouchStart={(e) => {
        touchStartX.current = e.touches[0].clientX
      }}
      onTouchEnd={(e) => {
        if (touchStartX.current === null) return
        const diff = touchStartX.current - e.changedTouches[0].clientX
        touchStartX.current = null
        handleSwipe(diff)
      }}
    >
      <div className="onboarding-hero">
        <svg className="absolute size-0" aria-hidden="true" focusable="false">
          <defs>
            <clipPath id="onboarding-hero-curve" clipPathUnits="objectBoundingBox">
              <path d="M0,0 H1 V0.75 C0.84,1 0.25,0.9 0,1 Z" />
            </clipPath>
          </defs>
        </svg>

        <div
          className="relative h-full"
          style={{ filter: 'drop-shadow(0px 8px 8px rgba(0,0,0,0.3))' }}
        >
          <div
            className="relative h-full overflow-hidden"
            style={{ clipPath: 'url(#onboarding-hero-curve)' }}
          >
            <img
              src={heroImg}
              alt="Immersive Experience"
              className="w-full h-full object-cover"
            />
          </div>
        </div>
      </div>

      <div
        className={`onboarding-content onboarding-content-right transition-all duration-500 ease-out ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-5'
          }`}
      >
        <div className="onboarding-copy">
          <h1
            className="onboarding-title"
          >
            Immersive 
            <br />
            Experience
          </h1>

          <p
            className="onboarding-body"
          >
            Follow the route. Stories play as you move. Wear headphones and stay aware of your surroundings.
          </p>

          <div className="flex justify-center gap-2">
            <div className="w-6 h-1.5 rounded-full bg-gray-300" />
            <div className="w-6 h-1.5 rounded-full bg-gray-300" />
            <div className="w-12 h-1.5 rounded-full bg-sky-400" />
          </div>
        </div>

        <div className="onboarding-actions">
          <button
            onClick={() => navigate('/map/overview')}
            className="onboarding-button"
          >
            Continue
          </button>

          <p
            onClick={() => navigate('')}
            className="onboarding-privacy"
          >
            Privacy Policy
          </p>
        </div>
      </div>
    </div>
  )
}

export default Onboarding3
