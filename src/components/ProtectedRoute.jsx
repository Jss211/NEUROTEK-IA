import { Navigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function ProtectedRoute({ children, allowedRoles }) {
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white dark:bg-slate-900">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (!user) {
    return <Navigate to="/login" replace />
  }

  // Si se requieren roles específicos y el usuario no tiene ninguno de ellos
  if (allowedRoles && !allowedRoles.includes(user.role?.toLowerCase())) {
    // Redirigir a una ruta segura según su rol
    if (user.role?.toLowerCase() === 'cliente') {
      return <Navigate to="/tienda" replace />
    }
    return <Navigate to="/admin/dashboard" replace />
  }

  return children
}
