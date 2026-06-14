import { useState, useEffect, useCallback } from 'react'
import { Check, X, Package } from 'lucide-react'
import StatusBadge from '../../components/ui/StatusBadge'
import PageHeader from '../../components/ui/PageHeader'
import Modal from '../../components/ui/Modal'
import { formatCurrency, formatDate } from '../../utils/format'
import api from '../../config/api'
import toast from 'react-hot-toast'
import Spinner from '../../components/ui/Spinner'

export default function BuyerRequests() {
  const [quotes, setQuotes] = useState([])
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState(null)
  const [tabFilter, setTabFilter] = useState('all')
  const [note, setNote] = useState('')
  const [responding, setResponding] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const params = tabFilter === 'all' ? '' : `?status=${tabFilter}`
      const { data } = await api.get(`/orders/quotes/list${params}`)
      setQuotes(data.data || [])
    } catch {
      toast.error('Failed to load purchase requests')
    } finally {
      setLoading(false)
    }
  }, [tabFilter])

  useEffect(() => { load() }, [load])

  const respond = async (quote, status) => {
    if (!quote?._id) return
    setResponding(true)
    try {
      await api.patch(`/orders/quotes/${quote._id}/respond`, {
        status,
        responderNote: note || undefined,
      })
      toast.success(status === 'accepted' ? 'Purchase request accepted — order created for buyer' : `Request ${status}`)
      setSelected(null)
      setNote('')
      load()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to respond')
    } finally {
      setResponding(false)
    }
  }

  if (loading) return <Spinner size="lg" />

  return (
    <div className="space-y-5 animate-fade-in">
      <PageHeader title="Purchase Requests" subtitle="Review and accept buyer purchase requests" />

      <div className="flex items-center gap-2 flex-wrap">
        {['all', 'new', 'pending', 'negotiating', 'accepted', 'declined'].map((s) => (
          <button
            key={s}
            type="button"
            onClick={() => setTabFilter(s)}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold capitalize transition ${tabFilter === s ? 'bg-gold-500 text-navy-900' : 'bg-white/5 text-slate-400 hover:bg-white/10'}`}
          >
            {s}
          </button>
        ))}
        <span className="ml-auto badge badge-new">{quotes.length} requests</span>
      </div>

      <div className="space-y-3">
        {quotes.map((q) => {
          const buyer = q.buyerId
          const initials = (buyer?.companyName || buyer?.fullName || '?').slice(0, 2).toUpperCase()
          return (
            <div
              key={q._id}
              className="ieg-card p-5 hover:border-white/15 transition cursor-pointer"
              onClick={() => { setSelected(q); setNote('') }}
            >
              <div className="flex items-start gap-4">
                <div className="w-11 h-11 rounded-2xl bg-blue-500/20 border border-blue-500/30 flex items-center justify-center font-display font-bold text-sm text-white flex-shrink-0">
                  {initials}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-display font-bold text-white">{buyer?.companyName || buyer?.fullName}</p>
                      <p className="text-xs text-slate-500">{buyer?.country}</p>
                      <div className="flex flex-wrap gap-3 mt-1.5 text-xs text-slate-400">
                        <span className="flex items-center gap-1"><Package size={11} /> {q.productType || q.productId?.nameEn || 'Product'}</span>
                        {q.quantity && <span>{q.quantity} units</span>}
                        {q.deliveryTimeline && <span>{q.deliveryTimeline}</span>}
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-2 flex-shrink-0">
                      <StatusBadge status={q.status} />
                      <span className="text-[10px] text-slate-500">{formatDate(q.createdAt)}</span>
                    </div>
                  </div>
                  {(q.status === 'new' || q.status === 'pending') && (
                    <div className="mt-3" onClick={(e) => e.stopPropagation()}>
                      <button type="button" onClick={() => { setSelected(q); setNote('') }} className="btn-gold text-xs py-1.5 px-3">Review</button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )
        })}
        {quotes.length === 0 && (
          <div className="ieg-card p-16 text-center">
            <Package size={32} className="text-slate-600 mx-auto mb-3" />
            <p className="font-display font-bold text-white">No purchase requests</p>
            <p className="text-slate-500 text-sm mt-1">When buyers submit purchase requests from the marketplace, they appear here.</p>
          </div>
        )}
      </div>

      {selected && (
        <Modal isOpen={!!selected} onClose={() => setSelected(null)} title="Purchase Request Details" size="lg">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-3">
              <h4 className="font-display font-bold text-white text-sm border-b border-white/10 pb-2">Buyer</h4>
              {[
                ['Company', selected.buyerId?.companyName || selected.buyerId?.fullName],
                ['Country', selected.buyerId?.country],
                ['Product', selected.productType || selected.productId?.nameEn],
                ['Quantity', selected.quantity ? `${selected.quantity} units` : '—'],
                ['Budget', selected.budgetMin != null ? `${formatCurrency(selected.budgetMin)} – ${formatCurrency(selected.budgetMax)}` : '—'],
                ['Timeline', selected.deliveryTimeline || '—'],
              ].map(([l, v]) => (
                <div key={l} className="flex justify-between text-sm">
                  <span className="text-slate-500">{l}</span>
                  <span className="text-white font-medium">{v || '—'}</span>
                </div>
              ))}
            </div>
            <div className="space-y-3">
              {selected.specialRequirements && (
                <div>
                  <p className="text-xs text-slate-500 mb-1">Special requirements</p>
                  <p className="text-sm text-slate-300">{selected.specialRequirements}</p>
                </div>
              )}
              <div>
                <label className="ieg-label">Response note</label>
                <textarea
                  className="ieg-input min-h-[80px] resize-none"
                  placeholder="Add a note for the buyer..."
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                />
              </div>
              {(selected.status === 'new' || selected.status === 'pending' || selected.status === 'negotiating') && (
                <div className="flex gap-2 pt-2">
                  <button type="button" disabled={responding} onClick={() => respond(selected, 'declined')} className="btn-danger flex-1 text-sm">Reject</button>
                  <button type="button" disabled={responding} onClick={() => respond(selected, 'accepted')} className="btn-gold flex-1 text-sm">Accept & Create Order</button>
                </div>
              )}
            </div>
          </div>
        </Modal>
      )}
    </div>
  )
}
