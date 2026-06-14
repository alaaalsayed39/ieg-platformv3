export default function IEGLogo({ size = 'md', collapsed = false }) {
  const s = { sm: 28, md: 36, lg: 48 }[size]
  return (
    <div className="flex items-center gap-2.5">
      <div style={{ width: s, height: s }} className="relative flex-shrink-0">
        <svg viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
          <rect width="40" height="40" rx="10" fill="#F5A623"/>
          <text x="4" y="28" fontFamily="Syne, sans-serif" fontWeight="800" fontSize="22" fill="#0B1437">IEG</text>
        </svg>
      </div>
      {!collapsed && (
        <div>
          <p className="font-display font-bold text-white text-sm leading-none">IEG</p>
          <p className="text-gold-500 text-[9px] font-semibold tracking-wider uppercase leading-none mt-0.5">Export Gateway</p>
        </div>
      )}
    </div>
  )
}
