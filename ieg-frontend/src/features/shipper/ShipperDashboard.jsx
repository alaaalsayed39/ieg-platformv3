import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Truck, Package, CheckCircle, AlertTriangle, Plus } from 'lucide-react'
import StatCard from '../../components/ui/StatCard'
import { useAuthStore } from '../../store/authStore'
import api from '../../config/api'
import Spinner from '../../components/ui/Spinner'

export default function ShipperDashboard() {
  const { user } = useAuthStore()
  const [shipments, setShipments] = useState([])
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      api.get('/shipments?limit=10'),
      api.get('/shipments/stats'),
    ])
      .then(([listRes, statsRes]) => {
        setShipments(listRes.data.data || [])
        setStats(statsRes.data.data)
      })
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <Spinner size="lg" />

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="font-display font-bold text-2xl text-white">Shipper Dashboard</h1>
          <p className="text-slate-400 text-sm mt-0.5">{user?.companyName} · Logistics Overview</p>
        </div>
        <Link to="/shipper/requests" className="btn-gold flex items-center gap-2 text-sm">
          <Plus size={16} /> Review Requests
        </Link>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Active Shipments" value={stats?.active ?? 0} icon={Truck} variant="gold" />
        <StatCard label="Awaiting Pickup" value={stats?.pickup ?? 0} icon={Package} variant="navy" />
        <StatCard label="Delivered" value={stats?.delivered ?? 0} icon={CheckCircle} variant="dark" />
        <StatCard label="Delayed" value={stats?.delayed ?? 0} icon={AlertTriangle} variant="dark" />
      </div>

      <div className="ieg-card p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-display font-bold text-white">Active Containers</h3>
          <Link to="/shipper/tracking" className="text-xs text-gold-500 hover:underline">View all →</Link>
        </div>
        <div className="space-y-2">
          {shipments.slice(0, 5).map((s) => (
            <div key={s._id} className="flex items-center justify-between p-3 rounded-xl bg-white/3 border border-white/5 hover:border-white/10 transition">
              <div>
                <p className="font-mono text-sm text-gold-500">{s.containerNumber}</p>
                <p className="text-xs text-slate-500">{s.originPort} → {s.destinationPort}</p>
              </div>
              <div className="text-right">
                <p className="text-xs text-slate-400">{s.carrier}</p>
                <span className={`badge mt-1 ${s.status === 'in_transit' ? 'badge-transit' : s.status === 'delivered' ? 'badge-delivered' : s.status === 'delayed' ? 'badge-cancelled' : 'badge-pending'}`}>
                  {s.status?.replace(/_/g, ' ')}
                </span>
              </div>
            </div>
          ))}
          {shipments.length === 0 && (
            <p className="text-center text-slate-500 text-sm py-8">No shipments yet. <Link to="/shipper/create" className="text-gold-500">Create one</Link></p>
          )}
        </div>
      </div>
    </div>
  )
}
