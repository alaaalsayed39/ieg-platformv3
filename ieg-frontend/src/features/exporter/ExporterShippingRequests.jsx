import { useState, useEffect } from 'react'
import { Package, ArrowRight } from 'lucide-react'
import PageHeader from '../../components/ui/PageHeader'
import FormSelect from '../../components/ui/FormSelect'
import { formatCurrency, formatDate } from '../../utils/format'
import { EGYPT_ORIGIN_PORTS, DESTINATION_PORTS, CARRIERS } from '../../constants/shipmentFormOptions'
import api from '../../config/api'
import toast from 'react-hot-toast'
import Spinner from '../../components/ui/Spinner'

const emptyForm = {
  orderId: '',
  originPort: '',
  destinationPort: '',
  carrier: '',
  departureDate: '',
  eta: '',
}

export default function ExporterShippingRequests() {
  const [orders, setOrders] = useState([])
  const [requests, setRequests] = useState([])
  const [form, setForm] = useState(emptyForm)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [errors, setErrors] = useState({})

  const load = () => {
    setLoading(true)
    Promise.all([
      api.get('/shipping-requests/eligible-orders'),
      api.get('/shipping-requests'),
    ])
      .then(([o, r]) => {
        setOrders(o.data.data || [])
        setRequests(r.data.data || [])
      })
      .catch(() => toast.error('Failed to load shipping data'))
      .finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [])

  const selectedOrder = orders.find((o) => o._id === form.orderId)

  const validate = () => {
    const next = {}
    if (!form.orderId) next.orderId = 'Select an order'
    if (!form.originPort) next.originPort = 'Required'
    if (!form.destinationPort) next.destinationPort = 'Required'
    if (!form.carrier) next.carrier = 'Required'
    if (form.departureDate && form.eta && form.eta < form.departureDate) {
      next.eta = 'ETA must be on or after departure'
    }
    setErrors(next)
    return Object.keys(next).length === 0
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!validate()) return toast.error('Please complete all required fields')
    setSubmitting(true)
    try {
      await api.post('/shipping-requests', {
        orderId: form.orderId,
        originPort: form.originPort,
        destinationPort: form.destinationPort,
        carrier: form.carrier,
        departureDate: form.departureDate || undefined,
        eta: form.eta || undefined,
      })
      toast.success('Shipping request submitted to logistics partner')
      setForm(emptyForm)
      load()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to submit request')
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) return <Spinner size="lg" />

  return (
    <div className="max-w-3xl mx-auto space-y-5 animate-fade-in">
      <PageHeader
        title="Shipping Requests"
        subtitle="Request logistics for paid orders — shipping company reviews and approves"
      />

      <form onSubmit={handleSubmit} className="ieg-card p-6 space-y-5">
        <FormSelect
          label="Order"
          value={form.orderId}
          onChange={(v) => setForm((f) => ({ ...f, orderId: v }))}
          options={orders.map((o) => ({
            value: o._id,
            label: `${o.orderNumber} — ${o.productName} (${formatCurrency(o.totalValueUsd)})`,
          }))}
          placeholder="Select processing order..."
          required
          error={errors.orderId}
        />

        {selectedOrder && (
          <div className="rounded-xl bg-white/3 border border-white/5 p-4 text-sm grid grid-cols-2 gap-3">
            <div><p className="text-[10px] text-slate-500 uppercase">Quantity</p><p className="text-slate-300">{selectedOrder.quantity} {selectedOrder.unit}</p></div>
            <div><p className="text-[10px] text-slate-500 uppercase">Payment</p><p className="text-emerald-400 capitalize">{selectedOrder.paymentStatus}</p></div>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormSelect label="Origin Port (Egypt)" value={form.originPort} onChange={(v) => setForm((f) => ({ ...f, originPort: v }))} options={EGYPT_ORIGIN_PORTS} required error={errors.originPort} />
          <FormSelect label="Destination Port" value={form.destinationPort} onChange={(v) => setForm((f) => ({ ...f, destinationPort: v }))} options={DESTINATION_PORTS} required error={errors.destinationPort} />
        </div>

        <FormSelect label="Carrier" value={form.carrier} onChange={(v) => setForm((f) => ({ ...f, carrier: v }))} options={CARRIERS} required error={errors.carrier} />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="ieg-label">Departure Date</label>
            <input type="date" className="ieg-input" value={form.departureDate} onChange={(e) => setForm((f) => ({ ...f, departureDate: e.target.value }))} />
          </div>
          <div>
            <label className="ieg-label">ETA</label>
            <input type="date" className="ieg-input" value={form.eta} onChange={(e) => setForm((f) => ({ ...f, eta: e.target.value }))} />
            {errors.eta && <p className="text-xs text-red-400 mt-1">{errors.eta}</p>}
          </div>
        </div>

        <button type="submit" disabled={submitting || orders.length === 0} className="btn-gold w-full flex items-center justify-center gap-2">
          {submitting ? 'Submitting...' : <>Submit Shipping Request <ArrowRight size={16} /></>}
        </button>
      </form>

      {orders.length === 0 && (
        <div className="ieg-card p-5 text-sm text-slate-400">
          No orders ready for shipping. Complete: purchase request → accept → buyer payment (escrow).
        </div>
      )}

      <div className="ieg-card p-5">
        <h3 className="font-display font-bold text-white mb-3 flex items-center gap-2"><Package size={16} /> Your Requests</h3>
        <div className="space-y-2">
          {requests.map((r) => (
            <div key={r._id} className="p-3 rounded-lg bg-white/3 flex justify-between text-sm">
              <div>
                <p className="text-white font-medium">{r.orderId?.orderNumber}</p>
                <p className="text-xs text-slate-500">{r.originPort} → {r.destinationPort} · {r.carrier}</p>
              </div>
              <span className={`badge ${r.status === 'approved' ? 'badge-approved' : r.status === 'rejected' ? 'badge-rejected' : 'badge-pending'}`}>{r.status}</span>
            </div>
          ))}
          {requests.length === 0 && <p className="text-slate-500 text-sm">No shipping requests yet</p>}
        </div>
      </div>
    </div>
  )
}
