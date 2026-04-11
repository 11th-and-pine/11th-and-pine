import { useNavigate } from 'react-router-dom'
import { useEffect, useState } from 'react'

import pic1 from '../../assets/images/onboarding1-1.webp'
import pic2 from '../../assets/images/onboarding1-2.jpg'
import pic3 from '../../assets/images/onboarding1-3.webp'

function Onboarding1() {
  const navigate = useNavigate()
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    setTimeout(() => setVisible(true), 100)
  }, [])

  return (
    <div className="min-h-dvh bg-gradient-to-br from-red-500 via-yellow-500 via-green-500 via-blue-500 via-indigo-500 to-purple-500 flex flex-col font-sans">

      <div className="flex-none h-[55vh] relative overflow-hidden bg-indigo-500">

        {/* 图片放这里作为背景， 图片还要改，要加地图吗？ */}
        <img src={pic1} className="absolute inset-0 w-full h-full object-cover" />

        {/* 渐变遮罩 */}
        <div className="absolute bottom-0 left-0 right-0 h-40 bg-gradient-to-b from-transparent to-indigo-500" />
      </div>

      {/* Content */}
      <div className={`flex-1 px-7 py-8 flex flex-col transition-all duration-500 ease-out
        ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-5'}`}>

        {/* Progress dots */}
        <div className="flex gap-1.5 mb-6">
          {[0, 1, 2].map(i => (
            <div key={i} className={`h-1 w-6 rounded-full ${i === 0 ? 'bg-yellow-400' : 'bg-gray-400'}`} />
          ))}
        </div>

        <p className="text-[11px] font-medium tracking-widest text-yellow-400 uppercase mb-2">
          Immersive Tour
        </p>
        <h1 className="font-serif text-[28px] text-white leading-tight mb-3">
          Welcome to 11th & Pine
        </h1>
        <p className="text-[15px] text-gray-200 leading-relaxed font-light flex-1 mb-8">
          Step into the streets of Capitol Hill. Discover the story of CHOP — through the voices, art, and memories of those who were there.
        </p>

        <button
          onClick={() => navigate('/onboarding/2')}
          className="w-full bg-white text-black rounded-2xl py-4 text-base font-medium active:scale-95 transition-transform"
        >
          Begin the tour
        </button>
        <p
          onClick={() => navigate('/home')}
          className="text-center text-gray-300 text-sm mt-3 cursor-pointer"
        >
          Skip intro
        </p>

      </div>
    </div >
  )
}

export default Onboarding1