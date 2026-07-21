import { useState, useEffect } from 'react'
import AdminLayout from '../../components/admin/AdminLayout'
import { supabase } from '../../lib/supabase'
import { useConfig } from '../../context/ConfigContext'

function StatCard({ label, value, icon, iconBg, iconColor }) {
  return (
    <div className="bg-white dark:bg-[#161b22] border border-black/5 dark:border-white/5 rounded-xl p-5 flex items-center justify-between">
      <div>
        <p className="text-sm text-slate-500 dark:text-gray-400 mb-1">{label}</p>
        <p className="text-3xl font-bold text-slate-900 dark:text-white">{value}</p>
      </div>
      <div className={`w-11 h-11 ${iconBg} rounded-xl flex items-center justify-center shrink-0`}>
        <svg className={`w-5 h-5 ${iconColor}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
          {icon}
        </svg>
      </div>
    </div>
  )
}

export default function Notificaciones() {
  const { t, getLocalized, formatPrice } = useConfig()
  const [notifs, setNotifs] = useState([])
  const [loading, setLoading] = useState(true)

  // Generar notificaciones base al cargar
  useEffect(() => {
    async function fetchInitialAlerts() {
      setLoading(true)
      const alerts = []
      
      // Leer notificaciones ya vistas
      const readNotifs = JSON.parse(localStorage.getItem('readNotifs') || '[]')
      
      // 1. Productos con bajo stock
      const { data: prods } = await supabase.from('productos').select('*').lte('stock', 10) // Umbral general
      if (prods) {
        prods.forEach(p => {
          if (p.stock <= p.stock_minimo) {
            alerts.push({
              id: `stock-${p.id}`,
              tipo: 'stock',
              titulo: p.stock === 0 ? t('admin.notif.out_of_stock') : t('admin.notif.low_stock'),
              texto: `${getLocalized(p, 'nombre')}: ${t('admin.notif.units_left')} ${p.stock} ${t('admin.dash.units')}`,
              tiempo: t('admin.notif.time_now'),
              leida: readNotifs.includes(`stock-${p.id}`),
              critica: p.stock === 0,
              iconBg: p.stock === 0 ? 'bg-red-500/15' : 'bg-orange-500/15',
              iconColor: p.stock === 0 ? 'text-red-400' : 'text-orange-400',
              icono: p.stock === 0 ? 'M13 17h8m0 0V9m0 8l-8-8-4 4-6-6' : 'M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z',
              timestamp: new Date().getTime()
            })
          }
        })
      }

      // 2. Últimas órdenes del día
      const today = new Date()
      today.setHours(0,0,0,0)
      const { data: orders } = await supabase.from('ordenes').select('*').gte('fecha', today.toISOString()).order('fecha', { ascending: false }).limit(10)
      if (orders) {
        orders.forEach(o => {
          alerts.push({
            id: `ord-${o.id}`,
            tipo: 'orden',
            titulo: o.estado === 'Completada' ? t('admin.notif.order_completed') : t('admin.notif.new_order'),
            texto: `${o.cliente_nombre || o.cliente} ${t('admin.notif.order_made')} ${formatPrice(parseFloat(o.total))}`,
            tiempo: new Date(o.fecha).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}),
            leida: o.estado === 'Completada' || readNotifs.includes(`ord-${o.id}`),
            critica: false,
            iconBg: 'bg-green-500/15',
            iconColor: 'text-green-400',
            icono: o.estado === 'Completada' ? 'M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10' : 'M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z',
            timestamp: new Date(o.fecha).getTime()
          })
        })
      }

      // 3. Nuevos clientes del día
      const { data: clients } = await supabase.from('usuarios').select('*').eq('rol', 'cliente').gte('created_at', today.toISOString())
      if (clients) {
        clients.forEach(c => {
          alerts.push({
            id: `cli-${c.id}`,
            tipo: 'cliente',
            titulo: t('admin.notif.new_client'),
            texto: `${c.nombre || c.email} ${t('admin.notif.client_registered')}`,
            tiempo: new Date(c.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}),
            leida: readNotifs.includes(`cli-${c.id}`),
            critica: false,
            iconBg: 'bg-blue-500/15',
            iconColor: 'text-blue-400',
            icono: 'M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z',
            timestamp: new Date(c.created_at).getTime()
          })
        })
      }

      // Ordenar por timestamp
      alerts.sort((a, b) => b.timestamp - a.timestamp)
      setNotifs(alerts)
      setLoading(false)
    }

    fetchInitialAlerts()

    // Suscripción a nuevas órdenes
    const channel = supabase.channel('admin_notifs')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'ordenes' }, (payload) => {
        const o = payload.new
        setNotifs(prev => [{
          id: `ord-${o.id}-${Date.now()}`,
          tipo: 'orden',
          titulo: t('admin.notif.new_order_realtime'),
          texto: `${o.cliente_nombre || o.cliente} ${t('admin.notif.order_made')} ${formatPrice(parseFloat(o.total))}`,
          tiempo: t('admin.notif.just_now'),
          leida: false,
          critica: false,
          iconBg: 'bg-green-500/15',
          iconColor: 'text-green-400',
          icono: 'M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z',
          timestamp: Date.now()
        }, ...prev])
      })
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'usuarios', filter: 'rol=eq.cliente' }, (payload) => {
        const c = payload.new
        setNotifs(prev => [{
          id: `cli-${c.id}-${Date.now()}`,
          tipo: 'cliente',
          titulo: t('admin.notif.new_client'),
          texto: `${c.nombre || c.email} ${t('admin.notif.client_registered')}`,
          tiempo: t('admin.notif.just_now'),
          leida: false,
          critica: false,
          iconBg: 'bg-blue-500/15',
          iconColor: 'text-blue-400',
          icono: 'M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z',
          timestamp: Date.now()
        }, ...prev])
        setSinLeer(s => s + 1)
        setHoy(h => h + 1)
      })
      .subscribe()

    return () => supabase.removeChannel(channel)
  }, [])

  const sinLeer = notifs.filter(n => !n.leida).length
  const criticas = notifs.filter(n => n.critica).length
  const hoy = notifs.length // Asumimos que todas son recientes/hoy por el fetch inicial

  const marcarLeida = (id) => {
    setNotifs(prev => prev.map(n => n.id === id ? { ...n, leida: true } : n))
    const read = JSON.parse(localStorage.getItem('readNotifs') || '[]')
    if (!read.includes(id)) {
      read.push(id)
      localStorage.setItem('readNotifs', JSON.stringify(read))
      window.dispatchEvent(new Event('notifsUpdated'))
    }
  }

  const marcarTodas = () => {
    setNotifs(prev => {
      const read = JSON.parse(localStorage.getItem('readNotifs') || '[]')
      prev.forEach(n => {
        if (!read.includes(n.id)) read.push(n.id)
      })
      localStorage.setItem('readNotifs', JSON.stringify(read))
      window.dispatchEvent(new Event('notifsUpdated'))
      return prev.map(n => ({ ...n, leida: true }))
    })
  }

  const limpiar = () => {
    setNotifs(prev => {
      const read = JSON.parse(localStorage.getItem('readNotifs') || '[]')
      prev.forEach(n => {
        if (!read.includes(n.id)) read.push(n.id)
      })
      localStorage.setItem('readNotifs', JSON.stringify(read))
      window.dispatchEvent(new Event('notifsUpdated'))
      return []
    })
  }

  const eliminar = (id) => {
    setNotifs(prev => prev.filter(n => n.id !== id))
    const read = JSON.parse(localStorage.getItem('readNotifs') || '[]')
    if (!read.includes(id)) {
      read.push(id)
      localStorage.setItem('readNotifs', JSON.stringify(read))
      window.dispatchEvent(new Event('notifsUpdated'))
    }
  }

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center min-h-[50vh]">
          <div className="text-primary animate-pulse font-medium">{t('admin.notif.loading')}</div>
        </div>
      </AdminLayout>
    )
  }

  return (
    <AdminLayout>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-6">
        <div>
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white">{t('admin.notif.title')}</h1>
            {sinLeer > 0 && (
              <span className="px-2.5 py-0.5 bg-cyan-500/15 text-cyan-400 text-xs font-semibold rounded-full border border-cyan-500/25">
                {sinLeer} {t('admin.notif.new_plural')}
              </span>
            )}
          </div>
          <p className="text-slate-500 dark:text-gray-400 text-sm mt-1">{t('admin.notif.subtitle')}</p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={marcarTodas}
            disabled={sinLeer === 0}
            className="flex items-center gap-2 text-sm text-slate-600 dark:text-gray-300 hover:text-slate-900 dark:hover:text-white bg-black/5 dark:bg-white/5 hover:bg-black/10 dark:hover:bg-white/10 border border-black/10 dark:border-white/10 px-4 py-2 rounded-xl transition disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            {t('admin.notif.mark_all_read')}
          </button>
          <button
            onClick={limpiar}
            disabled={notifs.length === 0}
            className="flex items-center gap-2 text-sm text-slate-600 dark:text-gray-300 hover:text-slate-900 dark:hover:text-white bg-black/5 dark:bg-white/5 hover:bg-black/10 dark:hover:bg-white/10 border border-black/10 dark:border-white/10 px-4 py-2 rounded-xl transition disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
            {t('admin.notif.clear')}
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard
          label={t('admin.notif.stats.total')}
          value={notifs.length}
          iconBg="bg-primary/10"
          iconColor="text-primary/80"
          icon={<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />}
        />
        <StatCard
          label={t('admin.notif.stats.unread')}
          value={sinLeer}
          iconBg="bg-cyan-500/10"
          iconColor="text-cyan-400"
          icon={<circle cx="12" cy="12" r="4" fill="currentColor" stroke="none" />}
        />
        <StatCard
          label={t('admin.notif.stats.critical')}
          value={criticas}
          iconBg="bg-red-500/10"
          iconColor="text-red-400"
          icon={<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />}
        />
        <StatCard
          label={t('admin.notif.stats.today')}
          value={hoy}
          iconBg="bg-green-500/10"
          iconColor="text-green-400"
          icon={<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />}
        />
      </div>

      {/* Actividad reciente */}
      <div className="mb-4">
        <h2 className="text-lg font-semibold text-slate-900 dark:text-white">{t('admin.notif.activity.title')}</h2>
        <p className="text-slate-500 dark:text-gray-400 text-sm mt-0.5">{t('admin.notif.activity.subtitle')}</p>
      </div>

      <div className="space-y-3">
        {notifs.length === 0 ? (
          <div className="bg-white/5 border border-white/10 rounded-xl p-12 text-center">
            <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
              </svg>
            </div>
            <p className="text-slate-900 dark:text-white font-medium">{t('admin.notif.empty.title')}</p>
            <p className="text-sm text-gray-500 mt-1">{t('admin.notif.empty.subtitle')}</p>
          </div>
        ) : (
          notifs.map((n) => (
            <div
              key={n.id}
              className={`group flex items-start gap-4 p-4 rounded-xl border transition ${
                n.leida
                  ? 'bg-white dark:bg-transparent border-black/5 dark:border-white/5 hover:bg-slate-50 dark:hover:bg-white/5'
                  : 'bg-white dark:bg-[#1a1d2e] border-primary/20 dark:border-primary/30 shadow-[0_0_15px_rgba(59,130,246,0.05)]'
              }`}
            >
              <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${n.iconBg}`}>
                <svg className={`w-5 h-5 ${n.iconColor}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  {typeof n.icono === 'string' ? (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={n.icono} />
                  ) : (
                    n.icono.map((path, i) => (
                      <path key={i} strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={path} />
                    ))
                  )}
                </svg>
              </div>

              <div className="flex-1 min-w-0 pt-0.5">
                <div className="flex items-start justify-between gap-4 mb-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className={`font-semibold text-sm ${n.leida ? 'text-slate-700 dark:text-gray-300' : 'text-slate-900 dark:text-white'}`}>
                      {n.titulo}
                    </p>
                    {n.critica && (
                      <span className="px-2 py-0.5 bg-red-500/10 text-red-400 text-[10px] font-bold uppercase tracking-wider rounded-md border border-red-500/20">
                        {t('admin.notif.urgent')}
                      </span>
                    )}
                  </div>
                  <span className="text-xs text-gray-500 whitespace-nowrap">{n.tiempo}</span>
                </div>
                <p className={`text-sm ${n.leida ? 'text-gray-500' : 'text-slate-600 dark:text-gray-300'}`}>
                  {n.texto}
                </p>
              </div>

              <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                {!n.leida && (
                  <button
                    onClick={() => marcarLeida(n.id)}
                    className="p-2 text-primary hover:text-blue-400 hover:bg-primary/10 rounded-lg transition"
                    title={t('admin.notif.mark_read')}
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </button>
                )}
                <button
                  onClick={() => eliminar(n.id)}
                  className="p-2 text-gray-500 hover:text-red-400 hover:bg-red-400/10 rounded-lg transition"
                  title={t('admin.notif.delete')}
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </AdminLayout>
  )
}
