import { useState, useEffect, useCallback } from 'react'
import api from '../../config/api'
import toast from 'react-hot-toast'
import PageHeader from '../../components/ui/PageHeader'
import StatusBadge from '../../components/ui/StatusBadge'
import Modal from '../../components/ui/Modal'
import Spinner from '../../components/ui/Spinner'
import { formatDate } from '../../utils/format'
import { Eye, CheckCircle, XCircle, Clock } from 'lucide-react'

const STATUS_OPTIONS = ['pending', 'under_review', 'approved', 'rejected']

export default function AdminGovernmentRequests() {
  const [requests, setRequests] = useState([])
  const [loading, setLoading]   = useState(true)
  const [selected, setSelected] = useState(null)
  const [statusFilter, setStatusFilter] = useState('')
  const [newStatus, setNewStatus] = useState('')
  const [adminNotes, setAdminNotes] = useState('')
  const [updating, setUpdating] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (statusFilter) params.append('status', statusFilter)
      const { data } = await api.get(`/government/all?${params}`)
      setRequests(data.data?.data || [])
    } catch {
      toast.error('Failed to load requests')
    } finally {
      setLoading(false)
    }
  }, [statusFilter])

  useEffect(() => { load() }, [load])

  const openReview = (req) => {
    setSelected(req)
    setNewStatus(req.status)
    setAdminNotes(req.adminNotes || '')
  }

  const handleUpdate = async () => {
    setUpdating(true)
    try {
      await api.patch(`/government/${selected._id}/status`, {
        status: newStatus,
        adminNotes,
      })
      toast.success('Status updated successfully')
      setSelected(null)
      load()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update')
    } finally {
      setUpdating(false)
    }
  }

  const stats = {
    total:       requests.length,
    pending:     requests.filter(r => r.status === 'pending').length,
    under_review:requests.filter(r => r.status === 'under_review').length,
    approved:    requests.filter(r => r.status === 'approved').length,
    rejected:    requests.filter(r => r.status === 'rejected').length,
  }

  if (loading) return <Spinner size="lg" />

  return (
    <div className="space-y-5 animate-fade-in">
      <PageHeader title="Government Requests" subtitle="Review and manage export service applications" />

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
        {[
          { label: 'Total',        value: stats.total,        color: 'text-white' },
          { label: 'Pending',      value: stats.pending,      color: 'text-amber-400' },
          { label: 'Under Review', value: stats.under_review, color: 'text-blue-400' },
          { label: 'Approved',     value: stats.approved,     color: 'text-emerald-400' },
          { label: 'Rejected',     value: stats.rejected,     color: 'text-red-400' },
        ].map(s => (
          <div key={s.label} className="ieg-card p-4 text-center">
            <p className={`font-display font-bold text-xl ${s.color}`}>{s.value}</p>
            <p className="text-xs text-slate-500">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Filter */}
      <div className="flex gap-1 flex-wrap">
        {['', ...STATUS_OPTIONS].map(s => (
          <button key={s || 'all'} onClick={() => setStatusFilter(s)}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition capitalize ${
              statusFilter === s ? 'bg-gold-500 text-navy-900' : 'bg-white/5 text-slate-400 hover:bg-white/10'
            }`}>
            {s ? s.replace(/_/g, ' ') : 'All'}
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="ieg-card overflow-hidden">
        <table className="ieg-table w-full">
          <thead>
            <tr>
              <th>Applicant</th>
              <th>Service</th>
              <th>Product</th>
              <th>Destination</th>
              <th>HS Code</th>
              <th>Submitted</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {requests.map(r => (
              <tr key={r._id}>
                <td>
                  <div>
                    <p className="text-sm font-semibold text-white">{r.user?.fullName || r.companyName}</p>
                    <p className="text-xs text-slate-500">{r.user?.email}</p>
                  </div>
                </td>
                <td><span className="text-xs text-gold-500 font-semibold">{r.serviceType}</span></td>
                <td><span className="text-xs text-slate-300">{r.product}</span></td>
                <td><span className="text-xs text-slate-400">{r.destinationCountry}</span></td>
                <td><span className="font-mono text-xs text-slate-500">{r.hsCode || '—'}</span></td>
                <td><span className="text-xs text-slate-500">{formatDate(r.createdAt)}</span></td>
                <td><StatusBadge status={r.status} /></td>
                <td>
                  <button onClick={() => openReview(r)}
                    className="w-7 h-7 rounded-lg bg-white/5 flex items-center justify-center text-slate-400 hover:bg-white/10 transition">
                    <Eye size={13} />
                  </button>
                </td>
              </tr>
            ))}
            {requests.length === 0 && (
              <tr><td colSpan={8} className="text-center py-12 text-slate-500">No requests found</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Review Modal */}
      {selected && (
        <Modal isOpen={!!selected} onClose={() => setSelected(null)}
          title={`Review — ${selected.serviceType}`}>
          <div className="space-y-4">
            {/* Details */}
            <div className="grid grid-cols-2 gap-3">
              {[
                ['Applicant', selected.user?.fullName || selected.companyName],
                ['Company',   selected.companyName],
                ['Product',   selected.product],
                ['Destination', selected.destinationCountry],
                ['HS Code',   selected.hsCode || '—'],
                ['Submitted', formatDate(selected.createdAt)],
              ].map(([label, value]) => (
                <div key={label} className="ieg-card p-3">
                  <p className="text-xs text-slate-500">{label}</p>
                  <p className="text-sm font-semibold text-white mt-0.5">{value}</p>
                </div>
              ))}
            </div>

            {/* Documents */}
            {selected.documents?.length > 0 && (
              <div>
                <p className="ieg-label mb-2">Documents</p>
                <div className="space-y-1">
                  {selected.documents.map((doc, i) => (
                    <a key={i} href={doc.url} target="_blank" rel="noopener noreferrer"
                      className="flex items-center gap-2 p-2 rounded-lg bg-blue-500/10 border border-blue-500/20 text-blue-400 hover:bg-blue-500/20 transition text-xs">
                      📄 {doc.name || `Document ${i + 1}`}
                    </a>
                  ))}
                </div>
              </div>
            )}

            {/* Update Status */}
            <div>
              <label className="ieg-label">Update Status</label>
              <div className="grid grid-cols-2 gap-2 mt-2">
                {STATUS_OPTIONS.map(s => (
                  <button key={s} onClick={() => setNewStatus(s)}
                    className={`p-2 rounded-lg text-xs font-semibold capitalize transition border ${
                      newStatus === s
                        ? s === 'approved' ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-400'
                        : s === 'rejected' ? 'bg-red-500/20 border-red-500/40 text-red-400'
                        : s === 'under_review' ? 'bg-blue-500/20 border-blue-500/40 text-blue-400'
                        : 'bg-amber-500/20 border-amber-500/40 text-amber-400'
                        : 'bg-white/5 border-white/10 text-slate-400'
                    }`}>
                    {s.replace(/_/g, ' ')}
                  </button>
                ))}
              </div>
            </div>

            {/* Notes */}
            <div>
              <label className="ieg-label">Admin Notes</label>
              <textarea className="ieg-input min-h-[70px] resize-none"
                placeholder="Add notes for the applicant..."
                value={adminNotes} onChange={e => setAdminNotes(e.target.value)} />
            </div>

            {/* Actions */}
            <div className="flex gap-3">
              <button onClick={() => setSelected(null)} className="btn-ghost flex-1">Cancel</button>
              <button onClick={handleUpdate} disabled={updating}
                className="btn-gold flex-1 flex items-center justify-center gap-2">
                {updating ? (
                  <span className="w-4 h-4 border-2 border-navy-900/30 border-t-navy-900 rounded-full animate-spin" />
                ) : <CheckCircle size={14} />}
                {updating ? 'Updating...' : 'Update Status'}
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  )
}