import { useNavigate } from 'react-router-dom'
import { useEffect, useState } from 'react'

function Tutorial2() {
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
              <div key={i} className={`h-1 w-6 rounded-full ${i === 1 ? 'bg-[#ef6f61]' : 'bg-[#eadf9c]'}`} />
            ))}
          </div>
          <p className="text-[11px] font-semibold tracking-widest text-[#ef6f61] uppercase">
            How It Works
          </p>
        </div>

        <div className="flex flex-col items-start gap-10">
          <div>
            <div className="w-16 h-16 rounded-lg bg-[#9fd6ff] flex items-center justify-center text-4xl mb-4 shadow-sm">🗺️</div>
            <h2 className="font-serif text-[32px] text-[#293033] leading-tight mb-3">
              Follow the main route
            </h2>
            <p className="text-[16px] text-[#64615a] leading-relaxed">
              Start at Westlake Station, end at Cal Anderson Park. About 1.1 miles · 25 minutes.
            </p>
          </div>

          <div>
            <div className="w-16 h-16 rounded-lg bg-[#b4a7d6] flex items-center justify-center text-4xl mb-4 shadow-sm">🔀</div>
            <h2 className="font-serif text-[32px] text-[#293033] leading-tight mb-3">
              Explore side paths
            </h2>
            <p className="text-[16px] text-[#64615a] leading-relaxed">
              Optional branches let you go deeper. You choose how much to explore.
            </p>
          </div>
        </div>

        <div className="flex flex-col gap-3 mt-10">
          <button
            onClick={() => navigate('/tutorial/3')}
            className="w-full bg-[#c0392b] text-white rounded-lg py-4 text-base font-semibold shadow-sm active:scale-95 transition-transform"
          >
            Continue
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

export default Tutorial2
