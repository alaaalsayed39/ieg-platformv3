import { useState, useEffect, useCallback } from 'react'
import { Search, FileText, Clock, Truck } from 'lucide-react'
import { useAuthStore } from '../../store/authStore'
import StatusBadge from '../../components/ui/StatusBadge'
import PageHeader from '../../components/ui/PageHeader'
import Modal from '../../components/ui/Modal'
import { ShipmentPipeline, ShipmentStagesList } from '../../components/shipments/ShipmentTimeline'
import { formatDate } from '../../utils/format'
import { SHIPMENT_STATUSES, SHIPMENT_STATUS_LABELS, SHIPMENT_STATUS_COLORS, SHIPMENT_PIPELINE } from '../../constants/shipmentStatuses'
import api from '../../config/api'
import toast from 'react-hot-toast'
import Spinner from '../../components/ui/Spinner'

const FILTER_TABS = ['', 'pickup', 'customs_cleared', 'in_transit', 'arrived', 'delivered', 'delayed']

export default function ShipmentTracking() {
  const { user } = useAuthStore()
  const isShipper = user?.role === 'shipper'

  const [shipments, setShipments] = useState([])
  const [selected, setSelected] = useState(null)
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('')
  const [search, setSearch] = useState('')
  const [searchInput, setSearchInput] = useState('')
  const [updateModal, setUpdateModal] = useState(false)
  const [updateForm, setUpdateForm] = useState({ status: '', location: '', note: '' })

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({ limit: '50' })
      if (filter) params.append('status', filter)
      if (search.trim()) params.append('search', search.trim())
      const { data } = await api.get(`/shipments?${params}`)
      setShipments(data.data || [])
    } catch {
      toast.error('Failed to load shipments')
    } finally {
      setLoading(false)
    }
  }, [filter, search])

  useEffect(() => { load() }, [load])

  const downloadPdfReport = async () => {
    try {
      const { data } = await api.get('/shipments/export/report/pdf', { responseType: 'blob' })
      const url = URL.createObjectURL(data)
      const a = document.createElement('a')
      a.href = url
      a.download = `shipments-report-${Date.now()}.pdf`
      a.click()
      URL.revokeObjectURL(url)
      toast.success('PDF report downloaded')
    } catch {
      toast.error('Failed to export report')
    }
  }

  const updateStatus = async () => {
    if (!updateForm.status) return toast.error('Select a status')
    try {
      await api.patch(`/shipments/${selected._id}/status`, updateForm)
      toast.success('Shipment status updated')
      setUpdateModal(false)
      setUpdateForm({ status: '', location: '', note: '' })
      load()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed')
    }
  }

  const openUpdateModal = (s, e) => {
    e?.stopPropagation()
    setSelected(s)
    setUpdateForm({ status: s.status, location: s.currentLocation || '', note: '' })
    setUpdateModal(true)
  }

  if (loading && shipments.length === 0) return <Spinner size="lg" />

  return (
    <div className="space-y-5 animate-fade-in">
      <PageHeader
        title="Shipment Tracking"
        actions={
          <button type="button" onClick={downloadPdfReport} className="btn-ghost flex items-center gap-2 text-sm">
            <FileText size={14} /> Export PDF
          </button>
        }
      />

      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
        <div className="flex-1 relative">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
          <input
            className="ieg-input pl-9 h-9 text-sm w-full"
            placeholder="Search container number..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && setSearch(searchInput)}
          />
        </div>
        <button type="button" onClick={() => setSearch(searchInput)} className="btn-gold text-sm px-4 h-9">
          Search
        </button>
        {search && (
          <button type="button" onClick={() => { setSearch(''); setSearchInput('') }} className="btn-ghost text-xs h-9">
            Clear
          </button>
        )}
      </div>

      <div className="flex gap-1 flex-wrap">
        {FILTER_TABS.map((s) => (
          <button
            key={s || 'all'}
            type="button"
            onClick={() => setFilter(s)}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
              filter === s ? 'bg-gold-500 text-navy-900' : 'bg-white/5 text-slate-400 hover:bg-white/10'
            }`}
          >
            {s ? SHIPMENT_STATUS_LABELS[s] || s : 'All Shipments'}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
        <div className="lg:col-span-2 space-y-3">
          <p className="text-xs text-slate-500 font-display uppercase tracking-wider">Active Shipments</p>
          {shipments.map((s) => {
            const stageIdx = SHIPMENT_PIPELINE.indexOf(s.status)
            const progress = s.status === 'delayed'
              ? 50
              : stageIdx >= 0
                ? ((stageIdx + 1) / SHIPMENT_PIPELINE.length) * 100
                : 0
            return (
              <div
                key={s._id}
                onClick={() => setSelected(s)}
                className={`ieg-card p-4 cursor-pointer transition ${
                  selected?._id === s._id ? 'border-gold-500/50 bg-gold-500/5' : 'hover:border-white/15'
                }`}
              >
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <p className="font-mono text-sm font-bold text-gold-500">{s.containerNumber}</p>
                    <p className="text-xs text-slate-400 mt-0.5">{s.originPort}</p>
                    <p className="text-xs text-slate-600">{s.destinationPort}</p>
                  </div>
                  <div className="text-right">
                    <StatusBadge status={s.status} />
                    <p className="text-[10px] text-slate-500 mt-1">{s.carrier}</p>
                  </div>
                </div>
                <div className="w-full h-1.5 bg-white/10 rounded-full overflow-hidden mb-2">
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{ width: `${progress}%`, background: SHIPMENT_STATUS_COLORS[s.status] || '#F5A623' }}
                  />
                </div>
                <div className="flex justify-between text-[10px] text-slate-500">
                  <span className="flex items-center gap-1"><Clock size={9} /> ETA: {formatDate(s.eta)}</span>
                  <span>{s.stages?.length || 0} events</span>
                </div>
                <button
                  type="button"
                  onClick={(e) => (isShipper ? openUpdateModal(s, e) : (e.stopPropagation(), setSelected(s)))}
                  className="btn-gold w-full text-xs py-1.5 mt-3"
                >
                  {isShipper ? 'Update Status' : 'View Details'}
                </button>
              </div>
            )
          })}
          {shipments.length === 0 && (
            <div className="ieg-card p-8 text-center">
              <Truck size={28} className="text-slate-600 mx-auto mb-2" />
              <p className="text-slate-500 text-sm">No shipments found</p>
            </div>
          )}
        </div>

        <div className="lg:col-span-3 ieg-card overflow-hidden">
          {selected ? (
            <div className="p-5 space-y-5 min-h-80">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-mono font-bold text-gold-500 text-lg">{selected.containerNumber}</p>
                  <p className="text-xs text-slate-500">{selected.orderId?.orderNumber} · {selected.orderId?.productName}</p>
                </div>
                <StatusBadge status={selected.status} />
              </div>

              <ShipmentPipeline status={selected.status} stages={selected.stages} />

              <div>
                <p className="text-xs text-slate-500 font-display uppercase tracking-wider mb-3">Event History</p>
                <ShipmentStagesList stages={selected.stages} />
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-center min-h-80 text-slate-500 text-sm">
              Select a shipment to view timeline
            </div>
          )}
        </div>
      </div>

      {isShipper && (
        <Modal isOpen={updateModal} onClose={() => setUpdateModal(false)} title={`Update — ${selected?.containerNumber}`}>
          <div className="space-y-4">
            <div>
              <label className="ieg-label">New Stage</label>
              <select
                className="ieg-input"
                value={updateForm.status}
                onChange={(e) => setUpdateForm((f) => ({ ...f, status: e.target.value }))}
              >
                <option value="">Select stage</option>
                {SHIPMENT_STATUSES.map((st) => (
                  <option key={st} value={st}>{SHIPMENT_STATUS_LABELS[st]}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="ieg-label">Current Location</label>
              <input
                className="ieg-input"
                placeholder="e.g. Hamburg Port, Germany"
                value={updateForm.location}
                onChange={(e) => setUpdateForm((f) => ({ ...f, location: e.target.value }))}
              />
            </div>
            <div>
              <label className="ieg-label">Note</label>
              <textarea
                className="ieg-input min-h-[70px] resize-none"
                placeholder="e.g. Customs cleared. Vessel en route to destination."
                value={updateForm.note}
                onChange={(e) => setUpdateForm((f) => ({ ...f, note: e.target.value }))}
              />
            </div>
            <div className="flex gap-3">
              <button type="button" onClick={() => setUpdateModal(false)} className="btn-ghost flex-1">Cancel</button>
              <button type="button" onClick={updateStatus} className="btn-gold flex-1">Update Status</button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  )
}
