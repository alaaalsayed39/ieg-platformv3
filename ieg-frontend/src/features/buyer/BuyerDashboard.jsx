import { useEffect, useState } from 'react'
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts'
import { Zap, DollarSign, Truck, Bookmark, Plus } from 'lucide-react'
import StatCard from '../../components/ui/StatCard'
import StatusBadge from '../../components/ui/StatusBadge'
import { formatCurrency } from '../../utils/format'
import { useAuthStore } from '../../store/authStore'
import { useNavigate } from 'react-router-dom'
import api, { getAssetUrl } from '../../config/api'
import Spinner from '../../components/ui/Spinner'

const PIE_COLORS = ['#F5A623','#3b82f6','#10b981','#8b5cf6','#ef4444']

export default function BuyerDashboard() {
  const { user }   = useAuthStore()
  const navigate   = useNavigate()
  const [stats, setStats]   = useState(null)
  const [orders, setOrders] = useState([])
  const [products, setProducts] = useState([])
  const [insight, setInsight] = useState('')
  const [categoryData, setCategoryData] = useState([])
  const [loading, setLoading] = useState(true)

  const [wallet, setWallet] = useState(null)
  const [paymentStats, setPaymentStats] = useState(null)

  useEffect(() => {
    Promise.all([
      api.get('/orders/stats'),
      api.get('/orders?limit=5'),
      api.get('/recommendations/products'),
      api.get('/payments/wallet'),
      api.get('/payments/stats'),
    ])
      .then(([s, o, rec, w, p]) => {
        setStats(s.data.data)
        setOrders(o.data.data || [])
        setWallet(w.data.data || {})
        setPaymentStats(p.data.data || {})
        const recData = rec.data.data || {}
        setProducts(recData.products || [])
        setInsight(recData.insight || '')
        const cats = {}
        ;(recData.products || []).forEach((pr) => { cats[pr.category] = (cats[pr.category] || 0) + 1 })
        const total = Object.values(cats).reduce((a, b) => a + b, 0) || 1
        setCategoryData(Object.entries(cats).map(([name, count]) => ({
          name, value: Math.round((count / total) * 100),
        })))
      })
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <Spinner size="lg" />

  const activity = orders.slice(0, 3).map(o => ({
    time: new Date(o.updatedAt || o.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    text: `Order ${o.orderNumber} — ${o.status}`,
    color: o.status === 'delivered' ? 'bg-emerald-500' : o.status === 'shipped' ? 'bg-blue-400' : 'bg-gold-500',
  }))

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="font-display font-bold text-2xl text-white">Welcome back, <span className="text-gold-500">{user?.fullName?.split(' ')[0]}</span></h1>
        <p className="text-slate-400 text-sm mt-0.5">Here's what you need to know about your latest orders.</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Wallet Balance" value={formatCurrency(wallet?.availableBalance ?? wallet?.balance ?? 0)} icon={DollarSign} variant="gold" />
        <StatCard label="Total Payments" value={formatCurrency(paymentStats?.totalPayments ?? 0)} icon={DollarSign} variant="navy" />
        <StatCard label="Refunds Received" value={formatCurrency(paymentStats?.totalRefunds ?? 0)} icon={Bookmark} variant="dark" />
        <StatCard label="Active Orders" value={stats?.processing ?? 0} icon={Zap} variant="dark" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="ieg-card p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-display font-bold text-white">AI Recommendations</h3>
            <p className="text-[10px] text-slate-500 mt-0.5">{insight || 'Personalized for your country'}</p>
            <button onClick={() => navigate('/buyer/marketplace')} className="text-xs text-gold-500 hover:text-gold-400 transition">View all</button>
          </div>
          <div className="grid grid-cols-2 gap-3">
            {products.map(p => (
              <div key={p._id} className="ieg-card p-0 overflow-hidden cursor-pointer hover:border-gold-500/30 transition group"
                onClick={() => navigate(`/buyer/marketplace/${p._id}`)}>
                <div className="h-28 overflow-hidden">
                  <img src={getAssetUrl(p.images?.[0]?.url) || 'https://images.unsplash.com/photo-1605000797499-95a51c5269ae?w=300'} alt={p.nameEn}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                </div>
                <div className="p-2.5">
                  <p className="text-xs font-semibold text-white truncate">{p.nameEn}</p>
                  <p className="text-[10px] text-slate-500">{p.category}</p>
                  {p.recommendationReasons?.[0] && (
                    <p className="text-[9px] text-gold-500/80 mt-1 line-clamp-2">{p.recommendationReasons[0]}</p>
                  )}
                </div>
              </div>
            ))}
            {products.length === 0 && <p className="text-slate-500 text-sm col-span-2">No products available</p>}
          </div>
        </div>

        <div className="ieg-card overflow-hidden">
          <div className="flex items-center justify-between p-4 border-b border-white/5">
            <h3 className="font-display font-bold text-white text-sm">Recent Orders</h3>
            <button onClick={() => navigate('/buyer/orders')} className="text-xs text-gold-500">View all</button>
          </div>
          <div className="divide-y divide-white/5">
            {orders.slice(0, 4).map(o => (
              <div key={o._id} className="flex items-center justify-between px-4 py-3">
                <div>
                  <p className="text-xs font-mono text-gold-500">{o.orderNumber}</p>
                  <p className="text-xs text-slate-400 mt-0.5">{o.productName}</p>
                </div>
                <div className="flex items-center gap-3">
                  <StatusBadge status={o.status} />
                  <span className="text-xs font-bold text-white">{formatCurrency(o.totalValueUsd)}</span>
                </div>
              </div>
            ))}
            {orders.length === 0 && (
              <div className="p-8 text-center">
                <p className="text-slate-500 text-sm">No orders yet</p>
                <button onClick={() => navigate('/buyer/marketplace')} className="btn-gold mt-3 text-sm flex items-center gap-2 mx-auto">
                  <Plus size={14} /> Browse Marketplace
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {categoryData.length > 0 && (
          <div className="ieg-card p-5">
            <h3 className="font-display font-bold text-white mb-1">Market Insights</h3>
            <p className="text-xs text-slate-500 mb-4">Product categories in marketplace</p>
            <div className="flex items-center gap-4">
              <ResponsiveContainer width={140} height={140}>
                <PieChart>
                  <Pie data={categoryData} cx="50%" cy="50%" innerRadius={40} outerRadius={65} paddingAngle={3} dataKey="value">
                    {categoryData.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                  </Pie>
                  <Tooltip contentStyle={{ background: '#0f1d4a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', color: '#fff', fontSize: '11px' }} />
                </PieChart>
              </ResponsiveContainer>
              <div className="space-y-2 flex-1">
                {categoryData.map((d, i) => (
                  <div key={d.name} className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full" style={{ background: PIE_COLORS[i % PIE_COLORS.length] }} />
                      <span className="text-slate-400">{d.name}</span>
                    </div>
                    <span className="font-bold text-white">{d.value}%</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        <div className="ieg-card p-5">
          <h3 className="font-display font-bold text-white mb-4">Recent Activity</h3>
          <div className="space-y-3">
            {activity.length > 0 ? activity.map((a, i) => (
              <div key={i} className="flex items-center gap-3">
                <div className={`w-2.5 h-2.5 rounded-full ${a.color} flex-shrink-0`} />
                <div className="flex-1 flex items-center justify-between">
                  <p className="text-xs text-slate-300">{a.text}</p>
                  <p className="text-[10px] text-slate-600">{a.time}</p>
                </div>
              </div>
            )) : (
              <p className="text-slate-500 text-sm">No recent activity</p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
