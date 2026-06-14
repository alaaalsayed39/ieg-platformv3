import { useState, useEffect } from 'react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { ArrowUpRight, ArrowDownLeft, Download } from 'lucide-react'
import StatusBadge from '../../components/ui/StatusBadge'
import PageHeader  from '../../components/ui/PageHeader'
import Modal from '../../components/ui/Modal'
import { formatCurrency, formatDate } from '../../utils/format'
import api from '../../config/api'
import toast from 'react-hot-toast'
import Spinner from '../../components/ui/Spinner'

const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']

export default function ExporterWallet() {
  const [wallet, setWallet]    = useState(null)
  const [txns,   setTxns]      = useState([])
  const [stats,  setStats]     = useState([])
  const [loading,setLoading]   = useState(true)
  const [modal,  setModal]     = useState(null) // 'withdraw' | 'deposit'
  const [amount, setAmount]    = useState('')

  const load = async () => {
    setLoading(true)
    try {
      const [w, t, s] = await Promise.all([
        api.get('/payments/wallet'),
        api.get('/payments/transactions?limit=20'),
        api.get('/payments/stats'),
      ])
      setWallet(w.data.data)
      setTxns(t.data.data || [])
      const monthly = s.data.data?.monthly || []
      setStats(MONTHS.map((m, i) => ({ month: m, total: monthly.find(x => x._id === i+1)?.total || 0 })))
    } catch { toast.error('Failed to load wallet') }
    finally { setLoading(false) }
  }

  useEffect(() => { load() }, [])

  const handleAction = async () => {
    if (!amount || Number(amount) <= 0) return toast.error('Enter a valid amount')
    try {
      const endpoint = modal === 'withdraw' ? '/payments/withdraw' : '/payments/deposit'
      await api.post(endpoint, { amount: Number(amount), description: modal === 'withdraw' ? 'Bank transfer request' : 'Funds added' })
      toast.success(modal === 'withdraw' ? 'Withdrawal submitted' : 'Funds added')
      setModal(null); setAmount(''); load()
    } catch (err) { toast.error(err.response?.data?.message || 'Failed') }
  }

  if (loading) return <Spinner size="lg" />

  return (
    <div className="space-y-5 animate-fade-in">
      <PageHeader title="Wallet & Payments" />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Balance card */}
        <div className="lg:col-span-2 ieg-card p-6" style={{ background: 'linear-gradient(135deg, #1e3a8a 0%, #0B1437 100%)' }}>
          <p className="text-xs text-slate-400 font-display uppercase tracking-wider mb-1">Available Balance</p>
          <p className="font-display font-bold text-4xl text-white mb-4">{formatCurrency(wallet?.availableBalance ?? wallet?.balance ?? 0)}</p>
          <div className="grid grid-cols-3 gap-3 mb-5">
            {[
              { label: 'Held in Escrow', value: formatCurrency(wallet?.heldBalance ?? wallet?.pending ?? 0), color: 'text-amber-400' },
              { label: 'Total Earnings', value: formatCurrency(stats.reduce((a, b) => a + b.total, 0)), color: 'text-emerald-400' },
              { label: 'Available to Withdraw', value: formatCurrency(wallet?.availableBalance ?? wallet?.balance ?? 0), color: 'text-blue-400' },
            ].map(s => (
              <div key={s.label}>
                <p className="text-xs text-slate-500">{s.label}</p>
                <p className={`font-bold text-sm mt-0.5 ${s.color}`}>{s.value}</p>
              </div>
            ))}
          </div>
          <div className="flex gap-3">
            <button onClick={() => setModal('withdraw')} className="btn-gold flex items-center gap-2 text-sm" title="Only available balance can be withdrawn">
              <ArrowUpRight size={14} /> Withdraw
            </button>
            <button onClick={() => setModal('deposit')} className="btn-ghost flex items-center gap-2 text-sm">
              <ArrowDownLeft size={14} /> Add Funds
            </button>
          </div>
        </div>

        {/* Bank account */}
        <div className="ieg-card p-5">
          <h3 className="font-display font-bold text-white mb-3">Bank Account Linked</h3>
          {wallet?.bankName ? (
            <div className="space-y-2">
              <div className="p-3 rounded-xl bg-white/5 border border-white/8">
                <p className="text-sm font-semibold text-white">{wallet.bankName}</p>
                <p className="text-xs text-slate-500 font-mono mt-1">
                  {wallet.bankAccount ? `••••${wallet.bankAccount.slice(-4)}` : 'No account number'}
                </p>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-slate-500">Balance</span>
                <span className="font-bold text-white">{formatCurrency(wallet.balance)}</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-emerald-400" />
                <span className="text-xs text-emerald-400">Active</span>
              </div>
            </div>
          ) : (
            <div className="text-center py-6">
              <p className="text-sm text-slate-500 mb-3">No bank account linked</p>
              <button className="btn-ghost text-sm">Link Account</button>
            </div>
          )}
        </div>
      </div>

      {/* Revenue chart + transactions */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
        <div className="lg:col-span-3 ieg-card p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-display font-bold text-white">Revenue by Month</h3>
            <button className="btn-ghost flex items-center gap-1 text-xs"><Download size={12} /> Download</button>
          </div>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={stats} barSize={24}>
              <CartesianGrid stroke="rgba(255,255,255,0.04)" />
              <XAxis dataKey="month" tick={{ fill:'#8892a4', fontSize:11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill:'#8892a4', fontSize:11 }} axisLine={false} tickLine={false} tickFormatter={v => v >= 1000 ? `$${v/1000}k` : `$${v}`} />
              <Tooltip contentStyle={{ background: '#0f1d4a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', color: '#fff', fontSize: '12px' }} />
              <Bar dataKey="total" fill="#F5A623" radius={[4,4,0,0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Transactions */}
        <div className="lg:col-span-2 ieg-card overflow-hidden">
          <div className="p-4 border-b border-white/5">
            <h3 className="font-display font-bold text-white text-sm">Recent Transactions</h3>
          </div>
          <div className="overflow-y-auto max-h-64">
            {txns.map((t) => (
              <div key={t._id} className="flex items-center gap-3 p-3 border-b border-white/5 last:border-0 hover:bg-white/2 transition">
                <div className={`w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 ${t.type === 'income' ? 'bg-emerald-500/15' : 'bg-red-500/15'}`}>
                  {t.type === 'income' ? <ArrowDownLeft size={14} className="text-emerald-400" /> : <ArrowUpRight size={14} className="text-red-400" />}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-white truncate">{t.description}</p>
                  <p className="text-[10px] text-slate-500">{formatDate(t.createdAt)}</p>
                </div>
                <div className="text-right flex-shrink-0">
                  <p className={`text-sm font-bold ${t.amountUsd >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                    {t.amountUsd >= 0 ? '+' : ''}{formatCurrency(Math.abs(t.amountUsd))}
                  </p>
                  <StatusBadge status={t.status} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Modal */}
      <Modal isOpen={!!modal} onClose={() => { setModal(null); setAmount('') }} title={modal === 'withdraw' ? 'Withdraw Funds' : 'Add Funds'}>
        <div className="space-y-4">
          <div>
            <label className="ieg-label">Amount (USD)</label>
            <input className="ieg-input text-xl font-bold" type="number" min="1" placeholder="0.00"
              value={amount} onChange={e => setAmount(e.target.value)} />
          </div>
          {modal === 'withdraw' && wallet?.bankName && (
            <div className="p-3 rounded-xl bg-white/5 border border-white/8 text-sm">
              <p className="text-slate-400">Will be sent to: <span className="text-white font-semibold">{wallet.bankName}</span></p>
            </div>
          )}
          <div className="flex gap-3 pt-2">
            <button onClick={() => { setModal(null); setAmount('') }} className="btn-ghost flex-1">Cancel</button>
            <button onClick={handleAction} className="btn-gold flex-1">
              {modal === 'withdraw' ? 'Withdraw' : 'Add Funds'}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
