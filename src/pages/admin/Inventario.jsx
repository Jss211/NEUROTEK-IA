import { useState, useEffect } from 'react'
import AdminLayout from '../../components/admin/AdminLayout'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../context/AuthContext'
import * as XLSX from 'xlsx'
import { useConfig } from '../../context/ConfigContext'

function getEstado(stock, stockMinimo, t) {
  if (stock === 0) return t('admin.inv.status.out_of_stock')
  if (stock <= stockMinimo * 0.5) return t('admin.inv.status.critical')
  if (stock <= stockMinimo) return t('admin.inv.status.low')
  return t('admin.inv.status.normal')
}

const estadoStyle = {
  'Sin Stock': 'bg-gray-500/20 text-slate-500 dark:text-gray-400 border border-gray-500/20',
  'Out of Stock': 'bg-gray-500/20 text-slate-500 dark:text-gray-400 border border-gray-500/20',
  'Normal':    'bg-green-500/20 text-green-400 border border-green-500/20',
  'Bajo':      'bg-yellow-500/20 text-yellow-400 border border-yellow-500/20',
  'Low':      'bg-yellow-500/20 text-yellow-400 border border-yellow-500/20',
  'Crítico':   'bg-red-500/20 text-red-400 border border-red-500/20',
  'Critical':   'bg-red-500/20 text-red-400 border border-red-500/20',
}

export default function Inventario() {
  const { user } = useAuth()
  const { t } = useConfig()
  const [productos, setProductos] = useState([])
  const [loading, setLoading] = useState(true)
  const [filtro, setFiltro] = useState('')
  const [filtroEstado, setFiltroEstado] = useState('')
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const [editandoStock, setEditandoStock] = useState(null)
  const [nuevoStock, setNuevoStock] = useState('')

  useEffect(() => {
    cargarProductos()

    // Suscripción en tiempo real
    const channel = supabase
      .channel('inventario-realtime')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'productos',
      }, () => {
        cargarProductos()
      })
      .subscribe()

    return () => supabase.removeChannel(channel)
  }, [])

  const cargarProductos = async () => {
    const { data } = await supabase
      .from('productos')
      .select('id, nombre, sku, stock, stock_minimo, ubicacion, categoria, activo, imagen_url')
      .order('nombre', { ascending: true })
    setProductos(data || [])
    setLoading(false)
  }

  const handleExportar = () => {
    const datos = productos.map(p => ({
      'Nombre':        p.nombre || '',
      'Categoría':     p.categoria || '',
      'Stock':         p.stock ?? 0,
      'Stock Mínimo':  p.stock_minimo ?? 5,
      'Estado':        getEstado(p.stock || 0, p.stock_minimo || 5, t),
      'Activo':        p.activo ? 'Sí' : 'No',
    }))

    const ws = XLSX.utils.json_to_sheet(datos)
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, 'Inventario')

    // Ancho de columnas automático
    ws['!cols'] = [
      { wch: 35 }, { wch: 18 },
      { wch: 8 }, { wch: 14 },
      { wch: 14 }, { wch: 8 },
    ]

    const fecha = new Date().toISOString().slice(0, 10)
    XLSX.writeFile(wb, `inventario-neurotek-${fecha}.xlsx`)
  }

  const handleActualizarStock = async (id) => {
    if (user?.email === 'demo@neurotek.com') {
      window.alert('Acción deshabilitada en modo Demo (Solo Lectura).')
      return
    }
    if (nuevoStock === '') return
    await supabase
      .from('productos')
      .update({ stock: parseInt(nuevoStock) })
      .eq('id', id)
    setEditandoStock(null)
    setNuevoStock('')
  }

  const productosFiltrados = productos.filter(p => {
    const matchTexto = p.nombre?.toLowerCase().includes(filtro.toLowerCase()) ||
      p.sku?.toLowerCase().includes(filtro.toLowerCase())
    const estado = getEstado(p.stock || 0, p.stock_minimo || 5, t)
    const matchEstado = filtroEstado ? estado === filtroEstado : true
    return matchTexto && matchEstado
  })

  // Stats
  const totalItems = productos.length
  const stockBajo = productos.filter(p => {
    const e = getEstado(p.stock || 0, p.stock_minimo || 5, t)
    return e === t('admin.inv.status.low')
  }).length
  const stockCritico = productos.filter(p => {
    const e = getEstado(p.stock || 0, p.stock_minimo || 5, t)
    return e === t('admin.inv.status.critical') || e === t('admin.inv.status.out_of_stock')
  }).length

  return (
    <AdminLayout>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">{t('admin.inv.title')}</h1>
          <p className="text-slate-500 dark:text-gray-400 text-sm mt-1">{t('admin.inv.subtitle')}</p>
        </div>
        <div className="flex gap-3">
          <button 
            onClick={handleExportar}
            className="flex items-center gap-2 bg-black/5 dark:bg-white/5 hover:bg-white/10 border border-black/10 dark:border-white/10 text-slate-600 dark:text-gray-300 font-medium px-4 py-2.5 rounded-xl transition text-sm"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            {t('admin.inv.btn_export')}
          </button>
        </div>
      </div>

      {/* Stats cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <div className="bg-white dark:bg-[#1a1d2e] border border-black/5 dark:border-white/5 rounded-xl p-5 flex items-center justify-between">
          <div>
            <p className="text-xs text-slate-500 dark:text-gray-400 uppercase tracking-wider mb-1">{t('admin.inv.stats.total')}</p>
            <p className="text-3xl font-bold text-slate-900 dark:text-white">{totalItems}</p>
          </div>
          <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center">
            <svg className="w-6 h-6 text-primary/80" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10" />
            </svg>
          </div>
        </div>

        <div className="bg-white dark:bg-[#1a1d2e] border border-black/5 dark:border-white/5 rounded-xl p-5 flex items-center justify-between">
          <div>
            <p className="text-xs text-slate-500 dark:text-gray-400 uppercase tracking-wider mb-1">{t('admin.inv.stats.low')}</p>
            <p className="text-3xl font-bold text-yellow-400">{stockBajo}</p>
          </div>
          <div className="w-12 h-12 bg-yellow-500/10 rounded-xl flex items-center justify-center">
            <svg className="w-6 h-6 text-yellow-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 17h8m0 0V9m0 8l-8-8-4 4-6-6" />
            </svg>
          </div>
        </div>

        <div className="bg-white dark:bg-[#1a1d2e] border border-black/5 dark:border-white/5 rounded-xl p-5 flex items-center justify-between">
          <div>
            <p className="text-xs text-slate-500 dark:text-gray-400 uppercase tracking-wider mb-1">{t('admin.inv.stats.critical')}</p>
            <p className="text-3xl font-bold text-red-400">{stockCritico}</p>
          </div>
          <div className="w-12 h-12 bg-red-500/10 rounded-xl flex items-center justify-center">
            <svg className="w-6 h-6 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
        </div>
      </div>

      {/* Tabla */}
      <div className="bg-white dark:bg-[#1a1d2e] border border-black/5 dark:border-white/5 rounded-xl">
        {/* Tabla header */}
        <div className="p-5 border-b border-black/5 dark:border-white/5">
          <h2 className="text-sm font-semibold text-slate-900 dark:text-white mb-0.5">{t('admin.inv.table.title')}</h2>
          <p className="text-xs text-gray-500">{t('admin.inv.table.subtitle')}</p>
        </div>

        {/* Búsqueda y filtros */}
        <div className="flex items-center gap-3 px-5 py-4 border-b border-black/5 dark:border-white/5">
          <div className="flex items-center gap-2 bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 rounded-xl px-4 py-2.5 flex-1">
            <svg className="w-4 h-4 text-slate-500 dark:text-gray-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              placeholder={t('admin.inv.search')}
              value={filtro}
              onChange={e => setFiltro(e.target.value)}
              className="bg-transparent text-sm text-slate-600 dark:text-gray-300 placeholder-gray-500 outline-none w-full"
            />
          </div>
          {/* Custom dropdown */}
          <div className="relative">
            <button
              onClick={() => setDropdownOpen(o => !o)}
              className="flex items-center gap-2 bg-white dark:bg-[#1a1d2e] border border-black/10 dark:border-white/10 rounded-xl px-4 py-2.5 text-sm text-slate-600 dark:text-gray-300 min-w-[130px] justify-between"
            >
              <span>{filtroEstado || t('admin.inv.filter.all')}</span>
              <svg className={`w-4 h-4 transition-transform ${dropdownOpen ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
            {dropdownOpen && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setDropdownOpen(false)} />
                <div className="absolute right-0 mt-1 z-20 bg-white dark:bg-[#1a1d2e] border border-black/10 dark:border-white/10 rounded-xl overflow-hidden shadow-xl min-w-[130px]">
                  {[t('admin.inv.filter.all'), t('admin.inv.status.normal'), t('admin.inv.status.low'), t('admin.inv.status.critical'), t('admin.inv.status.out_of_stock')].map((op, i) => (
                    <button
                      key={i}
                      onClick={() => { setFiltroEstado(i === 0 ? '' : op); setDropdownOpen(false) }}
                      className={`w-full text-left px-4 py-2.5 text-sm transition hover:bg-primary/10 hover:text-primary ${
                        (i === 0 && filtroEstado === '') || (i > 0 && filtroEstado === op)
                          ? 'text-primary font-semibold'
                          : 'text-slate-600 dark:text-gray-300'
                      }`}
                    >
                      {op}
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>

        {/* Tabla */}
        {loading ? (
          <div className="flex items-center justify-center h-40">
            <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-black/5 dark:border-white/5">
                  <th className="text-left px-5 py-3 text-xs text-gray-500 uppercase tracking-wider font-medium w-[40%]">{t('admin.inv.table.col_product')}</th>
                  <th className="text-center px-5 py-3 text-xs text-gray-500 uppercase tracking-wider font-medium w-[15%]">{t('admin.inv.table.col_stock')}</th>
                  <th className="text-center px-5 py-3 text-xs text-gray-500 uppercase tracking-wider font-medium w-[15%]">{t('admin.inv.table.col_min_stock')}</th>
                  <th className="text-center px-5 py-3 text-xs text-gray-500 uppercase tracking-wider font-medium w-[15%]">{t('admin.inv.table.col_status')}</th>
                  <th className="text-center px-5 py-3 text-xs text-gray-500 uppercase tracking-wider font-medium w-[15%]">{t('admin.inv.table.col_action')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {productosFiltrados.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="text-center py-12 text-gray-500">
                      {t('admin.inv.table.empty')}
                    </td>
                  </tr>
                ) : (
                  productosFiltrados.map(p => {
                    const estado = getEstado(p.stock || 0, p.stock_minimo || 5, t)
                    return (
                      <tr key={p.id} className="hover:bg-white/2 transition">
                        {/* Producto */}
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-slate-50 dark:bg-[#0f1117] rounded-lg flex items-center justify-center shrink-0 overflow-hidden border border-black/5 dark:border-white/5">
                              {p.imagen_url ? (
                                <img src={p.imagen_url} alt={p.nombre} className="w-full h-full object-contain p-1" />
                              ) : (
                                <svg className="w-5 h-5 text-primary/80" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10" />
                                </svg>
                              )}
                            </div>
                            <div>
                              <p className="text-slate-900 dark:text-white font-medium text-sm">{p.nombre}</p>
                              {p.categoria && <p className="text-xs text-gray-500">{p.categoria}</p>}
                            </div>
                          </div>
                        </td>

                        {/* Stock — editable */}
                        <td className="px-5 py-4 text-center">
                          {editandoStock === p.id ? (
                            <div className="flex items-center justify-center gap-2">
                              <input
                                type="number"
                                min="0"
                                value={nuevoStock}
                                onChange={e => setNuevoStock(e.target.value)}
                                className="w-16 bg-black/5 dark:bg-white/5 border border-primary rounded-lg px-2 py-1 text-sm text-slate-900 dark:text-white outline-none text-center"
                                autoFocus
                              />
                              <button
                                onClick={() => handleActualizarStock(p.id)}
                                className="text-green-400 hover:text-green-300 transition"
                              >
                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                </svg>
                              </button>
                              <button
                                onClick={() => { setEditandoStock(null); setNuevoStock('') }}
                                className="text-red-400 hover:text-red-300 transition"
                              >
                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                              </button>
                            </div>
                          ) : (
                            <span className={`font-bold text-sm ${
                              estado === t('admin.inv.status.critical') || estado === t('admin.inv.status.out_of_stock') ? 'text-red-400' :
                              estado === t('admin.inv.status.low') ? 'text-yellow-400' : 'text-slate-900 dark:text-white'
                            }`}>
                              {p.stock ?? 0}
                            </span>
                          )}
                        </td>

                        {/* Min stock */}
                        <td className="px-5 py-4 text-slate-500 dark:text-gray-400 text-sm text-center">{p.stock_minimo ?? 5}</td>

                        {/* Estado */}
                        <td className="px-5 py-4 text-center">
                          <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${estadoStyle[estado]}`}>
                            {estado}
                          </span>
                        </td>

                        {/* Acción */}
                        <td className="px-5 py-4 text-center">
                          <button
                            onClick={() => {
                              setEditandoStock(p.id)
                              setNuevoStock(String(p.stock ?? 0))
                            }}
                            className="text-xs text-primary/80 hover:text-blue-300 bg-primary/10 hover:bg-primary/20 px-3 py-1.5 rounded-lg transition font-medium inline-block"
                          >
                            {t('admin.inv.btn_adjust')}
                          </button>
                        </td>
                      </tr>
                    )
                  })
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* Footer tabla */}
        <div className="px-5 py-3 border-t border-black/5 dark:border-white/5 flex items-center justify-between">
          <p className="text-xs text-gray-500">
            {t('admin.inv.footer.showing')} {productosFiltrados.length} {t('admin.inv.footer.of')} {productos.length} {t('admin.inv.footer.products')}
          </p>
        </div>
      </div>
    </AdminLayout>
  )
}
