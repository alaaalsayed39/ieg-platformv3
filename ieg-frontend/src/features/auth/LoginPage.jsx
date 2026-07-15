import { useState } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { Eye, EyeOff, Globe, Shield, Lock } from 'lucide-react'
import api from '../../config/api'
import { useAuthStore } from '../../store/authStore'
import toast from 'react-hot-toast'
import IEGLogo from '../../components/ui/IEGLogo'

export default function LoginPage() {
  const [form, setForm]   = useState({ email: '', password: '', remember: false })
  const [show, setShow]   = useState(false)
  const [loading, setLoading] = useState(false)
  const { setAuth } = useAuthStore()
  const navigate    = useNavigate()
  const location    = useLocation()

  const from = location.state?.from?.pathname || null

  const getRoleHome = (role) => {
    const map = { admin: '/admin', exporter: '/exporter', buyer: '/buyer', shipper: '/shipper' }
    return map[role] || '/'
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.email || !form.password) return toast.error('Please fill all fields')

    // ── Password minimum length validation ────────────────────────────────────
    if (form.password.length < 8) {
      return toast.error('Password must be at least 8 characters')
    }

    setLoading(true)
    try {
      const { data } = await api.post('/auth/login', { email: form.email, password: form.password })
      setAuth(data.data.user, data.data.accessToken)
      toast.success(`Welcome back, ${data.data.user.fullName.split(' ')[0]}!`)
      navigate(from || getRoleHome(data.data.user.role), { replace: true })
    } catch (err) {
      toast.error(err.response?.data?.message || 'Login failed')
    } finally {
      setLoading(false)
    }
  }

  const quickLogin = (email, password) => {
    setForm(f => ({ ...f, email, password }))
  }

  return (
    <div className="min-h-screen flex" style={{ background: '#060d24' }}>
      {/* Left panel */}
      <div className="hidden lg:flex lg:w-5/12 flex-col justify-between p-10 relative overflow-hidden"
        style={{ background: 'linear-gradient(160deg, #0B1437 0%, #060d24 100%)' }}>
        <div className="absolute inset-0 navy-mesh opacity-60" />
        <div className="absolute bottom-0 left-0 right-0 h-64 opacity-10">
          <svg viewBox="0 0 400 200" className="w-full h-full">
            <rect x="50" y="120" width="300" height="60" rx="8" fill="#F5A623"/>
            <rect x="120" y="60" width="160" height="65" rx="4" fill="#1e3a8a"/>
            <rect x="170" y="20" width="10" height="80" fill="#F5A623"/>
            <rect x="210" y="30" width="10" height="70" fill="#F5A623"/>
            <path d="M0 160 Q200 130 400 160 L400 200 L0 200 Z" fill="#0B1437"/>
          </svg>
        </div>

        <div className="relative z-10">
          <IEGLogo size="lg" />
        </div>

        <div className="relative z-10">
          <h1 className="font-display font-bold text-4xl text-white mb-4 leading-tight">
            Your Gateway to<br />
            <span className="text-gradient">Global Trade</span>
          </h1>
          <p className="text-slate-400 text-base leading-relaxed mb-8">
            Connect with international buyers, manage export documents, and track shipments — all in one platform.
          </p>
          <div className="grid grid-cols-3 gap-3">
            {[
              { label: '500+', sub: 'Exporters' },
              { label: '80', sub: 'Countries' },
              { label: '$2B', sub: 'Trade Volume' },
            ].map((s) => (
              <div key={s.label} className="ieg-card p-3 text-center">
                <p className="font-display font-bold text-gold-500 text-xl">{s.label}</p>
                <p className="text-xs text-slate-500 mt-0.5">{s.sub}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="relative z-10 flex items-center gap-4">
          <Shield size={14} className="text-emerald-400" />
          <span className="text-xs text-slate-500">SSL Encrypted • Trusted Security</span>
        </div>
      </div>

      {/* Right panel */}
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-md animate-slide-up">
          <div className="lg:hidden mb-8">
            <IEGLogo size="md" />
          </div>

          <h2 className="font-display font-bold text-2xl text-white mb-1">Welcome back!</h2>
          <p className="text-slate-500 text-sm mb-8">Sign in to your IEG account</p>

          {/* Quick login buttons */}
          <div className="mb-6">
            <p className="text-xs text-slate-600 mb-2 font-display uppercase tracking-wider">Quick demo login</p>
            <div className="flex flex-wrap gap-2">
              {[
                { label: 'Admin',    email: 'admin@ieg.com',     pw: 'Admin@1234'  },
                { label: 'Exporter',email: 'exporter1@ieg.com', pw: 'Export@1234' },
                { label: 'Buyer',   email: 'buyer1@ieg.com',    pw: 'Buyer@1234'  },
                { label: 'Shipper', email: 'shipper1@ieg.com',  pw: 'Ship@1234'   },
              ].map((d) => (
                <button key={d.label} onClick={() => quickLogin(d.email, d.pw)}
                  className="btn-ghost text-xs px-3 py-1.5 h-auto">
                  {d.label}
                </button>
              ))}
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="ieg-label">Email Address</label>
              <input className="ieg-input" type="email" placeholder="you@company.com"
                value={form.email} onChange={(e) => setForm(f => ({ ...f, email: e.target.value }))} />
            </div>

            <div>
              <label className="ieg-label">Password</label>
              <div className="relative">
                <input className="ieg-input pr-10" type={show ? 'text' : 'password'} placeholder="••••••••"
                  value={form.password} onChange={(e) => setForm(f => ({ ...f, password: e.target.value }))} />
                <button type="button" onClick={() => setShow(!show)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white transition">
                  {show ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" className="rounded border-white/20 bg-white/5"
                  checked={form.remember} onChange={(e) => setForm(f => ({ ...f, remember: e.target.checked }))} />
                <span className="text-xs text-slate-400">Remember me</span>
              </label>
              <Link to="/auth/forgot-password" className="text-xs text-gold-500 hover:text-gold-400 transition">
                Forgot password?
              </Link>
            </div>

            <button type="submit" disabled={loading}
              className="btn-gold w-full py-3 flex items-center justify-center gap-2 mt-2">
              {loading ? (
                <div className="w-4 h-4 border-2 border-navy-900/30 border-t-navy-900 rounded-full animate-spin" />
              ) : (
                <><Lock size={15} /> Sign In</>
              )}
            </button>
          </form>

          <p className="text-center text-sm text-slate-500 mt-6">
            Don't have an account?{' '}
            <Link to="/auth/register" className="text-gold-500 hover:text-gold-400 font-semibold transition">
              Create account
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}