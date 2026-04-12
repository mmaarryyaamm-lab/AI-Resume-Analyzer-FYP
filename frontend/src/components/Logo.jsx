export default function Logo({ size = 28 }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <defs>
        <linearGradient id="logo-grad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#059669" />
          <stop offset="100%" stopColor="#0d9488" />
        </linearGradient>
      </defs>
      <rect x="10" y="6" width="40" height="52" rx="6" stroke="url(#logo-grad)" strokeWidth="4"/>
      <path d="M50 18l-8-8v8h8z" fill="url(#logo-grad)"/>
      <circle cx="30" cy="22" r="5" stroke="url(#logo-grad)" strokeWidth="3"/>
      <path d="M18 36h28M18 44h22M18 52h26" stroke="url(#logo-grad)" strokeWidth="4" strokeLinecap="round"/>
    </svg>
  )
}
