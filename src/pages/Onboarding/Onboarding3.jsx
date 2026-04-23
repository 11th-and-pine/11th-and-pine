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
      className="h-full bg-[#f3f3f3] flex flex-col [font-family:Roboto,-apple-system,BlinkMacSystemFont,'Helvetica_Neue',sans-serif] overflow-hidden"
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
      <div className="flex-none h-[57%]">
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
        className={`flex-1 min-h-0 flex flex-col justify-between transition-all duration-500 ease-out ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-5'
          }`}
        style={{ paddingLeft: '36px', paddingRight: '28px', paddingTop: 'clamp(12px, 3vh, 28px)', paddingBottom: 'clamp(2px, 1vh, 8px)' }}
      >
        <div className="flex flex-col gap-8">
          <h1
            className="font-semibold text-black leading-[1.05] mb-[clamp(7px,1.5vh,18px)] text-right"
            style={{ fontSize: 'clamp(26px, 6.5vw, 38px)' }}
          >
            Immersive 
            <br />
            Experience
          </h1>

          <p
            className="text-[#4b5563] mb-[clamp(10px,2.5vh,24px)] text-right"
            style={{ fontSize: 'clamp(13px, 3.8vw, 16px)', lineHeight: '1.6' }}
          >
            Follow the route. Stories play as you move. Wear headphones and stay aware of your surroundings.
          </p>

          <div className="flex justify-center gap-2">
            <div className="w-6 h-1.5 rounded-full bg-gray-300" />
            <div className="w-6 h-1.5 rounded-full bg-gray-300" />
            <div className="w-12 h-1.5 rounded-full bg-sky-400" />
          </div>
        </div>

        <div className="flex flex-col items-center mt-auto pb-1 gap-2">
          <button
            onClick={() => navigate('/map/overview')}
            style={{
              width: '90%', background: '#1d4ed8', color: 'white', padding: '8px',
              borderRadius: 20, fontSize: 20, fontWeight: 600, cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center'
            }}
          >
            Continue
          </button>

          <p
            onClick={() => navigate('')}
            className="text-center text-[#b9b9b9] text-xs mt-3 underline cursor-pointer"
          >
            Privacy Policy
          </p>
        </div>
      </div>
    </div>
  )
}

export default Onboarding3
