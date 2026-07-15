import { useState, useEffect } from 'react';
import TiendaLayout from '../../components/tienda/TiendaLayout';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';

export default function NotificacionesCliente() {
  const { user } = useAuth();
  const [notificaciones, setNotificaciones] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }

    async function fetchNotifs() {
      setLoading(true);
      // Extraemos las órdenes recientes del cliente
      const { data: ordenes } = await supabase
        .from('ordenes')
        .select('*')
        .eq('cliente_id', user.id)
        .order('fecha', { ascending: false })
        .limit(10);
      
      const notifs = [];
      
      if (ordenes) {
        ordenes.forEach(o => {
          let tipo = 'info';
          let titulo = `Orden #${o.id.toString().substring(0,8)} Actualizada`;
          let mensaje = `Tu orden está en estado: ${o.estado}`;
          
          if (o.estado === 'Completada') {
            tipo = 'oferta';
            titulo = '¡Orden Completada!';
            mensaje = `Tu orden #${o.id.toString().substring(0,8)} ha sido entregada. ¡Gracias por tu compra!`;
          } else if (o.estado === 'Enviado') {
            tipo = 'alerta';
            titulo = '¡Pedido en camino!';
            mensaje = `Tu orden #${o.id.toString().substring(0,8)} ya está en camino a tu dirección.`;
          } else if (o.estado === 'Pendiente') {
            tipo = 'info';
            titulo = 'Pedido recibido';
            mensaje = `Hemos recibido tu orden #${o.id.toString().substring(0,8)} y la estamos procesando.`;
          } else if (o.estado === 'Cancelada') {
            tipo = 'info';
            titulo = 'Orden Cancelada';
            mensaje = `Tu orden #${o.id.toString().substring(0,8)} ha sido cancelada.`;
          }

          notifs.push({
            id: o.id,
            tipo,
            titulo,
            mensaje,
            fecha: new Date(o.fecha).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' }),
            leido: o.estado === 'Completada' || o.estado === 'Cancelada', // Simular leído para estados finales
            timestamp: new Date(o.fecha).getTime()
          });
        });
      }

      setNotificaciones(notifs);
      setLoading(false);
    }

    fetchNotifs();

    // Escuchar cambios en las órdenes de este cliente
    const channel = supabase.channel('cliente_notifs')
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'ordenes', 
        filter: `cliente_id=eq.${user.id}` 
      }, (payload) => {
        fetchNotifs(); // Recargar notificaciones si hay cambios
      })
      .subscribe();

    return () => supabase.removeChannel(channel);
  }, [user]);

  const eliminarNotificacion = (id) => {
    setNotificaciones(prev => prev.filter(n => n.id !== id));
  };

  return (
    <TiendaLayout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Notificaciones</h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">Mantente al tanto de tus pedidos en tiempo real</p>
        </div>

        {loading ? (
          <div className="flex justify-center py-12">
            <div className="animate-pulse text-primary font-medium">Cargando notificaciones...</div>
          </div>
        ) : notificaciones.length === 0 ? (
          <div className="bg-white dark:bg-white/5 border border-black/5 dark:border-white/10 rounded-2xl p-12 text-center">
            <div className="w-16 h-16 bg-slate-100 dark:bg-white/5 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-slate-400 dark:text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
              </svg>
            </div>
            <p className="text-slate-900 dark:text-white font-medium">Bandeja vacía</p>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Realiza una compra para recibir notificaciones sobre el estado de tu orden.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {notificaciones.map((notif) => (
              <div 
                key={notif.id} 
                className={`group flex items-start gap-4 p-5 rounded-2xl border transition ${
                  notif.leido 
                    ? 'bg-white dark:bg-[#13151f] border-slate-200 dark:border-white/5 hover:bg-slate-50 dark:hover:border-slate-700' 
                    : 'bg-white dark:bg-[#13151f] border-blue-200 dark:border-blue-500/30 shadow-sm'
                }`}
              >
                <div className="shrink-0 mt-1">
                  {notif.tipo === 'oferta' && (
                    <div className="w-10 h-10 rounded-full bg-green-50 dark:bg-green-500/10 flex items-center justify-center border border-green-100 dark:border-green-500/20">
                      <svg className="w-5 h-5 text-green-600 dark:text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                  )}
                  {notif.tipo === 'alerta' && (
                    <div className="w-10 h-10 rounded-full bg-yellow-50 dark:bg-yellow-500/10 flex items-center justify-center border border-yellow-100 dark:border-yellow-500/20">
                      <svg className="w-5 h-5 text-yellow-600 dark:text-yellow-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
                      </svg>
                    </div>
                  )}
                  {notif.tipo === 'info' && (
                    <div className="w-10 h-10 rounded-full bg-blue-50 dark:bg-blue-500/10 flex items-center justify-center border border-blue-100 dark:border-blue-500/20">
                      <svg className="w-5 h-5 text-blue-600 dark:text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                  )}
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <h3 className={`font-medium truncate pr-4 ${notif.leido ? 'text-slate-700 dark:text-slate-300' : 'text-slate-900 dark:text-white'}`}>
                      {notif.titulo}
                    </h3>
                    <button 
                      onClick={() => eliminarNotificacion(notif.id)}
                      className="text-slate-400 opacity-0 group-hover:opacity-100 hover:text-red-500 transition-all p-1 shrink-0" 
                      title="Eliminar notificación"
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                  <p className={`text-sm mt-1 ${notif.leido ? 'text-slate-500 dark:text-slate-400' : 'text-slate-600 dark:text-slate-300'}`}>
                    {notif.mensaje}
                  </p>
                  <p className="text-slate-400 dark:text-slate-500 text-xs mt-3">{notif.fecha}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </TiendaLayout>
  );
}
