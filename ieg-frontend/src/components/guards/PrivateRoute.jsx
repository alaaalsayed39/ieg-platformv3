import { Navigate, useLocation } from 'react-router-dom'
import { useAuthStore } from '../../store/authStore'
import Spinner from '../ui/Spinner'

export default function PrivateRoute({ children, roles }) {
  const { isAuthenticated, isLoading, user } = useAuthStore()
  const location = useLocation()

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Spinner size="lg" />
      </div>
    )
  }

  if (!isAuthenticated) {
    return <Navigate to="/auth/login" state={{ from: location }} replace />
  }

  if (roles && !roles.includes(user?.role)) {
    // Redirect to role's home
    const roleHome = { admin: '/admin', exporter: '/exporter', buyer: '/buyer', shipper: '/shipper' }
    return <Navigate to={roleHome[user?.role] || '/'} replace />
  }

  return children
}
