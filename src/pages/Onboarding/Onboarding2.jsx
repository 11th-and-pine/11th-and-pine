import { useNavigate } from 'react-router-dom'
import { useEffect, useState } from 'react'

import heroImg from '../../assets/images/onboarding1-2.jpg'

function Onboarding2() {
  const navigate = useNavigate()
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const timer = setTimeout(() => setVisible(true), 100)
    return () => clearTimeout(timer)
  }, [])

  const handleSwipe = (diff) => {
    if (diff > 70) {
      navigate('/onboarding/3')
    }
    if (diff < -70) {
      navigate('/onboarding/1')
    }
  }

  return (
    <div
      className="min-h-dvh bg-[#f3f3f3] flex flex-col font-sans"
      onTouchStart={(e) => {
        const startX = e.touches[0].clientX
        e.currentTarget.ontouchend = (e2) => {
          const diff = startX - e2.changedTouches[0].clientX
          handleSwipe(diff)
        }
      }}
    >
      <div className="flex-none h-[57vh]">
        <svg className="absolute size-0" aria-hidden="true" focusable="false">
          <defs>
            <clipPath id="onboarding-hero-curve" clipPathUnits="objectBoundingBox">
              <path d="M0,0 H1 V0.91 C0.84,1 0.35,1 0,0.85 Z" />
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
        className={`flex-1 px-7 pt-7 pb-8 flex flex-col transition-all duration-500 ease-out ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-5'
          }`}
      >
        <h1 className="text-[30px] font-bold text-black leading-tight mb-5 text-center">
          Background
        </h1>

        <p className="text-[16px] text-[#4b5563] leading-7 mb-8 text-center">
          In 2020, CHOP emerged in Capitol Hill during a wave of protests, transforming
          the neighborhood into a space of gathering and expression.
        </p>

        <div className="mt-auto">
          <div className="flex justify-center gap-2 mb-10">
            <div className="w-6 h-1.5 rounded-full bg-gray-300" />
            <div className="w-12 h-1.5 rounded-full bg-sky-400" />
            <div className="w-6 h-1.5 rounded-full bg-gray-300" />
          </div>

          <button
            onClick={() => navigate('/onboarding/3')}
            className="w-full bg-[#0a5cff] text-white rounded-full py-4 text-xl font-semibold shadow-sm active:scale-95 transition-transform"
          >
            Continue
          </button>

          <p
            onClick={() => navigate('/map')}
            className="text-center text-[#b9b9b9] text-xs mt-4 underline cursor-pointer"
          >
            Privacy Policy
          </p>

        </div>
      </div>
    </div>
  )
}

export default Onboarding2