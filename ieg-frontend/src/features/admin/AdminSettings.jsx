import { useState, useEffect } from 'react'
import { Save, Key, Mail, DollarSign, Shield } from 'lucide-react'
import PageHeader from '../../components/ui/PageHeader'
import api from '../../config/api'
import toast from 'react-hot-toast'
import Spinner from '../../components/ui/Spinner'

export default function AdminSettings() {
  const [settings, setSettings] = useState(null)
  const [loading,  setLoading]  = useState(true)

  useEffect(() => {
    api.get('/admin/settings').then(r => { setSettings(r.data.data); setLoading(false) }).catch(() => setLoading(false))
  }, [])

  if (loading) return <Spinner size="lg" />

  const Section = ({ icon: Icon, title, children }) => (
    <div className="ieg-card p-5">
      <div className="flex items-center gap-2 mb-4 pb-3 border-b border-white/5">
        <div className="w-8 h-8 rounded-xl bg-gold-500/10 flex items-center justify-center">
          <Icon size={16} className="text-gold-500" />
        </div>
        <h3 className="font-display font-bold text-white">{title}</h3>
      </div>
      {children}
    </div>
  )

  const Toggle = ({ label, checked, onChange }) => (
    <div className="flex items-center justify-between py-3 border-b border-white/5 last:border-0">
      <span className="text-sm text-slate-300">{label}</span>
      <button onClick={() => onChange(!checked)}
        className={`w-11 h-6 rounded-full transition-colors relative ${checked ? 'bg-gold-500' : 'bg-white/15'}`}>
        <div className={`w-4 h-4 rounded-full bg-white absolute top-1 transition-all ${checked ? 'left-6' : 'left-1'}`} />
      </button>
    </div>
  )

  return (
    <div className="space-y-5 animate-fade-in max-w-3xl">
      <PageHeader title="Platform Settings" />

      <Section icon={Mail} title="SMTP Email Configuration">
        <div className="space-y-3">
          {[['SMTP Host','smtp.gmail.com'],['SMTP Port','587'],['SMTP Username',''],['SMTP Password','']].map(([label, placeholder]) => (
            <div key={label}>
              <label className="ieg-label">{label}</label>
              <input className="ieg-input" placeholder={placeholder} type={label.includes('Password') ? 'password' : 'text'}
                defaultValue={placeholder} />
            </div>
          ))}
        </div>
      </Section>

      <Section icon={DollarSign} title="Payment Gateway">
        <div className="space-y-3">
          <div>
            <label className="ieg-label">Platform Fee (%)</label>
            <input className="ieg-input w-32" type="number" step="0.1" defaultValue={settings?.platformFeePercent || 2.5} />
          </div>
          <Toggle label="Enable Platform Fees" checked={true} onChange={() => {}} />
        </div>
      </Section>

      <Section icon={Shield} title="Security">
        <div>
          <Toggle label="Enable Two-Factor Authentication" checked={settings?.twoFactorEnabled || false} onChange={() => toast.success('Setting updated')} />
          <Toggle label="Maintenance Mode" checked={settings?.maintenanceMode || false} onChange={() => toast.success('Setting updated')} />
        </div>
      </Section>

      <Section icon={Key} title="API Configuration">
        <div className="space-y-3">
          <div>
            <label className="ieg-label">API Key (read-only)</label>
            <div className="flex gap-2">
              <input className="ieg-input font-mono text-xs" readOnly value="ieg_sk_live_••••••••••••••••" />
              <button className="btn-ghost text-sm px-3">Copy</button>
            </div>
          </div>
        </div>
      </Section>

      <div className="flex justify-end">
        <button onClick={() => toast.success('Settings saved successfully')} className="btn-gold flex items-center gap-2">
          <Save size={15} /> Save All Settings
        </button>
      </div>
    </div>
  )
}
