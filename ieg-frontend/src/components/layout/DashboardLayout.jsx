import { Outlet, useLocation } from 'react-router-dom'
import Sidebar from './Sidebar'
import TopBar  from './TopBar'
import { useUIStore } from '../../store/uiStore'

const pageTitles = {
  '/admin':                   { title: 'Admin Dashboard',    subtitle: 'Platform overview' },
  '/admin/users':             { title: 'User Management',    subtitle: 'Manage all platform users' },
  '/admin/verifications':     { title: 'Verifications',      subtitle: 'Review KYB documents' },
  '/admin/document-reviews':  { title: 'Document Review',    subtitle: 'Approve or reject export documents' },
  '/admin/reports':           { title: 'Reports',            subtitle: 'Platform analytics' },
  '/admin/settings':          { title: 'Settings',           subtitle: 'Platform configuration' },
  '/admin/chat':              { title: 'Chat Moderation',    subtitle: 'Manage internal communications' },
  '/exporter':                { title: 'Exporter Dashboard', subtitle: 'Your export performance' },
  '/exporter/products':       { title: 'My Products',        subtitle: 'Manage your product catalog' },
  '/exporter/products/add':   { title: 'Add New Product',    subtitle: 'List a product for export' },
  '/exporter/orders':         { title: 'Orders Management',  subtitle: 'Track and manage your orders' },
  '/exporter/purchase-requests': { title: 'Purchase Requests', subtitle: 'Review buyer purchase requests' },
  '/exporter/buyer-requests': { title: 'Purchase Requests', subtitle: 'Review buyer purchase requests' },
  '/exporter/shipping-requests': { title: 'Shipping Requests', subtitle: 'Request logistics for paid orders' },
  '/exporter/documents':      { title: 'Export Documents',   subtitle: 'Manage your compliance documents' },
  '/exporter/shipments':      { title: 'Shipments',          subtitle: 'Track active shipments' },
  '/exporter/wallet':         { title: 'Wallet & Payments',  subtitle: 'Balance and transactions' },
  '/exporter/messages':       { title: 'Messages',           subtitle: 'Chat with buyers' },
  '/buyer':                   { title: 'Welcome back',       subtitle: "Here's what's happening" },
  '/buyer/marketplace':       { title: 'Marketplace',        subtitle: 'Discover Egyptian exports' },
  '/buyer/orders':            { title: 'My Orders',          subtitle: 'Track your purchases' },
  '/buyer/orders/:orderId/shipment': { title: 'Shipment Tracking', subtitle: 'Live container status' },
  '/buyer/messages':          { title: 'Messages',           subtitle: 'Chat with exporters' },
  '/buyer/settings':          { title: 'Settings',           subtitle: 'Account preferences' },
  '/shipper':                 { title: 'Shipper Dashboard',  subtitle: 'Logistics overview' },
  '/shipper/requests':        { title: 'Review Requests',    subtitle: 'Approve shipping requests' },
  '/shipper/create':          { title: 'Review Requests',    subtitle: 'Approve shipping requests' },
  '/shipper/tracking':        { title: 'Shipment Tracking',  subtitle: 'Live container tracking' },
  '/shipper/reports':         { title: 'Shipment Reports',   subtitle: 'Analytics and exports' },
  '/shipper/settings':        { title: 'Settings',           subtitle: 'Account preferences' },
}

export default function DashboardLayout() {
  const { sidebarCollapsed } = useUIStore()
  const location = useLocation()
  const page = pageTitles[location.pathname] || { title: 'IEG Platform', subtitle: '' }

  return (
    <div className="min-h-screen" style={{ background: '#0B1437' }}>
      <Sidebar />
      <div
        className="transition-all duration-300 min-h-screen flex flex-col"
        style={{ marginLeft: sidebarCollapsed ? '64px' : '240px' }}
      >
        <TopBar title={page.title} subtitle={page.subtitle} />
        <main className="flex-1 p-6">
          <div className="page-enter">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  )
}
