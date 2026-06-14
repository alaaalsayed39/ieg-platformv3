import { useEffect, useState } from 'react'
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts'
import { DollarSign, ShoppingCart, Truck, Users, FileText } from 'lucide-react'
import StatCard from '../../components/ui/StatCard'
import StatusBadge from '../../components/ui/StatusBadge'
import { formatCurrency, formatDate } from '../../utils/format'
import { useAuthStore } from '../../store/authStore'
import api from '../../config/api'
import Spinner from '../../components/ui/Spinner'

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-navy-900 border border-white/10 rounded-xl p-3">
      <p className="text-xs text-slate-400">{label}</p>
      <p className="text-sm font-bold text-gold-500">{formatCurrency(payload[0]?.value)}</p>
    </div>
  )
}

const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']

export default function ExporterDashboard() {
  const { user } = useAuthStore()
  const [stats,  setStats]  = useState(null)
  const [orders, setOrders] = useState([])
  const [docStats, setDocStats] = useState(null)
  const [paymentStats, setPaymentStats] = useState(null)
  const [wallet, setWallet] = useState(null)
  const [revenue,setRevenue]= useState([])
  const [loading,setLoading]= useState(true)

  useEffect(() => {
    Promise.all([
      api.get('/orders/stats'),
      api.get('/orders?limit=5'),
      api.get('/payments/stats'),
      api.get('/payments/wallet'),
      api.get('/documents/stats'),
    ]).then(([s, o, p, w, d]) => {
      setStats(s.data.data)
      setOrders(o.data.data || [])
      setPaymentStats(p.data.data || {})
      setWallet(w.data.data || {})
      setDocStats(d.data.data || {})
      const monthly = p.data.data?.monthly || []
      setRevenue(MONTHS.map((m, i) => ({ month: m, revenue: monthly.find(x => x._id === i+1)?.total || 0 })))
    }).finally(() => setLoading(false))
  }, [])

  // Shipment map simulation
  const shipmentPins = [
    { label: 'USA', lat: 40, lng: -95 }, { label: 'UK', lat: 51, lng: -1 },
    { label: 'Germany', lat: 51, lng: 10 }, { label: 'Japan', lat: 36, lng: 138 },
  ]

  if (loading) return <Spinner size="lg" />

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center gap-3">
        <div>
          <h1 className="font-display font-bold text-2xl text-white">Exporter Dashboard</h1>
          <p className="text-slate-400 text-sm mt-0.5">
            Hello, <span className="text-gold-500">{user?.fullName?.split(' ')[0]}</span> · {user?.companyName}
            {user?.isVerified && <span className="ml-2 text-emerald-400 text-xs">✓ Verified</span>}
          </p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Total Revenue"    value={formatCurrency(stats?.totalRevenue || 0)} icon={DollarSign} variant="gold" />
        <StatCard label="Active Orders"    value={stats?.processing || 0}                   icon={ShoppingCart} variant="navy" />
        <StatCard label="Pending Shipments"value={stats?.shipped || 0}                      icon={Truck}    sublabel="awaiting delivery" variant="dark" />
        <StatCard label="Global Buyers"    value={stats?.uniqueBuyers ?? 0}                  icon={Users}    sublabel="unique buyers" variant="dark" />
      </div>

      {/* Escrow wallet */}
      {wallet && (
        <div className="grid grid-cols-3 gap-3">
          <StatCard label="Available Balance" value={formatCurrency(wallet.availableBalance ?? wallet.balance ?? 0)} icon={DollarSign} variant="gold" sublabel="withdrawable" />
          <StatCard label="Held in Escrow" value={formatCurrency(wallet.heldBalance ?? wallet.pending ?? 0)} icon={Truck} variant="dark" sublabel="not withdrawable until delivery confirmed" />
          <StatCard label="Total Earnings" value={formatCurrency(paymentStats?.totalEarnings ?? 0)} icon={DollarSign} variant="navy" sublabel="released to wallet" />
        </div>
      )}

      {/* Document approval stats */}
      {docStats && (
        <div className="grid grid-cols-3 gap-3">
          {[
            { label: 'Approved Documents', value: docStats.approved ?? docStats.active ?? 0, color: 'text-emerald-400', icon: FileText },
            { label: 'Pending Documents', value: docStats.pending ?? 0, color: 'text-amber-400', icon: FileText },
            { label: 'Rejected Documents', value: docStats.rejected ?? 0, color: 'text-red-400', icon: FileText },
          ].map((s) => (
            <div key={s.label} className="ieg-card p-4 flex items-center justify-between">
              <div>
                <p className="text-xs text-slate-500">{s.label}</p>
                <p className={`font-display font-bold text-xl ${s.color}`}>{s.value}</p>
              </div>
              <s.icon size={20} className={s.color} />
            </div>
          ))}
        </div>
      )}

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
        {/* Revenue chart */}
        <div className="lg:col-span-3 ieg-card p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-display font-bold text-white">Export Revenue</h3>
              <p className="text-xs text-slate-500">12 Months</p>
            </div>
            <div className="flex gap-3 text-xs text-slate-500">
              <span className="flex items-center gap-1"><span className="w-3 h-0.5 bg-gold-500 inline-block" /> Current Year</span>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={180}>
            <AreaChart data={revenue}>
              <defs>
                <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#F5A623" stopOpacity={0.25} />
                  <stop offset="95%" stopColor="#F5A623" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid stroke="rgba(255,255,255,0.04)" />
              <XAxis dataKey="month" tick={{ fill:'#8892a4', fontSize:11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill:'#8892a4', fontSize:11 }} axisLine={false} tickLine={false} tickFormatter={v => v >= 1000 ? `$${v/1000}k` : `$${v}`} />
              <Tooltip content={<CustomTooltip />} />
              <Area type="monotone" dataKey="revenue" stroke="#F5A623" strokeWidth={2} fill="url(#revGrad)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Shipment world map */}
        <div className="lg:col-span-2 ieg-card p-5">
          <h3 className="font-display font-bold text-white mb-1">Export Shipment Tracking</h3>
          <p className="text-xs text-slate-500 mb-3">Active buyer countries</p>
          <div className="relative h-44 rounded-xl overflow-hidden bg-navy-900/50 border border-white/5">
            <svg viewBox="0 0 800 400" className="w-full h-full opacity-30">
              <rect width="800" height="400" fill="#0B1437" />
              <ellipse cx="400" cy="200" rx="380" ry="180" fill="none" stroke="#1e3a8a" strokeWidth="1" />
              {[100,200,300,400,500,600,700].map(x => <line key={x} x1={x} y1="20" x2={x} y2="380" stroke="#1e3a8a" strokeWidth="0.5" />)}
              {[80,160,240,320].map(y => <line key={y} x1="20" y1={y} x2="780" y2={y} stroke="#1e3a8a" strokeWidth="0.5" />)}
            </svg>
            {/* Egypt origin */}
            <div className="absolute" style={{ left: '54%', top: '42%' }}>
              <div className="w-3 h-3 rounded-full bg-gold-500 animate-pulse-gold" />
              <span className="text-[9px] text-gold-500 font-bold absolute left-4 -top-1 whitespace-nowrap">Egypt Office</span>
            </div>
            {/* Destination pins */}
            {[
              { label: 'USA',     left: '18%', top: '35%' },
              { label: 'UK',     left: '44%', top: '28%' },
              { label: 'Germany',left: '47%', top: '26%' },
              { label: 'Japan',  left: '80%', top: '32%' },
            ].map(p => (
              <div key={p.label} className="absolute" style={{ left: p.left, top: p.top }}>
                <div className="w-2 h-2 rounded-full bg-blue-400 border border-white/20" />
              </div>
            ))}
          </div>
          <div className="flex flex-wrap gap-2 mt-3">
            {['USA','UK','Germany','Japan','UAE'].map(c => (
              <span key={c} className="text-[10px] bg-white/5 border border-white/10 px-2 py-0.5 rounded-full text-slate-400">{c}</span>
            ))}
          </div>
        </div>
      </div>

      {/* Recent orders */}
      <div className="ieg-card overflow-hidden">
        <div className="flex items-center justify-between p-5 border-b border-white/5">
          <h3 className="font-display font-bold text-white">Recent Orders</h3>
          <a href="/exporter/orders" className="text-xs text-gold-500 hover:text-gold-400 transition">View all →</a>
        </div>
        <div className="overflow-x-auto">
          <table className="ieg-table w-full">
            <thead><tr>
              <th>Order ID</th><th>Product</th><th>Qty</th><th>Buyer</th><th>Status</th><th>Date</th><th>Action</th>
            </tr></thead>
            <tbody>
              {orders.length === 0 ? (
                <tr><td colSpan={7} className="text-center py-12 text-slate-500">No orders yet</td></tr>
              ) : orders.map(o => (
                <tr key={o._id}>
                  <td className="font-mono text-xs text-gold-500">{o.orderNumber}</td>
                  <td className="text-sm text-slate-300 max-w-[160px] truncate">{o.productName}</td>
                  <td className="text-sm">{o.quantity} {o.unit}</td>
                  <td className="text-sm text-slate-400">{o.buyerId?.companyName || o.buyerId?.fullName || '—'}</td>
                  <td><StatusBadge status={o.status} /></td>
                  <td className="text-xs text-slate-500">{formatDate(o.createdAt)}</td>
                  <td><a href={`/exporter/orders`} className="text-xs text-gold-500 hover:text-gold-400 transition">View</a></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
