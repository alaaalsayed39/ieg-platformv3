import { useState, useEffect, useCallback } from 'react'
import { UserX, UserCheck } from 'lucide-react'
import DataTable from '../../components/ui/DataTable'
import SearchBar  from '../../components/ui/SearchBar'
import StatusBadge from '../../components/ui/StatusBadge'
import PageHeader from '../../components/ui/PageHeader'
import { formatDate } from '../../utils/format'
import api from '../../config/api'
import toast from 'react-hot-toast'

export default function AdminUsers() {
  const [users, setUsers]   = useState([])
  const [total, setTotal]   = useState(0)
  const [page,  setPage]    = useState(1)
  const [loading, setLoading] = useState(true)
  const [search,  setSearch]  = useState('')
  const [roleFilter, setRoleFilter] = useState('')

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({ page, limit: 10 })
      if (search)     params.append('q', search)
      if (roleFilter) params.append('role', roleFilter)
      const { data } = await api.get(`/admin/users?${params}`)
      setUsers(data.data)
      setTotal(data.pagination.total)
    } catch { toast.error('Failed to load users') }
    finally { setLoading(false) }
  }, [page, search, roleFilter])

  useEffect(() => { load() }, [load])

  const toggleStatus = async (userId, isActive) => {
    try {
      await api.patch(`/admin/users/${userId}`, { isActive: !isActive })
      toast.success(`User ${isActive ? 'suspended' : 'activated'}`)
      load()
    } catch { toast.error('Failed to update user') }
  }

  const verify = async (userId) => {
    try {
      await api.patch(`/admin/users/${userId}`, { isVerified: true })
      toast.success('User verified')
      load()
    } catch { toast.error('Failed to verify user') }
  }

  const columns = [
    {
      key: 'fullName', label: 'User',
      render: (v, row) => (
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-gold-500/20 flex items-center justify-center flex-shrink-0">
            <span className="font-bold text-gold-500 text-xs">{v?.charAt(0)}</span>
          </div>
          <div>
            <p className="font-semibold text-white text-sm">{v}</p>
            <p className="text-xs text-slate-500">{row.email}</p>
          </div>
        </div>
      )
    },
    { key: 'companyName', label: 'Company', render: v => <span className="text-sm text-slate-300">{v || '—'}</span> },
    { key: 'role', label: 'Role', render: v => <StatusBadge status={v} /> },
    { key: 'country', label: 'Country', render: v => <span className="font-mono text-xs text-slate-400">{v}</span> },
    { key: 'createdAt', label: 'Joined', render: v => <span className="text-xs text-slate-500">{formatDate(v)}</span> },
    { key: 'isVerified', label: 'KYB', render: v => <StatusBadge status={v ? 'approved' : 'pending'} /> },
    { key: 'isActive',  label: 'Status', render: v => <StatusBadge status={v ? 'active' : 'inactive'} /> },
    {
      key: '_id', label: 'Actions',
      render: (id, row) => (
        <div className="flex items-center gap-1">
          {!row.isVerified && (
            <button onClick={() => verify(id)} title="Verify" className="w-7 h-7 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center hover:bg-emerald-500/20 transition">
              <UserCheck size={13} />
            </button>
          )}
          <button onClick={() => toggleStatus(id, row.isActive)} title={row.isActive ? 'Suspend' : 'Activate'}
            className={`w-7 h-7 rounded-lg flex items-center justify-center transition ${row.isActive ? 'bg-red-500/10 text-red-400 hover:bg-red-500/20' : 'bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20'}`}>
            <UserX size={13} />
          </button>
        </div>
      )
    },
  ]

  return (
    <div className="space-y-5 animate-fade-in">
      <PageHeader title="User Management" />

      {/* Stats bar */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { label: 'Total',     value: total, color: 'text-white' },
          { label: 'Exporters', value: '—',   color: 'text-gold-500' },
          { label: 'Buyers',    value: '—',   color: 'text-blue-400' },
          { label: 'Suspended', value: '—',   color: 'text-red-400' },
        ].map(s => (
          <div key={s.label} className="ieg-card p-4 text-center">
            <p className={`font-display font-bold text-xl ${s.color}`}>{s.value}</p>
            <p className="text-xs text-slate-500">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex gap-3 flex-wrap">
        <SearchBar value={search} onChange={setSearch} placeholder="Search name, email..." className="w-64" />
        <select className="ieg-input h-9 w-36 text-sm" value={roleFilter} onChange={e => { setRoleFilter(e.target.value); setPage(1) }}>
          <option value="">All Roles</option>
          <option value="exporter">Exporter</option>
          <option value="buyer">Buyer</option>
          <option value="shipper">Shipper</option>
        </select>
      </div>

      <DataTable
        columns={columns} data={users} loading={loading}
        page={page} totalPages={Math.ceil(total/10)} onPageChange={setPage}
        emptyMsg="No users found"
      />
    </div>
  )
}
