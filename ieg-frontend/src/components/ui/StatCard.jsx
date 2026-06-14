import { TrendingUp, TrendingDown } from 'lucide-react'

export default function StatCard({ label, value, icon: Icon, delta, variant = 'dark', sublabel }) {
  const isPos = delta > 0
  const variantClass = {
    gold:  'stat-gold text-navy-900',
    navy:  'stat-navy text-white',
    dark:  'stat-dark text-white',
  }[variant]

  return (
    <div className={`rounded-2xl p-5 flex items-start justify-between animate-slide-up ${variantClass}`}>
      <div className="flex-1">
        <p className={`text-xs font-semibold uppercase tracking-widest mb-1 font-display ${variant === 'gold' ? 'text-amber-900/70' : 'text-slate-400'}`}>
          {label}
        </p>
        <p className={`text-2xl font-bold font-display ${variant === 'gold' ? 'text-amber-900' : 'text-white'}`}>
          {value}
        </p>
        {sublabel && <p className={`text-xs mt-1 ${variant === 'gold' ? 'text-amber-800/60' : 'text-slate-500'}`}>{sublabel}</p>}
        {delta !== undefined && (
          <div className={`flex items-center gap-1 mt-2 text-xs font-semibold ${isPos ? 'text-emerald-400' : 'text-red-400'}`}>
            {isPos ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
            <span>{isPos ? '+' : ''}{delta}%</span>
            <span className="text-slate-500 font-normal ml-1">last 30d</span>
          </div>
        )}
      </div>
      {Icon && (
        <div className={`w-11 h-11 rounded-xl flex items-center justify-center ${variant === 'gold' ? 'bg-amber-900/20' : 'bg-white/10'}`}>
          <Icon size={22} className={variant === 'gold' ? 'text-amber-900' : 'text-gold-500'} />
        </div>
      )}
    </div>
  )
}
