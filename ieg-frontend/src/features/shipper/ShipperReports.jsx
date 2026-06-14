import { useEffect, useState } from 'react'
import { Download, FileText } from 'lucide-react'
import PageHeader from '../../components/ui/PageHeader'
import { SHIPMENT_STATUS_LABELS } from '../../constants/shipmentStatuses'
import api from '../../config/api'
import toast from 'react-hot-toast'
import Spinner from '../../components/ui/Spinner'

export default function ShipperReports() {
  const [shipments, setShipments] = useState([])
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      api.get('/shipments?limit=50'),
      api.get('/shipments/stats'),
    ])
      .then(([listRes, statsRes]) => {
        setShipments(listRes.data.data || [])
        setStats(statsRes.data.data)
      })
      .catch(() => toast.error('Failed to load shipments'))
      .finally(() => setLoading(false))
  }, [])

  const downloadReport = async (format) => {
    const path = format === 'pdf' ? '/shipments/export/report/pdf' : '/shipments/export/report'
    const ext = format === 'pdf' ? 'pdf' : 'csv'
    try {
      const { data } = await api.get(path, { responseType: 'blob' })
      const url = URL.createObjectURL(data)
      const a = document.createElement('a')
      a.href = url
      a.download = `shipments-report-${Date.now()}.${ext}`
      a.click()
      URL.revokeObjectURL(url)
      toast.success(`${ext.toUpperCase()} downloaded`)
    } catch {
      toast.error('Export failed')
    }
  }

  if (loading) return <Spinner size="lg" />

  const byStatus = shipments.reduce((acc, s) => {
    acc[s.status] = (acc[s.status] || 0) + 1
    return acc
  }, {})

  return (
    <div className="space-y-5 animate-fade-in">
      <PageHeader
        title="Shipment Reports"
        actions={
          <div className="flex gap-2">
            <button type="button" onClick={() => downloadReport('csv')} className="btn-ghost flex items-center gap-2 text-sm">
              <Download size={14} /> Export CSV
            </button>
            <button type="button" onClick={() => downloadReport('pdf')} className="btn-gold flex items-center gap-2 text-sm">
              <FileText size={14} /> Export PDF
            </button>
          </div>
        }
      />

      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        <div className="ieg-card p-4">
          <p className="text-xs text-slate-500">Total Shipments</p>
          <p className="font-display font-bold text-2xl text-gold-500 mt-1">{stats?.total ?? shipments.length}</p>
        </div>
        <div className="ieg-card p-4">
          <p className="text-xs text-slate-500">Active</p>
          <p className="font-display font-bold text-2xl text-blue-400 mt-1">{stats?.active ?? 0}</p>
        </div>
        <div className="ieg-card p-4">
          <p className="text-xs text-slate-500">Delivered</p>
          <p className="font-display font-bold text-2xl text-emerald-400 mt-1">{stats?.delivered ?? 0}</p>
        </div>
        <div className="ieg-card p-4">
          <p className="text-xs text-slate-500">Delayed</p>
          <p className="font-display font-bold text-2xl text-red-400 mt-1">{stats?.delayed ?? 0}</p>
        </div>
        {Object.entries(byStatus).map(([status, count]) => (
          <div key={status} className="ieg-card p-4">
            <p className="text-xs text-slate-500">{SHIPMENT_STATUS_LABELS[status] || status}</p>
            <p className="font-display font-bold text-2xl text-white mt-1">{count}</p>
          </div>
        ))}
      </div>

      <div className="ieg-card overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-white/5 text-slate-500 text-xs">
              <th className="text-left p-3">Container</th>
              <th className="text-left p-3">Order</th>
              <th className="text-left p-3">Route</th>
              <th className="text-left p-3">Status</th>
              <th className="text-left p-3">Carrier</th>
            </tr>
          </thead>
          <tbody>
            {shipments.map((s) => (
              <tr key={s._id} className="border-b border-white/5">
                <td className="p-3 font-mono text-gold-500">{s.containerNumber}</td>
                <td className="p-3 text-slate-400">{s.orderId?.orderNumber || '—'}</td>
                <td className="p-3 text-slate-400">{s.originPort} → {s.destinationPort}</td>
                <td className="p-3 text-slate-300 capitalize">{s.status?.replace(/_/g, ' ')}</td>
                <td className="p-3 text-slate-400">{s.carrier || '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
