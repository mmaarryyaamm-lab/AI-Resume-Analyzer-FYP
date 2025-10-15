export default function Logo({ size = 28 }) {
  const s = typeof size === 'number' ? `${size}` : size
  return (
    <svg
      width={s}
      height={s}
      viewBox="0 0 64 64"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
      className="brand-logo"
    >
      <rect x="10" y="6" width="40" height="52" rx="6" stroke="currentColor" strokeWidth="4"/>
      <path d="M50 18l-8-8v8h8z" fill="currentColor"/>
      <circle cx="30" cy="22" r="5" stroke="currentColor" strokeWidth="3"/>
      <path d="M18 36h28M18 44h22M18 52h26" stroke="currentColor" strokeWidth="4" strokeLinecap="round"/>
    </svg>
  )
}









