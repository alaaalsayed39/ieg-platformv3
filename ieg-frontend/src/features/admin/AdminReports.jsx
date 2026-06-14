import { useEffect, useState } from 'react'
import { BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts'
import PageHeader from '../../components/ui/PageHeader'
import { formatCurrency } from '../../utils/format'
import api from '../../config/api'
import Spinner from '../../components/ui/Spinner'

const COLORS = ['#F5A623','#3b82f6','#10b981','#8b5cf6','#ef4444','#f59e0b']
const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']

export default function AdminReports() {
  const [data,    setData]    = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.get('/admin/reports').then(r => setData(r.data.data)).finally(() => setLoading(false))
  }, [])

  if (loading) return <Spinner size="lg" />

  const revenueData = MONTHS.map((m, i) => ({
    month: m,
    revenue: data?.monthlyRevenue?.find(x => x._id === i+1)?.total || 0,
  }))

  const regionData = (data?.revenueByRegion || []).slice(0,8)
  const catData    = data?.productCategories || []

  return (
    <div className="space-y-5 animate-fade-in">
      <PageHeader title="Platform Reports" subtitle="Revenue analytics and export performance" />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Revenue by region */}
        <div className="ieg-card p-5">
          <h3 className="font-display font-bold text-white mb-4">Export Revenue by Region</h3>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={regionData} layout="vertical" barSize={16}>
              <CartesianGrid stroke="rgba(255,255,255,0.04)" horizontal={false} />
              <XAxis type="number" tick={{ fill:'#8892a4',fontSize:10 }} axisLine={false} tickLine={false} tickFormatter={v => `$${(v/1000).toFixed(0)}k`} />
              <YAxis type="category" dataKey="_id" tick={{ fill:'#8892a4',fontSize:10 }} axisLine={false} tickLine={false} width={30} />
              <Tooltip contentStyle={{ background:'#0f1d4a',border:'1px solid rgba(255,255,255,0.1)',borderRadius:'8px',color:'#fff',fontSize:'11px' }}
                formatter={v => [formatCurrency(v), 'Revenue']} />
              <Bar dataKey="revenue" radius={[0,4,4,0]}>
                {regionData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Product categories */}
        <div className="ieg-card p-5">
          <h3 className="font-display font-bold text-white mb-4">Product Categories</h3>
          <div className="flex items-center gap-4">
            <ResponsiveContainer width={180} height={180}>
              <PieChart>
                <Pie data={catData} cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={3} dataKey="count">
                  {catData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
                <Tooltip contentStyle={{ background:'#0f1d4a',border:'1px solid rgba(255,255,255,0.1)',borderRadius:'8px',color:'#fff',fontSize:'11px' }} />
              </PieChart>
            </ResponsiveContainer>
            <div className="space-y-2 flex-1">
              {catData.slice(0,6).map((d, i) => (
                <div key={d._id} className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full" style={{ background: COLORS[i % COLORS.length] }} />
                    <span className="text-slate-400">{d._id}</span>
                  </div>
                  <span className="font-bold text-white">{d.count}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Monthly revenue line chart */}
      <div className="ieg-card p-5">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="font-display font-bold text-white">Monthly Revenue</h3>
            <p className="text-xs text-slate-500">Platform-wide income for {new Date().getFullYear()}</p>
          </div>
          <div className="flex items-center gap-2 text-xs text-emerald-400 font-bold bg-emerald-500/10 border border-emerald-500/20 px-3 py-1.5 rounded-xl">
            Platform Growth +15%
          </div>
        </div>
        <ResponsiveContainer width="100%" height={200}>
          <LineChart data={revenueData}>
            <CartesianGrid stroke="rgba(255,255,255,0.04)" />
            <XAxis dataKey="month" tick={{fill:'#8892a4',fontSize:11}} axisLine={false} tickLine={false} />
            <YAxis tick={{fill:'#8892a4',fontSize:11}} axisLine={false} tickLine={false} tickFormatter={v => v >= 1000 ? `$${v/1000}k` : `$${v}`} />
            <Tooltip contentStyle={{background:'#0f1d4a',border:'1px solid rgba(255,255,255,0.1)',borderRadius:'8px',color:'#fff',fontSize:'11px'}}
              formatter={v => [formatCurrency(v), 'Revenue']} />
            <Line type="monotone" dataKey="revenue" stroke="#F5A623" strokeWidth={2.5} dot={{ fill:'#F5A623', r:3 }} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
