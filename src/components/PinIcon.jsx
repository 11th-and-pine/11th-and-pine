/**
 * Map pin icon — teardrop shape with a white dot inside.
 * Bottom-tip of the SVG sits at (width/2, height) so use anchor="bottom" on
 * Mapbox <Marker> to place the tip at the exact coordinate.
 */
export default function PinIcon({
  size = 28,
  color = '#BF360C',
  shadow = true,
}) {
  // Native aspect: 28 wide × 36 tall
  const width = size
  const height = Math.round((size * 36) / 28)
  return (
    <svg
      width={width}
      height={height}
      viewBox="0 0 28 36"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      style={{
        display: 'block',
        filter: shadow ? 'drop-shadow(0 2px 4px rgba(0,0,0,0.28))' : 'none',
        pointerEvents: 'none',
      }}
      aria-hidden="true"
    >
      <path
        d="M14 0.8 C7.2 0.8 2 5.8 2 12.6 C2 20.4 14 35 14 35 C14 35 26 20.4 26 12.6 C26 5.8 20.8 0.8 14 0.8 Z"
        fill={color}
      />
      <circle cx="14" cy="12.6" r="4.4" fill="#ffffff" />
    </svg>
  )
}
