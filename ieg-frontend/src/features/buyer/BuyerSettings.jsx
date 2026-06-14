import { useState, useEffect } from 'react'
import { useAuthStore } from '../../store/authStore'
import PageHeader from '../../components/ui/PageHeader'
import { formatCurrency } from '../../utils/format'
import api from '../../config/api'
import toast from 'react-hot-toast'

export default function BuyerSettings() {
  const { user, setUser } = useAuthStore()
  const [form, setForm] = useState({
    fullName: user?.fullName || '',
    companyName: user?.companyName || '',
    phone: user?.phone || '',
    country: user?.country || '',
  })
  const [wallet, setWallet] = useState(null)
  const [depositAmount, setDepositAmount] = useState('10000')
  const [saving, setSaving] = useState(false)
  const [depositing, setDepositing] = useState(false)

  useEffect(() => {
    api.get('/payments/wallet').then((r) => setWallet(r.data.data)).catch(() => {})
  }, [])

  const handleSave = async (e) => {
    e.preventDefault()
    setSaving(true)
    try {
      const { data } = await api.put('/users/profile', form)
      setUser(data.data)
      toast.success('Profile updated')
    } catch (err) {
      toast.error(err.response?.data?.message || 'Update failed')
    } finally {
      setSaving(false)
    }
  }

  const handleDeposit = async () => {
    const amount = Number(depositAmount)
    if (!amount || amount <= 0) return toast.error('Enter a valid amount')
    setDepositing(true)
    try {
      await api.post('/payments/deposit', { amount, description: 'Wallet top-up for order payments' })
      const { data } = await api.get('/payments/wallet')
      setWallet(data.data)
      toast.success(`Added ${formatCurrency(amount)} to wallet`)
    } catch (err) {
      toast.error(err.response?.data?.message || 'Deposit failed')
    } finally {
      setDepositing(false)
    }
  }

  return (
    <div className="space-y-5 animate-fade-in max-w-xl">
      <PageHeader title="Account Settings" subtitle="Manage your buyer profile and wallet" />

      <div className="ieg-card p-6">
        <h3 className="font-display font-bold text-white mb-1">Escrow Wallet</h3>
        <p className="text-xs text-slate-500 mb-4">Funds are held in escrow when you pay for orders.</p>
        <p className="font-display font-bold text-3xl text-gold-500 mb-4">{formatCurrency(wallet?.balance ?? user?.walletBalance ?? 0)}</p>
        <div className="flex gap-2">
          <input
            type="number"
            min="1"
            className="ieg-input flex-1"
            value={depositAmount}
            onChange={(e) => setDepositAmount(e.target.value)}
            placeholder="Amount USD"
          />
          <button type="button" onClick={handleDeposit} disabled={depositing} className="btn-gold px-4">
            {depositing ? 'Adding...' : 'Add Funds'}
          </button>
        </div>
        <p className="text-[10px] text-slate-600 mt-2">New accounts receive starter credit. Add more funds here if needed.</p>
      </div>

      <form onSubmit={handleSave} className="ieg-card p-6 space-y-4">
        <div>
          <label className="ieg-label">Full Name</label>
          <input className="ieg-input" value={form.fullName} onChange={(e) => setForm((f) => ({ ...f, fullName: e.target.value }))} required />
        </div>
        <div>
          <label className="ieg-label">Company</label>
          <input className="ieg-input" value={form.companyName} onChange={(e) => setForm((f) => ({ ...f, companyName: e.target.value }))} />
        </div>
        <div>
          <label className="ieg-label">Phone</label>
          <input className="ieg-input" value={form.phone} onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))} />
        </div>
        <div>
          <label className="ieg-label">Country</label>
          <input className="ieg-input" value={form.country} onChange={(e) => setForm((f) => ({ ...f, country: e.target.value }))} />
        </div>
        <button type="submit" className="btn-gold" disabled={saving}>{saving ? 'Saving...' : 'Save Changes'}</button>
      </form>
    </div>
  )
}
