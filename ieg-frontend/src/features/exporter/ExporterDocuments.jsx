import { useState, useEffect, useRef } from 'react'
import { Upload, Download, Eye, FileText, Trash2, RefreshCw } from 'lucide-react'
import StatusBadge from '../../components/ui/StatusBadge'
import PageHeader from '../../components/ui/PageHeader'
import { formatDate } from '../../utils/format'
import api from '../../config/api'
import toast from 'react-hot-toast'
import Spinner from '../../components/ui/Spinner'

const DOC_TYPES = [
  { value: 'certificate_of_origin',      label: 'Certificate of Origin',      icon: '📄' },
  { value: 'commercial_invoice',         label: 'Commercial Invoice',          icon: '🧾' },
  { value: 'packing_list',               label: 'Packing List',                icon: '📦' },
  { value: 'bill_of_lading',             label: 'Bill of Lading',              icon: '🚢' },
  { value: 'phytosanitary_certificate',  label: 'Phytosanitary Certificate',   icon: '🌿' },
  { value: 'insurance_certificate',      label: 'Insurance Certificate',       icon: '🛡️' },
  { value: 'trade_license',              label: 'Trade License',               icon: '📋' },
  { value: 'other',                      label: 'Other Document',              icon: '📎' },
]

const displayStatus = (status) => (status === 'pending' ? 'pending_review' : status)

export default function ExporterDocuments() {
  const [docs, setDocs] = useState([])
  const [stats, setStats] = useState({})
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [uploadType, setUploadType] = useState('certificate_of_origin')
  const [deletingId, setDeletingId] = useState(null)
  const [replaceType, setReplaceType] = useState(null)
  const fileRef = useRef(null)
  const replaceRef = useRef(null)

  const load = async () => {
    setLoading(true)
    try {
      const [d, s] = await Promise.all([api.get('/documents/my'), api.get('/documents/stats')])
      setDocs(d.data.data || [])
      setStats(s.data.data || {})
    } catch {
      toast.error('Failed to load documents')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  const uploadFile = async (file, type) => {
    const fd = new FormData()
    fd.append('file', file)
    fd.append('type', type)
    await api.post('/documents/upload', fd)
    toast.success('Document uploaded — pending admin review')
    load()
  }

  const handleUpload = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    try {
      await uploadFile(file, uploadType)
    } catch (err) {
      toast.error(err.response?.data?.message || 'Upload failed')
    } finally {
      setUploading(false)
      e.target.value = ''
      setReplaceType(null)
    }
  }

  const handleReplace = (doc) => {
    setReplaceType(doc.type)
    replaceRef.current?.click()
  }

  const handleReplaceUpload = async (e) => {
    const file = e.target.files?.[0]
    if (!file || !replaceType) return
    setUploading(true)
    try {
      await uploadFile(file, replaceType)
      toast.success('Replacement uploaded for review')
    } catch (err) {
      toast.error(err.response?.data?.message || 'Upload failed')
    } finally {
      setUploading(false)
      e.target.value = ''
      setReplaceType(null)
    }
  }

  const handleDelete = async (docId, fileName) => {
    if (!window.confirm(`Delete "${fileName}"? This cannot be undone.`)) return
    setDeletingId(docId)
    try {
      await api.delete(`/documents/${docId}`)
      toast.success('Document deleted')
      load()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Delete failed')
    } finally {
      setDeletingId(null)
    }
  }

  if (loading) return <Spinner size="lg" />

  return (
    <div className="space-y-5 animate-fade-in">
      <PageHeader
        title="Export Documents"
        subtitle="Documents are reviewed by admin before approval"
        actions={
          <div className="flex items-center gap-2">
            <button type="button" onClick={load} className="btn-ghost flex items-center gap-2 text-sm">
              <RefreshCw size={14} /> Refresh
            </button>
            <select className="ieg-select h-9 text-sm w-52" value={uploadType} onChange={(e) => setUploadType(e.target.value)}>
              {DOC_TYPES.map((d) => (
                <option key={d.value} value={d.value}>{d.icon} {d.label}</option>
              ))}
            </select>
            <button type="button" onClick={() => fileRef.current?.click()} disabled={uploading} className="btn-gold flex items-center gap-2 text-sm">
              {uploading ? <div className="w-4 h-4 border-2 border-navy-900/20 border-t-navy-900 rounded-full animate-spin" /> : <Upload size={14} />}
              Upload Document
            </button>
            <input ref={fileRef} type="file" accept=".pdf,.jpg,.jpeg,.png,.docx" onChange={handleUpload} className="sr-only" />
            <input ref={replaceRef} type="file" accept=".pdf,.jpg,.jpeg,.png,.docx" onChange={handleReplaceUpload} className="sr-only" />
          </div>
        }
      />

      <div className="grid grid-cols-3 gap-3">
        {[
          { label: 'Approved Documents', value: stats.approved ?? stats.active ?? 0, color: 'text-emerald-400' },
          { label: 'Pending Documents', value: stats.pending ?? 0, color: 'text-amber-400' },
          { label: 'Rejected Documents', value: stats.rejected ?? 0, color: 'text-red-400' },
        ].map((s) => (
          <div key={s.label} className="ieg-card p-4 flex items-center justify-between">
            <p className="text-xs text-slate-500">{s.label}</p>
            <p className={`font-display font-bold text-xl ${s.color}`}>{s.value}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {docs.map((doc) => {
          const docInfo = DOC_TYPES.find((d) => d.value === doc.type)
          const uploaded = doc.uploadDate || doc.createdAt
          const status = displayStatus(doc.status)
          const isApproved = status === 'approved'
          const isRejected = status === 'rejected'

          return (
            <div key={doc._id} className={`ieg-card p-4 relative ${isRejected ? 'border-red-500/20' : isApproved ? 'border-emerald-500/20' : 'border-amber-500/20'}`}>
              <div className="absolute top-3 right-3">
                <StatusBadge status={status} />
              </div>

              <div className="flex items-start gap-3 mb-3 pr-16">
                <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-lg flex-shrink-0">
                  {docInfo?.icon || '📄'}
                </div>
                <div className="min-w-0">
                  <p className="font-display font-bold text-white text-sm">{docInfo?.label || doc.type}</p>
                  <p className="text-xs text-slate-500 truncate" title={doc.fileName}>{doc.fileName}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs mb-3">
                <div>
                  <p className="text-slate-600">Upload Date</p>
                  <p className="text-slate-300">{formatDate(uploaded)}</p>
                </div>
                <div>
                  <p className="text-slate-600">Expiry Date</p>
                  <p className="text-slate-300">{formatDate(doc.expiryDate) || '—'}</p>
                </div>
              </div>

              {isApproved && doc.reviewedAt && (
                <div className="text-xs mb-3 p-2 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
                  <p className="text-emerald-400 font-semibold">Approved</p>
                  <p className="text-slate-400 mt-0.5">
                    By {doc.reviewedBy?.fullName || 'Admin'} · {formatDate(doc.reviewedAt)}
                  </p>
                  {doc.approvalNotes && <p className="text-slate-500 mt-1 italic">{doc.approvalNotes}</p>}
                </div>
              )}

              {isRejected && (
                <div className="text-xs mb-3 p-2 rounded-lg bg-red-500/10 border border-red-500/20">
                  <p className="text-red-400 font-semibold">Rejection Reason</p>
                  <p className="text-slate-300 mt-0.5">{doc.rejectionReason || doc.reviewNotes || 'No reason provided'}</p>
                </div>
              )}

              <div className="flex gap-2 flex-wrap">
                <button type="button" className="btn-ghost flex items-center gap-1.5 text-xs px-3 py-1.5" onClick={() => {
                  api.get(`/documents/${doc._id}/download`)
                    .then((r) => {
                      if (r.data?.url) {
                        // Cloudinary-hosted: open URL directly so the browser handles it natively
                        const a = document.createElement('a')
                        a.href = r.data.url
                        a.download = r.data.fileName || doc.fileName
                        a.target = '_blank'
                        a.rel = 'noopener noreferrer'
                        a.click()
                      } else {
                        // Local file: r.data is a blob
                        const url = URL.createObjectURL(r.data)
                        const a = document.createElement('a')
                        a.href = url
                        a.download = doc.fileName
                        a.click()
                        URL.revokeObjectURL(url)
                      }
                    })
                    .catch(() => toast.error('Download failed'))
                }}>
                  <Download size={12} /> Download
                </button>
                <button type="button" className="btn-ghost flex items-center gap-1.5 text-xs px-3 py-1.5" onClick={() => {
                  api.get(`/documents/${doc._id}/view`)
                    .then((r) => {
                      if (r.data?.url) {
                        // Cloudinary-hosted: open directly in a new tab
                        window.open(r.data.url, '_blank', 'noopener,noreferrer')
                      } else {
                        // Local file: r.data is a blob
                        const url = URL.createObjectURL(r.data)
                        window.open(url, '_blank')
                      }
                    })
                    .catch(() => toast.error('Preview failed'))
                }}>
                  <Eye size={12} /> View
                </button>
                {isRejected && (
                  <button type="button" disabled={uploading} onClick={() => handleReplace(doc)} className="btn-ghost flex items-center gap-1.5 text-xs px-3 py-1.5 text-amber-400 border-amber-500/30">
                    <Upload size={12} /> Upload Replacement
                  </button>
                )}
                {!isApproved && (
                  <button type="button" disabled={deletingId === doc._id} onClick={() => handleDelete(doc._id, doc.fileName)} className="btn-ghost flex items-center gap-1.5 text-xs px-3 py-1.5 text-red-400 border-red-500/30 hover:bg-red-500/10">
                    <Trash2 size={12} /> {deletingId === doc._id ? 'Deleting...' : 'Delete'}
                  </button>
                )}
              </div>
            </div>
          )
        })}

        {docs.length === 0 && (
          <div className="col-span-3 text-center py-16">
            <FileText size={36} className="text-slate-600 mx-auto mb-3" />
            <p className="text-slate-400 font-display font-bold">No documents uploaded</p>
            <p className="text-slate-600 text-sm mt-1">Upload export documents — admin will review each submission</p>
          </div>
        )}
      </div>
    </div>
  )
}
