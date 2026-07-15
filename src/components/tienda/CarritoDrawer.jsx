import { useState } from 'react';
import { useTienda } from '../../context/TiendaContext';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';

export default function CarritoDrawer() {
  const { isCarritoOpen, setIsCarritoOpen, carrito, removerDelCarrito, actualizarCantidad, totalCarrito, realizarCompra, comprando } = useTienda();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [compraExitosa, setCompraExitosa] = useState(false);
  const [errorCompra, setErrorCompra] = useState('');

  if (!isCarritoOpen) return null;

  const handleComprar = async () => {
    setErrorCompra('');
    const resultado = await realizarCompra(user);
    if (resultado.requireAuth) {
      setIsCarritoOpen(false);
      navigate('/login?redirect=/tienda/carrito');
      return;
    }
    if (resultado.success) {
      setCompraExitosa(true);
      setTimeout(() => {
        setCompraExitosa(false);
        setIsCarritoOpen(false);
      }, 3000);
    } else {
      setErrorCompra(resultado.error || 'Error al procesar la compra');
    }
  };

  return (
    <>
      {/* Overlay oscuro */}
      <div 
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 transition-opacity"
        onClick={() => { setIsCarritoOpen(false); setCompraExitosa(false); setErrorCompra(''); }}
      />
      
      {/* Panel lateral */}
      <div className="fixed inset-y-0 right-0 w-full md:w-[400px] bg-white dark:bg-[#13151f] shadow-2xl shadow-black/50 z-50 flex flex-col transform transition-transform duration-300 ease-in-out border-l border-slate-200 dark:border-white/5">
        
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-200 dark:border-white/5">
          <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <svg className="w-6 h-6 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
            Tu Carrito
          </h2>
          <button 
            onClick={() => { setIsCarritoOpen(false); setCompraExitosa(false); setErrorCompra(''); }}
            className="text-slate-400 hover:text-slate-900 dark:hover:text-white p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800/50 transition-colors"
          >
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Compra exitosa */}
        {compraExitosa && (
          <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
            <div className="w-20 h-20 bg-green-50 dark:bg-green-500/20 rounded-full flex items-center justify-center mb-6 animate-bounce">
              <svg className="w-10 h-10 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">¡Compra realizada!</h3>
            <p className="text-slate-500 dark:text-slate-400">Tu orden ha sido creada exitosamente. Puedes ver el estado en tu historial de compras.</p>
          </div>
        )}

        {/* Productos */}
        {!compraExitosa && (
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            {carrito.length === 0 ? (
              <div className="text-center text-slate-400 mt-10">
                <svg className="w-16 h-16 mx-auto text-slate-300 dark:text-slate-600 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                </svg>
                <p>Tu carrito está vacío.</p>
                <button 
                  onClick={() => setIsCarritoOpen(false)}
                  className="mt-4 text-primary hover:text-primary/80 font-medium"
                >
                  Explorar productos
                </button>
              </div>
            ) : (
              carrito.map((item) => (
                <div key={item.id} className="flex gap-4 bg-slate-50 dark:bg-black/20 p-3 rounded-xl border border-slate-200 dark:border-white/5">
                  <img src={item.imagen || item.imagen_url} alt={item.nombre} className="w-20 h-20 object-cover rounded-lg bg-slate-200 dark:bg-slate-800" />
                  <div className="flex-1">
                    <h3 className="font-medium text-slate-900 dark:text-white text-sm line-clamp-2">{item.nombre}</h3>
                    <p className="text-primary font-bold mt-1">${item.precio.toFixed(2)}</p>
                    
                    <div className="flex items-center justify-between mt-3">
                      <div className="flex items-center bg-white dark:bg-slate-800 rounded-md border border-slate-200 dark:border-slate-700">
                        <button 
                          onClick={() => actualizarCantidad(item.id, item.cantidad - 1)}
                          className="px-2 py-1 text-slate-500 hover:text-slate-900 dark:hover:text-white"
                        >
                          -
                        </button>
                        <span className="px-2 text-sm font-semibold text-slate-900 dark:text-white">{item.cantidad}</span>
                        <button 
                          onClick={() => actualizarCantidad(item.id, item.cantidad + 1)}
                          className="px-2 py-1 text-slate-500 hover:text-slate-900 dark:hover:text-white"
                        >
                          +
                        </button>
                      </div>
                      
                      <button 
                        onClick={() => removerDelCarrito(item.id)}
                        className="text-slate-400 hover:text-red-500 p-1"
                        title="Eliminar"
                      >
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* Footer */}
        {!compraExitosa && carrito.length > 0 && (
          <div className="p-6 border-t border-slate-200 dark:border-white/5 bg-slate-50 dark:bg-[#13151f]">
            <div className="flex justify-between items-center mb-4 text-slate-900 dark:text-white">
              <span className="font-medium">Total</span>
              <span className="text-2xl font-bold">${totalCarrito.toFixed(2)}</span>
            </div>
            
            {errorCompra && (
              <div className="mb-4 p-3 bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 rounded-lg text-red-600 dark:text-red-400 text-sm text-center">
                {errorCompra}
              </div>
            )}

            <button 
              onClick={handleComprar}
              disabled={comprando}
              className="w-full bg-primary hover:bg-primary/90 disabled:opacity-50 text-white font-bold py-3 px-4 rounded-xl transition-all shadow-lg shadow-primary/25 flex items-center justify-center gap-2"
            >
              {comprando ? (
                <>
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Procesando...
                </>
              ) : (
                'Finalizar Compra'
              )}
            </button>
            <button 
              onClick={() => setIsCarritoOpen(false)}
              className="w-full mt-3 py-3 text-sm font-medium text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors"
            >
              Seguir comprando
            </button>
          </div>
        )}
      </div>
    </>
  );
}
