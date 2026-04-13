import { useNavigate } from 'react-router-dom'
import { useEffect, useState } from 'react'

function Tutorial3() {
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
                    During the Walk
                </p>

                <div className="flex-1 flex flex-col gap-14 mb-18">

                    <div>
                        <h2 className="font-serif text-[26px] text-white leading-snug mb-3">
                            🔔 Proximity Alerts
                        </h2>
                        <p className="text-[16px] text-white/70 flex items-center gap-2">
                            When you’re close to a story point <br />
                            → your phone will vibrate<br />
                            → audio will be available
                        </p>
                    </div>

                    <div>
                        <h2 className="font-serif text-[26px] text-white leading-snug mb-3">
                            🎧 Audio Interaction
                        </h2>
                        <ul className="flex flex-col gap-2">
                            {['Tap to listen', 'Stories are tied to specific locations'].map(item => (
                                <li key={item} className="text-[16px] text-white/70 flex items-center gap-2">
                                    <span className="w-1.5 h-1.5 rounded-full bg-yellow-400 shrink-0" />
                                    {item}
                                </li>
                            ))}
                        </ul>
                    </div>

                    <div>
                        <h2 className="font-serif text-[26px] text-white leading-snug mb-3">
                            📍 Interactive Map
                        </h2>
                        <ul className="flex flex-col gap-2">
                            {['Highlighted areas = key story points', 'Icons are clickable', 'Preview nearby stories anytime'].map(item => (
                                <li key={item} className="text-[16px] text-white/70 flex items-center gap-2">
                                    <span className="w-1.5 h-1.5 rounded-full bg-yellow-400 shrink-0" />
                                    {item}
                                </li>
                            ))}
                        </ul>
                    </div>

                    <p className="text-[18px] text-purple-200 font-medium">
                        Stay on the path or wander — the experience adapts to you.
                    </p>
                </div>

                <button
                    onClick={() => navigate('/map')}
                    className="w-full bg-white text-black rounded-2xl py-4 text-base font-medium active:scale-95 transition-transform mb-3"
                >
                    Continue
                </button>
            </div>
        </div>
    )
}

export default Tutorial3