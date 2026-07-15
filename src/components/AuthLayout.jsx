import { useState, useEffect } from 'react'

import img1 from '../assets/dashboard.jpeg'
import img2 from '../assets/Datos.jpeg'
import img3 from '../assets/IA.jpeg'

const slides = [
  {
    src: img1,
    title: 'Gestión en tiempo real',
    desc: 'Controla tu inventario desde cualquier lugar.',
  },
  {
    src: img2,
    title: 'Datos que impulsan decisiones',
    desc: 'Analiza métricas y optimiza tus procesos.',
  },
  {
    src: img3,
    title: 'Inteligencia al servicio del negocio',
    desc: 'Automatiza y escala tu operación con IA.',
  },
]

export default function AuthLayout({ children }) {
  const [current, setCurrent] = useState(0)
  const [fading, setFading] = useState(false)

  useEffect(() => {
    const interval = setInterval(() => {
      // Inicia fade out
      setFading(true)
      setTimeout(() => {
        setCurrent((prev) => (prev + 1) % slides.length)
        setFading(false)
      }, 600) // duración del fade
    }, 10000) // cada 10 segundos

    return () => clearInterval(interval)
  }, [])

  const goTo = (index) => {
    if (index === current) return
    setFading(true)
    setTimeout(() => {
      setCurrent(index)
      setFading(false)
    }, 600)
  }

  return (
    <div className="min-h-screen flex">
      {/* Panel izquierdo — Formulario */}
      <div className="flex flex-col justify-between w-full md:w-1/2 px-10 py-10 bg-white">
        {/* Logo */}
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-primary rounded-md flex items-center justify-center">
            <svg className="w-5 h-5 text-slate-900 dark:text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10" />
            </svg>
          </div>
          <span className="text-lg font-bold text-gray-800">NeuroTek</span>
        </div>

        {/* Formulario centrado */}
        <div className="flex-1 flex flex-col justify-center max-w-sm mx-auto w-full">
          {children}
        </div>

        <div />
      </div>

      {/* Panel derecho — Carrusel */}
      <div className="hidden md:block md:w-1/2 relative overflow-hidden">
        {/* Imagen con transición fade */}
        <img
          key={current}
          src={slides[current].src}
          alt={slides[current].title}
          className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-600 ${
            fading ? 'opacity-0' : 'opacity-100'
          }`}
        />

        {/* Overlay oscuro para legibilidad del texto */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />

        {/* Texto descriptivo */}
        <div
          className={`absolute bottom-16 left-8 right-8 text-white transition-opacity duration-600 ${
            fading ? 'opacity-0' : 'opacity-100'
          }`}
        >
          <h2 className="text-2xl font-bold mb-1">{slides[current].title}</h2>
          <p className="text-sm text-white/80">{slides[current].desc}</p>
        </div>

        {/* Dots indicadores */}
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-2">
          {slides.map((_, i) => (
            <button
              key={i}
              onClick={() => goTo(i)}
              aria-label={`Slide ${i + 1}`}
              className={`h-2 rounded-full transition-all duration-300 ${
                i === current
                  ? 'bg-white w-6'
                  : 'bg-white/40 w-2 hover:bg-white/70'
              }`}
            />
          ))}
        </div>
      </div>
    </div>
  )
}
