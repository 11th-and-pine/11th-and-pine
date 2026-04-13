import { useNavigate } from 'react-router-dom'
import { useEffect, useState } from 'react'

function Tutorial1() {
  const navigate = useNavigate()
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    setTimeout(() => setVisible(true), 100)
  }, [])

  return (
    <div className="min-h-dvh bg-[#0e1a14] flex flex-col px-7 py-10 font-sans">

      <div className={`flex-1 flex flex-col justify-between transition-all duration-500 ease-out
        ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-5'}`}>

        {/* Top */}
        <div>
          <div className="flex gap-1.5 mb-10">
            {[0, 1, 2].map(i => (
              <div key={i} className={`h-1 w-6 rounded-full ${i === 0 ? 'bg-yellow-400' : 'bg-white/20'}`} />
            ))}
          </div>
          <p className="text-[11px] font-medium tracking-widest text-yellow-400 uppercase mb-4">
            Before You Start
          </p>
        </div>

        {/* Center content */}
        <div className="flex flex-col gap-10">
          <div>
            <div className="text-5xl mb-4">🎧</div>
            <h2 className="font-serif text-[32px] text-white leading-tight mb-3">
              Wear headphones
            </h2>
            <p className="text-[16px] text-white/50 leading-relaxed">
              Audio stories trigger automatically as you reach each location.
            </p>
          </div>

          <div>
            <div className="text-5xl mb-4">🚶</div>
            <h2 className="font-serif text-[32px] text-white leading-tight mb-3">
              Stay aware
            </h2>
            <p className="text-[16px] text-white/50 leading-relaxed">
              This is a real-world walk. Be mindful of your surroundings and traffic.
            </p>
          </div>
        </div>

        {/* Bottom */}
        <div className="flex flex-col gap-3 mt-10">
          <button
            onClick={() => navigate('/tutorial/2')}
            className="w-full bg-white text-black rounded-2xl py-4 text-base font-medium active:scale-95 transition-transform"
          >
            Continue
          </button>
          <p
            onClick={() => navigate('/home')}
            className="text-center text-white/30 text-sm cursor-pointer"
          >
            Skip
          </p>
        </div>

      </div>
    </div>
  )
}

export default Tutorial1