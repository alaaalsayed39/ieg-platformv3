import { useState, useEffect } from 'react'
import { Check, X } from 'lucide-react'
import PageHeader from '../../components/ui/PageHeader'
import { formatCurrency, formatDate } from '../../utils/format'
import api from '../../config/api'
import toast from 'react-hot-toast'
import Spinner from '../../components/ui/Spinner'

export default function ShipperShippingRequests() {
  const [requests, setRequests] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('pending')
  const [note, setNote] = useState('')
  const [reviewing, setReviewing] = useState(null)

  const load = () => {
    setLoading(true)
    api.get(`/shipping-requests?status=${filter}`)
      .then((r) => setRequests(r.data.data || []))
      .catch(() => toast.error('Failed to load requests'))
      .finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [filter])

  const review = async (id, status) => {
    setReviewing(id)
    try {
      const { data } = await api.patch(`/shipping-requests/${id}/review`, { status, reviewerNote: note || undefined })
      toast.success(status === 'approved' ? `Approved — container ${data.data?.shipment?.containerNumber || 'created'}` : 'Request rejected')
      setNote('')
      load()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Review failed')
    } finally {
      setReviewing(null)
    }
  }

  if (loading) return <Spinner size="lg" />

  return (
    <div className="space-y-5 animate-fade-in max-w-3xl mx-auto">
      <PageHeader title="Review Shipping Requests" subtitle="Approve requests to create shipments and begin tracking" />

      <div className="flex gap-2">
        {['pending', 'approved', 'rejected'].map((s) => (
          <button key={s} type="button" onClick={() => setFilter(s)}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold capitalize ${filter === s ? 'bg-gold-500 text-navy-900' : 'bg-white/5 text-slate-400'}`}>
            {s}
          </button>
        ))}
      </div>

      <div className="space-y-3">
        {requests.map((r) => (
          <div key={r._id} className="ieg-card p-5">
            <div className="flex justify-between items-start gap-4 mb-3">
              <div>
                <p className="font-mono text-gold-500 font-bold">{r.orderId?.orderNumber}</p>
                <p className="text-sm text-white mt-1">{r.orderId?.productName}</p>
                <p className="text-xs text-slate-500 mt-1">{r.exporterId?.companyName} → {r.buyerId?.companyName} ({r.buyerId?.country})</p>
              </div>
              <span className="text-sm font-bold text-gold-500">{formatCurrency(r.orderId?.totalValueUsd)}</span>
            </div>
            <div className="grid grid-cols-2 gap-2 text-xs text-slate-400 mb-4">
              <p><span className="text-slate-600">Route:</span> {r.originPort} → {r.destinationPort}</p>
              <p><span className="text-slate-600">Carrier:</span> {r.carrier}</p>
              <p><span className="text-slate-600">Depart:</span> {formatDate(r.departureDate)}</p>
              <p><span className="text-slate-600">ETA:</span> {formatDate(r.eta)}</p>
            </div>
            {r.status === 'pending' && (
              <>
                <textarea className="ieg-input min-h-[60px] text-sm mb-3" placeholder="Review note (optional)" value={note} onChange={(e) => setNote(e.target.value)} />
                <div className="flex gap-2">
                  <button type="button" disabled={reviewing === r._id} onClick={() => review(r._id, 'rejected')} className="btn-danger flex-1 flex items-center justify-center gap-2"><X size={14} /> Reject</button>
                  <button type="button" disabled={reviewing === r._id} onClick={() => review(r._id, 'approved')} className="btn-gold flex-1 flex items-center justify-center gap-2"><Check size={14} /> Approve & Create Shipment</button>
                </div>
              </>
            )}
            {r.status !== 'pending' && r.reviewerNote && (
              <p className="text-xs text-slate-500 italic">Note: {r.reviewerNote}</p>
            )}
          </div>
        ))}
        {requests.length === 0 && (
          <div className="ieg-card p-12 text-center text-slate-500 text-sm">No {filter} shipping requests</div>
        )}
      </div>
    </div>
  )
}
