/**
 * Circular back / next button used across the app's top bars.
 * The SVG draws its own outer ring + white inner circle, so the host
 * <button> stays transparent and just provides the click target.
 */
export default function NavCircleButton({
  direction = 'back',
  onClick,
  ariaLabel,
  style,
}) {
  // Back arrow: M28 19L20 24L28 29  (points left)
  // Next arrow: M20 19L28 24L20 29  (points right — mirrored on X)
  const arrowPath =
    direction === 'next'
      ? 'M20 19L28 24L20 29'
      : 'M28 19L20 24L28 29'

  const label = ariaLabel ?? (direction === 'next' ? 'Next' : 'Back')

  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      style={{
        ...buttonStyle,
        ...style,
        width: 48,
        height: 48,
        minWidth: 48,
        minHeight: 48,
      }}
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="48"
        height="48"
        viewBox="0 0 48 48"
        fill="none"
        aria-hidden="true"
      >
        <circle cx="24" cy="24" r="24" fill="#F0F0F0" />
        <circle cx="24.5" cy="23.5" r="19.5" fill="white" />
        <path
          d={arrowPath}
          stroke="black"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </button>
  )
}

const buttonStyle = {
  width: 48,
  height: 48,
  padding: 0,
  border: 'none',
  background: 'transparent',
  cursor: 'pointer',
  flexShrink: 0,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
}
