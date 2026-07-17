import { useState, useEffect } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import AuthLayout from '../components/AuthLayout'
import Toast from '../components/Toast'
import { useAuth } from '../context/AuthContext'

export default function Login() {
  const navigate = useNavigate()
  const location = useLocation()
  const successMessage = location.state?.message || ''
  const [showPassword, setShowPassword] = useState(false)
  const [form, setForm] = useState({ email: '', password: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [splash, setSplash] = useState(false)
  const [toast, setToast] = useState(null)
  const [pasoActual, setPasoActual] = useState(0)
  
  const { user } = useAuth()

  const query = new URLSearchParams(location.search)
  const redirectUrl = query.get('redirect')

  useEffect(() => {
    // Only auto-redirect if we're not currently showing the login splash screen
    if (user && !splash) {
      if (redirectUrl) {
        navigate(redirectUrl)
      } else if (user.role?.toLowerCase() === 'cliente' || user.role?.toLowerCase() === 'usuario') {
        navigate('/tienda')
      } else {
        navigate('/admin/dashboard')
      }
    }
  }, [user, navigate, redirectUrl, splash])

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value })
    setError('')
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    const { data, error } = await supabase.auth.signInWithPassword({
      email: form.email,
      password: form.password,
    })

    setLoading(false)

    if (error) {
      if (error.message.includes('Invalid login credentials')) {
        setError('Correo o contraseña incorrectos.')
      } else if (error.message.includes('Email not confirmed')) {
        setError('Debes confirmar tu correo antes de iniciar sesión.')
      } else {
        setError(error.message)
      }
      return
    }

    const nombre = data.user?.user_metadata?.full_name ||
      data.user?.user_metadata?.nombres ||
      data.user?.email?.split('@')[0] ||
      'Usuario'

    const { data: perfil } = await supabase
      .from('usuarios')
      .select('rol')
      .eq('id', data.user.id)
      .single()

    const dbRole = perfil?.rol?.toLowerCase();
    const metaRole = data.user?.user_metadata?.role?.toLowerCase();
    const userRole = dbRole || metaRole || 'cliente'

    setSplash(true)
    setToast({ message: `Bienvenido, ${nombre}`, type: 'success' })

    const pasos = [0, 1, 2, 3, 4, 5, 6]
    pasos.forEach((_, i) => {
      setTimeout(() => setPasoActual(i), i * 500)
    })

    setTimeout(() => {
      if (redirectUrl) {
        navigate(redirectUrl)
      } else if (userRole === 'cliente' || userRole === 'usuario') {
        navigate('/tienda')
      } else {
        navigate('/admin/dashboard')
      }
    }, 4000)
  }

  return (
    <>
      {/* Pantalla de carga splash */}
      {splash && (
        <div className="fixed inset-0 z-[9998] bg-slate-50 dark:bg-[#0f1117] flex flex-col items-center justify-center gap-8">
          {/* Logo */}
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-primary rounded-2xl flex items-center justify-center">
              <svg className="w-7 h-7 text-slate-900 dark:text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10" />
              </svg>
            </div>
            <span className="text-2xl font-bold text-slate-900 dark:text-white">NeuroTek</span>
          </div>

          {/* Spinner */}
          <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />

          {/* Texto que cambia */}
          <p className="text-primary/80 text-sm font-medium tracking-wide transition-all duration-300">
            {[
              'Verificando credenciales...',
              'Cargando productos...',
              'Sincronizando inventario...',
              'Cargando graficos y estadisticas...',
              'Obteniendo ordenes recientes...',
              'Cargando datos de clientes...',
              'Preparando tu dashboard...',
            ][pasoActual]}
          </p>

          {/* Barra de progreso */}
          <div className="w-56 bg-white/10 rounded-full h-1 overflow-hidden">
            <div
              className="h-full bg-primary rounded-full transition-all duration-500"
              style={{ width: `${((pasoActual + 1) / 7) * 100}%` }}
            />
          </div>
        </div>
      )}

      {/* Toast de bienvenida */}
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
          duration={2000}
        />
      )}

      <AuthLayout>
        <p className="text-sm text-gray-400 mb-1">Bienvenido de nuevo</p>
        <h1 className="text-2xl font-bold text-gray-800 mb-6">
          Iniciar sesión en <span className="text-primary">NeuroTek</span>
        </h1>

        {/* Demo Access Button para Reclutadores */}
        <div className="bg-gradient-to-r from-primary/10 to-blue-500/10 border border-primary/20 rounded-xl p-4 mb-6">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 bg-primary/20 rounded-lg flex items-center justify-center shrink-0">
                <svg className="w-5 h-5 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-800">¿Evaluando este portafolio?</h3>
                <p className="text-xs text-slate-500">Accede al panel Admin con permisos de solo lectura</p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => {
                setForm({ email: 'demo@neurotek.com', password: 'demo1234' })
              }}
              className="bg-primary hover:bg-primary/80 text-white px-4 py-2 rounded-lg text-xs font-bold transition-all shadow-md shadow-primary/20 hover:shadow-lg hover:shadow-primary/30 shrink-0"
            >
              Probar Demo
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {successMessage && (
            <div className="bg-green-50 border border-green-200 text-green-600 text-sm px-4 py-3 rounded-md">
              {successMessage}
            </div>
          )}

          {/* Email */}
          <div className="relative">
            <label className="absolute -top-2.5 left-3 bg-white px-1 text-xs text-primary font-medium">
              Correo electrónico
            </label>
            <div className="flex items-center border border-blue-400 rounded-md focus-within:ring-2 focus-within:ring-blue-300 transition">
              <input
                type="email"
                name="email"
                value={form.email}
                onChange={handleChange}
                placeholder="ejemplo@correo.com"
                required
                className="flex-1 px-4 py-3 text-sm text-gray-700 bg-transparent outline-none rounded-md"
              />
              <span className="pr-3 text-gray-400">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              </span>
            </div>
          </div>

          {/* Password */}
          <div className="relative">
            <label className="absolute -top-2.5 left-3 bg-white px-1 text-xs text-gray-500 font-medium">
              Contraseña
            </label>
            <div className="flex items-center border border-gray-300 rounded-md focus-within:ring-2 focus-within:ring-blue-300 transition">
              <input
                type={showPassword ? 'text' : 'password'}
                name="password"
                value={form.password}
                onChange={handleChange}
                placeholder="••••••••"
                required
                className="flex-1 px-4 py-3 text-sm text-gray-700 bg-transparent outline-none rounded-md"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="pr-3 text-gray-400 hover:text-gray-600 transition"
              >
                {showPassword ? (
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                  </svg>
                ) : (
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                )}
              </button>
            </div>
          </div>

          {/* Olvidé contraseña */}
          <div className="text-right">
            <Link to="/forgot-password" className="text-xs text-primary hover:underline">
              ¿Olvidaste tu contraseña?
            </Link>
          </div>

          {/* Error */}
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-600 text-sm px-4 py-3 rounded-md">
              {error}
            </div>
          )}

          {/* Botón */}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-primary hover:bg-primary/80 disabled:opacity-60 disabled:cursor-not-allowed text-slate-900 dark:text-white font-semibold py-3 rounded-md transition flex items-center justify-center gap-2"
          >
            {loading && (
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            )}
            {loading ? 'Iniciando sesión...' : 'Iniciar sesión'}
          </button>
        </form>

        {/* Divisor */}
        <div className="flex items-center my-6">
          <hr className="flex-1 border-gray-200" />
          <span className="mx-3 text-xs text-gray-400">o inicia sesión con</span>
          <hr className="flex-1 border-gray-200" />
        </div>

        {/* Social buttons */}
        <div className="flex gap-3 justify-center">
          <SocialBtn label="Facebook">
            <svg className="w-5 h-5 text-[#1877F2]" fill="currentColor" viewBox="0 0 24 24">
              <path d="M22 12c0-5.522-4.477-10-10-10S2 6.478 2 12c0 4.991 3.657 9.128 8.438 9.878v-6.987H7.898V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.891h-2.33v6.987C18.343 21.128 22 16.991 22 12z" />
            </svg>
          </SocialBtn>
          <SocialBtn label="Google">
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
            </svg>
          </SocialBtn>
          <SocialBtn label="Apple">
            <svg className="w-5 h-5 text-gray-800" fill="currentColor" viewBox="0 0 24 24">
              <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z" />
            </svg>
          </SocialBtn>
        </div>

        <p className="text-sm text-gray-500 text-center mt-8">
          ¿No tienes cuenta?{' '}
          <Link to={redirectUrl ? `/register?redirect=${redirectUrl}` : '/register'} className="text-primary font-semibold hover:underline">
            Regístrate
          </Link>
        </p>
      </AuthLayout>
    </>
  )
}

function SocialBtn({ children, label }) {
  return (
    <button
      type="button"
      aria-label={label}
      className="flex items-center justify-center w-14 h-12 border border-gray-200 rounded-md hover:bg-gray-50 transition"
    >
      {children}
    </button>
  )
}
