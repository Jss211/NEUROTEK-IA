import { useState, useEffect } from 'react';
import TiendaLayout from '../../components/tienda/TiendaLayout';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';

const ESTADO_CONFIG = {
  Pendiente: {
    color: 'bg-yellow-50 dark:bg-yellow-500/10 text-yellow-600 dark:text-yellow-400 border-yellow-200 dark:border-yellow-500/20',
    dot: 'bg-yellow-500 dark:bg-yellow-400',
    icon: (
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
  },
  Procesando: {
    color: 'bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-200 dark:border-blue-500/20',
    dot: 'bg-blue-500 dark:bg-blue-400',
    icon: (
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
      </svg>
    ),
  },
  Completada: {
    color: 'bg-green-50 dark:bg-green-500/10 text-green-600 dark:text-green-400 border-green-200 dark:border-green-500/20',
    dot: 'bg-green-500 dark:bg-green-400',
    icon: (
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
  },
  Cancelada: {
    color: 'bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400 border-red-200 dark:border-red-500/20',
    dot: 'bg-red-500 dark:bg-red-400',
    icon: (
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
  },
};

function getEstadoConfig(estado) {
  return ESTADO_CONFIG[estado] || ESTADO_CONFIG.Pendiente;
}

export default function HistorialCompras() {
  const { user } = useAuth();
  const [ordenes, setOrdenes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState(null);

  useEffect(() => {
    if (user?.id) {
      fetchOrdenes();
    }
  }, [user]);

  async function fetchOrdenes() {
    setLoading(true);
    const { data, error } = await supabase
      .from('ordenes')
      .select('*')
      .eq('cliente_id', user.id)
      .order('fecha', { ascending: false });

    if (!error && data) {
      setOrdenes(data);
    }
    setLoading(false);
  }

  function toggleExpand(id) {
    setExpandedId((prev) => (prev === id ? null : id));
  }

  function formatFecha(fechaStr) {
    const fecha = new Date(fechaStr);
    return fecha.toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  }

  return (
    <TiendaLayout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white mb-2 flex items-center gap-3">
            <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center">
              <svg className="w-5 h-5 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
              </svg>
            </div>
            Historial de Compras
          </h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm">
            Revisa el estado y detalle de todas tus órdenes realizadas.
          </p>
        </div>

        {/* Summary Cards */}
        {!loading && ordenes.length > 0 && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            <div className="bg-white dark:bg-[#13151f] border border-black/5 dark:border-white/5 rounded-2xl p-4 text-center shadow-sm">
              <p className="text-2xl font-bold text-slate-900 dark:text-white">{ordenes.length}</p>
              <p className="text-xs text-slate-500 font-medium mt-1">Total Órdenes</p>
            </div>
            <div className="bg-white dark:bg-[#13151f] border border-black/5 dark:border-white/5 rounded-2xl p-4 text-center shadow-sm">
              <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                {ordenes.filter((o) => o.estado === 'Completada').length}
              </p>
              <p className="text-xs text-slate-500 font-medium mt-1">Completadas</p>
            </div>
            <div className="bg-white dark:bg-[#13151f] border border-black/5 dark:border-white/5 rounded-2xl p-4 text-center shadow-sm">
              <p className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">
                {ordenes.filter((o) => o.estado === 'Pendiente' || o.estado === 'Procesando').length}
              </p>
              <p className="text-xs text-slate-500 font-medium mt-1">En Proceso</p>
            </div>
            <div className="bg-white dark:bg-[#13151f] border border-black/5 dark:border-white/5 rounded-2xl p-4 text-center shadow-sm">
              <p className="text-2xl font-bold text-primary">
                S/ {ordenes.reduce((sum, o) => sum + (parseFloat(o.total) || 0), 0).toFixed(2)}
              </p>
              <p className="text-xs text-slate-500 font-medium mt-1">Total Gastado</p>
            </div>
          </div>
        )}

        {/* Loading State */}
        {loading && (
          <div className="flex flex-col items-center justify-center min-h-[40vh]">
            <div className="w-14 h-14 border-4 border-slate-200 dark:border-slate-700 border-t-primary dark:border-t-primary rounded-full animate-spin"></div>
            <p className="mt-6 text-slate-500 dark:text-slate-400 text-sm font-medium">Cargando historial...</p>
          </div>
        )}

        {/* Empty State */}
        {!loading && ordenes.length === 0 && (
          <div className="flex flex-col items-center justify-center min-h-[40vh] text-center">
            <div className="w-24 h-24 bg-slate-100 dark:bg-slate-800/50 rounded-full flex items-center justify-center mb-6">
              <svg className="w-12 h-12 text-slate-400 dark:text-slate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
              </svg>
            </div>
            <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-3">No tienes órdenes aún</h2>
            <p className="text-slate-500 dark:text-slate-400 text-sm mb-8 max-w-md">
              Cuando realices tu primera compra, aquí podrás ver el detalle y seguimiento de todas tus órdenes.
            </p>
            <a
              href="/tienda/catalogo"
              className="inline-flex items-center gap-2 bg-primary hover:bg-primary/80 text-slate-900 dark:text-white font-semibold py-3 px-6 rounded-xl transition-colors shadow-lg shadow-primary/20"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
              </svg>
              Explorar Catálogo
            </a>
          </div>
        )}

        {/* Orders List */}
        {!loading && ordenes.length > 0 && (
          <div className="space-y-4">
            {ordenes.map((orden) => {
              const config = getEstadoConfig(orden.estado);
              const isExpanded = expandedId === orden.id;
              const productos = Array.isArray(orden.productos) ? orden.productos : [];

              return (
                <div
                  key={orden.id}
                  className={`bg-white dark:bg-[#13151f] border rounded-2xl overflow-hidden transition-all shadow-sm ${
                    isExpanded ? 'border-primary/50 shadow-md shadow-primary/10' : 'border-slate-200 dark:border-white/5 hover:border-slate-300 dark:hover:border-slate-700'
                  }`}
                >
                  {/* Order Header */}
                  <button
                    onClick={() => toggleExpand(orden.id)}
                    className="w-full flex flex-col sm:flex-row sm:items-center justify-between p-5 gap-4 text-left"
                  >
                    <div className="flex items-center gap-4 min-w-0">
                      {/* Order icon */}
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${config.color}`}>
                        {config.icon}
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-bold text-slate-900 dark:text-white">
                          Orden #{orden.id.slice(0, 8).toUpperCase()}
                        </p>
                        <p className="text-xs text-slate-500 mt-0.5 truncate">
                          {formatFecha(orden.fecha)}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-4 sm:gap-6 shrink-0">
                      {/* Items count */}
                      <div className="text-right hidden sm:block">
                        <p className="text-xs text-slate-500">Artículos</p>
                        <p className="text-sm font-semibold text-slate-900 dark:text-white">{orden.items || productos.length}</p>
                      </div>

                      {/* Total */}
                      <div className="text-right">
                        <p className="text-xs text-slate-500">Total</p>
                        <p className="text-sm font-bold text-primary">S/ {parseFloat(orden.total).toFixed(2)}</p>
                      </div>

                      {/* Status badge */}
                      <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-full border ${config.color}`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${config.dot}`}></span>
                        {orden.estado}
                      </span>

                      {/* Expand arrow */}
                      <svg
                        className={`w-5 h-5 text-slate-400 dark:text-slate-500 transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}`}
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </div>
                  </button>

                  {/* Expanded Detail */}
                  {isExpanded && (
                    <div className="border-t border-slate-100 dark:border-white/5 bg-slate-50/50 dark:bg-black/20">
                      <div className="p-5">
                        <h4 className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-4">
                          Detalle de productos
                        </h4>
                        {productos.length > 0 ? (
                          <div className="space-y-3">
                            {productos.map((prod, idx) => (
                              <div
                                key={idx}
                                className="flex items-center justify-between bg-white dark:bg-[#13151f] border border-slate-200 dark:border-white/5 rounded-xl px-4 py-3 shadow-sm"
                              >
                                <div className="flex items-center gap-3 min-w-0">
                                  <div className="w-8 h-8 bg-slate-100 dark:bg-white/5 rounded-lg flex items-center justify-center text-xs font-bold text-slate-500 dark:text-slate-400 shrink-0">
                                    {prod.cantidad || 1}x
                                  </div>
                                  <span className="text-sm text-slate-900 dark:text-white font-medium truncate">
                                    {prod.nombre}
                                  </span>
                                </div>
                                <span className="text-sm font-semibold text-primary shrink-0 ml-4">
                                  S/ {(parseFloat(prod.precio) * (prod.cantidad || 1)).toFixed(2)}
                                </span>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p className="text-sm text-slate-500 italic">
                            No hay detalle de productos disponible para esta orden.
                          </p>
                        )}

                        {/* Order total summary */}
                        <div className="mt-4 pt-4 border-t border-slate-200 dark:border-white/5 flex items-center justify-between">
                          <span className="text-sm font-medium text-slate-500 dark:text-slate-400">Total de la orden</span>
                          <span className="text-lg font-bold text-primary">S/ {parseFloat(orden.total).toFixed(2)}</span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

      </div>
    </TiendaLayout>
  );
}
