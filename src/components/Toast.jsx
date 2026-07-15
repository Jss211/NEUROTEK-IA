import { useEffect, useState } from 'react'

export default function Toast({ message, type = 'success', onClose, duration = 3000 }) {
  const [visible, setVisible] = useState(false)
  const [leaving, setLeaving] = useState(false)

  useEffect(() => {
    // Entrada
    setTimeout(() => setVisible(true), 10)

    // Salida
    const timer = setTimeout(() => {
      setLeaving(true)
      setTimeout(() => onClose(), 400)
    }, duration)

    return () => clearTimeout(timer)
  }, [])

  const icons = {
    success: (
      <svg className="w-5 h-5 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
      </svg>
    ),
    loading: (
      <div className="w-5 h-5 border-2 border-blue-400 border-t-transparent rounded-full animate-spin" />
    ),
    warning: (
      <svg className="w-5 h-5 text-yellow-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
      </svg>
    ),
  }

  const colors = {
    success: 'border-green-500/30 bg-green-500/10',
    loading: 'border-primary/30 bg-primary/10',
    warning: 'border-yellow-500/30 bg-yellow-500/10',
  }

  return (
    <div
      className={`fixed top-5 right-5 z-[9999] flex items-center gap-3 px-5 py-4 rounded-2xl border backdrop-blur-sm shadow-2xl transition-all duration-400 ${colors[type]} ${
        visible && !leaving ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-4'
      }`}
    >
      <span className="shrink-0">{icons[type]}</span>
      <p className="text-sm text-slate-900 dark:text-white font-medium">{message}</p>
    </div>
  )
}
