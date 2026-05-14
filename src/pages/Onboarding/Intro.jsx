import { useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"

import icon from '../../assets/images/intro-icon.png'

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
  }, [navigate])

  return (
    <div
      className={`onboarding-intro transition-opacity duration-500 ${
        fade ? "opacity-0" : "opacity-100"
      }`}
    >
      <div className="onboarding-intro-icon animate-drop-bounce">
        <img
          src={icon}
          alt="11th & Pine"
          className="onboarding-intro-image animate-intro-spin"
        />
      </div>

      <p className="onboarding-intro-title">
        11th & Pine
      </p>
    </div>
  )
}
