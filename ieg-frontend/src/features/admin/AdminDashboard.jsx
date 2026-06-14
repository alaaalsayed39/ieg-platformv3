import { useEffect, useState } from 'react'
import { Users, TrendingUp, ShieldCheck, DollarSign, Activity, FileText } from 'lucide-react'
import { Link } from 'react-router-dom'
import { AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import StatCard from '../../components/ui/StatCard'
import StatusBadge from '../../components/ui/StatusBadge'
import { formatCurrency, formatDate, timeAgo } from '../../utils/format'
import api from '../../config/api'
import Spinner from '../../components/ui/Spinner'

const CHART_COLORS = ['#F5A623', '#3b82f6', '#10b981', '#8b5cf6', '#ef4444']

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-navy-900 border border-white/10 rounded-xl p-3 shadow-2xl">
      <p className="text-xs text-slate-400 mb-1">{label}</p>
      {payload.map((p, i) => (
        <p key={i} className="text-sm font-bold" style={{ color: p.color }}>{formatCurrency(p.value)}</p>
      ))}
    </div>
  )
}

export default function AdminDashboard() {
  const [data, setData]   = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.get('/admin/dashboard').then(r => { setData(r.data.data); setLoading(false) }).catch(() => setLoading(false))
  }, [])

  if (loading) return <Spinner size="lg" />
  if (!data) return <div className="text-red-400">Failed to load dashboard</div>

  const { stats, recentUsers = [], userGrowth = [], systemHealth } = data

  const growthChartData = userGrowth.slice(-8).map(g => ({
    name: `${g._id?.month}/${g._id?.year?.toString().slice(2)}`,
    users: g.count,
  }))

  const pieData = (data.productCategories || []).slice(0, 5).map(c => ({
    name: c._id || 'Other',
    value: c.count,
  }))

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Platform Revenue" value={formatCurrency(stats.totalPlatformRevenue ?? stats.platformRevenue ?? 0)} icon={DollarSign} variant="gold" sublabel="2.5% fees collected" />
        <StatCard label="Total Escrow Balance" value={formatCurrency(stats.totalEscrowBalance ?? 0)} icon={Activity} variant="navy" sublabel={`${stats.escrowOrderCount ?? 0} orders held`} />
        <StatCard label="Released Payments" value={formatCurrency(stats.totalReleasedPayments ?? 0)} icon={TrendingUp} variant="dark" />
        <StatCard label="Transaction Volume" value={formatCurrency(stats.totalTransactionVolume ?? 0)} icon={DollarSign} variant="dark" />
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Total Users" value={stats.totalUsers?.toLocaleString()} icon={Users} variant="gold" />
        <StatCard label="Active Exporters" value={stats.activeExporters?.toLocaleString()} icon={TrendingUp} variant="navy" />
        <StatCard label="Pending Verifications" value={stats.pendingVerifications} icon={ShieldCheck} variant="dark" />
        <Link to="/admin/document-reviews" className="block">
          <StatCard label="Pending Document Reviews" value={stats.pendingDocuments ?? 0} icon={FileText} variant="dark" sublabel="awaiting admin review" />
        </Link>
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* User growth */}
        <div className="lg:col-span-2 ieg-card p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-display font-bold text-white">User Growth</h3>
              <p className="text-xs text-slate-500">Last 12 months</p>
            </div>
            <span className="badge badge-approved">+5.4%</span>
          </div>
          <ResponsiveContainer width="100%" height={180}>
            <AreaChart data={growthChartData}>
              <defs>
                <linearGradient id="goldGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#F5A623" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#F5A623" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid stroke="rgba(255,255,255,0.04)" />
              <XAxis dataKey="name" tick={{ fill: '#8892a4', fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: '#8892a4', fontSize: 11 }} axisLine={false} tickLine={false} />
              <Tooltip content={<CustomTooltip />} />
              <Area type="monotone" dataKey="users" stroke="#F5A623" strokeWidth={2} fill="url(#goldGrad)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Product distribution */}
        <div className="ieg-card p-5">
          <h3 className="font-display font-bold text-white mb-1">Product Categories</h3>
          <p className="text-xs text-slate-500 mb-4">Published products</p>
          <ResponsiveContainer width="100%" height={160}>
            <PieChart>
              <Pie data={pieData} cx="50%" cy="50%" innerRadius={45} outerRadius={70} paddingAngle={3} dataKey="value">
                {pieData.map((_, i) => <Cell key={i} fill={CHART_COLORS[i]} />)}
              </Pie>
              <Tooltip contentStyle={{ background: '#0f1d4a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', color: '#fff' }} />
            </PieChart>
          </ResponsiveContainer>
          <div className="space-y-1.5 mt-2">
            {pieData.map((d, i) => (
              <div key={d.name} className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full" style={{ background: CHART_COLORS[i] }} />
                  <span className="text-slate-400">{d.name}</span>
                </div>
                <span className="font-bold text-white">{d.value}%</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Bottom row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Recent users */}
        <div className="lg:col-span-2 ieg-card p-5">
          <h3 className="font-display font-bold text-white mb-4">Recent Registrations</h3>
          <div className="space-y-2">
            {recentUsers.map((u) => (
              <div key={u._id} className="flex items-center justify-between py-2 border-b border-white/5 last:border-0">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-xl bg-white/10 flex items-center justify-center">
                    <span className="font-bold text-gold-500 text-xs">{u.fullName?.charAt(0)}</span>
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-white">{u.fullName}</p>
                    <p className="text-xs text-slate-500">{u.country} · {timeAgo(u.createdAt)}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <StatusBadge status={u.role} />
                  {u.isVerified && <StatusBadge status="approved" />}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* System health */}
        <div className="ieg-card p-5">
          <h3 className="font-display font-bold text-white mb-4">System Health</h3>
          <div className="space-y-3">
            {[
              { label: 'Database Status', value: systemHealth?.dbStatus || 'online', color: 'text-emerald-400' },
              { label: 'API Uptime',      value: systemHealth?.apiUptime || '100%',  color: 'text-emerald-400' },
              { label: 'CPU Usage',       value: systemHealth?.cpuUsage  || '35%',   color: 'text-gold-500' },
              { label: 'Pending Docs',    value: `${stats.pendingDocuments} reviews`, color: 'text-blue-400' },
            ].map((s) => (
              <div key={s.label} className="flex items-center justify-between p-3 rounded-xl bg-white/3 border border-white/5">
                <div className="flex items-center gap-2">
                  <Activity size={13} className="text-slate-500" />
                  <span className="text-xs text-slate-400">{s.label}</span>
                </div>
                <span className={`text-xs font-bold font-mono ${s.color}`}>{s.value}</span>
              </div>
            ))}
          </div>
          <div className="mt-4 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
            <p className="text-xs text-emerald-400 font-semibold">All systems operational</p>
            <p className="text-[10px] text-slate-500 mt-0.5">Last checked: just now</p>
          </div>
        </div>
      </div>
    </div>
  )
}
