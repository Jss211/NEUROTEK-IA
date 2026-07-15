import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'

export default function Dashboard() {
  const { user } = useAuth()
  const navigate = useNavigate()

  const handleLogout = async () => {
    await supabase.auth.signOut()
    navigate('/login')
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center">
      <div className="bg-white rounded-xl shadow p-8 max-w-md w-full text-center">
        <div className="w-14 h-14 bg-primary rounded-full flex items-center justify-center mx-auto mb-4">
          <svg className="w-7 h-7 text-slate-900 dark:text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10" />
          </svg>
        </div>
        <h1 className="text-2xl font-bold text-gray-800 mb-1">¡Bienvenido a NeuroTek!</h1>
        <p className="text-sm text-gray-500 mb-6">{user?.email}</p>
        <p className="text-gray-400 text-sm mb-8">El dashboard del sistema de gestión de productos está en construcción.</p>
        <button
          onClick={handleLogout}
          className="w-full bg-red-500 hover:bg-red-600 text-slate-900 dark:text-white font-semibold py-2.5 rounded-md transition"
        >
          Cerrar sesión
        </button>
      </div>
    </div>
  )
}
