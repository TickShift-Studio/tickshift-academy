export default function Logo({ size = 32 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 34 34" fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="tg1" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#3CCBFF" />
          <stop offset="100%" stopColor="#0F6FFF" />
        </linearGradient>
        <linearGradient id="tg2" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#C9D1DC" />
          <stop offset="100%" stopColor="#6E7B8F" />
        </linearGradient>
      </defs>
      <polygon points="3,4 31,4 31,9 21,9 21,30 13,30 13,9 3,9" fill="url(#tg1)" />
      <polygon points="17,6 25,6 13,23 13,16 8,16 20,0" fill="url(#tg2)" opacity="0.9" />
    </svg>
  )
}
