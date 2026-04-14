import { useNavigate } from 'react-router-dom'
import { useEffect, useState } from 'react'

function Tutorial3() {
  const navigate = useNavigate()
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    setTimeout(() => setVisible(true), 100)
  }, [])

  return (
    <div className="min-h-dvh flex flex-col px-8 py-20 font-sans">

      <div className={`flex-1 flex flex-col justify-between transition-all duration-500 ease-out
        ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-5'}`}>

        <div>
          <div className="flex gap-1.5 mb-6">
            {[0, 1, 2].map(i => (
              <div key={i} className={`h-1 w-6 rounded-full ${i === 2 ? 'bg-[#ef6f61]' : 'bg-[#eadf9c]'}`} />
            ))}
          </div>
          <p className="text-[11px] font-semibold tracking-widest text-[#ef6f61] uppercase">
            During The Walk
          </p>
        </div>

        <div className="flex flex-col items-start gap-10">
          <div>
            <div className="w-16 h-16 rounded-lg bg-[#ff9b86] flex items-center justify-center text-4xl mb-4 shadow-sm">🔔</div>
            <h2 className="font-serif text-[32px] text-[#293033] leading-tight mb-3">
              Proximity alerts
            </h2>
            <p className="text-[16px] text-[#64615a] leading-relaxed">
              Your phone vibrates when you're off path. Use in app map to guide you back.
            </p>
          </div>

          <div>
            <div className="w-16 h-16 rounded-lg bg-[#9fd6ff] flex items-center justify-center text-4xl mb-4 shadow-sm">📍</div>
            <h2 className="font-serif text-[32px] text-[#293033] leading-tight mb-3">
              Interactive map
            </h2>
            <p className="text-[16px] text-[#64615a] leading-relaxed">
              Tap any point on the map to preview nearby stories anytime.
            </p>
          </div>
        </div>

        <div className="flex flex-col gap-3 mt-10">
          <button
            onClick={() => navigate('/map')}
            className="w-full bg-[#c0392b] text-white rounded-lg py-4 text-base font-semibold shadow-sm active:scale-95 transition-transform"
          >
            Start the tour
          </button>
          <p
            onClick={() => navigate('/map')}
            className="text-center text-[#827b68] text-sm cursor-pointer"
          >
            Skip
          </p>
        </div>

      </div>
    </div>
  )
}

export default Tutorial3
