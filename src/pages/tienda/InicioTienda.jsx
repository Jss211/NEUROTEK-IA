import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import TiendaLayout from '../../components/tienda/TiendaLayout';
import { supabase } from '../../lib/supabase';
import { useTienda } from '../../context/TiendaContext';
import { useConfig } from '../../context/ConfigContext';
import { TypewriterText } from '../../components/ui/TypewriterText';
import { ClientsSection } from '../../components/ui/testimonial-card';

export default function InicioTienda() {
  const { user } = useAuth();
  const userName = user?.user_metadata?.full_name?.split(' ')[0] || 'Usuario';
  const { agregarAlCarrito } = useTienda();
  const { t, formatPrice, getLocalized } = useConfig();

  const [productosDestacados, setProductosDestacados] = useState([]);
  const [loadingDestacados, setLoadingDestacados] = useState(true);
  const [testimonios, setTestimonios] = useState([]);

  useEffect(() => {
    async function fetchData() {
      setLoadingDestacados(true);
      
      // Fetch productos
      const { data: prodData } = await supabase
        .from('productos')
        .select('*')
        .eq('activo', true)
        .order('created_at', { ascending: false })
        .limit(4);

      if (prodData) setProductosDestacados(prodData);
      
      // Fetch reviews
      const { data: revData } = await supabase
        .from('reviews')
        .select(`
          rating,
          comentario,
          nombre_usuario,
          avatar_url,
          productos(nombre)
        `)
        .order('created_at', { ascending: false })
        .limit(4);
        
      if (revData) {
        setTestimonios(revData.map(r => ({
          name: r.nombre_usuario,
          title: r.productos ? `Compró: ${r.productos.nombre}` : 'Cliente verificado',
          quote: r.comentario,
          avatarSrc: r.avatar_url || '',
          rating: r.rating
        })));
      }

      setLoadingDestacados(false);
    }

    fetchData();
  }, []);

  const statsData = [
    { value: "100%", label: "Pagos Seguros" },
    { value: "+1K", label: "Clientes Felices" },
    { value: "4.9", label: "Estrellas Promedio" },
  ];


  return (
    <TiendaLayout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-16">
        
        {/* PREMIUM HERO SECTION */}
        <div className="relative rounded-3xl overflow-hidden shadow-[0_0_50px_rgba(0,243,255,0.15)] bg-slate-100 dark:bg-[#050505] border border-primary/20 min-h-[450px] flex items-center">
          {/* Fondo Abstracto (Glassmorphism & Gradients) */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-100">
            <div className="absolute -top-[20%] -right-[10%] w-[60%] h-[80%] bg-primary/20 blur-[120px] rounded-full mix-blend-screen"></div>
            <div className="absolute -bottom-[20%] -left-[10%] w-[50%] h-[60%] bg-blue-600/20 blur-[100px] rounded-full mix-blend-screen"></div>
            <div className="absolute inset-0 bg-gradient-to-r from-slate-100 via-slate-100/80 dark:from-[#050505] dark:via-[#050505]/80 to-transparent"></div>
          </div>

          <div className="relative z-10 px-8 md:px-16 py-12 max-w-3xl">
            <h1 className="text-4xl md:text-6xl font-extrabold text-slate-900 dark:text-white mb-6 leading-tight tracking-tight h-[120px] md:h-auto">
              Bienvenido{user ? `, ${userName}` : ' a NeuroTek'}. <br/>
              <TypewriterText
                text={[
                  "Eleva tu Setup",
                  "Domina el Juego",
                  "Construye tu Sueño",
                  "Rendimiento Extremo",
                  "Tecnología de Punta"
                ]}
                speed={80}
                deleteSpeed={40}
                delay={2000}
                loop={true}
                className="text-primary drop-shadow-[0_0_5px_rgba(0,243,255,0.4)] inline-block mt-2"
              />
            </h1>
            
            <p className="text-lg md:text-xl text-slate-600 dark:text-slate-300 mb-10 max-w-2xl font-light">
                {t('home.hero.subtitle')}
              </p>
              
              <div className="flex flex-col sm:flex-row gap-4">
                <Link 
                  to="/tienda/catalogo"
                  className="bg-primary hover:bg-slate-900 dark:hover:bg-white text-white dark:text-black px-8 py-4 rounded-xl font-bold text-lg transition-all transform hover:scale-105 shadow-[0_0_20px_rgba(0,243,255,0.4)] hover:shadow-[0_0_30px_rgba(0,0,0,0.2)] dark:hover:shadow-[0_0_30px_rgba(255,255,255,0.6)] text-center flex items-center justify-center gap-2"
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
                  </svg>
                  {t('home.hero.btn.catalog')}
                </Link>
                <Link 
                  to="/tienda/ofertas"
                  className="bg-black/5 dark:bg-white/10 hover:bg-black/10 dark:hover:bg-white/20 backdrop-blur-md text-slate-900 dark:text-white border border-black/10 dark:border-white/20 px-8 py-4 rounded-xl font-bold text-lg transition-all text-center flex items-center justify-center gap-2"
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v13m0-13V6a2 2 0 112 2h-2zm0 0V5.5A2.5 2.5 0 109.5 8H12zm-7 4h14M5 12a2 2 0 110-4h14a2 2 0 110 4M5 12v7a2 2 0 002 2h10a2 2 0 002-2v-7" />
                  </svg>
                  {t('home.hero.btn.offers')}
                </Link>
              </div>
          </div>
        </div>

        {/* VENTAJAS PREMIUM */}
        <div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="bg-slate-50 dark:bg-[#050505] border border-slate-200 dark:border-slate-800 rounded-2xl p-6 flex flex-col items-center text-center transform hover:-translate-y-2 transition-all hover:border-primary/50 group">
            <div className="w-16 h-16 bg-slate-200 dark:bg-slate-900 rounded-full flex items-center justify-center mb-4 group-hover:bg-primary/20 transition-colors">
              <svg className="w-8 h-8 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
              </svg>
            </div>
            <h3 className="text-slate-900 dark:text-white font-bold text-lg mb-2">{t('home.features.shipping.title')}</h3>
            <p className="text-slate-500 dark:text-slate-400 text-sm">{t('home.features.shipping.desc')} {formatPrice(200)}</p>
          </div>
          
          <div className="bg-slate-50 dark:bg-[#050505] border border-slate-200 dark:border-slate-800 rounded-2xl p-6 flex flex-col items-center text-center transform hover:-translate-y-2 transition-all hover:border-primary/50 group">
            <div className="w-16 h-16 bg-slate-200 dark:bg-slate-900 rounded-full flex items-center justify-center mb-4 group-hover:bg-primary/20 transition-colors">
              <svg className="w-8 h-8 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192l-3.536 3.536M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-5 0a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
            </div>
            <h3 className="text-slate-900 dark:text-white font-bold text-lg mb-2">{t('home.features.support.title')}</h3>
            <p className="text-slate-500 dark:text-slate-400 text-sm">{t('home.features.support.desc')}</p>
          </div>

          <div className="bg-slate-50 dark:bg-[#050505] border border-slate-200 dark:border-slate-800 rounded-2xl p-6 flex flex-col items-center text-center transform hover:-translate-y-2 transition-all hover:border-primary/50 group">
            <div className="w-16 h-16 bg-slate-200 dark:bg-slate-900 rounded-full flex items-center justify-center mb-4 group-hover:bg-primary/20 transition-colors">
              <svg className="w-8 h-8 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
            </div>
            <h3 className="text-slate-900 dark:text-white font-bold text-lg mb-2">{t('home.features.warranty.title')}</h3>
            <p className="text-slate-500 dark:text-slate-400 text-sm">{t('home.features.warranty.desc')}</p>
          </div>

          <div className="bg-slate-50 dark:bg-[#050505] border border-slate-200 dark:border-slate-800 rounded-2xl p-6 flex flex-col items-center text-center transform hover:-translate-y-2 transition-all hover:border-primary/50 group">
            <div className="w-16 h-16 bg-slate-200 dark:bg-slate-900 rounded-full flex items-center justify-center mb-4 group-hover:bg-primary/20 transition-colors">
              <svg className="w-8 h-8 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
              </svg>
            </div>
            <h3 className="text-slate-900 dark:text-white font-bold text-lg mb-2">{t('home.features.secure.title')}</h3>
            <p className="text-slate-500 dark:text-slate-400 text-sm">{t('home.features.secure.desc')}</p>
          </div>
        </div>
        </div>

        {/* TESTIMONIOS (CLIENTS SECTION) */}
        <div className="py-8">
          <ClientsSection
            tagLabel="Clientes Reales"
            title="Lo que dicen de nosotros"
            description="Las reseñas de nuestros compradores en tiempo real. Únete a la familia NeuroTek y eleva tu setup."
            stats={statsData}
            testimonials={testimonios}
            primaryActionLabel="Ver Catálogo"
            secondaryActionLabel="Explorar Ofertas"
            onPrimaryClick={(e) => {
              e.preventDefault();
              window.location.href = '/tienda/catalogo';
            }}
            onSecondaryClick={(e) => {
              e.preventDefault();
              window.location.href = '/tienda/ofertas';
            }}
            className="rounded-3xl border border-slate-200 dark:border-white/5"
          />
        </div>

        {/* ESCAPARATE DE PRODUCTOS */}
        <div className="pt-8">
          <div className="flex flex-col md:flex-row justify-between items-end mb-8 border-b border-slate-200 dark:border-slate-800 pb-4">
            <div>
              <h2 className="text-3xl font-black text-slate-900 dark:text-white">{t('home.trending.title')}</h2>
              <p className="text-slate-500 dark:text-slate-400 mt-2">{t('home.trending.subtitle')}</p>
            </div>
            <Link to="/tienda/catalogo" className="text-primary hover:text-slate-900 dark:hover:text-white transition-colors text-sm font-bold flex items-center gap-1 mt-4 md:mt-0">
              {t('home.hero.btn.catalog')} <span aria-hidden="true">&rarr;</span>
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
                        alt={getLocalized(prod, 'nombre')}
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
                      
                    </div>
                  </div>
                  
                  {/* Info */}
                  <div className="p-5 flex flex-col flex-grow">
                    <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-1 line-clamp-1">{getLocalized(prod, 'nombre')}</h3>
                    <p className="text-slate-500 dark:text-slate-400 text-sm mb-4 line-clamp-2">{getLocalized(prod, 'descripcion')}</p>
                    
                    <div className="mt-auto flex items-end justify-between">
                      <div>
                        <p className="text-xs text-slate-500 uppercase tracking-wider mb-1">Precio</p>
                        <span className="text-lg font-black text-slate-900 dark:text-white">{formatPrice(prod.precio)}</span>
                      </div>
                      <button 
                        onClick={(e) => {
                          e.preventDefault(); // prevenir navegacion al Link
                          agregarAlCarrito(prod);
                        }}
                        className="bg-primary/10 text-primary hover:bg-primary hover:text-black p-3 rounded-xl transition-all"
                      >
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                        </svg>
                      </button>
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
