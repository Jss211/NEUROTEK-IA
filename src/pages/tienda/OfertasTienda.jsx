import { useState, useEffect } from 'react';
import TiendaLayout from '../../components/tienda/TiendaLayout';
import { Link } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { useTienda } from '../../context/TiendaContext';

export default function OfertasTienda() {
  const [ofertas, setOfertas] = useState([]);
  const [loading, setLoading] = useState(true);
  const { agregarAlCarrito } = useTienda();

  // Fecha límite harcodeada para el 24 de Julio (puede cambiarse o venir de DB luego)
  const TARGET_DATE = new Date('2026-07-24T23:59:59').getTime();
  const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });
  const [isExpired, setIsExpired] = useState(false);

  useEffect(() => {
    cargarOfertas();

    // Lógica del Cronómetro
    const timer = setInterval(() => {
      const now = new Date().getTime();
      const distance = TARGET_DATE - now;

      if (distance < 0) {
        clearInterval(timer);
        setIsExpired(true);
      } else {
        setTimeLeft({
          days: Math.floor(distance / (1000 * 60 * 60 * 24)),
          hours: Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
          minutes: Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60)),
          seconds: Math.floor((distance % (1000 * 60)) / 1000),
        });
      }
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  async function cargarOfertas() {
    setLoading(true);
    const { data, error } = await supabase
      .from('productos')
      .select('*')
      .eq('activo', true)
      .eq('en_oferta', true)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error cargando ofertas:', error);
    } else {
      setOfertas(data || []);
    }
    setLoading(false);
  }

  const handleAgregar = (producto) => {
    if (producto.stock === 0) return;
    agregarAlCarrito({
      id: producto.id,
      nombre: producto.nombre,
      precio: producto.precio_oferta || producto.precio,
      imagen: producto.imagen_url
    });
  };

  return (
    <TiendaLayout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-20">
        <div className="text-center max-w-3xl mx-auto mb-12">
          <h1 className="text-4xl md:text-5xl font-extrabold text-slate-900 dark:text-white mb-6">
            Ofertas Exclusivas
          </h1>
          <p className="text-lg text-slate-600 dark:text-slate-400 mb-8">
            Aprovecha nuestros descuentos especiales por tiempo limitado en componentes, periféricos y más.
          </p>

          {/* CRONÓMETRO */}
          {!isExpired && (
            <div className="flex justify-center gap-4">
              <div className="flex flex-col items-center bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-3 w-20 shadow-sm">
                <span className="text-2xl font-bold text-primary">{String(timeLeft.days).padStart(2, '0')}</span>
                <span className="text-xs text-slate-500 uppercase font-semibold">Días</span>
              </div>
              <div className="flex flex-col items-center bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-3 w-20 shadow-sm">
                <span className="text-2xl font-bold text-primary">{String(timeLeft.hours).padStart(2, '0')}</span>
                <span className="text-xs text-slate-500 uppercase font-semibold">Hrs</span>
              </div>
              <div className="flex flex-col items-center bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-3 w-20 shadow-sm">
                <span className="text-2xl font-bold text-primary">{String(timeLeft.minutes).padStart(2, '0')}</span>
                <span className="text-xs text-slate-500 uppercase font-semibold">Min</span>
              </div>
              <div className="flex flex-col items-center bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-3 w-20 shadow-sm">
                <span className="text-2xl font-bold text-primary animate-pulse">{String(timeLeft.seconds).padStart(2, '0')}</span>
                <span className="text-xs text-slate-500 uppercase font-semibold">Seg</span>
              </div>
            </div>
          )}
        </div>
        
        {loading ? (
          <div className="flex flex-col items-center justify-center py-24">
            <div className="w-12 h-12 border-4 border-slate-200 dark:border-slate-700 border-t-primary rounded-full animate-spin mb-4"></div>
            <p className="text-slate-500 dark:text-slate-400 text-sm font-medium">Cargando ofertas...</p>
          </div>
        ) : isExpired || ofertas.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-12 bg-white dark:bg-[#13151f] rounded-3xl border border-slate-200 dark:border-white/5 shadow-sm text-center">
            <svg className="w-24 h-24 text-slate-300 dark:text-slate-700 mb-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-3">Productos en oferta próximamente</h2>
            <p className="text-slate-500 dark:text-slate-400 max-w-md mb-8">
              La temporada de ofertas ha terminado o estamos preparando una nueva selección de descuentos increíbles para ti. ¡Vuelve pronto!
            </p>
            <Link to="/tienda/catalogo" className="px-6 py-3 bg-primary hover:bg-primary/90 text-white font-medium rounded-xl transition-all shadow-md shadow-primary/20">
              Explorar el Catálogo
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {ofertas.map((producto) => (
              <div
                key={producto.id}
                className="bg-white dark:bg-slate-800/60 rounded-2xl overflow-hidden shadow-sm border border-slate-200 dark:border-slate-700/50 hover:shadow-xl dark:hover:shadow-2xl dark:hover:shadow-primary/5 transition-all duration-300 group relative flex flex-col"
              >
                {/* Top Left Badges Group */}
                <div className="absolute top-3 left-3 flex flex-col gap-2 z-10">
                  {/* Badge: sin stock */}
                  {producto.stock === 0 ? (
                    <div className="bg-slate-700 text-white text-xs font-bold px-3 py-1 rounded-full shadow-md">
                      Agotado
                    </div>
                  ) : (
                    /* Badge: últimas unidades */
                    producto.stock <= 5 && producto.stock > 0 && (
                      <div className="bg-red-500 text-white text-xs font-bold px-3 py-1 rounded-full shadow-md">
                        ¡Últimas unidades!
                      </div>
                    )
                  )}

                  {/* Offer Badge */}
                  <div className="bg-primary text-white text-xs font-black px-3 py-1.5 rounded-lg shadow-lg uppercase tracking-widest border border-primary-light">
                    Oferta
                  </div>
                </div>

                {/* Category Badge */}
                {producto.categoria && (
                  <div className="absolute top-3 right-3 bg-white/90 dark:bg-slate-900/80 backdrop-blur-sm text-slate-700 dark:text-slate-300 text-xs font-medium px-2.5 py-1 rounded-full z-10 border border-slate-200 dark:border-slate-600">
                    {producto.categoria}
                  </div>
                )}

                {/* Imagen */}
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
                      <svg className="w-16 h-16 text-slate-300 dark:text-slate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                    </div>
                  )}
                </Link>

                {/* Info */}
                <div className="p-5 flex flex-col flex-grow">
                  <Link to={`/tienda/producto/${producto.id}`} className="block">
                    <h3 className="font-semibold text-slate-900 dark:text-white text-sm mb-3 line-clamp-2 h-10 hover:text-primary transition-colors">
                      {producto.nombre}
                    </h3>
                  </Link>

                  <div className="flex justify-between items-end mb-4 mt-auto">
                    <div className="flex flex-col">
                      <span className="text-xl font-bold text-primary leading-none">
                        S/ {producto.precio_oferta.toFixed(2)}
                      </span>
                      <span className="text-xs text-slate-400 line-through mt-1">
                        S/ {producto.precio.toFixed(2)}
                      </span>
                    </div>
                    <span className={`text-xs font-medium ${producto.stock === 0 ? 'text-red-500' : producto.stock <= 5 ? 'text-amber-500' : 'text-slate-500 dark:text-slate-400'}`}>
                      {producto.stock === 0 ? 'Sin stock' : `${producto.stock} disp.`}
                    </span>
                  </div>

                  {/* Add to cart */}
                  <button
                    onClick={() => handleAgregar(producto)}
                    disabled={producto.stock === 0}
                    className={`w-full font-semibold py-2.5 rounded-xl flex items-center justify-center gap-2 transition-all duration-200 text-sm ${
                      producto.stock === 0
                        ? 'bg-slate-100 dark:bg-slate-700 text-slate-400 dark:text-slate-500 cursor-not-allowed'
                        : 'bg-primary hover:bg-primary/90 text-white shadow-lg shadow-primary/25'
                    }`}
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
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
