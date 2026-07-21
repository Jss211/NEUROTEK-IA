import { useState, useEffect } from 'react'
import AdminLayout from '../../components/admin/AdminLayout'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../context/AuthContext'
import { useConfig } from '../../context/ConfigContext'

const estadoStyle = {
  Completada: 'bg-green-500/20 text-green-400 border border-green-500/30',
  Pendiente:  'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30',
  Procesando: 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30',
  Cancelada:  'bg-red-500/20 text-red-400 border border-red-500/30',
}

function Avatar({ nombre, size = 'sm', imagen = null }) {
  const iniciales = nombre.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()
  const colores = ['bg-primary', 'bg-purple-500', 'bg-green-500', 'bg-orange-500', 'bg-pink-500', 'bg-teal-500']
  const color = colores[nombre.charCodeAt(0) % colores.length]
  const sz = size === 'sm' ? 'w-8 h-8 text-xs' : 'w-10 h-10 text-sm'
  
  if (imagen) {
    return <img src={imagen} alt={nombre} className={`${sz} rounded-full object-cover shrink-0 ring-2 ring-primary/20`} />
  }

  return (
    <div className={`${sz} ${color} rounded-full flex items-center justify-center font-bold text-slate-900 dark:text-white shrink-0 ring-2 ring-primary/20`}>
      {iniciales}
    </div>
  )
}

export default function Ordenes() {
  const { user } = useAuth()
  const { t, formatPrice } = useConfig()
  const [filtro, setFiltro] = useState('')
  const [filtroEstado, setFiltroEstado] = useState('')
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const [detalleOrden, setDetalleOrden] = useState(null)
  const [ordenes, setOrdenes] = useState([])
  const [productosDB, setProductosDB] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchOrdenes() {
      setLoading(true)
      const { data: ordenesData, error } = await supabase
        .from('ordenes')
        .select('*')
        .order('fecha', { ascending: false })
      
      const { data: usuariosData } = await supabase.from('usuarios').select('id, avatar_url');
      
      if (!error && ordenesData) {
        const ordenesConAvatar = ordenesData.map(o => {
           const u = usuariosData?.find(user => user.id === o.cliente_id);
           return { ...o, avatar_url: u?.avatar_url || null };
        });
        setOrdenes(ordenesConAvatar)
      }
      setLoading(false)
    }

    async function fetchProductos() {
      const { data } = await supabase.from('productos').select('id, nombre, imagen_url')
      if (data) setProductosDB(data)
    }

    fetchOrdenes()
    fetchProductos()

    const channel = supabase.channel('ordenes_changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'ordenes' }, () => {
        fetchOrdenes()
      })
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [])

  const ordenesFiltradas = ordenes.filter(o => {
    const matchTexto = (o.cliente_nombre || o.cliente || '').toLowerCase().includes(filtro.toLowerCase()) ||
      (o.id ? o.id.toString() : '').includes(filtro)
    const matchEstado = filtroEstado ? o.estado === filtroEstado : true
    return matchTexto && matchEstado
  })

  const totalOrdenes = ordenes.length
  
  const today = new Date().toISOString().split('T')[0]
  const ventasHoy = ordenes
    .filter(o => o.fecha?.startsWith(today) && o.estado !== 'Cancelada')
    .reduce((sum, o) => sum + (parseFloat(o.total) || 0), 0)
    
  const pendientes = ordenes.filter(o => o.estado === 'Pendiente').length

  const cambiarEstado = async (id, nuevoEstado) => {
    if (user?.email === 'demo@neurotek.com') {
      window.alert('Acción deshabilitada en modo Demo (Solo Lectura).')
      return
    }
    setOrdenes(prev => prev.map(o => o.id === id ? { ...o, estado: nuevoEstado } : o))
    if (detalleOrden?.id === id) setDetalleOrden(prev => ({ ...prev, estado: nuevoEstado }))
    await supabase.from('ordenes').update({ estado: nuevoEstado }).eq('id', id)
  }

  return (
    <AdminLayout>
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">{t('admin.ord.title')}</h1>
        <p className="text-slate-500 dark:text-gray-400 text-sm mt-1">{t('admin.ord.subtitle')}</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <div className="bg-white dark:bg-[#1a1d2e] border border-black/5 dark:border-white/5 rounded-xl p-5 flex items-center justify-between">
          <div>
            <p className="text-xs text-slate-500 dark:text-gray-400 uppercase tracking-wider mb-1">{t('admin.ord.stats.total')}</p>
            <div className="flex items-baseline gap-2">
              <p className="text-3xl font-bold text-slate-900 dark:text-white">{totalOrdenes}</p>
              <span className="text-xs text-green-400 flex items-center gap-0.5">
                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" /></svg>
                +12%
              </span>
            </div>
          </div>
          <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center">
            <svg className="w-6 h-6 text-primary/80" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
          </div>
        </div>

        <div className="bg-white dark:bg-[#1a1d2e] border border-black/5 dark:border-white/5 rounded-xl p-5 flex items-center justify-between">
          <div>
            <p className="text-xs text-slate-500 dark:text-gray-400 uppercase tracking-wider mb-1">{t('admin.ord.stats.sales_today')}</p>
            <div className="flex items-baseline gap-2">
              <p className="text-3xl font-bold text-slate-900 dark:text-white">{formatPrice(ventasHoy)}</p>
              <span className="text-xs text-green-400 flex items-center gap-0.5">
                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" /></svg>
                +23%
              </span>
            </div>
          </div>
          <div className="w-12 h-12 bg-green-500/10 rounded-xl flex items-center justify-center">
            <svg className="w-6 h-6 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
        </div>

        <div className="bg-white dark:bg-[#1a1d2e] border border-black/5 dark:border-white/5 rounded-xl p-5 flex items-center justify-between">
          <div>
            <p className="text-xs text-slate-500 dark:text-gray-400 uppercase tracking-wider mb-1">{t('admin.ord.stats.pending')}</p>
            <div className="flex items-baseline gap-2">
              <p className="text-3xl font-bold text-slate-900 dark:text-white">{pendientes}</p>
              <span className="text-xs text-red-400 flex items-center gap-0.5">
                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 17h8m0 0V9m0 8l-8-8-4 4-6-6" /></svg>
                -8%
              </span>
            </div>
          </div>
          <div className="w-12 h-12 bg-orange-500/10 rounded-xl flex items-center justify-center">
            <svg className="w-6 h-6 text-orange-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10" />
            </svg>
          </div>
        </div>
      </div>

      {/* Tabla */}
      <div className="bg-white dark:bg-[#1a1d2e] border border-black/5 dark:border-white/5 rounded-xl">
        <div className="p-5 border-b border-black/5 dark:border-white/5">
          <h2 className="text-sm font-semibold text-slate-900 dark:text-white">{t('admin.ord.table.title')}</h2>
          <p className="text-xs text-gray-500 mt-0.5">{t('admin.ord.table.subtitle')}</p>
        </div>

        {/* Filtros */}
        <div className="flex gap-3 px-5 py-4 border-b border-black/5 dark:border-white/5">
          <div className="flex items-center gap-2 bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 rounded-xl px-4 py-2.5 flex-1">
            <svg className="w-4 h-4 text-slate-500 dark:text-gray-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              placeholder={t('admin.ord.search')}
              value={filtro}
              onChange={e => setFiltro(e.target.value)}
              className="bg-transparent text-sm text-gray-300 placeholder-gray-500 outline-none w-full"
            />
          </div>
          {/* Custom dropdown */}
          <div className="relative">
            <button
              onClick={() => setDropdownOpen(o => !o)}
              className="flex items-center gap-2 bg-white dark:bg-[#1a1d2e] border border-black/10 dark:border-white/10 rounded-xl px-4 py-2.5 text-sm text-slate-600 dark:text-gray-300 min-w-[150px] justify-between"
            >
              <span>
                {filtroEstado === '' && t('admin.ord.filter.all_states')}
                {filtroEstado === 'Completada' && t('admin.dash.status.completada')}
                {filtroEstado === 'Pendiente' && t('admin.dash.status.pendiente')}
                {filtroEstado === 'Procesando' && t('admin.dash.status.procesando')}
                {filtroEstado === 'Cancelada' && t('admin.dash.status.cancelada')}
              </span>
              <svg className={`w-4 h-4 transition-transform ${dropdownOpen ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
            {dropdownOpen && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setDropdownOpen(false)} />
                <div className="absolute right-0 mt-1 z-20 bg-white dark:bg-[#1a1d2e] border border-black/10 dark:border-white/10 rounded-xl overflow-hidden shadow-xl min-w-[150px]">
                  {[
                    { label: t('admin.ord.filter.all_states'), value: '' },
                    { label: t('admin.dash.status.completada'), value: 'Completada' },
                    { label: t('admin.dash.status.pendiente'), value: 'Pendiente' },
                    { label: t('admin.dash.status.procesando'), value: 'Procesando' },
                    { label: t('admin.dash.status.cancelada'), value: 'Cancelada' },
                  ].map((op) => (
                    <button
                      key={op.value}
                      onClick={() => { setFiltroEstado(op.value); setDropdownOpen(false) }}
                      className={`w-full text-left px-4 py-2.5 text-sm transition hover:bg-primary/10 hover:text-primary ${
                        filtroEstado === op.value ? 'text-primary font-semibold' : 'text-slate-600 dark:text-gray-300'
                      }`}
                    >
                      {op.label}
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>

        {/* Tabla */}
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-black/5 dark:border-white/5">
                <th className="text-left px-5 py-3 text-xs text-gray-500 uppercase tracking-wider font-medium w-[14%]">{t('admin.ord.table.col_order')}</th>
                <th className="text-left px-5 py-3 text-xs text-gray-500 uppercase tracking-wider font-medium w-[22%]">{t('admin.ord.table.col_client')}</th>
                <th className="text-center px-5 py-3 text-xs text-gray-500 uppercase tracking-wider font-medium w-[16%]">{t('admin.ord.table.col_date')}</th>
                <th className="text-center px-5 py-3 text-xs text-gray-500 uppercase tracking-wider font-medium w-[10%]">{t('admin.ord.table.col_items')}</th>
                <th className="text-center px-5 py-3 text-xs text-gray-500 uppercase tracking-wider font-medium w-[16%]">{t('admin.ord.table.col_total')}</th>
                <th className="text-center px-5 py-3 text-xs text-gray-500 uppercase tracking-wider font-medium w-[14%]">{t('admin.ord.table.col_status')}</th>
                <th className="text-center px-5 py-3 text-xs text-gray-500 uppercase tracking-wider font-medium w-[8%]">{t('admin.ord.table.col_actions')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {loading ? (
                <tr>
                  <td colSpan="7" className="px-5 py-8 text-center text-gray-500">
                    {t('admin.ord.loading')}
                  </td>
                </tr>
              ) : ordenesFiltradas.length === 0 ? (
                <tr>
                  <td colSpan="7" className="px-5 py-8 text-center text-gray-500">
                    {t('admin.ord.empty')}
                  </td>
                </tr>
              ) : (
                ordenesFiltradas.map(o => (
                  <tr key={o.id} className="hover:bg-white/2 transition">
                    <td className="px-5 py-4">
                      <span className="text-primary/80 font-mono font-semibold text-sm">#{o.id.toString().substring(0,8)}</span>
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-2">
                        <Avatar nombre={o.cliente_nombre || o.cliente || 'SN'} imagen={o.avatar_url} size="sm" />
                        <span className="text-slate-900 dark:text-white font-medium">{o.cliente_nombre || o.cliente || 'SN'}</span>
                      </div>
                    </td>
                    <td className="px-5 py-4 text-center text-slate-500 dark:text-gray-400 text-sm">{new Date(o.fecha).toLocaleDateString()}</td>
                    <td className="px-5 py-4 text-center text-gray-300 text-sm font-medium">{o.items}</td>
                    <td className="px-5 py-4 text-center text-slate-900 dark:text-white font-semibold text-sm">{formatPrice(parseFloat(o.total) || 0)}</td>
                    <td className="px-5 py-4 text-center">
                      <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${estadoStyle[o.estado] || estadoStyle['Pendiente']}`}>
                        {t('admin.dash.status.' + o.estado.toLowerCase()) || o.estado}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-center">
                      <button
                        onClick={() => setDetalleOrden(o)}
                        className="text-primary/80 hover:text-blue-300 transition p-1"
                        title={t('admin.ord.view_detail')}
                      >
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="px-5 py-3 border-t border-black/5 dark:border-white/5">
          <p className="text-xs text-gray-500">
            {t('admin.ord.footer.showing')} {ordenesFiltradas.length} {t('admin.ord.footer.of')} {ordenes.length} {t('admin.ord.footer.orders')}
          </p>
        </div>
      </div>

      {/* Modal detalle orden */}
      {detalleOrden && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4" onClick={() => setDetalleOrden(null)}>
          <div className="bg-white dark:bg-[#1a1d2e] border border-black/10 dark:border-white/10 rounded-2xl w-full max-w-md" onClick={e => e.stopPropagation()}>
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-black/5 dark:border-white/5">
              <div>
                <h2 className="text-slate-900 dark:text-white font-bold">{t('admin.ord.modal.title')} #{detalleOrden.id.toString().substring(0,8)}</h2>
                <p className="text-xs text-gray-500 mt-0.5">{new Date(detalleOrden.fecha).toLocaleDateString()}</p>
              </div>
              <button onClick={() => setDetalleOrden(null)} className="text-slate-500 dark:text-gray-400 hover:text-slate-900 dark:text-white transition">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="p-6 space-y-4">
              {/* Cliente */}
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-primary rounded-full flex items-center justify-center text-sm font-bold text-slate-900 dark:text-white shrink-0">
                  {(detalleOrden.cliente_nombre || detalleOrden.cliente || 'SN').split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
                </div>
                <div className="overflow-hidden">
                  <p className="text-slate-900 dark:text-white font-medium truncate">{detalleOrden.cliente_nombre || detalleOrden.cliente}</p>
                  <p className="text-xs text-gray-500 truncate">{detalleOrden.cliente_email || detalleOrden.email}</p>
                </div>
                <span className={`ml-auto text-xs font-semibold px-2.5 py-1 rounded-full ${estadoStyle[detalleOrden.estado] || estadoStyle['Pendiente']}`}>
                  {t('admin.dash.status.' + detalleOrden.estado.toLowerCase()) || detalleOrden.estado}
                </span>
              </div>

              {/* Productos */}
              <div className="bg-slate-100 dark:bg-white/5 rounded-xl p-4 max-h-48 overflow-y-auto">
                <p className="text-xs text-slate-500 dark:text-gray-400 mb-3 font-medium uppercase tracking-wider">{t('admin.ord.modal.products')} ({detalleOrden.items})</p>
                <div className="space-y-2">
                  {detalleOrden.productos && Array.isArray(detalleOrden.productos) ? detalleOrden.productos.map((prod, i) => {
                    const imgUrl = prod.imagen_url || productosDB.find(p => p.id === prod.id || p.nombre === (prod.nombre || prod))?.imagen_url;
                    return (
                    <div key={i} className="flex items-center gap-2">
                      <div className="w-6 h-6 bg-slate-50 dark:bg-[#0f1117] border border-black/5 dark:border-white/5 rounded flex items-center justify-center shrink-0 overflow-hidden">
                        {imgUrl ? (
                          <img src={imgUrl} alt={prod.nombre || 'Producto'} className="w-full h-full object-contain p-0.5" />
                        ) : (
                          <svg className="w-3 h-3 text-primary/80" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10" />
                          </svg>
                        )}
                      </div>
                      <span className="text-sm text-slate-700 dark:text-gray-300 font-medium line-clamp-1">{prod.nombre || prod}</span>
                      {prod.cantidad && (
                        <span className="text-xs text-slate-500 ml-auto">x{prod.cantidad}</span>
                      )}
                    </div>
                    )
                  }) : (
                    <p className="text-sm text-gray-500">{t('admin.ord.modal.no_details')}</p>
                  )}
                </div>
              </div>

              {/* Total */}
              <div className="flex items-center justify-between bg-primary/10 border border-primary/20 rounded-xl px-4 py-3">
                <span className="text-sm text-primary font-bold">{t('admin.ord.modal.total')}</span>
                <span className="text-xl font-bold text-slate-900 dark:text-white">{formatPrice(detalleOrden.total)}</span>
              </div>

              {/* Cambiar estado */}
              <div>
                <p className="text-xs text-slate-500 dark:text-gray-400 mb-2 font-medium">{t('admin.ord.modal.change_status')}</p>
                <div className="grid grid-cols-2 gap-2">
                  {['Pendiente', 'Procesando', 'Completada', 'Cancelada'].map(estado => (
                    <button
                      key={estado}
                      onClick={() => cambiarEstado(detalleOrden.id, estado)}
                      className={`py-2 rounded-xl text-xs font-semibold transition ${
                        detalleOrden.estado === estado
                          ? estadoStyle[estado] + ' ring-1 ring-current'
                          : 'bg-slate-100 dark:bg-white/5 text-slate-600 dark:text-gray-400 hover:bg-slate-200 dark:hover:bg-white/10'
                      }`}
                    >
                      {t('admin.dash.status.' + estado.toLowerCase()) || estado}
                    </button>
                  ))}
                </div>
              </div>

              <button
                onClick={() => setDetalleOrden(null)}
                className="w-full bg-slate-800 hover:bg-slate-900 dark:bg-slate-700 dark:hover:bg-slate-600 text-white font-semibold py-2.5 rounded-xl transition text-sm"
              >
                {t('admin.ord.modal.close')}
              </button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  )
}
