import { Navigate } from 'react-router-dom'
import { useAuthStore } from '../../store/authStore'

export default function GuestRoute({ children }) {
const { isAuthenticated, isLoading, user } = useAuthStore()
if (isLoading) return null
  if (!isAuthenticated) return children
  const roleHome = { admin: '/admin', exporter: '/exporter', buyer: '/buyer', shipper: '/shipper' }
  return <Navigate to={roleHome[user?.role] || '/'} replace />
}
