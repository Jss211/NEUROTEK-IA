import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import AuthLayout from '../components/AuthLayout'

// Enmascara el correo: jordanperez@gmail.com → j*****z@gmail.com
function maskEmail(email) {
  const [local, domain] = email.split('@')
  if (local.length <= 2) return `${local[0]}*@${domain}`
  return `${local[0]}${'*'.repeat(local.length - 2)}${local[local.length - 1]}@${domain}`
}

export default function ForgotPassword() {
  const navigate = useNavigate()
  const [step, setStep] = useState(1) // 1: email, 2: OTP, 3: nueva contraseña
  const [email, setEmail] = useState('')
  const [otp, setOtp] = useState(['', '', '', '', '', '', '', ''])
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPass, setShowPass] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [resendTimer, setResendTimer] = useState(0)

  // ── PASO 1: enviar OTP al correo ──
  const handleSendOTP = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: window.location.origin + '/forgot-password',
    })

    setLoading(false)

    if (error) {
      if (error.message.includes('not found') || error.message.includes('not registered')) {
        setError('No existe una cuenta con ese correo.')
      } else {
        setError(error.message)
      }
      return
    }

    setStep(2)
    startResendTimer()
  }

  // ── PASO 2: verificar OTP ──
  const handleVerifyOTP = async (e) => {
    e.preventDefault()
    setError('')
    const code = otp.join('')
    if (code.length < 6) {
      setError('Ingresa el código completo.')
      return
    }

    setLoading(true)
    const { error } = await supabase.auth.verifyOtp({
      email,
      token: code,
      type: 'recovery',
    })
    setLoading(false)

    if (error) {
      setError('Código incorrecto o expirado. Intenta de nuevo.')
      return
    }

    setStep(3)
  }

  // ── PASO 3: actualizar contraseña ──
  const handleUpdatePassword = async (e) => {
    e.preventDefault()
    setError('')

    if (newPassword.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres.')
      return
    }
    if (newPassword !== confirmPassword) {
      setError('Las contraseñas no coinciden.')
      return
    }

    setLoading(true)
    const { error } = await supabase.auth.updateUser({ password: newPassword })
    setLoading(false)

    if (error) {
      setError(error.message)
      return
    }

    // Éxito — redirige al login
    navigate('/login', { state: { message: '¡Contraseña actualizada! Ya puedes iniciar sesión.' } })
  }

  // ── Manejo de inputs OTP ──
  const handleOtpChange = (value, index) => {
    if (!/^\d*$/.test(value)) return // solo números
    const newOtp = [...otp]
    newOtp[index] = value.slice(-1)
    setOtp(newOtp)
    setError('')
    // Avanzar al siguiente input
    if (value && index < 7) {
      document.getElementById(`otp-${index + 1}`)?.focus()
    }
  }

  const handleOtpKeyDown = (e, index) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      document.getElementById(`otp-${index - 1}`)?.focus()
    }
  }

  const handleOtpPaste = (e) => {
    e.preventDefault()
    const paste = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 8)
    const newOtp = [...otp]
    paste.split('').forEach((char, i) => { newOtp[i] = char })
    setOtp(newOtp)
    document.getElementById(`otp-${Math.min(paste.length, 7)}`)?.focus()
  }

  // ── Timer de reenvío ──
  const startResendTimer = () => {
    setResendTimer(60)
    const interval = setInterval(() => {
      setResendTimer((prev) => {
        if (prev <= 1) { clearInterval(interval); return 0 }
        return prev - 1
      })
    }, 1000)
  }

  const handleResend = async () => {
    if (resendTimer > 0) return
    setError('')
    await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: window.location.origin + '/forgot-password',
    })
    setOtp(['', '', '', '', '', '', '', ''])
    startResendTimer()
  }

  return (
    <AuthLayout>
      {/* ── PASO 1: Ingresar correo ── */}
      {step === 1 && (
        <>
          <Link to="/login" className="flex items-center gap-1 text-sm text-gray-400 hover:text-primary transition mb-6">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Volver al login
          </Link>

          <p className="text-sm text-gray-400 mb-1">Recupera tu acceso</p>
          <h1 className="text-2xl font-bold text-gray-800 mb-2">
            ¿Olvidaste tu <span className="text-primary">contraseña?</span>
          </h1>
          <p className="text-sm text-gray-500 mb-8">
            Ingresa tu correo y te enviaremos un código de verificación.
          </p>

          <form onSubmit={handleSendOTP} className="space-y-5">
            <div className="relative">
              <label className="absolute -top-2.5 left-3 bg-white px-1 text-xs text-primary font-medium">
                Correo electrónico
              </label>
              <div className="flex items-center border border-blue-400 rounded-md focus-within:ring-2 focus-within:ring-blue-300 transition">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => { setEmail(e.target.value); setError('') }}
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

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-600 text-sm px-4 py-3 rounded-md">{error}</div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-primary hover:bg-primary/80 disabled:opacity-60 text-slate-900 dark:text-white font-semibold py-3 rounded-md transition flex items-center justify-center gap-2"
            >
              {loading && <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />}
              {loading ? 'Enviando...' : 'Enviar código'}
            </button>
          </form>
        </>
      )}

      {/* ── PASO 2: Ingresar OTP ── */}
      {step === 2 && (
        <>
          <Link to="/login" className="flex items-center gap-1 text-sm text-gray-400 hover:text-primary transition mb-6">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Volver al login
          </Link>

          <p className="text-sm text-gray-400 mb-1">Verificación</p>
          <h1 className="text-2xl font-bold text-gray-800 mb-2">Revisa tu correo</h1>
          <p className="text-sm text-gray-500 mb-8">
            Enviamos un código a{' '}
            <span className="font-semibold text-primary">{maskEmail(email)}</span>
          </p>

          <form onSubmit={handleVerifyOTP} className="space-y-6">
            {/* Inputs OTP estilo imagen */}
            <div className="flex gap-2 justify-center" onPaste={handleOtpPaste}>
              {otp.map((digit, i) => (
                <div key={`fragment-${i}`} className="flex items-center">
                  {/* Separador a la mitad */}
                  {i === 4 && (
                    <div className="flex items-center px-1">
                      <div className="w-2 h-0.5 bg-gray-300 rounded-full" />
                    </div>
                  )}
                  <input
                    id={`otp-${i}`}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    value={digit}
                    onChange={(e) => handleOtpChange(e.target.value, i)}
                    onKeyDown={(e) => handleOtpKeyDown(e, i)}
                    className={`w-10 sm:w-12 h-12 sm:h-14 text-center text-xl font-bold rounded-xl border-2 outline-none transition
                      ${digit ? 'border-primary bg-blue-50 text-gray-800' : 'border-gray-200 bg-gray-50 text-gray-800'}
                      focus:border-primary focus:ring-2 focus:ring-blue-200`}
                  />
                </div>
              ))}
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-600 text-sm px-4 py-3 rounded-md text-center">{error}</div>
            )}

            <button
              type="submit"
              disabled={loading || otp.join('').length < 6}
              className="w-full bg-primary hover:bg-primary/80 disabled:opacity-60 disabled:cursor-not-allowed text-slate-900 dark:text-white font-semibold py-3 rounded-md transition flex items-center justify-center gap-2"
            >
              {loading && <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />}
              {loading ? 'Verificando...' : 'Verificar código'}
            </button>

            {/* Reenviar */}
            <p className="text-sm text-gray-500 text-center">
              ¿No recibiste el código?{' '}
              {resendTimer > 0 ? (
                <span className="text-gray-400">Reenviar en {resendTimer}s</span>
              ) : (
                <button
                  type="button"
                  onClick={handleResend}
                  className="text-primary font-semibold hover:underline"
                >
                  Reenviar
                </button>
              )}
            </p>
          </form>
        </>
      )}

      {/* ── PASO 3: Nueva contraseña ── */}
      {step === 3 && (
        <>
          <p className="text-sm text-gray-400 mb-1">Último paso</p>
          <h1 className="text-2xl font-bold text-gray-800 mb-2">
            Nueva <span className="text-primary">contraseña</span>
          </h1>
          <p className="text-sm text-gray-500 mb-8">Elige una contraseña segura para tu cuenta.</p>

          <form onSubmit={handleUpdatePassword} className="space-y-5">
            {/* Nueva contraseña */}
            <div className="relative">
              <label className="absolute -top-2.5 left-3 bg-white px-1 text-xs text-gray-500 font-medium">
                Nueva contraseña
              </label>
              <div className="flex items-center border border-gray-300 rounded-md focus-within:ring-2 focus-within:ring-blue-300 transition">
                <input
                  type={showPass ? 'text' : 'password'}
                  value={newPassword}
                  onChange={(e) => { setNewPassword(e.target.value); setError('') }}
                  placeholder="Mínimo 6 caracteres"
                  required
                  className="flex-1 px-4 py-3 text-sm text-gray-700 bg-transparent outline-none"
                />
                <button type="button" onClick={() => setShowPass(!showPass)} className="pr-3 text-gray-400 hover:text-gray-600">
                  <EyeIcon open={showPass} />
                </button>
              </div>
            </div>

            {/* Confirmar contraseña */}
            <div className="relative">
              <label className="absolute -top-2.5 left-3 bg-white px-1 text-xs text-gray-500 font-medium">
                Confirmar contraseña
              </label>
              <div className={`flex items-center border rounded-md focus-within:ring-2 transition ${
                confirmPassword && newPassword !== confirmPassword
                  ? 'border-red-400 focus-within:ring-red-200'
                  : confirmPassword && newPassword === confirmPassword
                  ? 'border-green-400 focus-within:ring-green-200'
                  : 'border-gray-300 focus-within:ring-blue-300'
              }`}>
                <input
                  type={showConfirm ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => { setConfirmPassword(e.target.value); setError('') }}
                  placeholder="Repite tu contraseña"
                  required
                  className="flex-1 px-4 py-3 text-sm text-gray-700 bg-transparent outline-none"
                />
                <button type="button" onClick={() => setShowConfirm(!showConfirm)} className="pr-3 text-gray-400 hover:text-gray-600">
                  <EyeIcon open={showConfirm} />
                </button>
              </div>
              {confirmPassword && (
                <p className={`text-xs mt-1 ${newPassword === confirmPassword ? 'text-green-500' : 'text-red-500'}`}>
                  {newPassword === confirmPassword ? '✓ Las contraseñas coinciden' : '✗ Las contraseñas no coinciden'}
                </p>
              )}
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-600 text-sm px-4 py-3 rounded-md">{error}</div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-primary hover:bg-primary/80 disabled:opacity-60 text-slate-900 dark:text-white font-semibold py-3 rounded-md transition flex items-center justify-center gap-2"
            >
              {loading && <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />}
              {loading ? 'Guardando...' : 'Actualizar contraseña'}
            </button>
          </form>
        </>
      )}
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
