import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import Map, { Source, Layer, Marker } from 'react-map-gl'
import 'mapbox-gl/dist/mapbox-gl.css'

const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_TOKEN

const START_POS = [47.61208726167953, -122.33701558200671]

const toLngLat = ([lat, lng]) => [lng, lat]

// Approximate circle polygon for proximity ring
function circlePolygon([lat, lng], radiusM, steps = 64) {
  const coords = []
  for (let i = 0; i < steps; i++) {
    const angle = (i / steps) * 2 * Math.PI
    const dLat = (radiusM / 111320) * Math.cos(angle)
    const dLng = (radiusM / (111320 * Math.cos(lat * Math.PI / 180))) * Math.sin(angle)
    coords.push([lng + dLng, lat + dLat])
  }
  coords.push(coords[0])
  return { type: 'Feature', geometry: { type: 'Polygon', coordinates: [coords] } }
}

function distanceKm([lat1, lon1], [lat2, lon2]) {
  const R = 6371
  const dLat = (lat2 - lat1) * Math.PI / 180
  const dLon = (lon2 - lon1) * Math.PI / 180
  const a = Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLon / 2) ** 2
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}

function compassDir([lat1, lon1], [lat2, lon2]) {
  const dLon = (lon2 - lon1) * Math.PI / 180
  const φ1 = lat1 * Math.PI / 180
  const φ2 = lat2 * Math.PI / 180
  const y = Math.sin(dLon) * Math.cos(φ2)
  const x = Math.cos(φ1) * Math.sin(φ2) - Math.sin(φ1) * Math.cos(φ2) * Math.cos(dLon)
  const bearing = ((Math.atan2(y, x) * 180 / Math.PI) + 360) % 360
  const dirs = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW']
  return dirs[Math.round(bearing / 45) % 8]
}

const DIR_LABEL = { N: 'North', NE: 'Northeast', E: 'East', SE: 'Southeast', S: 'South', SW: 'Southwest', W: 'West', NW: 'Northwest' }

export default function NavigateToStart() {
  const navigate = useNavigate()
  const mapRef = useRef()
  const [userPos, setUserPos] = useState(null)
  const [gpsError, setGpsError] = useState(false)

  useEffect(() => {
    if (!navigator.geolocation) {
      setGpsError(true)
      return
    }
    navigator.geolocation.getCurrentPosition(
      pos => setUserPos([pos.coords.latitude, pos.coords.longitude]),
      () => setGpsError(true),
      { timeout: 10000 }
    )
  }, [])

  // Fly to midpoint when user position updates
  useEffect(() => {
    if (!userPos) return
    const mid = [
      (userPos[0] + START_POS[0]) / 2,
      (userPos[1] + START_POS[1]) / 2,
    ]
    mapRef.current?.flyTo({ center: [mid[1], mid[0]], zoom: 14, duration: 600 })
  }, [userPos])

  const dist = userPos ? distanceKm(userPos, START_POS) : null
  const distMiles = dist !== null ? dist * 0.621371 : null
  const walkMins = dist !== null ? Math.max(1, Math.round(dist / 0.083)) : null
  const dir = userPos ? compassDir(userPos, START_POS) : null
  const atStart = dist !== null && dist < 0.08

  const mid = userPos
    ? [(userPos[0] + START_POS[0]) / 2, (userPos[1] + START_POS[1]) / 2]
    : [START_POS[0], START_POS[1]]

  return (
    <div style={{ height: '100%', width: '100%', position: 'relative' }}>
      <Map
        ref={mapRef}
        mapboxAccessToken={MAPBOX_TOKEN}
        initialViewState={{ longitude: mid[1], latitude: mid[0], zoom: 14 }}
        style={{ width: '100%', height: '100%' }}
        mapStyle="mapbox://styles/mapbox/light-v11"
        attributionControl={false}
      >
        {/* Dashed line from user to start */}
        {userPos && (
          <Source id="nav-line" type="geojson" data={{
            type: 'Feature',
            geometry: { type: 'LineString', coordinates: [toLngLat(userPos), toLngLat(START_POS)] },
          }}>
            <Layer id="nav-line-layer" type="line"
              layout={{ 'line-cap': 'round', 'line-join': 'round' }}
              paint={{ 'line-color': '#3b82f6', 'line-width': 2, 'line-opacity': 0.65, 'line-dasharray': [2.5, 2] }}
            />
          </Source>
        )}

        {/* Proximity circle around start */}
        <Source id="start-circle" type="geojson" data={circlePolygon(START_POS, 80)}>
          <Layer id="start-circle-fill" type="fill"
            paint={{ 'fill-color': '#22c55e', 'fill-opacity': 0.08 }}
          />
          <Layer id="start-circle-outline" type="line"
            paint={{ 'line-color': '#22c55e', 'line-width': 1.5, 'line-opacity': 0.6, 'line-dasharray': [2, 2] }}
          />
        </Source>

        {/* User dot */}
        {userPos && <Marker longitude={userPos[1]} latitude={userPos[0]} anchor="center">
          <div style={{ position: 'relative', width: 24, height: 24 }}>
            <div style={{ position: 'absolute', inset: 0, background: 'rgba(59,130,246,0.35)', borderRadius: '50%', animation: 'userPing 2s ease-in-out infinite' }} />
            <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', width: 13, height: 13, background: '#3b82f6', border: '3px solid white', borderRadius: '50%', boxShadow: '0 2px 10px rgba(59,130,246,0.7)' }} />
          </div>
        </Marker>}

        {/* Start marker */}
        <Marker longitude={START_POS[1]} latitude={START_POS[0]} anchor="center">
          <div style={{ width: 18, height: 18, background: '#22c55e', border: '3px solid white', borderRadius: '50%', boxShadow: '0 2px 10px rgba(34,197,94,0.6)' }} />
        </Marker>
      </Map>

      {/* Top bar */}
      <div style={{
        position: 'absolute', top: 0, left: 0, right: 0, zIndex: 1000,
        background: 'linear-gradient(to bottom, rgba(0,0,0,0.82) 0%, transparent 100%)',
        padding: '18px 16px 48px',
        display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between',
      }}>
        <button onClick={() => navigate(-1)} style={{
          background: 'rgba(255,255,255,0.12)', border: 'none', color: 'white',
          padding: '8px 14px', borderRadius: 20, fontSize: 14, cursor: 'pointer',
        }}>← Back</button>

        <div style={{
          background: 'rgba(0,0,0,0.5)', border: '1px solid rgba(255,255,255,0.1)',
          borderRadius: 20, padding: '6px 12px',
          display: 'flex', alignItems: 'center', gap: 6,
        }}>
          <div style={{ width: 7, height: 7, borderRadius: '50%', background: userPos ? '#22c55e' : '#f59e0b' }} />
          <span style={{ color: 'white', fontSize: 12 }}>{userPos ? 'Live GPS' : 'Locating…'}</span>
        </div>
      </div>

      {/* Bottom panel */}
      <div style={{
        position: 'absolute', bottom: 0, left: 0, right: 0, zIndex: 1000,
        background: 'white', borderRadius: '24px 24px 0 0',
        boxShadow: '0 -4px 24px rgba(0,0,0,0.10)',
        padding: '14px 20px 44px',
      }}>
        <div style={{ width: 40, height: 4, background: '#d1d5db', borderRadius: 2, margin: '0 auto 20px' }} />

        {!userPos && !gpsError && (
          <div style={{ textAlign: 'center', marginBottom: 20 }}>
            <div style={{ color: '#6b7280', fontSize: 14 }}>Getting your location…</div>
          </div>
        )}

        {gpsError && (
          <div style={{ textAlign: 'center', marginBottom: 20 }}>
            <div style={{ color: '#ef4444', fontWeight: 600, fontSize: 14 }}>Could not access GPS. Please enable location permissions.</div>
          </div>
        )}

        {userPos && (atStart ? (
          <div style={{ textAlign: 'center', marginBottom: 20 }}>
            <div style={{ fontSize: 36, marginBottom: 8 }}>✅</div>
            <div style={{ color: '#111827', fontWeight: 700, fontSize: 18 }}>You're at the starting point!</div>
            <div style={{ color: '#6b7280', fontSize: 14, marginTop: 4 }}>Westlake Center — ready to begin</div>
          </div>
        ) : (
          <div style={{
            display: 'flex', alignItems: 'center', gap: 12,
            background: '#eff6ff', border: '1px solid #bfdbfe',
            borderRadius: 16, padding: '14px', marginBottom: 18,
          }}>
            <div style={{ width: 46, height: 46, flexShrink: 0, background: '#dbeafe', borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22 }}>🧭</div>
            <div>
              <div style={{ color: '#111827', fontWeight: 600, fontSize: 15 }}>Head {DIR_LABEL[dir]} to reach start</div>
              <div style={{ color: '#6b7280', fontSize: 13, marginTop: 2 }}>Westlake Center · {distMiles.toFixed(2)} mi · ~{walkMins} min walk</div>
            </div>
          </div>
        ))}

        <button onClick={() => navigate('/map/walking')} style={{
          width: '100%', background: atStart ? '#22c55e' : '#84C4FF',
          color: '#0a0a0a', border: 'none', padding: '15px', borderRadius: 16,
          fontSize: 16, fontWeight: 600, cursor: 'pointer',
        }}>
          {atStart ? 'Begin Walk →' : 'Begin Walk Anyway →'}
        </button>
      </div>
    </div>
  )
}
