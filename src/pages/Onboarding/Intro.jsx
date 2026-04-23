import { useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"

import icon from '../../assets/images/intro-icon.jpg'

export default function Intro() {
  const navigate = useNavigate()
  const [fade, setFade] = useState(false)

  useEffect(() => {
    const timer1 = setTimeout(() => {
      setFade(true)
    }, 1500)

    const timer2 = setTimeout(() => {
      navigate("/onboarding/1")
    }, 1550)

    return () => {
      clearTimeout(timer1)
      clearTimeout(timer2)
    }
  }, [])

  return (
    <div
      className={`h-full flex flex-col items-center justify-center gap-6 bg-white transition-opacity duration-500 ${
        fade ? "opacity-0" : "opacity-100"
      }`}
    >
      <div className="w-40 h-40 rounded-full overflow-hidden animate-drop-bounce">
        <img
          src={icon}
          alt="11th & Pine"
          className="w-full h-full object-cover animate-intro-spin"
        />
      </div>

      <p className="text-xl font-semibold text-gray-800">
        11th & Pine
      </p>
    </div>
  )
}
