import { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import TiendaLayout from '../../components/tienda/TiendaLayout';
import { useTienda } from '../../context/TiendaContext';
import { supabase } from '../../lib/supabase';

export default function CatalogoTienda() {
  const { agregarAlCarrito } = useTienda();
  const [productos, setProductos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busqueda, setBusqueda] = useState('');
  const [categoriaActiva, setCategoriaActiva] = useState('Todos');

  // Fetch initial products
  useEffect(() => {
    async function fetchProductos() {
      setLoading(true);
      const { data, error } = await supabase
        .from('productos')
        .select('*')
        .eq('activo', true)
        .order('created_at', { ascending: false });

      if (!error && data) {
        setProductos(data);
      }
      setLoading(false);
    }

    fetchProductos();
  }, []);

  // Real-time subscription
  useEffect(() => {
    const channel = supabase
      .channel('productos-realtime')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'productos' },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            if (payload.new.activo) {
              setProductos((prev) => [payload.new, ...prev]);
            }
          } else if (payload.eventType === 'UPDATE') {
            if (payload.new.activo) {
              setProductos((prev) =>
                prev.map((p) => (p.id === payload.new.id ? payload.new : p))
              );
            } else {
              setProductos((prev) =>
                prev.filter((p) => p.id !== payload.new.id)
              );
            }
          } else if (payload.eventType === 'DELETE') {
            setProductos((prev) =>
              prev.filter((p) => p.id !== payload.old.id)
            );
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  // Derive unique categories from real data
  const categorias = useMemo(() => {
    const uniqueCats = [...new Set(productos.map((p) => p.categoria).filter(Boolean))];
    uniqueCats.sort();
    return ['Todos', ...uniqueCats];
  }, [productos]);

  // Filtered products (search + category)
  const productosFiltrados = useMemo(() => {
    return productos.filter((p) => {
      const matchBusqueda = p.nombre
        .toLowerCase()
        .includes(busqueda.toLowerCase());
      const matchCategoria =
        categoriaActiva === 'Todos' || p.categoria === categoriaActiva;
      return matchBusqueda && matchCategoria;
    });
  }, [productos, busqueda, categoriaActiva]);

  const handleAgregarCarrito = (producto) => {
    agregarAlCarrito({
      id: producto.id,
      nombre: producto.nombre,
      precio: producto.precio,
      imagen: producto.imagen_url,
    });
  };

  return (
    <TiendaLayout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

        {/* Header del Catálogo */}
        <div className="flex flex-col gap-6 mb-8">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4">
            <div>
              <h1 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">
                Catálogo de Productos
              </h1>
              <p className="text-slate-500 dark:text-slate-400 text-sm">
                {loading
                  ? 'Cargando productos...'
                  : `Mostrando ${productosFiltrados.length} de ${productos.length} productos`}
              </p>
            </div>

          </div>

          {/* Filtros de categoría */}
          <div className="flex gap-2 overflow-x-auto pb-2 w-full scrollbar-hide">
            {categorias.map((cat) => (
              <button
                key={cat}
                onClick={() => setCategoriaActiva(cat)}
                className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all duration-200 ${
                  categoriaActiva === cat
                    ? 'bg-primary text-white shadow-md shadow-primary/30'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Barra de búsqueda */}
          <div className="relative w-full max-w-md">
            <svg
              className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
            <input
              type="text"
              placeholder="Buscar productos..."
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-colors text-sm"
            />
          </div>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="flex flex-col items-center justify-center py-24">
            <div className="w-12 h-12 border-4 border-slate-200 dark:border-slate-700 border-t-primary rounded-full animate-spin mb-4"></div>
            <p className="text-slate-500 dark:text-slate-400 text-sm font-medium">
              Cargando catálogo...
            </p>
          </div>
        )}

        {/* Empty State */}
        {!loading && productosFiltrados.length === 0 && (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <div className="w-20 h-20 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mb-6">
              <svg
                className="w-10 h-10 text-slate-400"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"
                />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">
              No se encontraron productos
            </h3>
            <p className="text-slate-500 dark:text-slate-400 text-sm max-w-md">
              No hay productos que coincidan con tu búsqueda
              {categoriaActiva !== 'Todos' && ` en la categoría "${categoriaActiva}"`}.
              Intenta con otros filtros.
            </p>
            <button
              onClick={() => {
                setBusqueda('');
                setCategoriaActiva('Todos');
              }}
              className="mt-6 px-6 py-2.5 bg-primary text-white rounded-xl text-sm font-medium hover:bg-primary/90 transition-colors"
            >
              Limpiar filtros
            </button>
          </div>
        )}

        {/* Grid de Productos */}
        {!loading && productosFiltrados.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {productosFiltrados.map((producto) => (
              <div
                key={producto.id}
                className="bg-white dark:bg-slate-800/60 rounded-2xl overflow-hidden shadow-sm border border-slate-200 dark:border-slate-700/50 hover:shadow-xl dark:hover:shadow-2xl dark:hover:shadow-primary/5 transition-all duration-300 group relative flex flex-col"
              >
                {/* Badge: últimas unidades */}
                {producto.stock <= 5 && producto.stock > 0 && (
                  <div className="absolute top-3 left-3 bg-red-500 text-white text-xs font-bold px-3 py-1 rounded-full z-10 shadow-md">
                    ¡Últimas unidades!
                  </div>
                )}

                {/* Badge: sin stock */}
                {producto.stock === 0 && (
                  <div className="absolute top-3 left-3 bg-slate-700 text-white text-xs font-bold px-3 py-1 rounded-full z-10 shadow-md">
                    Agotado
                  </div>
                )}

                {/* Category Badge */}
                {producto.categoria && (
                  <div className="absolute top-3 right-3 bg-white/90 dark:bg-slate-900/80 backdrop-blur-sm text-slate-700 dark:text-slate-300 text-xs font-medium px-2.5 py-1 rounded-full z-10 border border-slate-200 dark:border-slate-600">
                    {producto.categoria}
                  </div>
                )}

                {/* Imagen del Producto */}
                <Link to={`/tienda/producto/${producto.id}`} className="relative aspect-square overflow-hidden bg-slate-100 dark:bg-slate-900/50">
                  {producto.imagen_url ? (
                    <img
                      src={producto.imagen_url}
                      alt={producto.nombre}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      loading="lazy"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <svg
                        className="w-16 h-16 text-slate-300 dark:text-slate-600"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={1}
                          d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                        />
                      </svg>
                    </div>
                  )}
                </Link>

                {/* Info del Producto */}
                <div className="p-5 flex flex-col flex-grow">
                  <Link
                    to={`/tienda/producto/${producto.id}`}
                    className="block"
                  >
                    <h3 className="font-semibold text-slate-900 dark:text-white text-sm mb-3 line-clamp-2 h-10 hover:text-primary transition-colors">
                      {producto.nombre}
                    </h3>
                  </Link>

                  {/* Precio y Disponibilidad */}
                  <div className="flex justify-between items-end mb-4 mt-auto">
                    <span className="text-lg font-bold text-primary">
                      ${producto.precio.toFixed(2)}
                    </span>
                    <span
                      className={`text-xs font-medium ${
                        producto.stock === 0
                          ? 'text-red-500'
                          : producto.stock <= 5
                          ? 'text-amber-500'
                          : 'text-slate-500 dark:text-slate-400'
                      }`}
                    >
                      {producto.stock === 0
                        ? 'Sin stock'
                        : `${producto.stock} disponibles`}
                    </span>
                  </div>

                  {/* Botón Añadir al Carrito */}
                  <button
                    onClick={() => handleAgregarCarrito(producto)}
                    disabled={producto.stock === 0}
                    className={`w-full font-semibold py-2.5 rounded-xl flex items-center justify-center gap-2 transition-all duration-200 text-sm ${
                      producto.stock === 0
                        ? 'bg-slate-100 dark:bg-slate-700 text-slate-400 dark:text-slate-500 cursor-not-allowed'
                        : 'bg-slate-100 dark:bg-slate-700 hover:bg-primary hover:text-white text-slate-700 dark:text-slate-200 hover:shadow-lg hover:shadow-primary/25'
                    }`}
                  >
                    <svg
                      className="w-4 h-4"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"
                      />
                    </svg>
                    {producto.stock === 0 ? 'No disponible' : 'Agregar al carrito'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </TiendaLayout>
  );
}
