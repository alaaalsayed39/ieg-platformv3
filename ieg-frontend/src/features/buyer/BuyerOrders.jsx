import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { Truck, Download, ChevronDown, ChevronUp, MessageSquare } from 'lucide-react'
import StatusBadge from '../../components/ui/StatusBadge'
import PageHeader from '../../components/ui/PageHeader'
import { formatCurrency, formatDate } from '../../utils/format'
import api from '../../config/api'
import { useChatStore } from '../../store/chatStore'
import toast from 'react-hot-toast'
import Spinner from '../../components/ui/Spinner'

const SHIPPABLE_STATUSES = ['shipped', 'in_transit', 'delivered']

export default function BuyerOrders() {
  const navigate = useNavigate()
  const { initiateConversation } = useChatStore()
  const [orders, setOrders] = useState([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(true)
  const [statusF, setStatusF] = useState('')
  const [expanded, setExpanded] = useState(null)
  const [stats, setStats] = useState(null)

  const handleChat = async (exporterId) => {
    if (!exporterId) return
    try {
      await initiateConversation(exporterId)
      navigate('/buyer/messages')
    } catch (_) {}
  }

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({ page, limit: 10 })
      if (statusF) params.append('status', statusF)
      const [od, sd] = await Promise.all([api.get(`/orders?${params}`), api.get('/orders/stats')])
      setOrders(od.data.data || [])
      setTotal(od.data.pagination?.total || 0)
      setStats(sd.data.data)
    } catch {
      toast.error('Failed to load orders')
    } finally {
      setLoading(false)
    }
  }, [page, statusF])

  useEffect(() => { load() }, [load])

  const confirmDelivery = async (orderId) => {
    if (!window.confirm('Confirm you received this order? Escrow will be released to the exporter.')) return
    try {
      await api.patch(`/orders/${orderId}/confirm-delivery`)
      toast.success('Delivery confirmed — payment released from escrow')
      load()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Confirmation failed')
    }
  }

  const payForOrder = async (orderId) => {
    if (!window.confirm('Pay for this order? Funds will be held in escrow until delivery.')) return
    try {
      await api.post(`/payments/pay/${orderId}`)
      toast.success('Payment held successfully! Order is now processing.')
      load()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Payment failed')
    }
  }

  const trackShipment = (order) => {
    if (!SHIPPABLE_STATUSES.includes(order.status)) {
      toast.error('Shipment tracking is available once the order has been shipped')
      return
    }
    navigate(`/buyer/orders/${order._id}/shipment`)
  }

  if (loading) return <Spinner size="lg" />

  return (
    <div className="space-y-5 animate-fade-in">
      <PageHeader title="My Orders" />

      {stats && (
        <div className="ieg-card p-4">
          <div className="grid grid-cols-4 gap-4 text-center">
            {[
              { label: 'Total Orders', value: stats.total, color: 'text-white' },
              { label: 'In Transit', value: stats.shipped, color: 'text-blue-400' },
              { label: 'Delivered', value: stats.delivered, color: 'text-emerald-400' },
              { label: 'Pending', value: stats.processing, color: 'text-amber-400' },
            ].map((s) => (
              <div key={s.label}>
                <p className={`font-display font-bold text-2xl ${s.color}`}>{s.value ?? 0}</p>
                <p className="text-xs text-slate-500">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="flex gap-1 flex-wrap">
        {['', 'pending', 'processing', 'in_transit', 'delivered', 'cancelled'].map((s) => (
          <button
            key={s || 'all'}
            type="button"
            onClick={() => { setStatusF(s); setPage(1) }}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
              statusF === s ? 'bg-gold-500 text-navy-900' : 'bg-white/5 text-slate-400 hover:bg-white/10'
            }`}
          >
            {s ? s.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()) : 'All'}
          </button>
        ))}
      </div>

      <div className="ieg-card overflow-hidden">
        <table className="ieg-table w-full">
          <thead>
            <tr>
              <th>Order Number</th>
              <th>Supplier</th>
              <th>Product</th>
              <th>Qty</th>
              <th>Order Value</th>
              <th>Expected Delivery</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {orders.map((o) => (
              <>
                <tr key={o._id}>
                  <td className="font-mono text-xs text-gold-500">{o.orderNumber}</td>
                  <td>
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-lg bg-blue-500/20 flex items-center justify-center text-[10px] font-bold text-blue-400 flex-shrink-0">
                        {(o.exporterId?.companyName || o.exporterId?.fullName || '?').charAt(0)}
                      </div>
                      <div>
                        <p className="text-xs font-medium text-white">{o.exporterId?.companyName || o.exporterId?.fullName || '—'}</p>
                        <p className="text-[10px] text-slate-500">{o.exporterId?.country}</p>
                      </div>
                    </div>
                  </td>
                  <td className="text-xs text-slate-300 max-w-[140px] truncate">{o.productName}</td>
                  <td className="text-xs">{o.quantity} {o.unit}</td>
                  <td><span className="font-bold text-gold-500 text-sm">{formatCurrency(o.totalValueUsd)}</span></td>
                  <td className="text-xs text-slate-400">{formatDate(o.eta) || '—'}</td>
                  <td><StatusBadge status={o.status} /></td>
                  <td>
                    <div className="flex items-center gap-1.5">
                      {o.paymentStatus === 'unpaid' && (
                        <button
                          type="button"
                          onClick={() => payForOrder(o._id)}
                          className="text-xs bg-gold-500/20 text-gold-400 border border-gold-500/30 px-2 py-1 rounded-lg hover:bg-gold-500/30 transition font-semibold"
                        >
                          Pay Now
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => trackShipment(o)}
                        disabled={!SHIPPABLE_STATUSES.includes(o.status)}
                        className="text-xs bg-blue-500/10 text-blue-400 border border-blue-500/30 px-2 py-1 rounded-lg hover:bg-blue-500/20 transition flex items-center gap-1 disabled:opacity-40 disabled:cursor-not-allowed"
                      >
                        <Truck size={11} /> Track
                      </button>
                      {o.status === 'delivered' && o.paymentStatus === 'held' && o.awaitingDeliveryConfirmation && (
                        <button
                          type="button"
                          onClick={() => confirmDelivery(o._id)}
                          className="text-xs bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 px-2 py-1 rounded-lg hover:bg-emerald-500/30 transition font-semibold"
                        >
                          Confirm Delivery
                        </button>
                      )}
                      {o.status === 'delivered' && (
                        <button type="button" className="text-xs bg-white/5 text-slate-400 border border-white/10 px-2 py-1 rounded-lg hover:bg-white/10 transition flex items-center gap-1">
                          <Download size={11} /> Invoice
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => setExpanded(expanded === o._id ? null : o._id)}
                        className="w-6 h-6 rounded-lg bg-white/5 flex items-center justify-center text-slate-400 hover:bg-white/10 transition"
                      >
                        {expanded === o._id ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                      </button>
                    </div>
                  </td>
                </tr>
                {expanded === o._id && (
                  <tr key={`${o._id}-detail`}>
                    <td colSpan={8} className="!p-0">
                      <div className="bg-white/2 px-6 py-4 border-y border-white/5">
                        <div className="flex items-center gap-6 mb-3 text-xs text-slate-400 flex-wrap">
                          {[
                            ['Delivery Method', o.deliveryMethod],
                            ['Shipment Mode', o.shipmentMode],
                            ['Insurance', o.insurance ? 'Yes' : 'No'],
                            ['Payment Status', null],
                            ['Comments', o.comments || '—'],
                          ].map(([label, value]) => (
                            <div key={label}>
                              <p className="text-slate-600 text-[10px] uppercase tracking-wider">{label}</p>
                              {label === 'Payment Status'
                                ? <StatusBadge status={o.paymentStatus} />
                                : <p className="text-slate-300 mt-0.5">{value}</p>
                              }
                            </div>
                          ))}
                        </div>
                        <div className="flex gap-2 items-center">
                          {SHIPPABLE_STATUSES.includes(o.status) ? (
                            <button type="button" onClick={() => trackShipment(o)} className="btn-gold text-xs py-2 px-4 flex items-center gap-2">
                              <Truck size={14} /> View Live Shipment Tracking
                            </button>
                          ) : (
                            <p className="text-xs text-slate-500 py-2 pr-4">Tracking will be available once your order is shipped.</p>
                          )}
                          <button
                            type="button"
                            onClick={() => handleChat(o.exporterId?._id || o.exporterId)}
                            className="bg-white/5 border border-white/10 hover:border-gold-500/30 hover:bg-gold-500/10 text-xs py-2 px-4 flex items-center gap-1.5 rounded-xl transition text-slate-300 hover:text-white"
                          >
                            <MessageSquare size={14} /> Chat with Supplier
                          </button>
                        </div>
                        <button type="button" onClick={() => setExpanded(null)} className="mt-3 btn-ghost text-xs block">Close Details</button>
                      </div>
                    </td>
                  </tr>
                )}
              </>
            ))}
            {orders.length === 0 && (
              <tr><td colSpan={8} className="text-center py-12 text-slate-500">No orders found</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
