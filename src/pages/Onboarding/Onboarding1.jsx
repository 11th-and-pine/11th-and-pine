import { useNavigate } from 'react-router-dom'
import { useEffect, useState } from 'react'

import pic1 from '../../assets/images/onboarding1-1.webp'
import pic2 from '../../assets/images/onboarding1-2.jpg'
import pic3 from '../../assets/images/onboarding1-3.webp'

function Onboarding1() {
  const navigate = useNavigate()
  const [visible, setVisible] = useState(false)

  const [currentPic, setCurrentPic] = useState(0)
  const pics = [pic1, pic2, pic3]

  useEffect(() => {
    setTimeout(() => setVisible(true), 100)
  }, [])

  return (
    <div className="min-h-dvh bg-[#f0e8d0] flex flex-col font-sans">

      <div className="flex-none h-[50vh] relative overflow-hidden">
        <div
          className='flex h-full transition-transform duration-300 ease-out'
          style={{ transform: `translateX(-${currentPic * 100}%)` }}
        >
          {pics.map((pic, i) => (
            <img key={i} src={pic} className="w-full h-full object-cover shrink-0" />
          ))}
        </div>

        <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-b from-transparent to-white" />
        {/* 小圆点 */}
        <div className="absolute bottom-8 left-0 right-0 flex justify-center gap-2">
          {pics.map((_, i) => (
            <div
              key={i}
              className={`rounded-full transition-all duration-300 ${i === currentPic ? 'w-4 h-2 bg-white' : 'w-2 h-2 bg-white/50'
                }`}
            />
          ))}
        </div>
        {/* 移动端滑动切换图片 */}
        <div
          className="absolute inset-0"
          onTouchStart={(e) => {
            const startX = e.touches[0].clientX
            e.currentTarget.ontouchend = (e2) => {
              const diff = startX - e2.changedTouches[0].clientX
              if (diff > 50) setCurrentPic(prev => Math.min(prev + 1, pics.length - 1))
              if (diff < -50) setCurrentPic(prev => Math.max(prev - 1, 0))
            }
          }}
        />
      </div>

      <div className={`flex-1 px-7 pt-6 pb-10 flex flex-col transition-all duration-500 ease-out
        ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-5'}`}>

        <p className="text-[11px] font-semibold tracking-widest text-[#e8a020] uppercase mb-3">
          A living memory map
        </p>
        <h1 className="font-serif text-[30px] text-[#1a1208] leading-tight mb-4">
          Welcome to 11th & Pine
        </h1>
        <p className="text-[16px] text-[#64615a] leading-relaxed flex-1 mb-8">
          Capitol Hill Organized Protest (CHOP) was a community-led protest zone in Seattle during the summer of 2020.
          <br />
          This app walks you through those streets. At each location, you'll hear the stories of the people who were there.
        </p>

        <button
          onClick={() => navigate('/tutorial/1')}
          className="w-full bg-[#c0392b] text-white rounded-lg py-4 text-base font-semibold shadow-sm active:scale-95 transition-transform"
        >
          Continue
        </button>
        <p
          onClick={() => navigate('/map')}
          className="text-center text-[#827b68] text-sm mt-3 cursor-pointer"
        >
          Skip intro
        </p>

      </div>
    </div >
  )
}

export default Onboarding1
