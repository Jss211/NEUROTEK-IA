import { useState } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import AuthLayout from '../components/AuthLayout'

export default function Register() {
  const navigate = useNavigate()
  const location = useLocation()
  const query = new URLSearchParams(location.search)
  const redirectUrl = query.get('redirect')

  const [showPassword, setShowPassword] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [form, setForm] = useState({
    nombres: '',
    apellidos: '',
    email: '',
    password: '',
    confirmPassword: '',
  })
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [loading, setLoading] = useState(false)

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value })
    setError('')
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')

    // Validaciones
    if (form.nombres.trim().length < 2) {
      setError('Ingresa tu nombre completo.')
      return
    }
    if (form.apellidos.trim().length < 2) {
      setError('Ingresa tus apellidos.')
      return
    }
    if (form.password.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres.')
      return
    }
    if (form.password !== form.confirmPassword) {
      setError('Las contraseñas no coinciden. Verifica e intenta de nuevo.')
      return
    }

    setLoading(true)

    const { data, error } = await supabase.auth.signUp({
      email: form.email,
      password: form.password,
      options: {
        data: {
          nombres: form.nombres.trim(),
          apellidos: form.apellidos.trim(),
          full_name: `${form.nombres.trim()} ${form.apellidos.trim()}`,
        },
      },
    })

    setLoading(false)

    if (error) {
      if (error.message.includes('already registered')) {
        setError('Este correo ya está registrado. Intenta iniciar sesión.')
      } else {
        setError(error.message)
      }
      return
    }

    // Si Supabase devuelve una sesión, significa que "Confirm email" está desactivado
    if (data?.session) {
      navigate('/tienda')
    } else {
      // Mostrar pantalla de éxito para confirmar correo
      setSuccess(true)
    }
  }

  // Pantalla de éxito — correo enviado
  if (success) {
    return (
      <AuthLayout>
        <div className="flex flex-col items-center text-center">
          {/* Ícono */}
          <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center mb-5">
            <svg className="w-8 h-8 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
          </div>

          <h2 className="text-2xl font-bold text-gray-800 mb-2">Revisa tu correo</h2>
          <p className="text-gray-500 text-sm mb-1">
            Enviamos un enlace de confirmación a:
          </p>
          <p className="text-primary font-semibold text-sm mb-6">{form.email}</p>
          <p className="text-gray-400 text-xs mb-8 leading-relaxed">
            Haz clic en el enlace que te enviamos para activar tu cuenta.
            Después de confirmar podrás iniciar sesión.
          </p>

          <button
            onClick={() => navigate(redirectUrl ? `/login?redirect=${redirectUrl}` : '/login')}
            className="w-full bg-primary hover:bg-primary/80 text-slate-900 dark:text-white font-semibold py-3 rounded-md transition"
          >
            Ir al inicio de sesión
          </button>

          <p className="text-xs text-gray-400 mt-4">
            ¿No recibiste el correo? Revisa tu carpeta de spam.
          </p>
        </div>
      </AuthLayout>
    )
  }

  return (
    <AuthLayout>
      <p className="text-sm text-gray-400 mb-1">Empieza tu camino</p>
      <h1 className="text-2xl font-bold text-gray-800 mb-6">
        Regístrate en <span className="text-primary">NeuroTek</span>
      </h1>

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Nombres y Apellidos en fila */}
        <div className="grid grid-cols-2 gap-3">
          {/* Nombres */}
          <div className="relative">
            <label className="absolute -top-2.5 left-3 bg-white px-1 text-xs text-primary font-medium">
              Nombres
            </label>
            <input
              type="text"
              name="nombres"
              value={form.nombres}
              onChange={handleChange}
              placeholder="Juan"
              required
              className="w-full px-4 py-3 text-sm text-gray-700 border border-blue-400 rounded-md outline-none focus:ring-2 focus:ring-blue-300 transition"
            />
          </div>

          {/* Apellidos */}
          <div className="relative">
            <label className="absolute -top-2.5 left-3 bg-white px-1 text-xs text-primary font-medium">
              Apellidos
            </label>
            <input
              type="text"
              name="apellidos"
              value={form.apellidos}
              onChange={handleChange}
              placeholder="Pérez"
              required
              className="w-full px-4 py-3 text-sm text-gray-700 border border-blue-400 rounded-md outline-none focus:ring-2 focus:ring-blue-300 transition"
            />
          </div>
        </div>

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
              className="flex-1 px-4 py-3 text-sm text-gray-700 bg-transparent outline-none"
            />
            <span className="pr-3 text-gray-400">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            </span>
          </div>
        </div>

        {/* Contraseña */}
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
              placeholder="Mínimo 6 caracteres"
              required
              className="flex-1 px-4 py-3 text-sm text-gray-700 bg-transparent outline-none"
            />
            <button type="button" onClick={() => setShowPassword(!showPassword)} className="pr-3 text-gray-400 hover:text-gray-600 transition">
              <EyeIcon open={showPassword} />
            </button>
          </div>
        </div>

        {/* Confirmar contraseña */}
        <div className="relative">
          <label className="absolute -top-2.5 left-3 bg-white px-1 text-xs text-gray-500 font-medium">
            Confirmar contraseña
          </label>
          <div className={`flex items-center border rounded-md focus-within:ring-2 transition ${
            form.confirmPassword && form.password !== form.confirmPassword
              ? 'border-red-400 focus-within:ring-red-200'
              : form.confirmPassword && form.password === form.confirmPassword
              ? 'border-green-400 focus-within:ring-green-200'
              : 'border-gray-300 focus-within:ring-blue-300'
          }`}>
            <input
              type={showConfirm ? 'text' : 'password'}
              name="confirmPassword"
              value={form.confirmPassword}
              onChange={handleChange}
              placeholder="Repite tu contraseña"
              required
              className="flex-1 px-4 py-3 text-sm text-gray-700 bg-transparent outline-none"
            />
            <button type="button" onClick={() => setShowConfirm(!showConfirm)} className="pr-3 text-gray-400 hover:text-gray-600 transition">
              <EyeIcon open={showConfirm} />
            </button>
          </div>
          {/* Indicador visual */}
          {form.confirmPassword && (
            <p className={`text-xs mt-1 ${
              form.password === form.confirmPassword ? 'text-green-500' : 'text-red-500'
            }`}>
              {form.password === form.confirmPassword ? '✓ Las contraseñas coinciden' : '✗ Las contraseñas no coinciden'}
            </p>
          )}
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
          {loading && <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />}
          {loading ? 'Creando cuenta...' : 'Crear cuenta'}
        </button>
      </form>

      {/* Divisor */}
      <div className="flex items-center my-5">
        <hr className="flex-1 border-gray-200" />
        <span className="mx-3 text-xs text-gray-400">o regístrate con</span>
        <hr className="flex-1 border-gray-200" />
      </div>

      {/* Social buttons */}
      <div className="flex justify-center">
        <button
          type="button"
          onClick={() => supabase.auth.signInWithOAuth({ provider: 'google', options: { redirectTo: window.location.origin } })}
          className="flex items-center justify-center gap-3 w-full h-12 border border-gray-200 rounded-md hover:bg-gray-50 transition font-medium text-slate-700"
        >
          <svg className="w-5 h-5" viewBox="0 0 24 24">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
          </svg>
          Registrarse con Google
        </button>
      </div>

      <p className="text-sm text-gray-500 text-center mt-6">
        ¿Ya tienes cuenta?{' '}
        <Link to={redirectUrl ? `/login?redirect=${redirectUrl}` : '/login'} className="text-primary font-semibold hover:underline">
          Iniciar sesión
        </Link>
      </p>
    </AuthLayout>
  )
}

function EyeIcon({ open }) {
  return open ? (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
    </svg>
  ) : (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
    </svg>
  )
}

