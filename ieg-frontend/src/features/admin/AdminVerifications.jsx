import { useState, useEffect, useCallback } from 'react'
import { Check, X, Eye } from 'lucide-react'
import StatusBadge from '../../components/ui/StatusBadge'
import PageHeader  from '../../components/ui/PageHeader'
import Modal       from '../../components/ui/Modal'
import { formatDate } from '../../utils/format'
import api from '../../config/api'
import toast from 'react-hot-toast'
import Spinner from '../../components/ui/Spinner'

export default function AdminVerifications() {
  const [verifs,   setVerifs]   = useState([])
  const [loading,  setLoading]  = useState(true)
  const [selected, setSelected] = useState(null)
  const [note,     setNote]     = useState('')
  const [tabFilter,setTabFilter]= useState('pending')

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const { data } = await api.get(`/verifications?status=${tabFilter}`)
      setVerifs(data.data || [])
    } catch { toast.error('Failed to load') }
    finally { setLoading(false) }
  }, [tabFilter])

  useEffect(() => { load() }, [load])

  const review = async (status) => {
    try {
      await api.patch(`/verifications/${selected._id}/review`, { status, reviewerNotes: note })
      toast.success(`Verification ${status}`)
      setSelected(null); setNote(''); load()
    } catch (err) { toast.error(err.response?.data?.message || 'Failed') }
  }

  if (loading) return <Spinner size="lg" />

  return (
    <div className="space-y-5 animate-fade-in">
      <PageHeader title="Verification Requests" subtitle="Review KYB documents from exporters and shippers" />

      <div className="flex gap-1">
        {['pending','approved','rejected','under_review'].map(s => (
          <button key={s} onClick={() => setTabFilter(s)}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition capitalize ${tabFilter === s ? 'bg-gold-500 text-navy-900' : 'bg-white/5 text-slate-400 hover:bg-white/10'}`}>
            {s.replace(/_/g,' ')}
          </button>
        ))}
      </div>

      <div className="ieg-card overflow-hidden">
        <table className="ieg-table w-full">
          <thead><tr>
            <th>Company</th><th>Tax ID</th><th>Documents</th><th>Submitted</th><th>Status</th><th>Actions</th>
          </tr></thead>
          <tbody>
            {verifs.map(v => (
              <tr key={v._id}>
                <td>
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-xl bg-gold-500/20 flex items-center justify-center text-xs font-bold text-gold-500">
                      {(v.userId?.companyName || v.userId?.fullName || '?').charAt(0)}
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-white">{v.userId?.companyName || v.userId?.fullName}</p>
                      <p className="text-xs text-slate-500">{v.userId?.email} · {v.userId?.country}</p>
                    </div>
                  </div>
                </td>
                <td><span className="font-mono text-xs text-slate-300">{v.taxId || '—'}</span></td>
                <td>
                  <div className="text-xs text-slate-400 space-y-0.5">
                    {v.tradeLicenseUrl && <p className="text-emerald-400">✓ Trade License</p>}
                    {v.businessRegUrl  && <p className="text-emerald-400">✓ Business Reg.</p>}
                    {!v.tradeLicenseUrl && !v.businessRegUrl && <p className="text-slate-600">No docs</p>}
                  </div>
                </td>
                <td className="text-xs text-slate-500">{formatDate(v.submittedAt)}</td>
                <td><StatusBadge status={v.status} /></td>
                <td>
                  <div className="flex items-center gap-1.5">
                    <button onClick={() => { setSelected(v); setNote('') }}
                      className="w-7 h-7 rounded-lg bg-white/5 flex items-center justify-center text-slate-400 hover:bg-white/10 transition" title="Review">
                      <Eye size={13} />
                    </button>
                    {v.status === 'pending' && (
                      <>
                        <button onClick={() => { setSelected(v); review('approved') }}
                          className="w-7 h-7 rounded-lg bg-emerald-500/15 text-emerald-400 flex items-center justify-center hover:bg-emerald-500/25 transition" title="Approve">
                          <Check size={13} />
                        </button>
                        <button onClick={() => { setSelected(v) }}
                          className="w-7 h-7 rounded-lg bg-red-500/15 text-red-400 flex items-center justify-center hover:bg-red-500/25 transition" title="Reject">
                          <X size={13} />
                        </button>
                      </>
                    )}
                  </div>
                </td>
              </tr>
            ))}
            {verifs.length === 0 && (
              <tr><td colSpan={6} className="text-center py-12 text-slate-500">No {tabFilter} verifications</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Review modal */}
      {selected && (
        <Modal isOpen={!!selected} onClose={() => setSelected(null)} title={`Review — ${selected.userId?.companyName || selected.userId?.fullName}`}>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3 text-sm">
              {[
                ['Company', selected.userId?.companyName],
                ['Role',    selected.userId?.role],
                ['Country', selected.userId?.country],
                ['Tax ID',  selected.taxId],
              ].map(([l,v]) => (
                <div key={l} className="ieg-card p-3">
                  <p className="text-xs text-slate-500">{l}</p>
                  <p className="font-semibold text-white text-sm mt-0.5">{v || '—'}</p>
                </div>
              ))}
            </div>
            <div>
              <label className="ieg-label">Review Notes</label>
              <textarea className="ieg-input min-h-[80px] resize-none" placeholder="Add notes for the applicant..."
                value={note} onChange={e => setNote(e.target.value)} />
            </div>
            <div className="flex gap-3">
              <button onClick={() => setSelected(null)} className="btn-ghost flex-1">Cancel</button>
              {selected.status === 'pending' && (
                <>
                  <button onClick={() => review('rejected')} className="btn-danger flex-1">Reject</button>
                  <button onClick={() => review('approved')} className="btn-gold flex-1">Approve</button>
                </>
              )}
            </div>
          </div>
        </Modal>
      )}
    </div>
  )
}
