import { useState, useEffect } from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../context/AuthContext'
import Toast from '../Toast'

const navItems = [
  {
    to: '/admin/dashboard',
    label: 'Dashboard',
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
      </svg>
    ),
  },
  {
    to: '/admin/productos',
    label: 'Productos',
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10" />
      </svg>
    ),
  },
  {
    to: '/admin/inventario',
    label: 'Inventario',
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
      </svg>
    ),
  },
  {
    to: '/admin/ordenes',
    label: 'Órdenes',
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
      </svg>
    ),
  },
  {
    to: '/admin/clientes',
    label: 'Clientes',
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
    ),
  },
  {
    to: '/admin/analytics',
    label: 'Analytics',
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
      </svg>
    ),
  },
  {
    to: '/admin/reportes',
    label: 'Reportes',
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
      </svg>
    ),
  },
  {
    to: '/admin/notificaciones',
    label: 'Notificaciones',
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
      </svg>
    ),
  },
  {
    to: '/admin/equipo',
    label: 'Equipo',
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
      </svg>
    ),
  },
  {
    to: '/admin/configuracion',
    label: 'Configuración',
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
    ),
  },
]

export default function AdminLayout({ children }) {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [collapsed, setCollapsed] = useState(true)
  const [toast, setToast] = useState(null)

  const nombre = user?.user_metadata?.full_name || user?.email || 'Admin'
  const iniciales = nombre.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()

  const isNewUser = user?.created_at
    ? (Date.now() - new Date(user.created_at).getTime()) < 7 * 24 * 60 * 60 * 1000
    : false

  const [notificaciones, setNotificaciones] = useState(0)

  useEffect(() => {
    async function fetchNotifsCount() {
      // 1. Productos con bajo stock
      const { data: prods } = await supabase.from('productos').select('*').lte('stock', 10)
      let count = 0
      if (prods) {
        prods.forEach(p => {
          if (p.stock <= p.stock_minimo) count++
        })
      }
      // 2. Últimas órdenes del día
      const today = new Date()
      today.setHours(0,0,0,0)
      const { data: orders } = await supabase.from('ordenes').select('id').gte('fecha', today.toISOString())
      if (orders) {
        count += orders.length
      }
      setNotificaciones(count)
    }

    fetchNotifsCount()

    // Suscribirse a cambios en productos y ordenes para actualizar el badge
    const channel = supabase.channel('layout_notifs')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'ordenes' }, () => {
        fetchNotifsCount()
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'productos' }, () => {
        fetchNotifsCount()
      })
      .subscribe()

    return () => supabase.removeChannel(channel)
  }, [])
  const handleLogout = async () => {
    setToast({ message: 'Cerrando sesión...', type: 'warning' })
    setTimeout(async () => {
      try {
        await supabase.auth.signOut()
      } catch (err) {
        console.error('Error al cerrar sesión:', err)
      } finally {
        for (let key in localStorage) {
          if (key.startsWith('sb-')) {
            localStorage.removeItem(key)
          }
        }
        window.location.href = '/login'
      }
    }, 1500)
  }

  return (
    <div className="flex h-screen bg-slate-50 dark:bg-[#0f1117] text-slate-900 dark:text-white overflow-hidden">
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} duration={1200} />}
      {/* Sidebar */}
      <aside className="flex flex-col bg-white dark:bg-[#13151f] border-r border-black/5 dark:border-white/5 w-72 overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
        {/* Logo */}
        <div className="flex items-center gap-3 px-4 py-5 border-b border-black/5 dark:border-white/5">
          <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center shrink-0">
            <svg className="w-6 h-6 text-slate-900 dark:text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10" />
            </svg>
          </div>
          <span className="font-bold text-slate-900 dark:text-white text-lg">NeuroTek</span>
        </div>

        {/* Nav */}
        <nav className="flex-1 py-2 flex flex-col">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `group flex items-center gap-4 px-6 py-4 transition-all w-full ${
                  isActive
                    ? 'bg-primary/20 text-primary/80 border-r-4 border-primary font-bold'
                    : 'text-gray-400 hover:bg-black/5 dark:hover:bg-white/5 hover:text-slate-900 dark:hover:text-white border-r-4 border-transparent font-semibold'
                }`
              }
            >
              <span className="shrink-0 w-6 h-6 flex items-center justify-center transition-transform duration-300 group-hover:scale-110 group-active:scale-95">
                {item.icon}
              </span>
              <span className="flex-1 text-[15px]">{item.label}</span>
              {item.to === '/admin/notificaciones' && notificaciones > 0 && (
                <span className="min-w-[20px] h-5 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center px-1 shadow-sm shadow-red-500/40">
                  {notificaciones}
                </span>
              )}
            </NavLink>
          ))}
        </nav>

        {/* Usuario abajo */}
        <div className="border-t border-black/5 dark:border-white/5 p-4">
          <div className="flex items-center gap-3">
            <div className="relative shrink-0">
              {user?.user_metadata?.avatar_url ? (
                <img src={user.user_metadata.avatar_url} alt="Perfil" className="w-10 h-10 rounded-full object-cover border-2 border-primary/50" />
              ) : (
                <div className="w-10 h-10 bg-primary rounded-full flex items-center justify-center text-sm font-bold text-slate-900 dark:text-white">
                  {iniciales}
                </div>
              )}
              <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-400 border-2 border-[#13151f] rounded-full" />
              {isNewUser && (
                <span className="absolute -top-2 -right-3 bg-primary text-slate-900 dark:text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full leading-none">
                  New
                </span>
              )}
            </div>
            <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-slate-900 dark:text-white truncate">{nombre}</p>
                <p className="text-xs text-primary/80">Admin</p>
              </div>
              <button onClick={handleLogout} title="Cerrar sesion" className="text-gray-500 hover:text-red-400 transition">
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
              </button>
          </div>
        </div>
      </aside>

      {/* Contenido principal */}
      <div className="flex-1 flex flex-col overflow-hidden relative">
        <main className="flex-1 overflow-y-auto p-6">
          {children}
        </main>


      </div>
    </div>
  )
}
