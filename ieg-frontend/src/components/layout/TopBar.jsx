import { Bell, Search, Menu, LogOut, User } from 'lucide-react'
import { useAuthStore } from '../../store/authStore'
import { useUIStore }   from '../../store/uiStore'
import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../../config/api'
import toast from 'react-hot-toast'
import { timeAgo } from '../../utils/format'

export default function TopBar({ title, subtitle }) {
  const { user, logout }             = useAuthStore()
  const { sidebarCollapsed, toggleSidebar } = useUIStore()
  const [notifOpen,   setNotifOpen]  = useState(false)
  const [profileOpen, setProfileOpen]= useState(false)
  const [notifs,      setNotifs]     = useState([])
  const [unread,      setUnread]     = useState(0)
  const navigate  = useNavigate()
  const notifRef  = useRef(null)
  const profileRef= useRef(null)

  // Load notifications on mount
  useEffect(() => {
    api.get('/notifications?limit=8').then(r => {
      const data = r.data.data || []
      setNotifs(data)
      setUnread(data.filter(n => !n.isRead).length)
    }).catch(() => {})
  }, [])

  // Close dropdowns on outside click
  useEffect(() => {
    const handler = (e) => {
      if (notifRef.current && !notifRef.current.contains(e.target))   setNotifOpen(false)
      if (profileRef.current && !profileRef.current.contains(e.target)) setProfileOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const markAllRead = async () => {
    try {
      await api.patch('/notifications/read-all')
      setNotifs(n => n.map(x => ({ ...x, isRead: true })))
      setUnread(0)
    } catch {}
  }

  const handleMarkOne = async (id) => {
    try {
      await api.patch(`/notifications/${id}/read`)
      setNotifs(n => n.map(x => x._id === id ? { ...x, isRead: true } : x))
      setUnread(u => Math.max(0, u - 1))
    } catch {}
  }

  const handleLogout = async () => {
    try { await api.post('/auth/logout') } catch {}
    logout()
    navigate('/auth/login')
    toast.success('Logged out')
  }

  const notifTypeColor = {
    order:        'bg-gold-500',
    payment:      'bg-emerald-400',
    verification: 'bg-blue-400',
    shipment:     'bg-purple-400',
    message:      'bg-pink-400',
    system:       'bg-slate-400',
  }

  const roleHome = { admin: '/admin', exporter: '/exporter', buyer: '/buyer', shipper: '/shipper' }

  return (
    <header
      className="h-16 flex items-center justify-between px-6 sticky top-0 z-20"
      style={{
        background: 'rgba(11,20,55,0.85)',
        backdropFilter: 'blur(12px)',
        borderBottom: '1px solid rgba(255,255,255,0.06)',
      }}
    >
      <div className="flex items-center gap-4">
        <button onClick={toggleSidebar} className="text-slate-500 hover:text-white transition lg:hidden">
          <Menu size={20} />
        </button>
        <div>
          <h2 className="font-display font-bold text-white text-base leading-none">{title}</h2>
          {subtitle && <p className="text-xs text-slate-500 mt-0.5">{subtitle}</p>}
        </div>
      </div>

      <div className="flex items-center gap-3">
        {/* Search */}
        {/* <div className="hidden md:flex items-center gap-2 bg-white/5 border border-white/8 rounded-xl px-3 py-2 text-sm text-slate-500 w-48 cursor-pointer hover:border-gold-500/30 transition">
          <Search size={14} />
          <span className="text-xs">Search...</span>
          <span className="ml-auto text-[10px] bg-white/10 px-1.5 py-0.5 rounded font-mono">⌘K</span>
        </div> */}

        {/* Notifications */}
        <div className="relative" ref={notifRef}>
          <button
            onClick={() => setNotifOpen(!notifOpen)}
            className="w-9 h-9 rounded-xl bg-white/5 border border-white/8 flex items-center justify-center text-slate-400 hover:text-gold-500 hover:border-gold-500/30 transition relative"
          >
            <Bell size={16} />
            {unread > 0 && (
              <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-gold-500 rounded-full text-[9px] font-bold text-navy-900 flex items-center justify-center">
                {unread > 9 ? '9+' : unread}
              </span>
            )}
          </button>

          {notifOpen && (
            <div className="absolute right-0 top-11 w-80 bg-navy-800 border border-white/10 rounded-xl shadow-2xl z-50 animate-slide-up overflow-hidden">
              <div className="flex items-center justify-between px-4 py-3 border-b border-white/5">
                <p className="text-xs font-display font-bold text-white uppercase tracking-wider">Notifications</p>
                {unread > 0 && (
                  <button onClick={markAllRead} className="text-[10px] text-gold-500 hover:text-gold-400 transition">
                    Mark all read
                  </button>
                )}
              </div>
              <div className="max-h-72 overflow-y-auto">
                {notifs.length === 0 ? (
                  <p className="text-xs text-slate-500 text-center py-6">No notifications</p>
                ) : notifs.map((n) => (
                  <div key={n._id}
                    onClick={() => handleMarkOne(n._id)}
                    className={`flex items-start gap-3 px-4 py-3 cursor-pointer transition border-b border-white/3 hover:bg-white/4 ${!n.isRead ? 'bg-white/3' : ''}`}
                  >
                    <div className={`w-2 h-2 rounded-full mt-1.5 flex-shrink-0 ${n.isRead ? 'bg-slate-600' : (notifTypeColor[n.type] || 'bg-gold-500')}`} />
                    <div className="flex-1 min-w-0">
                      <p className={`text-xs font-medium truncate ${n.isRead ? 'text-slate-400' : 'text-white'}`}>{n.title}</p>
                      {n.body && <p className="text-[10px] text-slate-500 mt-0.5 line-clamp-1">{n.body}</p>}
                      <p className="text-[10px] text-slate-600 mt-1">{timeAgo(n.createdAt)}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Profile */}
        <div className="relative" ref={profileRef}>
          <button
            onClick={() => setProfileOpen(!profileOpen)}
            className="w-9 h-9 rounded-xl bg-gold-500/20 border border-gold-500/30 flex items-center justify-center cursor-pointer hover:bg-gold-500/30 transition"
          >
            <span className="font-display font-bold text-gold-500 text-sm">
              {user?.fullName?.charAt(0).toUpperCase()}
            </span>
          </button>

          {profileOpen && (
            <div className="absolute right-0 top-11 w-52 bg-navy-800 border border-white/10 rounded-xl shadow-2xl z-50 animate-slide-up overflow-hidden">
              <div className="px-4 py-3 border-b border-white/5">
                <p className="text-xs font-semibold text-white truncate">{user?.fullName}</p>
                <p className="text-[10px] text-slate-500 truncate">{user?.email}</p>
                <span className="inline-block mt-1 text-[9px] bg-gold-500/20 text-gold-500 border border-gold-500/20 px-1.5 py-0.5 rounded-full capitalize font-bold">
                  {user?.role}
                </span>
              </div>
              <div className="p-1">
                <button
                  onClick={() => { navigate(roleHome[user?.role] || '/'); setProfileOpen(false) }}
                  className="w-full flex items-center gap-2 px-3 py-2 text-xs text-slate-300 hover:bg-white/5 rounded-lg transition text-left"
                >
                  <User size={13} /> Dashboard
                </button>
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center gap-2 px-3 py-2 text-xs text-red-400 hover:bg-red-500/10 rounded-lg transition text-left"
                >
                  <LogOut size={13} /> Sign Out
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}
