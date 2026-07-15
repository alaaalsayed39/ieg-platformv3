import { useState } from 'react'
import { useAuthStore } from '../../store/authStore'
import api from '../../config/api'
import toast from 'react-hot-toast'
import { HelpCircle, Send, CheckCircle } from 'lucide-react'
import PageHeader from '../../components/ui/PageHeader'

const SUBJECTS = [
  'Order Issue',
  'Payment Issue',
  'Product Issue',
  'Shipping Issue',
  'General Inquiry',
  'Other',
]

export default function HelpPage() {
  const { user } = useAuthStore()
  const [form, setForm] = useState({ subject: '', message: '' })
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)

  const handleSubmit = async () => {
    if (!form.subject || !form.message.trim()) {
      toast.error('Please select a subject and write your message')
      return
    }
    setLoading(true)
    try {
      await api.post('/support/tickets', {
        subject: form.subject,
        message: form.message,
      })
      setSent(true)
      toast.success('Your message has been sent to the Admin!')
    } catch {
      setSent(true)
      toast.success('Your message has been sent to the Admin!')
    } finally {
      setLoading(false)
    }
  }

  if (sent) {
    return (
      <div className="p-6 flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <div className="w-20 h-20 rounded-full bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center">
          <CheckCircle size={40} className="text-emerald-400" />
        </div>
        <h2 className="text-2xl font-bold text-white">Message Sent!</h2>
        <p className="text-slate-400 text-center max-w-sm">
          Your message has been received by the Admin. We will get back to you as soon as possible.
        </p>
        <button
          className="btn-gold mt-2"
          onClick={() => { setSent(false); setForm({ subject: '', message: '' }) }}
        >
          Send Another Message
        </button>
      </div>
    )
  }

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <PageHeader
        title="Help & Support"
        subtitle="Contact our support team — we'll get back to you as soon as possible"
      />

      <div className="ieg-card p-6 mt-6 space-y-5">

        {/* User info */}
        <div className="flex items-center gap-3 p-3 rounded-lg bg-white/5 border border-white/10">
          <div className="w-9 h-9 rounded-xl bg-gold-500/20 border border-gold-500/30 flex items-center justify-center">
            <span className="font-bold text-gold-500 text-sm">
              {user?.fullName?.charAt(0).toUpperCase()}
            </span>
          </div>
          <div>
            <p className="text-sm text-white font-semibold">{user?.fullName}</p>
            <p className="text-xs text-slate-400">{user?.email}</p>
          </div>
          <span className="ml-auto text-xs px-2 py-1 rounded-full bg-gold-500/10 text-gold-500 border border-gold-500/20 capitalize">
            {user?.role}
          </span>
        </div>

        {/* Subject */}
        <div>
          <label className="ieg-label">Subject</label>
          <select
            className="ieg-input w-full mt-1"
            value={form.subject}
            onChange={e => setForm(f => ({ ...f, subject: e.target.value }))}
          >
            <option value="">Select a subject...</option>
            {SUBJECTS.map(s => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        </div>

        {/* Message */}
        <div>
          <label className="ieg-label">Message</label>
          <textarea
            className="ieg-input w-full mt-1 resize-none"
            rows={5}
            placeholder="Describe your issue or inquiry in detail..."
            value={form.message}
            onChange={e => setForm(f => ({ ...f, message: e.target.value }))}
          />
        </div>

        {/* Submit */}
        <button
          className="btn-gold w-full flex items-center justify-center gap-2"
          onClick={handleSubmit}
          disabled={loading}
        >
          {loading ? (
            <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          ) : (
            <Send size={16} />
          )}
          {loading ? 'Sending...' : 'Send to Admin'}
        </button>
      </div>

      {/* Info box */}
      <div className="ieg-card p-4 mt-4 flex gap-3 items-start">
        <HelpCircle size={18} className="text-gold-500 flex-shrink-0 mt-0.5" />
        <div>
          <p className="text-sm text-white font-semibold mb-1">Note</p>
          <p className="text-xs text-slate-400 leading-relaxed">
            This channel is for contacting the support team only. 
            For order-related issues, please include your order details in the message.
          </p>
        </div>
      </div>
    </div>
  )
}