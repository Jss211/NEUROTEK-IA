import { useState, useEffect } from 'react'
import AdminLayout from '../../components/admin/AdminLayout'
import { supabase } from '../../lib/supabase'
import { useConfig } from '../../context/ConfigContext'

function Estrellas({ rating }) {
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map(i => (
        <svg key={i} className={`w-4 h-4 ${i <= rating ? 'text-yellow-400' : 'text-gray-600'}`} fill="currentColor" viewBox="0 0 20 20">
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
        </svg>
      ))}
    </div>
  )
}

function Avatar({ nombre, size = 'md', imagen = null }) {
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

export default function Clientes() {
  const { t } = useConfig()
  const [filtro, setFiltro] = useState('')
  const [detalleCliente, setDetalleCliente] = useState(null)
  const [clientes, setClientes] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      
      const { data: usuariosData, error: usuariosError } = await supabase
        .from('usuarios')
        .select('*')
        .eq('rol', 'cliente');

      const { data: ordenesData, error: ordenesError } = await supabase
        .from('ordenes')
        .select('cliente_id, total');

      if (!usuariosError && usuariosData) {
        const clientesConStats = usuariosData.map(u => {
          const userOrders = ordenesData?.filter(o => o.cliente_id === u.id) || [];
          const totalSpent = userOrders.reduce((sum, o) => sum + (parseFloat(o.total) || 0), 0);
          
          return {
            id: u.id,
            nombre: u.nombre || u.full_name || u.nombres || t('admin.cli.new_client_default'),
            email: u.email || t('admin.cli.no_email'),
            telefono: u.telefono || u.phone || t('admin.cli.no_phone'),
            ubicacion: u.ubicacion || u.ciudad || t('admin.cli.default_location'),
            imagen: u.avatar_url,
            ordenes: userOrders.length,
            total: totalSpent,
            rating: 5,
            vip: totalSpent > 1000 || userOrders.length >= 3,
            created_at: u.created_at
          };
        });

        clientesConStats.sort((a, b) => b.total - a.total);
        setClientes(clientesConStats);
      }
      setLoading(false);
    }
    
    fetchData();

    const channel = supabase.channel('clientes_changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'usuarios' }, () => {
        fetchData();
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'ordenes' }, () => {
        fetchData();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const clientesFiltrados = clientes.filter(c =>
    c.nombre.toLowerCase().includes(filtro.toLowerCase()) ||
    c.email.toLowerCase().includes(filtro.toLowerCase()) ||
    c.ubicacion.toLowerCase().includes(filtro.toLowerCase())
  )

  const totalClientes = clientes.length
  const currentMonth = new Date().getMonth();
  const nuevos = clientes.filter(c => c.created_at && new Date(c.created_at).getMonth() === currentMonth).length;
  const vip = clientes.filter(c => c.vip).length

  return (
    <AdminLayout>
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">{t('admin.cli.title')}</h1>
        <p className="text-slate-500 dark:text-gray-400 text-sm mt-1">{t('admin.cli.subtitle')}</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <div className="bg-white dark:bg-[#1a1d2e] border border-black/5 dark:border-white/5 rounded-xl p-5 flex items-center justify-between">
          <div>
            <p className="text-xs text-slate-500 dark:text-gray-400 uppercase tracking-wider mb-1">{t('admin.cli.stats.total')}</p>
            <p className="text-3xl font-bold text-slate-900 dark:text-white">{totalClientes.toLocaleString()}</p>
          </div>
          <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center">
            <svg className="w-6 h-6 text-primary/80" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </div>
        </div>

        <div className="bg-white dark:bg-[#1a1d2e] border border-black/5 dark:border-white/5 rounded-xl p-5 flex items-center justify-between">
          <div>
            <p className="text-xs text-slate-500 dark:text-gray-400 uppercase tracking-wider mb-1">{t('admin.cli.stats.new_month')}</p>
            <p className="text-3xl font-bold text-slate-900 dark:text-white">{nuevos}</p>
          </div>
          <div className="w-12 h-12 bg-green-500/10 rounded-xl flex items-center justify-center">
            <svg className="w-6 h-6 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
            </svg>
          </div>
        </div>

        <div className="bg-white dark:bg-[#1a1d2e] border border-black/5 dark:border-white/5 rounded-xl p-5 flex items-center justify-between">
          <div>
            <p className="text-xs text-slate-500 dark:text-gray-400 uppercase tracking-wider mb-1">{t('admin.cli.stats.vip')}</p>
            <p className="text-3xl font-bold text-slate-900 dark:text-white">{vip}</p>
          </div>
          <div className="w-12 h-12 bg-yellow-500/10 rounded-xl flex items-center justify-center">
            <svg className="w-6 h-6 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
            </svg>
          </div>
        </div>
      </div>

      {/* Tabla */}
      <div className="bg-white dark:bg-[#1a1d2e] border border-black/5 dark:border-white/5 rounded-xl">
        <div className="p-5 border-b border-black/5 dark:border-white/5">
          <h2 className="text-sm font-semibold text-slate-900 dark:text-white">{t('admin.cli.table.title')}</h2>
          <p className="text-xs text-gray-500 mt-0.5">{t('admin.cli.table.subtitle')}</p>
        </div>

        {/* Búsqueda */}
        <div className="px-5 py-4 border-b border-black/5 dark:border-white/5">
          <div className="flex items-center gap-2 bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 rounded-xl px-4 py-2.5">
            <svg className="w-4 h-4 text-slate-500 dark:text-gray-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              placeholder={t('admin.cli.search')}
              value={filtro}
              onChange={e => setFiltro(e.target.value)}
              className="bg-transparent text-sm text-gray-300 placeholder-gray-500 outline-none w-full"
            />
          </div>
        </div>

        {/* Tabla */}
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-black/5 dark:border-white/5">
                <th className="text-center px-5 py-3 text-xs text-gray-500 uppercase tracking-wider font-medium">{t('admin.cli.table.col_client')}</th>
                <th className="text-center px-5 py-3 text-xs text-gray-500 uppercase tracking-wider font-medium">{t('admin.cli.table.col_contact')}</th>
                <th className="text-center px-5 py-3 text-xs text-gray-500 uppercase tracking-wider font-medium">{t('admin.cli.table.col_location')}</th>
                <th className="text-center px-5 py-3 text-xs text-gray-500 uppercase tracking-wider font-medium">{t('admin.cli.table.col_orders')}</th>
                <th className="text-center px-5 py-3 text-xs text-gray-500 uppercase tracking-wider font-medium">{t('admin.cli.table.col_total')}</th>
                <th className="text-center px-5 py-3 text-xs text-gray-500 uppercase tracking-wider font-medium">{t('admin.cli.table.col_rating')}</th>
                <th className="text-center px-5 py-3 text-xs text-gray-500 uppercase tracking-wider font-medium"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {loading ? (
                <tr>
                  <td colSpan="7" className="px-5 py-8 text-center text-gray-500">
                    {t('admin.cli.loading')}
                  </td>
                </tr>
              ) : clientesFiltrados.length === 0 ? (
                <tr>
                  <td colSpan="7" className="px-5 py-8 text-center text-gray-500">
                    {t('admin.cli.empty')}
                  </td>
                </tr>
              ) : (
                clientesFiltrados.map(c => (
                  <tr key={c.id} className="hover:bg-white/2 transition">
                    {/* Cliente */}
                    <td className="px-5 py-4">
                    <div className="flex items-center justify-center gap-3">
                      <Avatar nombre={c.nombre} imagen={c.imagen} />
                      <div className="text-left">
                        <div className="flex items-center gap-2">
                          <p className="text-slate-900 dark:text-white font-medium text-sm">{c.nombre}</p>
                          {c.vip && (
                            <span className="text-xs bg-yellow-500/20 text-yellow-400 border border-yellow-500/20 px-1.5 py-0.5 rounded-full font-medium">VIP</span>
                          )}
                        </div>
                        <p className="text-xs text-gray-500 line-clamp-1 w-32" title={c.id}>ID: {c.id}</p>
                      </div>
                    </div>
                  </td>

                  {/* Contacto */}
                  <td className="px-5 py-4">
                    <div className="space-y-1 flex flex-col items-center">
                      <div className="flex items-center justify-center gap-1.5 text-xs text-slate-500 dark:text-gray-400">
                        <svg className="w-3 h-3 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                        </svg>
                        {c.email}
                      </div>
                      <div className="flex items-center justify-center gap-1.5 text-xs text-slate-500 dark:text-gray-400">
                        <svg className="w-3 h-3 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                        </svg>
                        {c.telefono}
                      </div>
                    </div>
                  </td>

                  {/* Ubicación */}
                  <td className="px-5 py-4">
                    <div className="flex items-center justify-center gap-1.5 text-slate-500 dark:text-gray-400 text-sm">
                      <svg className="w-3.5 h-3.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                      {c.ubicacion}
                    </div>
                  </td>

                  {/* Órdenes */}
                  <td className="px-5 py-4 text-center text-slate-900 dark:text-white font-semibold text-sm">{c.ordenes}</td>

                  {/* Total gastado */}
                  <td className="px-5 py-4 text-center text-green-400 font-semibold text-sm">
                    S/ {c.total.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                  </td>

                  {/* Rating */}
                  <td className="px-5 py-4">
                    <div className="flex justify-center">
                      <Estrellas rating={c.rating} />
                    </div>
                  </td>

                  {/* Acciones */}
                  <td className="px-5 py-4">
                    <button
                      onClick={() => setDetalleCliente(c)}
                      className="text-primary/80 hover:text-blue-300 transition p-1"
                      title={t('admin.cli.view_detail')}
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
            {t('admin.cli.footer.showing')} {clientesFiltrados.length} {t('admin.cli.footer.of')} {clientes.length} {t('admin.cli.footer.clients')}
          </p>
        </div>
      </div>

      {/* Modal detalle cliente */}
      {detalleCliente && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4" onClick={() => setDetalleCliente(null)}>
          <div className="bg-white dark:bg-[#1a1d2e] border border-black/10 dark:border-white/10 rounded-2xl w-full max-w-sm" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between px-6 py-4 border-b border-black/5 dark:border-white/5">
              <h2 className="text-slate-900 dark:text-white font-bold">{t('admin.cli.modal.title')}</h2>
              <button onClick={() => setDetalleCliente(null)} className="text-slate-500 dark:text-gray-400 hover:text-slate-900 dark:text-white transition">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="p-6 space-y-4">
              {/* Avatar y nombre */}
              <div className="flex flex-col items-center gap-3 pb-4 border-b border-black/5 dark:border-white/5">
                <Avatar nombre={detalleCliente.nombre} size="lg" />
                <div className="text-center">
                  <div className="flex items-center gap-2 justify-center">
                    <p className="text-slate-900 dark:text-white font-bold text-lg">{detalleCliente.nombre}</p>
                    {detalleCliente.vip && (
                      <span className="text-xs bg-yellow-500/20 text-yellow-400 border border-yellow-500/20 px-2 py-0.5 rounded-full font-medium">VIP</span>
                    )}
                  </div>
                  <Estrellas rating={detalleCliente.rating} />
                </div>
              </div>

              {/* Info */}
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-black/5 dark:bg-white/5 rounded-lg flex items-center justify-center shrink-0">
                    <svg className="w-4 h-4 text-slate-500 dark:text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <p className="text-sm text-gray-300">{detalleCliente.email}</p>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-black/5 dark:bg-white/5 rounded-lg flex items-center justify-center shrink-0">
                    <svg className="w-4 h-4 text-slate-500 dark:text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                    </svg>
                  </div>
                  <p className="text-sm text-gray-300">{detalleCliente.telefono}</p>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-black/5 dark:bg-white/5 rounded-lg flex items-center justify-center shrink-0">
                    <svg className="w-4 h-4 text-slate-500 dark:text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    </svg>
                  </div>
                  <p className="text-sm text-gray-300">{detalleCliente.ubicacion}</p>
                </div>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-black/5 dark:bg-white/5 rounded-xl p-3 text-center">
                  <p className="text-xs text-gray-500 mb-1">{t('admin.cli.modal.orders')}</p>
                  <p className="text-xl font-bold text-slate-900 dark:text-white">{detalleCliente.ordenes}</p>
                </div>
                <div className="bg-black/5 dark:bg-white/5 rounded-xl p-3 text-center">
                  <p className="text-xs text-gray-500 mb-1">{t('admin.cli.modal.total_spent')}</p>
                  <p className="text-lg font-bold text-green-400">${detalleCliente.total.toLocaleString()}</p>
                </div>
              </div>

              <button onClick={() => setDetalleCliente(null)}
                className="w-full bg-black/5 dark:bg-white/5 hover:bg-white/10 text-gray-300 font-semibold py-2.5 rounded-xl transition text-sm">
                {t('admin.cli.modal.close')}
              </button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  )
}
