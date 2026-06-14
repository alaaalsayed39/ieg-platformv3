import { formatDate, formatDateShort } from '../../utils/format'
import { SHIPMENT_STATUS_LABELS, SHIPMENT_PIPELINE } from '../../constants/shipmentStatuses'

/**
 * Renders the full stages[] history from MongoDB (timestamps, locations, notes).
 */
export function ShipmentStagesList({ stages = [], className = '' }) {
  if (!stages.length) {
    return <p className="text-sm text-slate-500">No tracking events yet.</p>
  }

  const sorted = [...stages].sort(
    (a, b) => new Date(a.recordedAt || 0) - new Date(b.recordedAt || 0)
  )

  return (
    <ol className={`space-y-0 ${className}`}>
      {sorted.map((entry, i) => (
        <li key={`${entry.stage}-${entry.recordedAt}-${i}`} className="relative flex gap-4 pb-6 last:pb-0">
          {i < sorted.length - 1 && (
            <span className="absolute left-[15px] top-8 bottom-0 w-px bg-white/10" aria-hidden />
          )}
          <div className="w-8 h-8 rounded-full bg-gold-500/20 border border-gold-500/40 flex items-center justify-center flex-shrink-0 z-10">
            <span className="text-[10px] font-bold text-gold-500">{i + 1}</span>
          </div>
          <div className="flex-1 min-w-0 pt-0.5">
            <div className="flex flex-wrap items-center gap-2">
              <p className="text-sm font-semibold text-white capitalize">
                {SHIPMENT_STATUS_LABELS[entry.stage] || entry.stage?.replace(/_/g, ' ')}
              </p>
              {entry.recordedAt && (
                <span className="text-[10px] text-slate-500">
                  {formatDate(entry.recordedAt)} · {new Date(entry.recordedAt).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}
                </span>
              )}
            </div>
            {entry.location && (
              <p className="text-xs text-slate-400 mt-1 flex items-center gap-1">
                <span className="text-slate-600">📍</span> {entry.location}
              </p>
            )}
            {entry.note && (
              <p className="text-xs text-slate-500 mt-1 italic">{entry.note}</p>
            )}
          </div>
        </li>
      ))}
    </ol>
  )
}

/**
 * Horizontal pipeline showing current progress through standard stages.
 */
export function ShipmentPipeline({ status, stages = [], compact = false }) {
  const currentIdx = SHIPMENT_PIPELINE.indexOf(status)
  const icons = ['📦', '✈️', '🚢', '🏭', '✅']

  return (
    <div className={`flex items-center ${compact ? 'gap-1' : 'gap-2'}`}>
      {SHIPMENT_PIPELINE.map((stage, i) => {
        const done = status === 'delayed' ? i <= 0 : i <= currentIdx
        const stageData = stages?.filter((s) => s.stage === stage).pop()
        return (
          <div key={stage} className="flex items-center flex-1 min-w-0">
            <div className="flex flex-col items-center flex-1 min-w-0">
              <div
                className={`${compact ? 'w-7 h-7 text-sm' : 'w-8 h-8 text-base'} rounded-xl flex items-center justify-center ${
                  done ? 'bg-gold-500' : 'bg-white/10'
                }`}
              >
                {icons[i]}
              </div>
              <p
                className={`${compact ? 'text-[8px]' : 'text-[9px]'} mt-1 text-center whitespace-nowrap ${
                  done ? 'text-gold-500 font-bold' : 'text-slate-600'
                }`}
              >
                {SHIPMENT_STATUS_LABELS[stage]}
              </p>
              {!compact && stageData?.location && (
                <p className="text-[7px] text-slate-600 text-center max-w-[60px] truncate">{stageData.location}</p>
              )}
            </div>
            {i < SHIPMENT_PIPELINE.length - 1 && (
              <div className={`flex-1 h-0.5 mx-1 ${done && i < currentIdx ? 'bg-gold-500' : 'bg-white/10'}`} />
            )}
          </div>
        )
      })}
    </div>
  )
}

export function ShipmentSummaryCard({ shipment }) {
  if (!shipment) return null
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
      <div>
        <p className="text-[10px] text-slate-500 uppercase tracking-wider">Container</p>
        <p className="font-mono text-gold-500 font-bold mt-0.5">{shipment.containerNumber}</p>
      </div>
      <div>
        <p className="text-[10px] text-slate-500 uppercase tracking-wider">Route</p>
        <p className="text-slate-300 mt-0.5">{shipment.originPort} → {shipment.destinationPort}</p>
      </div>
      <div>
        <p className="text-[10px] text-slate-500 uppercase tracking-wider">Carrier</p>
        <p className="text-slate-300 mt-0.5">{shipment.carrier || '—'}</p>
      </div>
      <div>
        <p className="text-[10px] text-slate-500 uppercase tracking-wider">ETA</p>
        <p className="text-slate-300 mt-0.5">{formatDate(shipment.eta)}</p>
      </div>
      {shipment.currentLocation && (
        <div className="col-span-2">
          <p className="text-[10px] text-slate-500 uppercase tracking-wider">Current Location</p>
          <p className="text-slate-300 mt-0.5">{shipment.currentLocation}</p>
        </div>
      )}
      {shipment.departureDate && (
        <div>
          <p className="text-[10px] text-slate-500 uppercase tracking-wider">Departed</p>
          <p className="text-slate-300 mt-0.5">{formatDateShort(shipment.departureDate)}</p>
        </div>
      )}
    </div>
  )
}
