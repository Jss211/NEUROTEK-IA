import { useState, useEffect } from 'react'
import AdminLayout from '../../components/admin/AdminLayout'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../context/AuthContext'

const estadoStyle = {
  Completada: 'bg-green-500/20 text-green-400 border border-green-500/30',
  Pendiente:  'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30',
  Procesando: 'bg-primary/20 text-primary/80 border border-primary/30',
  Cancelada:  'bg-red-500/20 text-red-400 border border-red-500/30',
}

export default function Ordenes() {
  const { user } = useAuth()
  const [filtro, setFiltro] = useState('')
  const [filtroEstado, setFiltroEstado] = useState('')
  const [detalleOrden, setDetalleOrden] = useState(null)
  const [ordenes, setOrdenes] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchOrdenes() {
      setLoading(true)
      const { data, error } = await supabase
        .from('ordenes')
        .select('*')
        .order('fecha', { ascending: false })
      
      if (!error && data) {
        setOrdenes(data)
      }
      setLoading(false)
    }

    fetchOrdenes()

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
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Órdenes</h1>
        <p className="text-slate-500 dark:text-gray-400 text-sm mt-1">Gestión de pedidos y ventas</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <div className="bg-white dark:bg-[#1a1d2e] border border-black/5 dark:border-white/5 rounded-xl p-5 flex items-center justify-between">
          <div>
            <p className="text-xs text-slate-500 dark:text-gray-400 uppercase tracking-wider mb-1">Órdenes Totales</p>
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
            <p className="text-xs text-slate-500 dark:text-gray-400 uppercase tracking-wider mb-1">Ventas Hoy</p>
            <div className="flex items-baseline gap-2">
              <p className="text-3xl font-bold text-slate-900 dark:text-white">S/ {ventasHoy.toLocaleString()}</p>
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
            <p className="text-xs text-slate-500 dark:text-gray-400 uppercase tracking-wider mb-1">Pendientes</p>
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
          <h2 className="text-sm font-semibold text-slate-900 dark:text-white">Órdenes Recientes</h2>
          <p className="text-xs text-gray-500 mt-0.5">Historial de pedidos y transacciones</p>
        </div>

        {/* Filtros */}
        <div className="flex gap-3 px-5 py-4 border-b border-black/5 dark:border-white/5">
          <div className="flex items-center gap-2 bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 rounded-xl px-4 py-2.5 flex-1">
            <svg className="w-4 h-4 text-slate-500 dark:text-gray-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              placeholder="Buscar por cliente o ID..."
              value={filtro}
              onChange={e => setFiltro(e.target.value)}
              className="bg-transparent text-sm text-gray-300 placeholder-gray-500 outline-none w-full"
            />
          </div>
          <select
            value={filtroEstado}
            onChange={e => setFiltroEstado(e.target.value)}
            className="bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 rounded-xl px-4 py-2.5 text-sm text-slate-600 dark:text-gray-300 outline-none cursor-pointer"
          >
            <option className="bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white" value="">Todos los estados</option>
            <option className="bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white" value="Completada">Completada</option>
            <option className="bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white" value="Pendiente">Pendiente</option>
            <option className="bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white" value="Procesando">Procesando</option>
            <option className="bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white" value="Cancelada">Cancelada</option>
          </select>
        </div>

        {/* Tabla */}
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-black/5 dark:border-white/5">
                <th className="text-left px-5 py-3 text-xs text-gray-500 uppercase tracking-wider font-medium w-[14%]">Orden</th>
                <th className="text-left px-5 py-3 text-xs text-gray-500 uppercase tracking-wider font-medium w-[22%]">Cliente</th>
                <th className="text-center px-5 py-3 text-xs text-gray-500 uppercase tracking-wider font-medium w-[16%]">Fecha</th>
                <th className="text-center px-5 py-3 text-xs text-gray-500 uppercase tracking-wider font-medium w-[10%]">Items</th>
                <th className="text-center px-5 py-3 text-xs text-gray-500 uppercase tracking-wider font-medium w-[16%]">Total</th>
                <th className="text-center px-5 py-3 text-xs text-gray-500 uppercase tracking-wider font-medium w-[14%]">Estado</th>
                <th className="text-center px-5 py-3 text-xs text-gray-500 uppercase tracking-wider font-medium w-[8%]">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {loading ? (
                <tr>
                  <td colSpan="7" className="px-5 py-8 text-center text-gray-500">
                    Cargando órdenes...
                  </td>
                </tr>
              ) : ordenesFiltradas.length === 0 ? (
                <tr>
                  <td colSpan="7" className="px-5 py-8 text-center text-gray-500">
                    No se encontraron órdenes registradas.
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
                        <div className="w-7 h-7 bg-primary rounded-full flex items-center justify-center text-xs font-bold text-slate-900 dark:text-white shrink-0">
                          {(o.cliente_nombre || o.cliente || 'SN').split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
                        </div>
                        <span className="text-slate-900 dark:text-white text-sm">{o.cliente_nombre || o.cliente}</span>
                      </div>
                    </td>
                    <td className="px-5 py-4 text-center text-slate-500 dark:text-gray-400 text-sm">{new Date(o.fecha).toLocaleDateString()}</td>
                    <td className="px-5 py-4 text-center text-gray-300 text-sm font-medium">{o.items}</td>
                    <td className="px-5 py-4 text-center text-slate-900 dark:text-white font-semibold text-sm">S/ {(parseFloat(o.total) || 0).toFixed(2)}</td>
                    <td className="px-5 py-4 text-center">
                      <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${estadoStyle[o.estado] || estadoStyle['Pendiente']}`}>
                        {o.estado}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-center">
                      <button
                        onClick={() => setDetalleOrden(o)}
                        className="text-primary/80 hover:text-blue-300 transition p-1"
                        title="Ver detalle"
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
            Mostrando {ordenesFiltradas.length} de {ordenes.length} órdenes
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
                <h2 className="text-slate-900 dark:text-white font-bold">Orden #{detalleOrden.id.toString().substring(0,8)}</h2>
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
                  {detalleOrden.estado}
                </span>
              </div>

              {/* Productos */}
              <div className="bg-slate-100 dark:bg-white/5 rounded-xl p-4 max-h-48 overflow-y-auto">
                <p className="text-xs text-slate-500 dark:text-gray-400 mb-3 font-medium uppercase tracking-wider">Productos ({detalleOrden.items})</p>
                <div className="space-y-2">
                  {detalleOrden.productos && Array.isArray(detalleOrden.productos) ? detalleOrden.productos.map((prod, i) => (
                    <div key={i} className="flex items-center gap-2">
                      <div className="w-5 h-5 bg-primary/20 rounded flex items-center justify-center shrink-0">
                        <svg className="w-3 h-3 text-primary/80" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10" />
                        </svg>
                      </div>
                      <span className="text-sm text-slate-700 dark:text-gray-300 font-medium line-clamp-1">{prod.nombre || prod}</span>
                      {prod.cantidad && (
                        <span className="text-xs text-slate-500 ml-auto">x{prod.cantidad}</span>
                      )}
                    </div>
                  )) : (
                    <p className="text-sm text-gray-500">Detalles no disponibles</p>
                  )}
                </div>
              </div>

              {/* Total */}
              <div className="flex items-center justify-between bg-primary/10 border border-primary/20 rounded-xl px-4 py-3">
                <span className="text-sm text-primary font-bold">Total de la orden</span>
                <span className="text-xl font-bold text-slate-900 dark:text-white">S/ {detalleOrden.total.toFixed(2)}</span>
              </div>

              {/* Cambiar estado */}
              <div>
                <p className="text-xs text-slate-500 dark:text-gray-400 mb-2 font-medium">Cambiar estado</p>
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
                      {estado}
                    </button>
                  ))}
                </div>
              </div>

              <button
                onClick={() => setDetalleOrden(null)}
                className="w-full bg-slate-800 hover:bg-slate-900 dark:bg-slate-700 dark:hover:bg-slate-600 text-white font-semibold py-2.5 rounded-xl transition text-sm"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  )
}
