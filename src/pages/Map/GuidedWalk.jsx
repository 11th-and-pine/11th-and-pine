import { useCallback, useState, useEffect, useRef } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import Map, { Source, Layer, Marker } from 'react-map-gl'
import 'mapbox-gl/dist/mapbox-gl.css'
import PinIcon from '../../components/PinIcon'
import NavCircleButton from '../../components/NavCircleButton'

const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_TOKEN
const MAP_STYLE = 'mapbox://styles/mapbox/light-v11'

const DEFAULT_ROUTE_COLOR = '#5272FF'
const PRIMARY_BUTTON_COLOR = '#C53E2C'
const WRONG_ROUTE_COLOR = '#ef4444'

// Walk pacing — each "step" along the route advances every WALK_INTERVAL_MS.
// POI audio windows (with current 2200ms):
//   POI 1 (step 1) → POI 2 (step 3): 4.4s for Westlake Plaza audio
//   POI 2 (step 3) → POI 3 (step 6): 6.6s for Pike/Pine audio
//   POI 3 (step 6) → end       (step 7): 2.2s, but audio keeps playing past `done`
// Bump this if your recordings are longer than the windows above.
const WALK_INTERVAL_MS = 2200
const CAMERA_MOVE_DURATION = 1200
const CAMERA_IDLE_DURATION = 700
const INITIAL_ZOOM = 15.5


const WESTLAKE_ROUTE = [
  [47.61208726167953, -122.33701558200671], // Westlake Center
  [47.6117017475211, -122.33664367843423],
  [47.61217739456354, -122.33554583325099],
  [47.61311511374411, -122.33330990771319],
  [47.61357524872394, -122.33220631461666],
  [47.61528546767674, -122.32803424183338],
  [47.61532231916068, -122.32569616528335],
  [47.61534637433494, -122.31998484534672], // Cal Anderson Park
]

// ~10ft ≈ 0.000030 degrees latitude offset — walker drifts slightly off route
const WRONG_PATH_ROUTE = [
  [47.61208726167953, -122.33701558200671], // same start
  [47.61215, -122.33680], // slight drift
  [47.61240, -122.33590], // drifting further off
  [47.61290, -122.33450], // clearly off route
  [47.61320, -122.33350], // deep off route
]

const POIS = [
  {
    id: 1,
    position: [47.6120, -122.3358],
    triggerStep: 1,
    audioUrl: '/audio/westlake-plaza.mp3',
    name: 'Westlake Plaza',
    title: 'Where the March Began',
    desc: 'On June 1st, 2020, thousands gathered at Westlake Plaza before marching east up Pine Street. Speakers read names of those lost to police violence as the crowd swelled past the monorail and spilled into the streets.',
    ttsText: 'You are at Westlake Plaza. This is the starting point for the walk.'
  },
  {
    id: 2,
    position: [47.6136, -122.3318],
    triggerStep: 3,
    audioUrl: '/audio/pike-pine.mp3',
    name: 'Pike/Pine Corridor',
    title: 'From Auto Row to Activism',
    desc: 'Once lined with car showrooms in the 1920s, Pike/Pine became the heart of Seattle\'s queer community by the 1990s. The corridor\'s brick warehouses and late-night venues made it a natural gathering point during the 2020 uprising.',
    ttsText: 'You are moving through the Pike Pine corridor. Pause here, look around, and then continue east toward Capitol Hill.'
  },
  {
    id: 3,
    position: [47.6153, -122.3240],
    triggerStep: 6,
    audioUrl: '/audio/cal-anderson.mp3',
    name: 'Cal Anderson Park',
    title: 'The Autonomous Zone',
    desc: 'For nearly a month in June 2020, several blocks around Cal Anderson Park became the Capitol Hill Organized Protest — a self-declared police-free zone with community gardens, open mics, and a No Cop Co-op. Named for Washington\'s first openly gay legislator, the park remains a site of memory and mobilization.',
    ttsText: 'You are near Cal Anderson Park.'
  },
]

const toLngLat = ([lat, lng]) => [lng, lat]

function makeInitialViewState(route) {
  return {
    longitude: toLngLat(route[0])[0],
    latitude: toLngLat(route[0])[1],
    zoom: INITIAL_ZOOM,
  }
}

function formatTime(seconds) {
  if (!seconds || isNaN(seconds) || !isFinite(seconds)) return '00:00'
  const minutes = Math.floor(seconds / 60)
  const remainingSeconds = Math.floor(seconds % 60)

  return `${String(minutes).padStart(2, '0')}:${String(remainingSeconds).padStart(2, '0')}`
}

function makeLine(points) {
  if (points.length < 2) {
    return {
      type: 'FeatureCollection',
      features: [],
    }
  }

  return {
    type: 'Feature',
    geometry: {
      type: 'LineString',
      coordinates: points.map(toLngLat),
    },
  }
}

function calcBearing([lat1, lng1], [lat2, lng2]) {
  const toRad = degree => degree * Math.PI / 180

  const y = Math.sin(toRad(lng2 - lng1)) * Math.cos(toRad(lat2))
  const x =
    Math.cos(toRad(lat1)) * Math.sin(toRad(lat2)) -
    Math.sin(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.cos(toRad(lng2 - lng1))

  return (Math.atan2(y, x) * 180 / Math.PI + 360) % 360
}

function distanceFeet([lat1, lng1], [lat2, lng2]) {
  const earthRadiusFeet = 20902231
  const toRad = degree => degree * Math.PI / 180

  const dLat = toRad(lat2 - lat1)
  const dLng = toRad(lng2 - lng1)

  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) *
      Math.cos(toRad(lat2)) *
      Math.sin(dLng / 2) ** 2

  return earthRadiusFeet * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}

// Min distance from point to any segment on the route
function distanceToRoute(point, route) {
  let minDist = Infinity
  for (let i = 0; i < route.length - 1; i++) {
    minDist = Math.min(minDist, distanceFeet(point, route[i]))
  }
  return minDist
}

// Error sound using Web Audio API
function playErrorSound() {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)()
    const playTone = (freq, start, duration, type = 'sine') => {
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      osc.connect(gain)
      gain.connect(ctx.destination)
      osc.type = type
      osc.frequency.setValueAtTime(freq, ctx.currentTime + start)
      gain.gain.setValueAtTime(0.4, ctx.currentTime + start)
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + start + duration)
      osc.start(ctx.currentTime + start)
      osc.stop(ctx.currentTime + start + duration)
    }
    // Descending alert tones
    playTone(880, 0, 0.18, 'square')
    playTone(660, 0.22, 0.18, 'square')
    playTone(440, 0.44, 0.28, 'square')
  } catch {
    // AudioContext not available
  }
}

export default function GuidedWalk() {
  const navigate = useNavigate()
  const location = useLocation()
  const mapRef = useRef()
  const simTimer = useRef(null)
  const wrongSimTimer = useRef(null)
  const audioRef = useRef(null)
  const speechRef = useRef(null)
  const playedPOIs = useRef(new Set())

  const branchRoute = location.state ? location.state.route : null
  const route = branchRoute ? branchRoute.path : WESTLAKE_ROUTE
  const routeColor = branchRoute ? branchRoute.color : DEFAULT_ROUTE_COLOR

  const [step, setStep] = useState(0)
  const [simulating, setSimulating] = useState(false)
  const [done, setDone] = useState(false)
  const [openPOI, setOpenPOI] = useState(null)
  const [exitPromptOpen, setExitPromptOpen] = useState(false)

  // Wrong path simulation state
  const [wrongPathMode, setWrongPathMode] = useState(false)
  const [wrongStep, setWrongStep] = useState(0)
  const [offRouteAlert, setOffRouteAlert] = useState(false)
  const [alertDismissed, setAlertDismissed] = useState(false)

  // Audio player state
  const [audioPlaying, setAudioPlaying] = useState(false)
  const [audioProgress, setAudioProgress] = useState(0)
  const [audioDuration, setAudioDuration] = useState(0)
  const [audioCurrentTime, setAudioCurrentTime] = useState(0)
  const [currentAudioPOI, setCurrentAudioPOI] = useState(null)
  const [audioError, setAudioError] = useState(false)
  const [usingTTS, setUsingTTS] = useState(false)

  const normalPoint = route[step] || route[route.length - 1] || WESTLAKE_ROUTE[0]
  const wrongPoint = WRONG_PATH_ROUTE[Math.min(wrongStep, WRONG_PATH_ROUTE.length - 1)]
  const currentPoint = wrongPathMode ? wrongPoint : normalPoint

  const traveled = wrongPathMode
    ? WRONG_PATH_ROUTE.slice(0, wrongStep + 1)
    : route.slice(0, step + 1)

  const stopSpeech = useCallback(() => {
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      window.speechSynthesis.cancel()
    }
    speechRef.current = null
    setUsingTTS(false)
  }, [])

  const speakPOIText = useCallback((poi) => {
    if (!poi || typeof window === 'undefined' || !window.speechSynthesis) {
      setAudioPlaying(false)
      setAudioError(true)
      return
    }

    if (speechRef.current?.poiId === poi.id) {
      return
    }

    window.speechSynthesis.cancel()

    const utterance = new SpeechSynthesisUtterance(poi.ttsText || poi.desc)
    utterance.poiId = poi.id
    utterance.rate = 0.94
    utterance.pitch = 1
    utterance.onstart = () => {
      setUsingTTS(true)
      setAudioError(false)
      setAudioPlaying(true)
    }
    utterance.onend = () => {
      speechRef.current = null
      setUsingTTS(false)
      setAudioPlaying(false)
      setAudioProgress(100)
    }
    utterance.onerror = () => {
      speechRef.current = null
      setUsingTTS(false)
      setAudioPlaying(false)
      setAudioError(true)
    }

    speechRef.current = utterance
    setUsingTTS(true)
    setAudioError(false)
    setAudioProgress(0)
    setAudioCurrentTime(0)
    setAudioDuration(0)
    window.speechSynthesis.speak(utterance)
  }, [])

  // Trigger POI audio when the walker arrives at a POI's step.
  // Each POI fires at most once per route (tracked in playedPOIs) so
  // re-stepping or jitter won't replay the same clip. This is a plain
  // function — it's called from the simulation interval callback below.
  const triggerPOIAudioForStep = useCallback((currentStep) => {
    const poi = POIS.find(p => p.triggerStep === currentStep)
    if (!poi || playedPOIs.current.has(poi.id)) return

    playedPOIs.current.add(poi.id)
    setCurrentAudioPOI(poi)
    setAudioError(false)
    setAudioProgress(0)
    setAudioCurrentTime(0)
    setAudioDuration(0)
    stopSpeech()

    const a = audioRef.current
    if (!a) return

    a.src = poi.audioUrl
    a.currentTime = 0
    a.play()
      .then(() => setAudioPlaying(true))
      .catch(() => {
        speakPOIText(poi)
      })
  }, [speakPOIText, stopSpeech])

  // Sync external audioPlaying state with the actual <audio> element.
  // (Lets the audio bar's ▶/⏸ button drive playback.)
  useEffect(() => {
    const a = audioRef.current
    if (usingTTS) return
    if (!a || !a.src) return

    if (audioPlaying) {
      a.play().catch(() => setAudioPlaying(false))
    } else {
      a.pause()
    }
  }, [audioPlaying, usingTTS])


  // Camera
  useEffect(() => {
    if (!mapRef.current || !currentPoint) {
      return
    }

    const isMoving = simulating || wrongPathMode

    if (isMoving) {
      const currentRoute = wrongPathMode ? WRONG_PATH_ROUTE : route
      const currentStep = wrongPathMode ? wrongStep : step
      const nextIdx = Math.min(currentStep + 1, currentRoute.length - 1)

      const bearing = currentStep < currentRoute.length - 1
        ? calcBearing(currentRoute[currentStep], currentRoute[nextIdx])
        : mapRef.current.getBearing?.() ?? 0

      mapRef.current.easeTo({
        center: toLngLat(currentPoint),
        zoom: 17.5,
        pitch: 55,
        bearing,
        duration: 1200,
      })
    } else {
      mapRef.current.easeTo({
        center: toLngLat(currentPoint),
        zoom: 15.5,
        pitch: 0,
        bearing: 0,
        duration: 700,
      })
    }
  }, [step, wrongStep, simulating, wrongPathMode, route, currentPoint])

  // Normal walk simulation. Uses a ref to track the current step so the
  // setInterval callback can read it without going through setStep's
  // updater (which is supposed to be pure — side effects belong here in
  // the subscription callback per React 19 hook rules).
  const stepRef = useRef(0)
  useEffect(() => {
    stepRef.current = step
  }, [step])

  useEffect(() => {
    if (simulating && !done && !wrongPathMode) {
      simTimer.current = setInterval(() => {
        const next = Math.min(stepRef.current + 1, route.length - 1)
        stepRef.current = next
        setStep(next)

        triggerPOIAudioForStep(next)

        if (next >= route.length - 1) {
          setSimulating(false)
          setDone(true)
        }
      }, WALK_INTERVAL_MS)
    } else {
      clearInterval(simTimer.current)
      simTimer.current = null
    }

    return () => {
      clearInterval(simTimer.current)
      simTimer.current = null
    }
  }, [simulating, done, wrongPathMode, route, triggerPOIAudioForStep])

  // Wrong path simulation
  useEffect(() => {
    if (wrongPathMode) {
      wrongSimTimer.current = setInterval(() => {
        setWrongStep(prev => {
          const next = prev + 1

          if (next >= WRONG_PATH_ROUTE.length) {
            clearInterval(wrongSimTimer.current)
            return prev
          }

          const newPos = WRONG_PATH_ROUTE[next]
          const distFt = distanceToRoute(newPos, WESTLAKE_ROUTE)

          if (distFt > 15 && !alertDismissed) {
            setOffRouteAlert(true)

            if (navigator.vibrate) {
              navigator.vibrate([300, 150, 300, 150, 300])
            }

            playErrorSound()
          }

          return next
        })
      }, WALK_INTERVAL_MS)
    } else {
      clearInterval(wrongSimTimer.current)
    }

    return () => clearInterval(wrongSimTimer.current)
  }, [wrongPathMode, alertDismissed])

  // Reset state when the route changes — using the "prev prop" pattern
  // (https://react.dev/learn/you-might-not-need-an-effect#resetting-all-state-when-a-prop-changes)
  // instead of an Effect with setState. Timer cleanup is handled by the existing
  // simulation Effects via their deps (`simulating`, `wrongPathMode`, `route`).
  const [prevRoute, setPrevRoute] = useState(route)
  if (prevRoute !== route) {
    setPrevRoute(route)
    setStep(0)
    setSimulating(false)
    setDone(false)
    setWrongPathMode(false)
    setOffRouteAlert(false)
    setAlertDismissed(false)
    setWrongStep(0)
    // Reset audio state — actual ref + <audio> element cleanup happens in
    // the effect below (refs can't be touched during render).
    setCurrentAudioPOI(null)
    setAudioPlaying(false)
    setAudioProgress(0)
    setAudioCurrentTime(0)
    setAudioDuration(0)
    setAudioError(false)
    setUsingTTS(false)
  }

  // Clear played-POI tracking and reset the <audio> element when the route changes.
  useEffect(() => {
    playedPOIs.current.clear()
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      window.speechSynthesis.cancel()
    }
    speechRef.current = null
    const a = audioRef.current
    if (a) {
      a.pause()
      a.removeAttribute('src')
      a.load()
    }
  }, [route])


  function startWrongPath() {
    setSimulating(false)
    setDone(false)
    setOffRouteAlert(false)
    setAlertDismissed(false)
    setWrongStep(0)

    clearInterval(simTimer.current)
    clearInterval(wrongSimTimer.current)

    setTimeout(() => setWrongPathMode(true), 300)
  }

  function stopWrongPath() {
    setWrongPathMode(false)
    setOffRouteAlert(false)
    setAlertDismissed(false)
    setWrongStep(0)

    clearInterval(wrongSimTimer.current)
  }

  function dismissOffRouteAlert() {
    setOffRouteAlert(false)
    setAlertDismissed(true)
  }

  function toggleSimulation() {
    // Audio playback is now driven by POI triggers, not by simulation start/stop.
    // Pausing the simulation also pauses any in-flight audio so the two stay in sync.
    setSimulating(prev => {
      const next = !prev
      if (!next) setAudioPlaying(false)
      return next
    })
  }

  function closePOI() {
    setOpenPOI(null)
  }

  return (
    <div style={styles.page}>
      <style>{animationStyles}</style>

      <Map
        ref={mapRef}
        mapboxAccessToken={MAPBOX_TOKEN}
        initialViewState={makeInitialViewState(route)}
        style={styles.map}
        mapStyle={MAP_STYLE}
        attributionControl={false}
      >
        {/* Full route — faint preview */}
        <Source id="full-route" type="geojson" data={makeLine(route)}>
          <Layer 
            id="full-route-line" 
            type="line"
            layout={styles.routeLineLayout}
            paint={styles.fullRoutePaint(routeColor)}
          />
        </Source>

        {/* Traveled path */}
        <Source id="traveled" type="geojson" data={makeLine(traveled)}>
          <Layer 
            id="traveled-line" 
            type="line"
            layout={styles.routeLineLayout}
            paint={styles.traveledRoutePaint(routeColor, wrongPathMode)}
          />
        </Source>

        {/* Start marker */}
        <Marker 
          longitude={toLngLat(route[0])[0]} 
          latitude={toLngLat(route[0])[1]} 
          anchor="center"
        >
          <div style={styles.routeMarker(routeColor)} />
        </Marker>

        {/* End marker */}
        <Marker 
          longitude={toLngLat(route[route.length - 1])[0]} 
          latitude={toLngLat(route[route.length - 1])[1]} 
          anchor="center"
        >
          <div style={styles.routeMarker(routeColor)} />
        </Marker>

        {/* POI markers */}
        {POIS.map(poi => (
          <Marker
            key={poi.id}
            longitude={poi.position[1]}
            latitude={poi.position[0]}
            anchor="bottom"
          >
            <div onClick={() => setOpenPOI(poi)} style={styles.poiMarker}>
              <PinIcon size={24} />
            </div>
          </Marker>
        ))}

        {/* Walker dot */}
        {!done && (
          <Marker
            longitude={toLngLat(currentPoint)[0]}
            latitude={toLngLat(currentPoint)[1]}
            anchor="center"
          >
            <div style={styles.walkerWrapper}>
              <svg
                width="14"
                height="22"
                viewBox="0 0 14 22"
                fill="none"
                style={styles.walkerDirection}
                aria-hidden="true"
              >
                <path
                  d="M13.6049 0.79137C9.13084 -0.572843 4.30883 -0.163951 0.000218554 1.94501L7.75183 21.2901L13.6049 0.79137Z"
                  fill="url(#walker-direction-gradient-sim)"
                />
                <defs>
                  <radialGradient
                    id="walker-direction-gradient-sim"
                    cx="0"
                    cy="0"
                    r="1"
                    gradientUnits="userSpaceOnUse"
                    gradientTransform="translate(7.75183 21.2901) rotate(10) scale(19.6964 21.3378)"
                  >
                    <stop stopColor="#3478F6" />
                    <stop offset="1" stopColor="#3478F6" stopOpacity="0" />
                  </radialGradient>
                </defs>
              </svg>

              <svg
                width="18"
                height="18"
                viewBox="0 0 18 18"
                fill="none"
                style={styles.walkerDot}
                aria-hidden="true"
              >
                <circle cx="9" cy="9" r="7.5" fill="#0C79FE" stroke="white" strokeWidth="3" />
              </svg>
            </div>
          </Marker>
        )}
      </Map>

      {/* Top bar */}
      <div style={styles.topBar}>
        <div style={styles.topBarContent}>
          <NavCircleButton onClick={() => setExitPromptOpen(true)} />
        </div>
      </div>

      {/* Simulate button */}
      {!done && !wrongPathMode && (
        <div style={styles.simButtonGroup(200)}>
          <button onClick={toggleSimulation} style={styles.simButton}>
            {simulating ? '⏸' : '▶'}
          </button>

          <span style={styles.simLabel}>
            Walking Simulation
          </span>
        </div>
      )}

      {/* Wrong Path button */}
      {!done && (
        <div style={styles.simButtonGroup(wrongPathMode ? 200 : 290)}>
          {wrongPathMode ? (
            <>
              <button onClick={stopWrongPath} style={styles.stopWrongPathButton}>
                ⏹
              </button>

              <span style={styles.stopWrongPathLabel}>
                Stop Test
              </span>
            </>
          ) : (
            <>
              <button onClick={startWrongPath} style={styles.wrongPathButton}>
                ⚠️
              </button>

              <span style={styles.wrongPathLabel}>
                Wrong Path Simulation
              </span>
            </>
          )}
        </div>
      )}

      {/* Hidden HTML5 audio element — drives the player bar below */}
      <audio
        ref={audioRef}
        preload="auto"
        onLoadedMetadata={() => {
          if (audioRef.current) {
            setUsingTTS(false)
            setAudioError(false)
            setAudioDuration(audioRef.current.duration)
          }
        }}
        onTimeUpdate={() => {
          const a = audioRef.current
          if (!a || !a.duration) return
          setAudioCurrentTime(a.currentTime)
          setAudioProgress((a.currentTime / a.duration) * 100)
        }}
        onPlay={() => setAudioPlaying(true)}
        onPause={() => setAudioPlaying(false)}
        onEnded={() => {
          setAudioPlaying(false)
          setAudioProgress(100)
        }}
        onError={() => {
          setAudioPlaying(false)
          setAudioProgress(0)
          setAudioCurrentTime(0)
          setAudioDuration(0)
          if (currentAudioPOI) {
            speakPOIText(currentAudioPOI)
          } else {
            setAudioError(true)
          }
        }}
      />

      {/* Audio player bar */}
      {!done && (
        <div style={styles.audioBar}>
          <div style={styles.audioContent}>
            <button
              disabled={!currentAudioPOI || audioError}
              onClick={() => {
                if (usingTTS) {
                  if (audioPlaying) {
                    window.speechSynthesis.pause()
                    setAudioPlaying(false)
                  } else {
                    window.speechSynthesis.resume()
                    setAudioPlaying(true)
                  }
                  return
                }
                const a = audioRef.current
                if (!a || !a.src || audioError) return  // No POI has triggered yet
                if (a.paused) a.play().catch(() => {
                  if (currentAudioPOI) speakPOIText(currentAudioPOI)
                })
                else a.pause()
              }}
              style={styles.audioPlayButton(!currentAudioPOI || audioError)}
            >
              {audioPlaying ? (
                <svg width="15" height="18" viewBox="0 0 15 18" fill="none" aria-hidden="true">
                  <path d="M10 17.5V0H15V17.5H10ZM0 17.5V0H5V17.5H0Z" fill="white" />
                </svg>
              ) : (
                <svg width="18" height="20" viewBox="0 0 18 20" fill="none" aria-hidden="true">
                  <path d="M17 10L1.25 19.0933V0.906734L17 10Z" fill="white" />
                </svg>
              )}
            </button>

            <div style={styles.audioInfo}>
              <div style={styles.audioTitle}>
                {audioError
                  ? 'Audio unavailable'
                  : currentAudioPOI
                    ? currentAudioPOI.title
                    : 'Title'}
              </div>

              <div style={styles.audioRouteTitle(routeColor)}>
                {audioError
                  ? 'Missing audio file'
                  : usingTTS
                    ? 'Text narration'
                  : currentAudioPOI
                  ? currentAudioPOI.name
                  : (branchRoute ? branchRoute.title : 'Westlake Route')}
              </div>

              <div style={styles.audioProgressTrack}>
                <div style={styles.audioProgressFill(audioProgress)} />
              </div>

              <div style={styles.audioTimeRow}>
                <span style={styles.audioTime}>
                  {formatTime(audioCurrentTime)}
                </span>

                <span style={styles.audioTime}>
                  {formatTime(audioDuration)}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {offRouteAlert && (
        <div style={styles.alertOverlay}>
          <div style={styles.alertBackdrop} />

          <div style={styles.alertCard}>
            <div style={styles.alertIconCircle}>
              <svg
                width="32"
                height="32"
                viewBox="0 0 32 32"
                fill="none"
                style={styles.alertIcon}
              >
                <path
                  d="M10 20 C10 14 16 10 22 10 L22 6 L28 12 L22 18 L22 14 C18 14 14 17 14 22"
                  stroke="#dc2626"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  fill="none"
                />
              </svg>
            </div>

            <div style={styles.alertTitle}>
              Off Route Alert
            </div>

            <div style={styles.alertSubtitle}>
              Please return to the original route.
            </div>
          </div>

          <div style={styles.alertActionsBar}>
            <button
              className="walk-alert-action"
              type="button"
              onClick={stopWrongPath}
              style={styles.alertCancelButton}
            >
              Cancel
            </button>

            <button
              className="walk-alert-action"
              type="button"
              onClick={dismissOffRouteAlert}
              style={styles.alertResumeButton}
            >
              <span style={styles.alertResumeIcon}>▶</span>
              Resume
            </button>
          </div>
        </div>
      )}

      {/* POI detail card */}
      {openPOI && (
        <div onClick={closePOI} style={styles.poiOverlay}>
          <div
            onClick={event => event.stopPropagation()}
            style={styles.poiCard}
          >
            <div style={styles.poiCardTexture} />

            <div style={styles.poiCardIcon}>
              <PinIcon size={72} />
            </div>

            <button onClick={closePOI} style={styles.poiCloseButton}>
              ✕
            </button>

            <div style={styles.poiCardContent}>
              <div style={styles.poiLocationPill}>
                <PinIcon size={14} shadow={false} />

                <span style={styles.poiLocationText}>
                  {openPOI.name}
                </span>
              </div>

              <h2 style={styles.poiTitle}>
                {openPOI.title}
              </h2>

              <p style={styles.poiDescription}>
                {openPOI.desc}
              </p>
            </div>
          </div>
        </div>
      )}

      {exitPromptOpen && !done && (
        <div style={styles.exitPromptOverlay} role="presentation">
          <div style={styles.exitPromptDialog} role="dialog" aria-modal="true" aria-labelledby="exit-prompt-title">
            <svg width="67" height="67" viewBox="0 0 88 88" fill="none" aria-hidden="true" style={{ aspectRatio: '1 / 1' }}>
              <path
                d="M38 24H24v40h14"
                stroke="#9B9B9B"
                strokeWidth="7"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                d="M46 44h24"
                stroke="#9B9B9B"
                strokeWidth="7"
                strokeLinecap="round"
              />
              <path
                d="M60 32l12 12-12 12"
                stroke="#9B9B9B"
                strokeWidth="7"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>

            <h2 id="exit-prompt-title" style={styles.exitPromptTitle}>
              Leave this walk?
            </h2>

            <p style={styles.exitPromptText}>
              Your progress will be saved. You can resume this walk anytime.
            </p>

            <div style={styles.exitPromptActions}>
              <button
                type="button"
                onClick={() => setExitPromptOpen(false)}
                style={styles.exitPromptContinue}
              >
                Continue
              </button>

              <button
                type="button"
                onClick={() => navigate('/map/overview')}
                style={styles.exitPromptLeave}
              >
                Leave
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main route complete */}
      {done && !branchRoute && (
        <div style={styles.branchCompleteOverlay}>
          <div style={styles.arrivedBar}>
            <NavCircleButton
              onClick={() => navigate('/map/overview')}
              ariaLabel="Close completion screen"
              style={styles.arrivedBackButton}
            />
            <span>Arrived</span>
          </div>

          <div style={styles.branchCompleteContent}>
            <div style={styles.branchCompleteTitle}>
              You’ve completed
              <br />
              this route
            </div>

            <div style={styles.branchCompleteButtonGroup}>
              <button
                onClick={() => navigate('/map/overview')}
                style={styles.newRouteButton}
              >
                New Route

                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                  <path
                    d="M21 3 L3 10.5 L10.5 13.5 L13.5 21 L21 3 Z"
                    stroke="white"
                    strokeWidth="1.8"
                    strokeLinejoin="round"
                    fill="none"
                  />
                </svg>
              </button>

              <button
                onClick={() => navigate('/perspectives/1')}
                style={styles.archiveButton}
              >
                More Info
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                  <path
                    d="M4 5.5C4 4.7 4.7 4 5.5 4H10c1.1 0 2 .9 2 2v14c0-1.1-.9-2-2-2H5.5C4.7 18 4 17.3 4 16.5v-11Z"
                    stroke="currentColor"
                    strokeWidth="1.8"
                    strokeLinejoin="round"
                  />
                  <path
                    d="M20 5.5C20 4.7 19.3 4 18.5 4H14c-1.1 0-2 .9-2 2v14c0-1.1.9-2 2-2h4.5c.8 0 1.5-.7 1.5-1.5v-11Z"
                    stroke="currentColor"
                    strokeWidth="1.8"
                    strokeLinejoin="round"
                  />
                </svg>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Branch route complete */}
      {done && branchRoute && (
        <div style={styles.branchCompleteOverlay}>
          <div style={styles.arrivedBar}>
            <NavCircleButton
              onClick={() => navigate('/map/overview')}
              ariaLabel="Close completion screen"
              style={styles.arrivedBackButton}
            />
            <span>Arrived</span>
          </div>

          <div style={styles.branchCompleteContent}>
            <div style={styles.branchCompleteTitle}>
              You’ve completed
              <br />
              this route
            </div>

            <div style={styles.branchCompleteButtonGroup}>
              <button
                onClick={() => navigate('/map/overview')}
                style={styles.newRouteButton}
              >
                New Route

                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                  <path
                    d="M21 3 L3 10.5 L10.5 13.5 L13.5 21 L21 3 Z"
                    stroke="white"
                    strokeWidth="1.8"
                    strokeLinejoin="round"
                    fill="none"
                  />
                </svg>
              </button>

              <button
                onClick={() => navigate(`/perspectives/${branchRoute.perspectiveId || '1'}`)}
                style={styles.archiveButton}
              >
                More Info
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                  <path
                    d="M4 5.5C4 4.7 4.7 4 5.5 4H10c1.1 0 2 .9 2 2v14c0-1.1-.9-2-2-2H5.5C4.7 18 4 17.3 4 16.5v-11Z"
                    stroke="currentColor"
                    strokeWidth="1.8"
                    strokeLinejoin="round"
                  />
                  <path
                    d="M20 5.5C20 4.7 19.3 4 18.5 4H14c-1.1 0-2 .9-2 2v14c0-1.1.9-2 2-2h4.5c.8 0 1.5-.7 1.5-1.5v-11Z"
                    stroke="currentColor"
                    strokeWidth="1.8"
                    strokeLinejoin="round"
                  />
                </svg>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

const animationStyles = `
  @keyframes walkerPulse {
    0% { transform: scale(1); opacity: 0.7; }
    70% { transform: scale(2.2); opacity: 0; }
    100% { transform: scale(1); opacity: 0; }
  }

  @keyframes slideDown {
    from { transform: translateY(-16px); opacity: 0; }
    to { transform: translateY(0); opacity: 1; }
  }

  @keyframes alertSlideUp {
    from { transform: translateY(40px) scale(0.94); opacity: 0; }
    to { transform: translateY(0) scale(1); opacity: 1; }
  }

  @keyframes alertPulse {
    0%, 100% { box-shadow: 0 0 0 0 rgba(220, 38, 38, 0.4); }
    50% { box-shadow: 0 0 0 18px rgba(220, 38, 38, 0); }
  }

  @keyframes iconSpin {
    0% { transform: rotate(-15deg); }
    50% { transform: rotate(15deg); }
    100% { transform: rotate(-15deg); }
  }

  @keyframes wrongWalkerPulse {
    0% { transform: scale(1); opacity: 0.8; }
    70% { transform: scale(2.5); opacity: 0; }
    100% { transform: scale(1); opacity: 0; }
  }
`

const styles = {
  page: {
    height: '100%',
    width: '100%',
    position: 'relative',
    overflow: 'hidden',
  },

  map: {
    width: '100%',
    height: '100%',
  },

  routeLineLayout: {
    'line-cap': 'round',
    'line-join': 'round',
  },

  fullRoutePaint: color => ({
    'line-color': color,
    'line-width': 4,
    'line-opacity': 0.25,
  }),

  traveledRoutePaint: (color, wrongPathMode) => ({
    'line-color': wrongPathMode ? WRONG_ROUTE_COLOR : color,
    'line-width': 5,
    'line-opacity': 0.9,
  }),

  routeMarker: color => ({
    width: 10,
    height: 10,
    background: color,
    border: '2.5px solid white',
    borderRadius: '50%',
  }),

  poiMarker: {
    cursor: 'pointer',
    lineHeight: 0,
  },

  walkerWrapper: {
    position: 'relative',
    width: 84,
    height: 84,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'visible',
  },

  walkerDirection: {
    position: 'absolute',
    left: '50%',
    bottom: '50%',
    width: 42.676,
    height: 39.393,
    transform: 'translateX(-50%) rotate(-80deg)',
    transformOrigin: '50% 100%',
    zIndex: 0,
    pointerEvents: 'none',
  },

  walkerDot: {
    position: 'relative',
    zIndex: 2,
    filter: 'drop-shadow(0 2px 8px rgba(12, 121, 254, 0.45))',
  },

  topBar: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 1000,
    padding: '52px 16px 16px',
  },

  topBarContent: {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
  },

  simButtonGroup: bottom => ({
    position: 'absolute',
    right: 14,
    bottom,
    zIndex: 1000,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: 6,
    transition: 'bottom 0.3s ease',
  }),

  simButton: {
    width: 50,
    height: 50,
    borderRadius: '50%',
    background: '#7D92A7',
    backdropFilter: 'blur(8px)',
    color: 'white',
    fontSize: 18,
    cursor: 'pointer',
    boxShadow: '0 3px 14px rgba(0,0,0,0.45)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    border: 'none',
  },

  simLabel: {
    color: 'white',
    fontSize: 10,
    fontWeight: 600,
    background: 'rgba(0,0,0,0.45)',
    padding: '2px 7px',
    borderRadius: 8,
    maxWidth: 64,
  },

  wrongPathButton: {
    width: 50,
    height: 50,
    borderRadius: '50%',
    background: 'rgba(239,68,68,0.85)',
    backdropFilter: 'blur(8px)',
    color: 'white',
    fontSize: 20,
    cursor: 'pointer',
    boxShadow: '0 3px 14px rgba(239,68,68,0.45)',
    border: 'none',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },

  wrongPathLabel: {
    color: 'white',
    fontSize: 10,
    fontWeight: 600,
    background: 'rgba(0,0,0,0.45)',
    padding: '2px 7px',
    borderRadius: 8,
    textAlign: 'center',
    maxWidth: 64,
  },

  stopWrongPathButton: {
    width: 50,
    height: 50,
    borderRadius: '50%',
    background: '#ef4444',
    color: 'white',
    fontSize: 18,
    cursor: 'pointer',
    boxShadow: '0 3px 14px rgba(239,68,68,0.55)',
    border: 'none',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    animation: 'alertPulse 1.8s infinite',
  },

  stopWrongPathLabel: {
    color: 'white',
    fontSize: 10,
    fontWeight: 600,
    background: 'rgba(220,38,38,0.8)',
    padding: '2px 7px',
    borderRadius: 8,
  },

  audioBar: {
    position: 'absolute',
    bottom: 24,
    left: '50%',
    transform: 'translateX(-50%)',
    zIndex: 1000,
    width: 342,
    height: 93,
    maxWidth: 512,
    display: 'flex',
    alignItems: 'center',
    gap: 16,
    background: 'rgba(255, 255, 255, 0.70)',
    borderRadius: 32,
    border: '1px solid rgba(255, 255, 255, 0.40)',
    boxShadow: '0 12px 48px 0 rgba(0, 73, 197, 0.10)',
    backdropFilter: 'blur(10px)',
    WebkitBackdropFilter: 'blur(10px)',
    padding: 16,
  },

  audioContent: {
    width: '100%',
    display: 'flex',
    alignItems: 'center',
    gap: 16,
  },

  audioPlayButton: disabled => ({
    position: 'relative',
    width: 48,
    height: 48,
    borderRadius: 9999,
    background: '#C53E2C',
    color: 'white',
    cursor: disabled ? 'not-allowed' : 'pointer',
    opacity: disabled ? 0.55 : 1,
    flexShrink: 0,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    border: 'none',
    boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.10), 0 4px 6px -4px rgba(0, 0, 0, 0.10)',
  }),

  audioInfo: {
    flex: 1,
    minWidth: 0,
  },

  audioTitle: {
    fontSize: 16,
    fontWeight: 700,
    color: '#111827',
    marginBottom: 2,
  },

  audioRouteTitle: () => ({
    fontSize: 12,
    color: '#8a5d55',
    marginBottom: 10,
  }),

  audioProgressTrack: {
    height: 6,
    background: '#e5e7eb',
    borderRadius: 3,
    overflow: 'hidden',
  },

  audioProgressFill: progress => ({
    height: '100%',
    borderRadius: 3,
    background: '#EED05D',
    width: `${progress}%`,
    transition: 'width 0.15s linear',
  }),

  audioTimeRow: {
    display: 'flex',
    justifyContent: 'space-between',
    marginTop: 6,
  },

  audioTime: {
    fontSize: 12,
    color: '#9ca3af',
  },

  alertOverlay: {
    position: 'absolute',
    inset: 0,
    zIndex: 3000,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '24px',
    pointerEvents: 'none',
  },

  alertBackdrop: {
    position: 'absolute',
    inset: 0,
    background: 'rgba(0,0,0,0.18)',
    backdropFilter: 'blur(3px)',
    WebkitBackdropFilter: 'blur(3px)',
    pointerEvents: 'auto',
  },

  alertCard: {
    position: 'relative',
    zIndex: 1,
    width: 'min(340px, 86vw)',
    background: 'rgba(255,255,255,0.96)',
    backdropFilter: 'blur(20px)',
    WebkitBackdropFilter: 'blur(20px)',
    borderRadius: 28,
    padding: '36px 28px 28px',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    boxShadow: '0 20px 60px rgba(0,0,0,0.18), 0 0 0 1px rgba(255,255,255,0.5)',
    animation: 'alertSlideUp 0.35s cubic-bezier(0.34,1.56,0.64,1)',
    pointerEvents: 'auto',
  },

  alertIconCircle: {
    width: 72,
    height: 72,
    borderRadius: '50%',
    border: '2.5px solid #dc2626',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 22,
    animation: 'alertPulse 1.6s ease-in-out infinite',
    background: 'rgba(254,242,242,0.6)',
  },

  alertIcon: {
    animation: 'iconSpin 2s ease-in-out infinite',
  },

  alertTitle: {
    fontSize: 22,
    fontWeight: 800,
    color: '#0a0a0a',
    textAlign: 'center',
    marginBottom: 10,
    letterSpacing: '-0.3px',
  },

  alertSubtitle: {
    fontSize: 15,
    color: '#6b7280',
    textAlign: 'center',
    lineHeight: 1.5,
  },

  alertActionsBar: {
    position: 'absolute',
    left: 24,
    right: 24,
    bottom: 24,
    zIndex: 2,
    width: 'min(342px, calc(100vw - 48px))',
    minHeight: 100,
    background: 'rgba(255, 255, 255, 0.70)',
    backdropFilter: 'blur(10px)',
    WebkitBackdropFilter: 'blur(10px)',
    borderRadius: 40,
    padding: 16,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 18,
    boxShadow: '0 -8px 32px 0 rgba(25, 27, 36, 0.06)',
    pointerEvents: 'auto',
    margin: '0 auto',
  },

  alertCancelButton: {
    width: 100,
    height: 68,
    border: 0,
    borderRadius: 99,
    background: '#E7E7F4',
    color: '#191B24',
    textAlign: 'center',
    fontSize: 18,
    fontWeight: 700,
    lineHeight: '28px',
    cursor: 'pointer',
    boxShadow: '0 -8px 32px 0 rgba(25, 27, 36, 0.06)',
    backdropFilter: 'blur(10px)',
    WebkitBackdropFilter: 'blur(10px)',
  },

  alertResumeButton: {
    width: 200,
    height: 68,
    padding: '20px 0',
    border: 0,
    borderRadius: 9999,
    background: '#C53E2C',
    color: '#FFF',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    textAlign: 'center',
    fontSize: 18,
    fontWeight: 700,
    lineHeight: '28px',
    cursor: 'pointer',
    boxShadow: '0 8px 24px 0 rgba(0, 73, 197, 0.30)',
  },

  alertResumeIcon: {
    fontSize: 14,
    lineHeight: 1,
  },

  poiOverlay: {
    position: 'absolute',
    inset: 0,
    zIndex: 2500,
    background: 'rgba(0,0,0,0.55)',
    backdropFilter: 'blur(6px)',
    WebkitBackdropFilter: 'blur(6px)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },

  poiCard: {
    width: 'min(346px, 88vw)',
    height: 'min(538px, 75vh)',
    borderRadius: 40,
    overflow: 'hidden',
    position: 'relative',
    flexShrink: 0,
    background: 'linear-gradient(160deg, #3d3d3d 0%, #1a1a1a 100%)',
  },

  poiCardTexture: {
    position: 'absolute',
    inset: 0,
    background: 'rgba(255,255,255,0.03)',
  },

  poiCardIcon: {
    position: 'absolute',
    top: 80,
    left: 0,
    right: 0,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    opacity: 0.35,
  },

  poiCloseButton: {
    position: 'absolute',
    top: 20,
    right: 20,
    zIndex: 10,
    width: 34,
    height: 34,
    borderRadius: '50%',
    background: 'rgba(0,0,0,0.4)',
    backdropFilter: 'blur(8px)',
    border: '1px solid rgba(255,255,255,0.2)',
    color: 'white',
    fontSize: 15,
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },

  poiCardContent: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    background: 'linear-gradient(to top, rgba(0,0,0,0.92) 0%, rgba(0,0,0,0.75) 55%, transparent 100%)',
    padding: '48px 28px 36px',
  },

  poiLocationPill: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 6,
    marginBottom: 12,
    background: 'rgba(255,255,255,0.12)',
    border: '1px solid rgba(255,255,255,0.25)',
    padding: '4px 12px',
    borderRadius: 99,
  },

  poiLocationText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 600,
  },

  poiTitle: {
    color: 'white',
    fontSize: 26,
    fontWeight: 700,
    margin: '0 0 10px',
    lineHeight: 1.2,
  },

  poiDescription: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 14,
    lineHeight: 1.65,
    margin: '0 0 26px',
  },

  exitPromptOverlay: {
    position: 'absolute',
    inset: 0,
    zIndex: 2100,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    background: 'rgba(0, 0, 0, 0.18)',
    backdropFilter: 'blur(2px)',
    WebkitBackdropFilter: 'blur(2px)',
  },

  exitPromptDialog: {
    width: 'min(342px, calc(100vw - 48px))',
    height: 'min(474px, calc(100dvh - 48px))',
    padding: '68px 34px 36px',
    borderRadius: 32,
    background: 'rgba(255, 255, 255, 0.70)',
    color: '#000',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    textAlign: 'center',
  },

  exitPromptTitle: {
    display: 'flex',
    width: 222,
    height: 36,
    flexDirection: 'column',
    justifyContent: 'center',
    margin: '24px 0 0',
    color: '#000',
    textAlign: 'center',
    fontSize: 24,
    fontWeight: 500,
    lineHeight: '24px',
  },

  exitPromptText: {
    margin: '24px 0 0',
    color: '#424656',
    textAlign: 'center',
    fontSize: 16,
    fontWeight: 400,
    lineHeight: '24px',
  },

  exitPromptActions: {
    width: '100%',
    marginTop: 'auto',
    display: 'flex',
    flexDirection: 'column',
    gap: 22,
  },

  exitPromptContinue: {
    width: '100%',
    height: 57,
    border: 0,
    borderRadius: 999,
    background: '#C53E2C',
    color: 'white',
    fontSize: 24,
    fontWeight: 800,
    cursor: 'pointer',
  },

  exitPromptLeave: {
    width: '100%',
    height: 57,
    border: 0,
    borderRadius: 999,
    background: '#E7E7F4',
    color: '#050505',
    fontSize: 24,
    fontWeight: 800,
    cursor: 'pointer',
  },

  branchCompleteOverlay: {
    position: 'absolute',
    inset: 0,
    zIndex: 2000,
    background: 'rgba(255,255,255,0.68)',
    backdropFilter: 'blur(14px)',
    WebkitBackdropFilter: 'blur(14px)',
    display: 'flex',
    flexDirection: 'column',
  },

  arrivedBar: {
    position: 'relative',
    flexShrink: 0,
    width: '100%',
    height: 65,
    padding: '0 24px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    textAlign: 'center',
    background: 'rgba(255,255,255,0.82)',
    border: '1px solid rgba(0,0,0,0.04)',
    boxShadow: '0 12px 32px rgba(0,0,0,0.03)',
    fontSize: 20,
    fontWeight: 800,
    color: '#C53E2C',
    lineHeight: 1,
  },

  arrivedBackButton: {
    position: 'absolute',
    left: 24,
    top: '50%',
    transform: 'translateY(-50%)',
  },

  branchCompleteContent: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '0 58px 88px',
  },

  branchCompleteTitle: {
    fontSize: 'clamp(34px, 9.2vw, 42px)',
    fontWeight: 800,
    color: '#111827',
    textAlign: 'center',
    lineHeight: 1.08,
    letterSpacing: 0,
    marginBottom: 136,
  },

  branchCompleteButtonGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: 19,
    width: '100%',
    maxWidth: 309,
    alignItems: 'center',
  },

  newRouteButton: {
    width: '100%',
    height: 58,
    padding: '0 24px',
    background: '#C53E2C',
    borderRadius: 999,
    fontSize: 19,
    fontWeight: 800,
    color: 'white',
    cursor: 'pointer',
    border: 'none',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    boxShadow: '0 10px 22px rgba(197, 62, 44, 0.18)',
  },

  archiveButton: {
    width: '100%',
    height: 58,
    padding: '0 24px',
    background: '#E8E7F6',
    borderRadius: 999,
    fontSize: 18,
    fontWeight: 800,
    color: '#111827',
    cursor: 'pointer',
    border: 'none',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
}
