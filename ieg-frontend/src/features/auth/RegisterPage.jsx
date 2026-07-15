import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { UserPlus } from 'lucide-react'
import api from '../../config/api'
import { useAuthStore } from '../../store/authStore'
import toast from 'react-hot-toast'
import IEGLogo from '../../components/ui/IEGLogo'

const ROLES = [
  { value: 'exporter', label: 'Exporter / Supplier', desc: 'List products and sell globally' },
  { value: 'buyer',    label: 'Buyer / Importer',    desc: 'Source products from Egypt' },
  { value: 'shipper',  label: 'Logistics Provider',  desc: 'Manage shipments and delivery' },
]

export default function RegisterPage() {
  const [form, setForm] = useState({ fullName: '', email: '', password: '', companyName: '', phone: '', role: '', country: 'EG' })
  const [loading, setLoading] = useState(false)
  const { setAuth } = useAuthStore()
  const navigate    = useNavigate()

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.role) return toast.error('Please select your role')

    // ── Full Name validation ──────────────────────────────────────────────────
    if (!/^[a-zA-Z\u0600-\u06FF\s]+$/.test(form.fullName.trim())) {
      return toast.error('Full Name must contain letters only, no numbers or special characters')
    }

    // ── Phone validation ──────────────────────────────────────────────────────
    if (form.phone && form.phone.replace(/\D/g, '').length > 15) {
      return toast.error('Phone number is too long — maximum 15 digits allowed')
    }

    // ── Password validation ───────────────────────────────────────────────────
    if (!/(?=.*[A-Z])/.test(form.password)) {
      return toast.error('Password must contain at least one uppercase letter')
    }
    if (form.password.length < 8) {
      return toast.error('Password must be at least 8 characters')
    }

    setLoading(true)
    try {
      const { data } = await api.post('/auth/register', form)
      setAuth(data.data.user, data.data.accessToken)
      toast.success('Account created! Welcome to IEG.')
      const roleHome = { admin: '/admin', exporter: '/exporter', buyer: '/buyer', shipper: '/shipper' }
      navigate(roleHome[data.data.user.role] || '/')
    } catch (err) {
      toast.error(err.response?.data?.message || 'Registration failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-6" style={{ background: '#060d24' }}>
      <div className="w-full max-w-lg animate-slide-up">
        <div className="mb-6">
          <IEGLogo size="md" />
        </div>
        <div className="ieg-card p-8">
          <h2 className="font-display font-bold text-2xl text-white mb-1">Create Account</h2>
          <p className="text-slate-500 text-sm mb-6">Join the International Export Gateway</p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="ieg-label">Full Name</label>
                <input
                  className="ieg-input"
                  placeholder="Your name"
                  value={form.fullName}
                  onChange={e => {
                    const val = e.target.value
                    // منع كتابة أرقام مباشرة في الـ input
                    if (/\d/.test(val)) return
                    set('fullName', val)
                  }}
                  required
                />
              </div>
              <div>
                <label className="ieg-label">Company</label>
                <input className="ieg-input" placeholder="Company name" value={form.companyName} onChange={e => set('companyName', e.target.value)} />
              </div>
            </div>
            <div>
              <label className="ieg-label">Email</label>
              <input className="ieg-input" type="email" placeholder="you@company.com" value={form.email} onChange={e => set('email', e.target.value)} required />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="ieg-label">Password</label>
                <input className="ieg-input" type="password" placeholder="8+ characters" value={form.password} onChange={e => set('password', e.target.value)} required />
              </div>
              <div>
                <label className="ieg-label">Phone</label>
                <input
                  className="ieg-input"
                  placeholder="+20..."
                  value={form.phone}
                  maxLength={15}
                  onChange={e => {
                    const val = e.target.value
                    if (/[a-zA-Z\u0600-\u06FF]/.test(val)) return
                    set('phone', val)
                  }}
                />
              </div>
            </div>

            <div>
              <label className="ieg-label">Select Your Role</label>
              <div className="grid grid-cols-1 gap-2">
                {ROLES.map((r) => (
                  <label key={r.value}
                    className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition ${
                      form.role === r.value ? 'border-gold-500 bg-gold-500/10' : 'border-white/10 hover:border-white/20'
                    }`}
                  >
                    <input type="radio" name="role" value={r.value} checked={form.role === r.value}
                      onChange={() => set('role', r.value)} className="sr-only" />
                    <div className={`w-3.5 h-3.5 rounded-full border-2 flex-shrink-0 ${form.role === r.value ? 'border-gold-500 bg-gold-500' : 'border-slate-600'}`} />
                    <div>
                      <p className="text-sm font-semibold text-white">{r.label}</p>
                      <p className="text-xs text-slate-500">{r.desc}</p>
                    </div>
                  </label>
                ))}
              </div>
            </div>

            <button type="submit" disabled={loading} className="btn-gold w-full py-3 flex items-center justify-center gap-2">
              {loading ? <div className="w-4 h-4 border-2 border-navy-900/30 border-t-navy-900 rounded-full animate-spin" /> : <><UserPlus size={15} /> Create Account</>}
            </button>
          </form>

          <p className="text-center text-sm text-slate-500 mt-4">
            Already have an account?{' '}
            <Link to="/auth/login" className="text-gold-500 hover:text-gold-400 font-semibold transition">Sign in</Link>
          </p>
        </div>
      </div>
    </div>
  )
}
