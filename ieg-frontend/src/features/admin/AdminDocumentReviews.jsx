import { useState, useEffect, useCallback } from 'react'
import { Check, X, Eye, Download, FileText } from 'lucide-react'
import StatusBadge from '../../components/ui/StatusBadge'
import PageHeader from '../../components/ui/PageHeader'
import Modal from '../../components/ui/Modal'
import { formatDate } from '../../utils/format'
import api from '../../config/api'
import toast from 'react-hot-toast'
import Spinner from '../../components/ui/Spinner'

const DOC_TYPE_LABELS = {
  certificate_of_origin: 'Certificate of Origin',
  commercial_invoice: 'Commercial Invoice',
  packing_list: 'Packing List',
  bill_of_lading: 'Bill of Lading',
  phytosanitary_certificate: 'Phytosanitary Certificate',
  insurance_certificate: 'Insurance Certificate',
  trade_license: 'Trade License',
  other: 'Other Document',
}

const FILTER_TABS = [
  { value: 'pending_review', label: 'Pending' },
  { value: 'approved', label: 'Approved' },
  { value: 'rejected', label: 'Rejected' },
]

export default function AdminDocumentReviews() {
  const [docs, setDocs] = useState([])
  const [loading, setLoading] = useState(true)
  const [tabFilter, setTabFilter] = useState('pending_review')
  const [selected, setSelected] = useState(null)
  const [rejectionReason, setRejectionReason] = useState('')
  const [approvalNotes, setApprovalNotes] = useState('')
  const [actionLoading, setActionLoading] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({ limit: '50' })
      if (tabFilter) params.append('status', tabFilter)
      const { data } = await api.get(`/documents/admin/all?${params}`)
      setDocs(data.data || [])
    } catch {
      toast.error('Failed to load documents')
    } finally {
      setLoading(false)
    }
  }, [tabFilter])

  useEffect(() => { load() }, [load])

  const openDoc = (doc) => {
    setSelected(doc)
    setRejectionReason('')
    setApprovalNotes('')
  }

  const downloadDoc = async (doc, e) => {
    e?.stopPropagation()
    try {
      const { data } = await api.get(`/documents/${doc._id}/download`)
      if (data?.url) {
        // Cloudinary-hosted: trigger native browser download via anchor
        const a = document.createElement('a')
        a.href = data.url
        a.download = data.fileName || doc.fileName
        a.target = '_blank'
        a.rel = 'noopener noreferrer'
        a.click()
      } else {
        // Local file: data is a blob
        const url = URL.createObjectURL(data)
        const a = document.createElement('a')
        a.href = url
        a.download = doc.fileName
        a.click()
        URL.revokeObjectURL(url)
      }
    } catch {
      toast.error('Download failed')
    }
  }

  const viewDoc = async (doc, e) => {
    e?.stopPropagation()
    try {
      const { data } = await api.get(`/documents/${doc._id}/view`)
      if (data?.url) {
        // Cloudinary-hosted: open the CDN URL directly in a new tab
        window.open(data.url, '_blank', 'noopener,noreferrer')
      } else {
        // Local file: data is a blob
        const url = URL.createObjectURL(data)
        window.open(url, '_blank')
      }
    } catch {
      toast.error('Preview failed')
    }
  }

  const approveDoc = async (doc) => {
    setActionLoading(true)
    try {
      await api.patch(`/documents/${doc._id}/approve`, { approvalNotes: approvalNotes.trim() || undefined })
      toast.success('Document approved')
      setSelected(null)
      load()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Approve failed')
    } finally {
      setActionLoading(false)
    }
  }

  const rejectDoc = async () => {
    if (!rejectionReason.trim()) return toast.error('Rejection reason is required')
    setActionLoading(true)
    try {
      await api.patch(`/documents/${selected._id}/reject`, { rejectionReason: rejectionReason.trim() })
      toast.success('Document rejected')
      setSelected(null)
      load()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Reject failed')
    } finally {
      setActionLoading(false)
    }
  }

  const isPending = (doc) => doc.status === 'pending_review' || doc.status === 'pending'

  if (loading) return <Spinner size="lg" />

  return (
    <div className="space-y-5 animate-fade-in">
      <PageHeader
        title="Document Review"
        subtitle="Review export and verification documents submitted by exporters"
      />

      <div className="flex gap-1 flex-wrap">
        {FILTER_TABS.map((tab) => (
          <button
            key={tab.value}
            type="button"
            onClick={() => setTabFilter(tab.value)}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${tabFilter === tab.value ? 'bg-gold-500 text-navy-900' : 'bg-white/5 text-slate-400 hover:bg-white/10'}`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="ieg-card overflow-hidden">
        <table className="ieg-table w-full">
          <thead>
            <tr>
              <th>Exporter</th>
              <th>Document</th>
              <th>Upload Date</th>
              <th>Expiry Date</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {docs.map((doc) => (
              <tr key={doc._id}>
                <td>
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-xl bg-gold-500/20 flex items-center justify-center text-xs font-bold text-gold-500">
                      {(doc.userId?.companyName || doc.userId?.fullName || '?').charAt(0)}
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-white">{doc.userId?.companyName || doc.userId?.fullName}</p>
                      <p className="text-xs text-slate-500">{doc.userId?.email}</p>
                    </div>
                  </div>
                </td>
                <td>
                  <p className="text-sm text-white">{DOC_TYPE_LABELS[doc.type] || doc.type}</p>
                  <p className="text-xs text-slate-500 truncate max-w-[180px]">{doc.fileName}</p>
                </td>
                <td className="text-xs text-slate-500">{formatDate(doc.uploadDate || doc.createdAt)}</td>
                <td className="text-xs text-slate-500">{formatDate(doc.expiryDate) || '—'}</td>
                <td><StatusBadge status={doc.status === 'pending' ? 'pending_review' : doc.status} /></td>
                <td>
                  <div className="flex items-center gap-1.5">
                    <button type="button" onClick={() => viewDoc(doc)} className="w-7 h-7 rounded-lg bg-white/5 flex items-center justify-center text-slate-400 hover:bg-white/10 transition" title="View">
                      <Eye size={13} />
                    </button>
                    <button type="button" onClick={() => downloadDoc(doc)} className="w-7 h-7 rounded-lg bg-white/5 flex items-center justify-center text-slate-400 hover:bg-white/10 transition" title="Download">
                      <Download size={13} />
                    </button>
                    {isPending(doc) && (
                      <>
                        <button type="button" onClick={() => openDoc(doc)} className="w-7 h-7 rounded-lg bg-emerald-500/15 text-emerald-400 flex items-center justify-center hover:bg-emerald-500/25 transition" title="Approve">
                          <Check size={13} />
                        </button>
                        <button type="button" onClick={() => openDoc(doc)} className="w-7 h-7 rounded-lg bg-red-500/15 text-red-400 flex items-center justify-center hover:bg-red-500/25 transition" title="Reject">
                          <X size={13} />
                        </button>
                      </>
                    )}
                    {!isPending(doc) && (
                      <button type="button" onClick={() => openDoc(doc)} className="text-xs text-gold-500 hover:text-gold-400 px-2">Details</button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
            {docs.length === 0 && (
              <tr>
                <td colSpan={6} className="text-center py-12 text-slate-500">
                  <FileText size={28} className="mx-auto mb-2 opacity-40" />
                  No {tabFilter.replace('_', ' ')} documents
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {selected && (
        <Modal
          isOpen={!!selected}
          onClose={() => setSelected(null)}
          title={`Review — ${DOC_TYPE_LABELS[selected.type] || selected.type}`}
          size="lg"
        >
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3 text-sm">
              {[
                ['Exporter', selected.userId?.companyName || selected.userId?.fullName],
                ['File', selected.fileName],
                ['Upload Date', formatDate(selected.uploadDate || selected.createdAt)],
                ['Expiry Date', formatDate(selected.expiryDate)],
                ['Status', null],
              ].map(([label, value]) => (
                <div key={label} className="ieg-card p-3">
                  <p className="text-xs text-slate-500">{label}</p>
                  {label === 'Status' ? (
                    <StatusBadge status={selected.status === 'pending' ? 'pending_review' : selected.status} />
                  ) : (
                    <p className="font-semibold text-white text-sm mt-0.5">{value || '—'}</p>
                  )}
                </div>
              ))}
            </div>

            {selected.status === 'approved' && (
              <div className="rounded-xl bg-emerald-500/10 border border-emerald-500/20 p-3 text-sm">
                <p className="text-emerald-400 font-semibold">Approved</p>
                <p className="text-slate-400 text-xs mt-1">
                  By {selected.reviewedBy?.fullName || 'Admin'} on {formatDate(selected.reviewedAt)}
                </p>
                {selected.approvalNotes && <p className="text-slate-300 text-xs mt-2">{selected.approvalNotes}</p>}
              </div>
            )}

            {selected.status === 'rejected' && (
              <div className="rounded-xl bg-red-500/10 border border-red-500/20 p-3 text-sm">
                <p className="text-red-400 font-semibold">Rejected</p>
                <p className="text-slate-300 text-xs mt-1">{selected.rejectionReason || selected.reviewNotes}</p>
              </div>
            )}

            <div className="flex gap-2">
              <button type="button" onClick={() => viewDoc(selected)} className="btn-ghost flex-1 flex items-center justify-center gap-2 text-sm">
                <Eye size={14} /> View
              </button>
              <button type="button" onClick={() => downloadDoc(selected)} className="btn-ghost flex-1 flex items-center justify-center gap-2 text-sm">
                <Download size={14} /> Download
              </button>
            </div>

            {isPending(selected) && (
              <>
                <div>
                  <label className="ieg-label">Approval Notes (optional)</label>
                  <textarea
                    className="ieg-input min-h-[60px] resize-none"
                    placeholder="Optional note for the exporter..."
                    value={approvalNotes}
                    onChange={(e) => setApprovalNotes(e.target.value)}
                  />
                </div>
                <div>
                  <label className="ieg-label">Rejection Reason (required to reject)</label>
                  <textarea
                    className="ieg-input min-h-[80px] resize-none"
                    placeholder="Explain why this document was rejected..."
                    value={rejectionReason}
                    onChange={(e) => setRejectionReason(e.target.value)}
                  />
                </div>
                <div className="flex gap-3 pt-2 border-t border-white/5">
                  <button type="button" onClick={() => setSelected(null)} className="btn-ghost flex-1">Cancel</button>
                  <button type="button" disabled={actionLoading} onClick={rejectDoc} className="btn-danger flex-1">Reject</button>
                  <button type="button" disabled={actionLoading} onClick={() => approveDoc(selected)} className="btn-gold flex-1">Approve</button>
                </div>
              </>
            )}
          </div>
        </Modal>
      )}
    </div>
  )
}
