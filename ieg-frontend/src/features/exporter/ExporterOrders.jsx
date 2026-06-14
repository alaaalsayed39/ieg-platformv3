import { useState, useEffect, useCallback } from 'react'
import { RefreshCw, MessageSquare } from 'lucide-react'
import DataTable from '../../components/ui/DataTable'
import StatusBadge from '../../components/ui/StatusBadge'
import PageHeader  from '../../components/ui/PageHeader'
import Modal       from '../../components/ui/Modal'
import { formatCurrency, formatDate } from '../../utils/format'
import api from '../../config/api'
import { useChatStore } from '../../store/chatStore'
import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'

const STATUS_TRANSITIONS = {
  pending:    ['processing','cancelled'],
  processing: ['shipped','cancelled'],
  shipped:    ['in_transit'],
}

export default function ExporterOrders() {
  const navigate = useNavigate()
  const { initiateConversation } = useChatStore()
  const [orders, setOrders] = useState([])
  const [total,  setTotal]  = useState(0)
  const [page,   setPage]   = useState(1)

  const handleChat = async (buyerId) => {
    if (!buyerId) return
    try {
      await initiateConversation(buyerId)
      navigate('/exporter/messages')
    } catch (_) {}
  }
  const [loading,setLoading]= useState(true)
  const [statusFilter, setStatusFilter] = useState('')
  const [selected, setSelected] = useState(null)
  const [stats,  setStats]  = useState(null)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({ page, limit: 10 })
      if (statusFilter) params.append('status', statusFilter)
      const [od, sd] = await Promise.all([
        api.get(`/orders?${params}`),
        api.get('/orders/stats'),
      ])
      setOrders(od.data.data || [])
      setTotal(od.data.pagination?.total || 0)
      setStats(sd.data.data)
    } catch { toast.error('Failed to load orders') }
    finally { setLoading(false) }
  }, [page, statusFilter])

  useEffect(() => { load() }, [load])

  const updateStatus = async (orderId, status) => {
    try {
      await api.patch(`/orders/${orderId}/status`, { status })
      toast.success(`Order status updated to ${status}`)
      load()
      setSelected(null)
    } catch (err) { toast.error(err.response?.data?.message || 'Failed') }
  }

  const columns = [
    { key: 'orderNumber', label: 'Order ID', render: v => <span className="font-mono text-xs text-gold-500">{v}</span> },
    {
      key: 'buyerId', label: 'Buyer',
      render: (v) => (
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-blue-500/20 flex items-center justify-center text-xs font-bold text-blue-400">
            {(v?.companyName || v?.fullName || '?').charAt(0)}
          </div>
          <div>
            <p className="text-sm text-white font-medium">{v?.companyName || v?.fullName || '—'}</p>
            <p className="text-xs text-slate-500">{v?.country}</p>
          </div>
        </div>
      )
    },
    { key: 'productName', label: 'Product', render: v => <span className="text-sm text-slate-300 max-w-[150px] truncate block">{v}</span> },
    { key: 'quantity',    label: 'Qty',     render: (v, r) => <span className="text-sm">{v} {r.unit}</span> },
    { key: 'totalValueUsd', label: 'Value', render: v => <span className="font-bold text-gold-500">{formatCurrency(v)}</span> },
    { key: 'status',      label: 'Status',  render: v => <StatusBadge status={v} /> },
    { key: 'paymentStatus', label: 'Payment', render: v => <StatusBadge status={v} /> },
    { key: 'eta',         label: 'ETA',     render: v => <span className="text-xs text-slate-500">{formatDate(v)}</span> },
    {
      key: '_id', label: 'Actions',
      render: (id, row) => (
        <div className="flex gap-1">
          <button onClick={() => setSelected(row)} className="text-xs text-gold-500 hover:text-gold-400 transition">View</button>
        </div>
      )
    },
  ]

  return (
    <div className="space-y-5 animate-fade-in">
      <PageHeader title="Orders Management"
        actions={
          <button onClick={load} className="btn-ghost flex items-center gap-2 text-sm"><RefreshCw size={14} /> Refresh</button>
        }
      />

      {/* Stats row */}
      {stats && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {[
            { label: 'Total Orders',  value: stats.total,      color: 'text-white' },
            { label: 'Processing',    value: stats.processing,  color: 'text-purple-400' },
            { label: 'Shipped',       value: stats.shipped,     color: 'text-blue-400' },
            { label: 'Delivered',     value: stats.delivered,   color: 'text-emerald-400' },
          ].map(s => (
            <div key={s.label} className="ieg-card p-4 flex items-center justify-between">
              <p className="text-xs text-slate-500">{s.label}</p>
              <p className={`font-display font-bold text-xl ${s.color}`}>{s.value ?? 0}</p>
            </div>
          ))}
        </div>
      )}

      {/* Filters */}
      <div className="flex gap-1 flex-wrap">
          {['','processing','shipped','in_transit','delivered','cancelled'].map(s => (
            <button key={s} onClick={() => { setStatusFilter(s); setPage(1) }}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${statusFilter === s ? 'bg-gold-500 text-navy-900' : 'bg-white/5 text-slate-400 hover:bg-white/10'}`}>
              {s ? s.replace(/_/g,' ').replace(/\w/g,c=>c.toUpperCase()) : 'All'}
            </button>
          ))}
      </div>

      <DataTable columns={columns} data={orders} loading={loading}
        page={page} totalPages={Math.ceil(total/10)} onPageChange={setPage} emptyMsg="No orders found" />

      {/* Order detail modal */}
      {selected && (
        <Modal isOpen={!!selected} onClose={() => setSelected(null)} title={`Order ${selected.orderNumber}`} size="lg">
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3 text-sm">
              {[
                ['Buyer',       selected.buyerId?.companyName || selected.buyerId?.fullName],
                ['Product',     selected.productName],
                ['Quantity',    `${selected.quantity} ${selected.unit}`],
                ['Total Value', formatCurrency(selected.totalValueUsd)],
                ['Status',      null],
                ['Payment',     null],
                ['Delivery',    selected.deliveryMethod],
                ['ETA',         formatDate(selected.eta)],
              ].map(([label, value], i) => (
                <div key={label} className="ieg-card p-3">
                  <p className="text-xs text-slate-500 mb-1">{label}</p>
                  {label === 'Status'  ? <StatusBadge status={selected.status} /> :
                   label === 'Payment' ? <StatusBadge status={selected.paymentStatus} /> :
                   <p className="font-semibold text-white">{value}</p>}
                </div>
              ))}
            </div>

            {/* Timeline */}
            {selected.timeline?.length > 0 && (
              <div>
                <p className="text-xs text-slate-500 mb-2 font-display uppercase tracking-wider">Timeline</p>
                <div className="space-y-2">
                  {selected.timeline.map((t, i) => (
                    <div key={i} className="flex items-start gap-3 text-xs">
                      <div className="w-2 h-2 rounded-full bg-gold-500 mt-1 flex-shrink-0" />
                      <div>
                        <span className="font-semibold text-white capitalize">{t.status?.replace(/_/g,' ')}</span>
                        <span className="text-slate-500 ml-2">{formatDate(t.changedAt)}</span>
                        {t.note && <p className="text-slate-500">{t.note}</p>}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Update status and Chat actions */}
            <div className="flex gap-2 pt-3 border-t border-white/5 items-center justify-between flex-wrap">
              <div className="flex gap-2">
                {STATUS_TRANSITIONS[selected.status]?.length > 0 && STATUS_TRANSITIONS[selected.status].map(s => (
                  <button key={s} onClick={() => updateStatus(selected._id, s)}
                    className={s === 'cancelled' ? 'btn-danger' : 'btn-gold'}>
                    → {s.replace(/_/g,' ').replace(/ \w/g,c=>c.toUpperCase())}
                  </button>
                ))}
              </div>
              <button
                type="button"
                onClick={() => handleChat(selected.buyerId?._id || selected.buyerId)}
                className="bg-white/5 border border-white/10 hover:border-gold-500/30 hover:bg-gold-500/10 text-xs py-2 px-4 flex items-center gap-1.5 rounded-xl transition text-slate-300 hover:text-white"
              >
                <MessageSquare size={14} /> Chat with Buyer
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  )
}
