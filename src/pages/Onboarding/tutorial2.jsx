import { useNavigate } from 'react-router-dom'
import { useEffect, useState } from 'react'

function Tutorial2() {
  const navigate = useNavigate()
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    setTimeout(() => setVisible(true), 100)
  }, [])

  return (
    <div className="min-h-dvh bg-gradient-to-br from-red-500 via-yellow-500 via-green-500 via-blue-500 via-indigo-500 to-purple-500 flex flex-col font-sans">
      <div className={`flex-1 px-7 py-8 flex flex-col transition-all duration-500 ease-out
        ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-5'}`}>

        <p className="text-[11px] font-medium tracking-widest text-yellow-400 uppercase mb-10">
          How It Works
        </p>

        <div className="flex-1 flex flex-col gap-14 mb-18">

          <div>
            <h2 className="font-serif text-[26px] text-white leading-snug mb-3">
              Follow the Main Route
            </h2>
            <ul className="flex flex-col gap-2">
              {['Start at Westlake Station', 'End at Cal Anderson Park', '~1.1 miles · ~25 minutes'].map(item => (
                <li key={item} className="text-[16px] text-white/70 flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-yellow-400 shrink-0" />
                  {item}
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h2 className="font-serif text-[26px] text-white leading-snug mb-3">
              🌿 Explore Side Paths
            </h2>
            <ul className="flex flex-col gap-2">
              {['Optional branches allow deeper exploration', 'Tap nearby points to preview stories'].map(item => (
                <li key={item} className="text-[16px] text-white/70 flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-yellow-400 shrink-0" />
                  {item}
                </li>
              ))}
            </ul>
          </div>

          <p className="text-[18px] text-white font-medium">
            You choose how deep you want to explore.
          </p>
        </div>

        <button
          onClick={() => navigate('/tutorial/3')}
          className="w-full bg-white text-black rounded-2xl py-4 text-base font-medium active:scale-95 transition-transform mb-3"
        >
          Continue
        </button>
        <p
          onClick={() => navigate('/map')}
          className="text-center text-white/50 text-sm cursor-pointer underline underline-offset-2"
        >
          Skip
        </p>
      </div>
    </div>
  )
}

export default Tutorial2