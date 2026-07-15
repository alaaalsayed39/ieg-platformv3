import { useState, useEffect, useCallback } from 'react'
import { useAuthStore } from '../../store/authStore'
import api from '../../config/api'
import toast from 'react-hot-toast'
import PageHeader from '../../components/ui/PageHeader'
import StatusBadge from '../../components/ui/StatusBadge'
import Modal from '../../components/ui/Modal'
import Spinner from '../../components/ui/Spinner'
import { formatDate } from '../../utils/format'
import {
  FileText, Shield, Leaf, Search, ClipboardCheck,
  Plus, X, Upload, CheckCircle, Clock, AlertCircle
} from 'lucide-react'

const SERVICES = [
  {
    type: 'Export License',
    icon: Shield,
    color: 'text-gold-500',
    bg: 'bg-gold-500/10',
    border: 'border-gold-500/20',
    description: 'Official permission to export goods from Egypt to international markets.',
    authority: 'Export Authority',
  },
  {
    type: 'Certificate of Origin',
    icon: FileText,
    color: 'text-blue-400',
    bg: 'bg-blue-500/10',
    border: 'border-blue-500/20',
    description: 'Document certifying the country of origin of your exported products.',
    authority: 'Chamber of Commerce',
  },
  {
    type: 'Inspection Certificate',
    icon: ClipboardCheck,
    color: 'text-purple-400',
    bg: 'bg-purple-500/10',
    border: 'border-purple-500/20',
    description: 'Confirms your goods meet quality and safety standards before export.',
    authority: 'General Organization for Export Control',
  },
  {
    type: 'Phytosanitary Certificate',
    icon: Leaf,
    color: 'text-emerald-400',
    bg: 'bg-emerald-500/10',
    border: 'border-emerald-500/20',
    description: 'Required for agricultural products to confirm they are pest and disease free.',
    authority: 'Ministry of Agriculture',
  },
  {
    type: 'Customs Clearance',
    icon: Search,
    color: 'text-orange-400',
    bg: 'bg-orange-500/10',
    border: 'border-orange-500/20',
    description: 'Official clearance from customs authority to allow your shipment to proceed.',
    authority: 'Egyptian Customs Authority',
  },
]

const COUNTRIES = [
  'United States', 'United Kingdom', 'Germany', 'France', 'China',
  'Saudi Arabia', 'UAE', 'Italy', 'Netherlands', 'Japan', 'Other'
]

export default function GovernmentPage() {
  const { user } = useAuthStore()
  const [requests, setRequests] = useState([])
  const [loading, setLoading] = useState(true)
  const [applyModal, setApplyModal] = useState(null) // selected service
  const [submitting, setSubmitting] = useState(false)
  const [form, setForm] = useState({
    companyName: '', product: '', destinationCountry: '', hsCode: ''
  })
  const [files, setFiles] = useState([])

  const loadRequests = useCallback(async () => {
    try {
      const { data } = await api.get('/government/my')
      setRequests(data.data?.data || [])
    } catch {
      toast.error('Failed to load requests')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadRequests()
    // Pre-fill company name
    setForm(f => ({ ...f, companyName: user?.companyName || user?.fullName || '' }))
  }, [loadRequests, user])

  const openApply = (service) => {
    setApplyModal(service)
    setForm(f => ({ ...f, companyName: user?.companyName || user?.fullName || '' }))
    setFiles([])
  }

  const handleSubmit = async () => {
    if (!form.companyName || !form.product || !form.destinationCountry) {
      return toast.error('Please fill all required fields')
    }
    setSubmitting(true)
    try {
      const formData = new FormData()
      formData.append('serviceType', applyModal.type)
      formData.append('companyName', form.companyName)
      formData.append('product', form.product)
      formData.append('destinationCountry', form.destinationCountry)
      formData.append('hsCode', form.hsCode)
      files.forEach(f => formData.append('documents', f))

      await api.post('/government/apply', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      })
      toast.success('Application submitted successfully!')
      setApplyModal(null)
      loadRequests()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to submit')
    } finally {
      setSubmitting(false)
    }
  }

  const getRequestForService = (serviceType) =>
    requests.filter(r => r.serviceType === serviceType)

  const getStatusIcon = (status) => {
    if (status === 'approved') return <CheckCircle size={12} className="text-emerald-400" />
    if (status === 'rejected') return <AlertCircle size={12} className="text-red-400" />
    return <Clock size={12} className="text-amber-400" />
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        title="Government Services"
        subtitle="Apply for export licenses, certificates, and customs clearance — Demo Integration"
      />

      {/* Demo notice */}
      <div className="ieg-card p-3 flex items-center gap-3 border-amber-500/20 bg-amber-500/5">
        <AlertCircle size={16} className="text-amber-400 flex-shrink-0" />
        <p className="text-xs text-amber-300">
          <strong>Demo Integration</strong> — This module simulates government services workflow for demonstration purposes.
        </p>
      </div>

      {/* Service Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {SERVICES.map((service) => {
          const Icon = service.icon
          const myRequests = getRequestForService(service.type)
          const latest = myRequests[0]

          return (
            <div key={service.type} className={`ieg-card p-5 border ${service.border} flex flex-col gap-4`}>
              {/* Header */}
              <div className="flex items-start justify-between">
                <div className={`w-10 h-10 rounded-xl ${service.bg} flex items-center justify-center`}>
                  <Icon size={20} className={service.color} />
                </div>
                {latest && (
                  <div className="flex items-center gap-1">
                    {getStatusIcon(latest.status)}
                    <StatusBadge status={latest.status} />
                  </div>
                )}
              </div>

              {/* Info */}
              <div>
                <h3 className="font-display font-bold text-white text-sm mb-1">{service.type}</h3>
                <p className="text-xs text-slate-400 leading-relaxed">{service.description}</p>
                <p className="text-xs text-slate-600 mt-2">🏛 {service.authority}</p>
              </div>

              {/* Previous requests */}
              {myRequests.length > 0 && (
                <div className="space-y-1">
                  {myRequests.slice(0, 2).map(r => (
                    <div key={r._id} className="flex items-center justify-between text-xs p-2 rounded-lg bg-white/3">
                      <span className="text-slate-400">{formatDate(r.createdAt)}</span>
                      <StatusBadge status={r.status} />
                    </div>
                  ))}
                </div>
              )}

              {/* Apply button */}
              <button
                onClick={() => openApply(service)}
                className="btn-gold w-full text-sm flex items-center justify-center gap-2 mt-auto"
              >
                <Plus size={14} /> Apply Now
              </button>
            </div>
          )
        })}
      </div>

      {/* My Requests */}
      <div className="ieg-card p-5">
        <h3 className="font-display font-bold text-white mb-4">My Government Requests</h3>
        {loading ? <Spinner /> : (
          <div className="space-y-2">
            {requests.length === 0 ? (
              <p className="text-slate-500 text-sm text-center py-8">No requests yet. Apply for a service above.</p>
            ) : (
              <table className="ieg-table w-full">
                <thead>
                  <tr>
                    <th>Service</th>
                    <th>Product</th>
                    <th>Destination</th>
                    <th>Submitted</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {requests.map(r => (
                    <tr key={r._id}>
                      <td className="text-sm text-white font-semibold">{r.serviceType}</td>
                      <td className="text-xs text-slate-400">{r.product}</td>
                      <td className="text-xs text-slate-400">{r.destinationCountry}</td>
                      <td className="text-xs text-slate-500">{formatDate(r.createdAt)}</td>
                      <td><StatusBadge status={r.status} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}
      </div>

      {/* Apply Modal */}
      {applyModal && (
        <Modal isOpen={!!applyModal} onClose={() => setApplyModal(null)} title={`Apply — ${applyModal.type}`}>
          <div className="space-y-4">
            {/* Service info */}
            <div className={`p-3 rounded-xl ${applyModal.bg} border ${applyModal.border} flex items-center gap-3`}>
              <applyModal.icon size={18} className={applyModal.color} />
              <div>
                <p className="text-sm font-semibold text-white">{applyModal.type}</p>
                <p className="text-xs text-slate-400">{applyModal.authority}</p>
              </div>
            </div>

            {/* Form */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="ieg-label">Company Name *</label>
                <input className="ieg-input" value={form.companyName}
                  onChange={e => setForm(f => ({ ...f, companyName: e.target.value }))}
                  placeholder="Your company name" />
              </div>
              <div>
                <label className="ieg-label">Product *</label>
                <input className="ieg-input" value={form.product}
                  onChange={e => setForm(f => ({ ...f, product: e.target.value }))}
                  placeholder="e.g. Egyptian Cotton" />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="ieg-label">Destination Country *</label>
                <select className="ieg-input" value={form.destinationCountry}
                  onChange={e => setForm(f => ({ ...f, destinationCountry: e.target.value }))}>
                  <option value="">Select country...</option>
                  {COUNTRIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <label className="ieg-label">HS Code</label>
                <input className="ieg-input" value={form.hsCode}
                  onChange={e => setForm(f => ({ ...f, hsCode: e.target.value }))}
                  placeholder="e.g. 5201.00" />
              </div>
            </div>

            {/* File upload */}
            <div>
              <label className="ieg-label">Upload Documents</label>
              <label className="flex items-center gap-2 p-3 rounded-xl border border-dashed border-white/20 cursor-pointer hover:border-gold-500/40 transition">
                <Upload size={16} className="text-slate-400" />
                <span className="text-sm text-slate-400">Click to upload documents (PDF, images)</span>
                <input type="file" multiple accept=".pdf,.jpg,.jpeg,.png"
                  className="hidden"
                  onChange={e => setFiles(Array.from(e.target.files))} />
              </label>
              {files.length > 0 && (
                <div className="mt-2 space-y-1">
                  {files.map((f, i) => (
                    <div key={i} className="flex items-center justify-between text-xs p-2 rounded-lg bg-white/5">
                      <span className="text-slate-300">{f.name}</span>
                      <button onClick={() => setFiles(prev => prev.filter((_, idx) => idx !== i))}>
                        <X size={12} className="text-slate-500 hover:text-red-400" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="flex gap-3 pt-2">
              <button onClick={() => setApplyModal(null)} className="btn-ghost flex-1">Cancel</button>
              <button onClick={handleSubmit} disabled={submitting}
                className="btn-gold flex-1 flex items-center justify-center gap-2">
                {submitting ? (
                  <span className="w-4 h-4 border-2 border-navy-900/30 border-t-navy-900 rounded-full animate-spin" />
                ) : <Plus size={15} />}
                {submitting ? 'Submitting...' : 'Submit Application'}
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  )
}