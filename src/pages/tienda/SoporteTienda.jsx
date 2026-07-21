import TiendaLayout from '../../components/tienda/TiendaLayout';
import { useState } from 'react';

export default function SoporteTienda() {
  const [formData, setFormData] = useState({
    nombre: '',
    email: '',
    asunto: '',
    mensaje: ''
  });
  const [enviado, setEnviado] = useState(false);
  const [enviando, setEnviando] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setEnviando(true);
    try {
      await fetch('https://formsubmit.co/ajax/jordanpmrojasbazan@gmail.com', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({
          _subject: `Reporte de Soporte: ${formData.asunto}`,
          Nombre: formData.nombre,
          Email: formData.email,
          Asunto: formData.asunto,
          Mensaje: formData.mensaje
        })
      });
      setEnviado(true);
      setTimeout(() => setEnviado(false), 5000);
      setFormData({ nombre: '', email: '', asunto: '', mensaje: '' });
    } catch (error) {
      console.error('Error al enviar:', error);
      alert('Hubo un error al enviar el reporte. Por favor, intenta de nuevo.');
    } finally {
      setEnviando(false);
    }
  };

  return (
    <TiendaLayout>
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-20">
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-extrabold text-slate-900 dark:text-white mb-6">
            Centro de Soporte
          </h1>
          <p className="text-lg text-slate-600 dark:text-slate-400 max-w-2xl mx-auto">
            ¿Tienes algún problema con un pedido o un equipo? Repórtalo completando el siguiente formulario y nuestro equipo te contactará directamente a tu correo electrónico.
          </p>
        </div>

        <div className="bg-white dark:bg-[#13151f] rounded-3xl border border-slate-200 dark:border-white/5 shadow-xl shadow-black/5 dark:shadow-none p-6 md:p-10 relative overflow-hidden">
          {/* Decorative background blur */}
          <div className="absolute -top-24 -right-24 w-64 h-64 bg-blue-500/10 blur-[80px] rounded-full pointer-events-none"></div>

          {enviado ? (
            <div className="text-center py-16 animate-in fade-in zoom-in duration-300">
              <div className="w-24 h-24 bg-green-50 dark:bg-green-500/10 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg shadow-green-500/10">
                <svg className="w-12 h-12 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h2 className="text-3xl font-extrabold text-slate-900 dark:text-white mb-4">¡Reporte Enviado con Éxito!</h2>
              <p className="text-lg text-slate-500 dark:text-slate-400 max-w-md mx-auto">
                Hemos recibido tu solicitud. Nuestro equipo técnico revisará el caso y te responderá a tu correo electrónico lo antes posible.
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6 relative z-10">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">Nombre completo</label>
                  <input 
                    type="text" 
                    required
                    value={formData.nombre}
                    onChange={(e) => setFormData({...formData, nombre: e.target.value})}
                    className="w-full px-5 py-4 rounded-xl bg-slate-50 dark:bg-black/20 border border-slate-200 dark:border-white/10 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all dark:text-white placeholder:text-slate-400"
                    placeholder="Ej. Alex García"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">Correo electrónico</label>
                  <input 
                    type="email" 
                    required
                    value={formData.email}
                    onChange={(e) => setFormData({...formData, email: e.target.value})}
                    className="w-full px-5 py-4 rounded-xl bg-slate-50 dark:bg-black/20 border border-slate-200 dark:border-white/10 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all dark:text-white placeholder:text-slate-400"
                    placeholder="tu@correo.com"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">Asunto o Número de Orden</label>
                <input 
                  type="text" 
                  required
                  value={formData.asunto}
                  onChange={(e) => setFormData({...formData, asunto: e.target.value})}
                  className="w-full px-5 py-4 rounded-xl bg-slate-50 dark:bg-black/20 border border-slate-200 dark:border-white/10 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all dark:text-white placeholder:text-slate-400"
                  placeholder="Ej. Problema con envío #NT-12345"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">Describe tu problema</label>
                <textarea 
                  required
                  rows="5"
                  value={formData.mensaje}
                  onChange={(e) => setFormData({...formData, mensaje: e.target.value})}
                  className="w-full px-5 py-4 rounded-xl bg-slate-50 dark:bg-black/20 border border-slate-200 dark:border-white/10 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all dark:text-white resize-none placeholder:text-slate-400"
                  placeholder="Detalla lo más posible la situación para poder ayudarte mejor..."
                ></textarea>
              </div>
              <button 
                type="submit" 
                disabled={enviando}
                className="w-full py-4 bg-primary hover:bg-primary/90 disabled:opacity-70 disabled:cursor-not-allowed text-white font-bold text-lg rounded-xl transition-all hover:scale-[1.01] hover:shadow-lg hover:shadow-primary/30 flex items-center justify-center gap-2 active:scale-95"
              >
                {enviando ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Enviando Reporte...
                  </>
                ) : (
                  <>
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                    </svg>
                    Enviar Reporte
                  </>
                )}
              </button>
            </form>
          )}
        </div>
      </div>
    </TiendaLayout>
  );
}
