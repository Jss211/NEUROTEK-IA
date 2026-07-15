import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import TiendaLayout from '../../components/tienda/TiendaLayout';
import { supabase } from '../../lib/supabase';
import { useTienda } from '../../context/TiendaContext';

export default function InicioTienda() {
  const { user } = useAuth();
  const userName = user?.user_metadata?.full_name?.split(' ')[0] || 'Usuario';
  const { agregarAlCarrito } = useTienda();

  const [productosDestacados, setProductosDestacados] = useState([]);
  const [loadingDestacados, setLoadingDestacados] = useState(true);

  useEffect(() => {
    async function fetchDestacados() {
      setLoadingDestacados(true);
      const { data, error } = await supabase
        .from('productos')
        .select('*')
        .eq('activo', true)
        .order('created_at', { ascending: false })
        .limit(4);

      if (!error && data) {
        setProductosDestacados(data);
      }
      setLoadingDestacados(false);
    }

    fetchDestacados();
  }, []);

  return (
    <TiendaLayout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-16">
        
        {/* PREMIUM HERO SECTION */}
        <div className="relative rounded-3xl overflow-hidden shadow-sm dark:shadow-2xl bg-white dark:bg-[#0f1117] border border-slate-200 dark:border-transparent min-h-[450px] flex items-center">
          {/* Fondo Abstracto (Glassmorphism & Gradients) */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-50 dark:opacity-100">
            <div className="absolute -top-[20%] -right-[10%] w-[60%] h-[80%] bg-primary/20 blur-[120px] rounded-full dark:mix-blend-screen mix-blend-multiply"></div>
            <div className="absolute -bottom-[20%] -left-[10%] w-[50%] h-[60%] bg-purple-600/20 blur-[100px] rounded-full dark:mix-blend-screen mix-blend-multiply"></div>
            <div className="absolute inset-0 bg-gradient-to-r from-white via-white/80 dark:from-[#0f1117] dark:via-[#0f1117]/80 to-transparent"></div>
          </div>

          <div className="relative z-10 px-8 md:px-16 py-12 max-w-3xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-primary font-medium text-sm mb-6 backdrop-blur-md">
              <span className="w-2 h-2 rounded-full bg-primary animate-pulse"></span>
              Nueva Colección 2026
            </div>
            
            <h1 className="text-4xl md:text-6xl font-extrabold text-slate-900 dark:text-white mb-6 leading-tight tracking-tight">
              Bienvenido{user ? `, ${userName}` : ' a NeuroTek'}. <br/>
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-purple-500 dark:to-purple-400">
                Eleva tu Setup
              </span>
            </h1>
            
            <p className="text-slate-600 dark:text-slate-300 text-lg md:text-xl mb-10 max-w-xl leading-relaxed">
              Descubre la tecnología más avanzada para potenciar tu productividad y llevar tu experiencia gamer al siguiente nivel.
            </p>
            
            <div className="flex flex-wrap items-center gap-4">
              <Link to="/tienda/catalogo" className="px-8 py-4 bg-primary hover:bg-primary/90 text-white dark:text-slate-900 font-bold rounded-xl transition-all hover:scale-105 hover:shadow-lg hover:shadow-primary/30 flex items-center gap-2">
                Explorar Catálogo
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                </svg>
              </Link>
              {user && (
                <Link to="/tienda/historial" className="px-8 py-4 bg-slate-100 dark:bg-white/5 hover:bg-slate-200 dark:hover:bg-white/10 text-slate-700 dark:text-white font-medium rounded-xl border border-slate-200 dark:border-white/10 backdrop-blur-md transition-all">
                  Ver mis compras
                </Link>
              )}
            </div>
          </div>
        </div>

        {/* VENTAJAS PREMIUM (Rediseñado según la petición del usuario) */}
        <div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Tarjeta 1 */}
            <div className="group bg-white dark:bg-[#13151f] p-8 rounded-2xl border border-slate-200 dark:border-white/5 hover:border-primary/50 transition-all hover:-translate-y-1 shadow-sm hover:shadow-xl hover:shadow-primary/5 relative overflow-hidden">
              <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                <svg className="w-24 h-24 text-primary" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/></svg>
              </div>
              <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center mb-6 text-primary group-hover:scale-110 transition-transform">
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
              </div>
              <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-3">Envíos Express Privados</h3>
              <p className="text-slate-500 dark:text-slate-400 text-sm leading-relaxed">Olvídate de esperas. Entregas garantizadas en menos de 24 horas a la puerta de tu casa con empaque premium de seguridad.</p>
            </div>

            {/* Tarjeta 2 */}
            <div className="group bg-white dark:bg-[#13151f] p-8 rounded-2xl border border-slate-200 dark:border-white/5 hover:border-purple-500/50 transition-all hover:-translate-y-1 shadow-sm hover:shadow-xl hover:shadow-purple-500/5 relative overflow-hidden">
              <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                <svg className="w-24 h-24 text-purple-500" fill="currentColor" viewBox="0 0 24 24"><path d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z"/></svg>
              </div>
              <div className="w-12 h-12 bg-purple-500/10 rounded-xl flex items-center justify-center mb-6 text-purple-500 group-hover:scale-110 transition-transform">
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>
              </div>
              <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-3">Garantía Elite Plus</h3>
              <p className="text-slate-500 dark:text-slate-400 text-sm leading-relaxed">Todos nuestros equipos cuentan con 12 meses de cobertura total contra defectos de fábrica, sin letras pequeñas ni trámites lentos.</p>
            </div>

            {/* Tarjeta 3 */}
            <div className="group bg-white dark:bg-[#13151f] p-8 rounded-2xl border border-slate-200 dark:border-white/5 hover:border-green-500/50 transition-all hover:-translate-y-1 shadow-sm hover:shadow-xl hover:shadow-green-500/5 relative overflow-hidden">
              <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                <svg className="w-24 h-24 text-green-500" fill="currentColor" viewBox="0 0 24 24"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
              </div>
              <div className="w-12 h-12 bg-green-500/10 rounded-xl flex items-center justify-center mb-6 text-green-500 group-hover:scale-110 transition-transform">
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" /></svg>
              </div>
              <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-3">Pagos Seguros VIP</h3>
              <p className="text-slate-500 dark:text-slate-400 text-sm leading-relaxed">Tus transacciones están protegidas con encriptación militar de 256 bits. Aceptamos todas las tarjetas y criptomonedas seleccionadas.</p>
            </div>
          </div>
        </div>

        {/* ESCAPARATE DE PRODUCTOS */}
        <div>
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Lo Más Top del Mes</h2>
              <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">Selección especial de equipos de alto rendimiento.</p>
            </div>
            <Link to="/tienda/catalogo" className="text-primary hover:text-primary/80 font-medium text-sm flex items-center gap-1">
              Ver todo el catálogo
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </Link>
          </div>

          {loadingDestacados ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {[1, 2, 3, 4].map(n => (
                <div key={n} className="bg-white dark:bg-[#13151f] rounded-2xl h-80 animate-pulse border border-slate-100 dark:border-white/5"></div>
              ))}
            </div>
          ) : productosDestacados.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {productosDestacados.map((prod) => (
                <Link key={prod.id} to={`/tienda/producto/${prod.id}`} className="group bg-white dark:bg-[#13151f] rounded-2xl overflow-hidden border border-slate-200 dark:border-white/5 hover:border-primary/50 transition-all hover:-translate-y-1 hover:shadow-xl flex flex-col">
                  {/* Etiqueta flotante */}
                  {prod.stock < 10 && prod.stock > 0 && (
                    <div className="absolute z-10 m-3 px-2 py-1 bg-red-500/90 backdrop-blur-sm text-white text-[10px] font-bold rounded-lg uppercase tracking-wider">
                      ¡Solo {prod.stock} left!
                    </div>
                  )}

                  {/* Imagen */}
                  <div className="aspect-[4/3] bg-slate-100 dark:bg-black/20 relative overflow-hidden">
                    {prod.imagen_url ? (
                      <img 
                        src={prod.imagen_url} 
                        alt={prod.nombre}
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <svg className="w-12 h-12 text-slate-300 dark:text-slate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                      </div>
                    )}
                    
                    {/* Hover Overlay Buttons */}
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3 backdrop-blur-[2px]">
                      <button 
                        onClick={(e) => { e.preventDefault(); agregarAlCarrito(prod); }}
                        className="w-10 h-10 rounded-full bg-primary text-slate-900 flex items-center justify-center hover:scale-110 transition-transform"
                        title="Añadir al carrito"
                      >
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" /></svg>
                      </button>
                    </div>
                  </div>
                  
                  {/* Info */}
                  <div className="p-5 flex flex-col flex-1">
                    <p className="text-xs text-primary font-medium mb-1 tracking-wider uppercase">{prod.categoria}</p>
                    <h3 className="font-bold text-slate-900 dark:text-white mb-2 line-clamp-2 leading-tight group-hover:text-primary transition-colors">{prod.nombre}</h3>
                    <div className="mt-auto pt-4 flex items-center justify-between border-t border-slate-100 dark:border-white/5">
                      <span className="text-lg font-black text-slate-900 dark:text-white">${parseFloat(prod.precio).toLocaleString()}</span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 bg-white dark:bg-[#13151f] rounded-2xl border border-slate-200 dark:border-white/5">
              <p className="text-slate-500 dark:text-slate-400">No hay productos destacados por el momento.</p>
            </div>
          )}
        </div>

      </div>
    </TiendaLayout>
  );
}
