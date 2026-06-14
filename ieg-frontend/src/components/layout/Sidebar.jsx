import { NavLink, useNavigate } from 'react-router-dom'
import { useAuthStore } from '../../store/authStore'
import { useUIStore }   from '../../store/uiStore'
import IEGLogo from '../ui/IEGLogo'
import api from '../../config/api'
import toast from 'react-hot-toast'
import {
  LayoutDashboard, Package, ShoppingCart, FileText, Truck,
  Wallet, Users, BarChart3, Settings,
  LogOut, ChevronLeft, ShieldCheck, Globe, Star,
  TrendingUp, Bell, Boxes, MessageSquare,
} from 'lucide-react'

const navConfig = {
  admin: [
    { label: 'Dashboard',     icon: LayoutDashboard, to: '/admin' },
    { label: 'Users',         icon: Users,           to: '/admin/users' },
    { label: 'Verifications',     icon: ShieldCheck,     to: '/admin/verifications' },
    { label: 'Document Review',   icon: FileText,        to: '/admin/document-reviews' },
    { label: 'Reports',       icon: BarChart3,       to: '/admin/reports' },
    { label: 'Chat Moderation',   icon: MessageSquare,   to: '/admin/chat' },
    { label: 'Settings',      icon: Settings,        to: '/admin/settings' },
  ],
  exporter: [
    { label: 'Dashboard',          icon: LayoutDashboard, to: '/exporter' },
    { label: 'Products',           icon: Package,         to: '/exporter/products' },
    { label: 'Orders',             icon: ShoppingCart,    to: '/exporter/orders' },
    { label: 'Purchase Requests',  icon: Users,           to: '/exporter/purchase-requests' },
    { label: 'Shipping Requests',  icon: Truck,           to: '/exporter/shipping-requests' },
    { label: 'Documents',          icon: FileText,        to: '/exporter/documents' },
    { label: 'Track Shipments',    icon: Boxes,           to: '/exporter/shipments' },
    { label: 'Messages',           icon: MessageSquare,   to: '/exporter/messages' },
    { label: 'Wallet',             icon: Wallet,          to: '/exporter/wallet' },
  ],
  buyer: [
    { label: 'Dashboard',     icon: LayoutDashboard, to: '/buyer' },
    { label: 'Marketplace',   icon: Globe,           to: '/buyer/marketplace' },
    { label: 'My Orders',     icon: ShoppingCart,    to: '/buyer/orders' },
    { label: 'Messages',      icon: MessageSquare,   to: '/buyer/messages' },
    { label: 'Settings',      icon: Settings,        to: '/buyer/settings' },
  ],
  shipper: [
    { label: 'Dashboard',        icon: LayoutDashboard, to: '/shipper' },
    { label: 'Review Requests',  icon: Package,         to: '/shipper/requests' },
    { label: 'Tracking',         icon: Truck,           to: '/shipper/tracking' },
    { label: 'Reports',          icon: BarChart3,       to: '/shipper/reports' },
    { label: 'Settings',         icon: Settings,        to: '/shipper/settings' },
  ],
}

const roleColors = {
  admin:    'text-purple-400',
  exporter: 'text-gold-500',
  buyer:    'text-blue-400',
  shipper:  'text-emerald-400',
}

export default function Sidebar() {
  const { user, logout } = useAuthStore()
  const { sidebarCollapsed, toggleSidebar } = useUIStore()
  const navigate = useNavigate()

  const items = navConfig[user?.role] || []

  const handleLogout = async () => {
    try {
      await api.post('/auth/logout')
    } catch (_) {}
    logout()
    toast.success('Logged out')
    navigate('/auth/login')
  }

  return (
    <aside
      className="fixed top-0 left-0 h-screen flex flex-col z-30 transition-all duration-300"
      style={{
        width: sidebarCollapsed ? '64px' : '240px',
        background: 'linear-gradient(180deg, #060d24 0%, #0B1437 100%)',
        borderRight: '1px solid rgba(255,255,255,0.06)',
      }}
    >
      {/* Logo */}
      <div className="flex items-center justify-between px-4 py-5 border-b border-white/5">
        <IEGLogo collapsed={sidebarCollapsed} />
        <button
          onClick={toggleSidebar}
          className="w-6 h-6 rounded-md flex items-center justify-center text-slate-500 hover:text-gold-500 transition"
        >
          <ChevronLeft size={14} className={`transition-transform duration-300 ${sidebarCollapsed ? 'rotate-180' : ''}`} />
        </button>
      </div>

      {/* User info */}
      {!sidebarCollapsed && user && (
        <div className="px-4 py-3 border-b border-white/5">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-gold-500/20 border border-gold-500/30 flex items-center justify-center flex-shrink-0">
              <span className="font-display font-bold text-gold-500 text-xs">
                {user.fullName?.charAt(0).toUpperCase()}
              </span>
            </div>
            <div className="min-w-0">
              <p className="text-xs font-semibold text-white truncate">{user.fullName}</p>
              <p className={`text-[10px] capitalize font-display font-bold ${roleColors[user.role] || 'text-slate-400'}`}>
                {user.role}
                {user.isVerified && <span className="ml-1 text-emerald-400">✓</span>}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-3 px-2">
        {!sidebarCollapsed && (
          <p className="text-[9px] uppercase tracking-widest text-slate-600 font-display font-bold px-2 mb-2">
            Main Menu
          </p>
        )}
        <ul className="space-y-0.5">
          {items.map(({ label, icon: Icon, to }) => (
            <li key={to}>
              <NavLink
                to={to}
                end={to === '/admin' || to === '/exporter' || to === '/buyer' || to === '/shipper'}
                className={({ isActive }) =>
                  `nav-item flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all ${
                    isActive ? 'nav-active' : 'text-slate-400'
                  }`
                }
                title={sidebarCollapsed ? label : undefined}
              >
                <Icon size={17} className="flex-shrink-0" />
                {!sidebarCollapsed && <span className="font-medium">{label}</span>}
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>

      {/* Footer */}
      <div className="p-2 border-t border-white/5">
        <button
          onClick={handleLogout}
          className="nav-item flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-slate-400 w-full hover:text-red-400 transition"
          title={sidebarCollapsed ? 'Logout' : undefined}
        >
          <LogOut size={17} />
          {!sidebarCollapsed && <span>Logout</span>}
        </button>
      </div>
    </aside>
  )
}
