import TiendaLayout from '../../components/tienda/TiendaLayout';
import ElegantCarousel from '../../components/ui/ElegantCarousel';

export default function NosotrosTienda() {
  return (
    <TiendaLayout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-20">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          <div>
            <h1 className="text-4xl md:text-5xl font-extrabold text-slate-900 dark:text-white mb-6 leading-tight">
              Revolucionando tu <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-purple-500">Setup</span>
            </h1>
            <p className="text-lg text-slate-600 dark:text-slate-400 mb-8 leading-relaxed">
              En NeuroTek Store nos apasiona la tecnología de alto rendimiento. Nacimos con la misión de brindar a profesionales y gamers los equipos más avanzados del mercado, respaldados por un servicio excepcional y una experiencia de compra premium.
            </p>
            <div className="grid grid-cols-2 gap-6">
              <div className="p-6 bg-white dark:bg-[#13151f] rounded-2xl border border-slate-200 dark:border-white/5 shadow-sm text-center">
                <h3 className="text-4xl font-black text-slate-900 dark:text-white mb-2">+500</h3>
                <p className="text-slate-500 dark:text-slate-400 font-medium">Productos Premium</p>
              </div>
              <div className="p-6 bg-white dark:bg-[#13151f] rounded-2xl border border-slate-200 dark:border-white/5 shadow-sm text-center">
                <h3 className="text-4xl font-black text-slate-900 dark:text-white mb-2">99%</h3>
                <p className="text-slate-500 dark:text-slate-400 font-medium">Clientes Satisfechos</p>
              </div>
            </div>
          </div>
          
          <div className="relative group">
            <div className="absolute inset-0 bg-gradient-to-tr from-primary to-purple-500 blur-2xl opacity-20 rounded-3xl transition-opacity duration-500 group-hover:opacity-40"></div>
            <div className="relative aspect-square md:aspect-auto md:h-full min-h-[400px] bg-slate-100 dark:bg-slate-800 rounded-[2rem] md:rounded-[3rem] overflow-hidden border border-slate-200 dark:border-white/10 shadow-2xl">
              {/* Imagen de fondo (Setup Gaming / Oficina) */}
              <img 
                src="https://images.unsplash.com/photo-1598550476439-6847785fcea6?auto=format&fit=crop&w=800&q=80" 
                alt="Setup Tecnológico" 
                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
              />
              {/* Overlay oscuro para que el texto resalte */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent"></div>
              
              {/* Contenido sobre la imagen */}
              <div className="absolute bottom-0 left-0 w-full p-8 md:p-10 flex flex-col justify-end">
                 <h3 className="text-3xl md:text-4xl font-extrabold text-white mb-3 tracking-tight">Calidad e Innovación</h3>
                 <p className="text-white/80 text-lg max-w-sm">
                   Comprometidos con brindarte la mejor tecnología del mañana, hoy.
                 </p>
              </div>
            </div>
          </div>
        </div>

        {/* Valores */}
        <div className="mt-32 grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="p-8 bg-white dark:bg-[#13151f] rounded-3xl border border-slate-200 dark:border-white/5 shadow-sm">
            <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center mb-6 text-primary">
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-3">Velocidad y Rendimiento</h3>
            <p className="text-slate-500 dark:text-slate-400">Sabemos que cada milisegundo cuenta. Por eso solo ofrecemos componentes de élite que garantizan el máximo rendimiento.</p>
          </div>
          <div className="p-8 bg-white dark:bg-[#13151f] rounded-3xl border border-slate-200 dark:border-white/5 shadow-sm">
            <div className="w-12 h-12 bg-purple-500/10 rounded-xl flex items-center justify-center mb-6 text-purple-500">
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
              </svg>
            </div>
            <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-3">Confianza Absoluta</h3>
            <p className="text-slate-500 dark:text-slate-400">Garantía total en todos nuestros equipos y un soporte técnico compuesto por expertos apasionados por el hardware.</p>
          </div>
          <div className="p-8 bg-white dark:bg-[#13151f] rounded-3xl border border-slate-200 dark:border-white/5 shadow-sm">
            <div className="w-12 h-12 bg-green-500/10 rounded-xl flex items-center justify-center mb-6 text-green-500">
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
            </div>
            <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-3">Innovación Constante</h3>
            <p className="text-slate-500 dark:text-slate-400">Renovamos constantemente nuestro catálogo para que siempre tengas acceso a la última tecnología apenas sale al mercado.</p>
          </div>
        </div>

        {/* Sección del Equipo con Carousel */}
        <div className="mt-32">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-extrabold text-slate-900 dark:text-white mb-4">
              El Equipo Detrás de la Magia
            </h2>
            <p className="text-lg text-slate-600 dark:text-slate-400 max-w-2xl mx-auto">
              Conoce a los expertos que trabajan día a día para que tu experiencia en NeuroTek sea inigualable.
            </p>
          </div>

          <ElegantCarousel />
        </div>

      </div>
    </TiendaLayout>
  );
}
