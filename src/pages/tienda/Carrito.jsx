import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import TiendaLayout from '../../components/tienda/TiendaLayout';
import { useTienda } from '../../context/TiendaContext';
import { useAuth } from '../../context/AuthContext';

export default function Carrito() {
  const { carrito, removerDelCarrito, actualizarCantidad, totalCarrito, realizarCompra, comprando } = useTienda();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [compraExitosa, setCompraExitosa] = useState(false);
  const [errorCompra, setErrorCompra] = useState('');

  const handleComprar = async () => {
    setErrorCompra('');
    const resultado = await realizarCompra(user);
    if (resultado.requireAuth) {
      navigate('/login?redirect=/tienda/carrito');
      return;
    }
    if (resultado.success) {
      setCompraExitosa(true);
    } else {
      setErrorCompra(resultado.error || 'Error al procesar la compra');
    }
  };

  const cantidadCarrito = carrito.reduce((acc, item) => acc + item.cantidad, 0);

  return (
    <TiendaLayout>
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Carrito de Compras</h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">{cantidadCarrito} productos en tu carrito</p>
        </div>

        {compraExitosa ? (
          <div className="bg-white dark:bg-slate-800 rounded-2xl p-12 shadow-sm border border-slate-200 dark:border-slate-700 text-center">
            <div className="w-20 h-20 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-6 animate-bounce">
              <svg className="w-10 h-10 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">¡Compra realizada!</h2>
            <p className="text-slate-500 dark:text-slate-400 mb-8 max-w-md mx-auto">Tu orden ha sido creada exitosamente. Puedes ver el estado y los detalles en tu historial de compras.</p>
            <Link 
              to="/tienda/historial"
              className="inline-block bg-primary hover:bg-primary/90 text-white font-medium px-8 py-3 rounded-xl transition-colors"
            >
              Ver mis compras
            </Link>
          </div>
        ) : carrito.length === 0 ? (
          <div className="bg-white dark:bg-slate-800 rounded-2xl p-16 shadow-sm border border-slate-200 dark:border-slate-700 text-center flex flex-col items-center">
            <svg className="w-24 h-24 text-slate-300 dark:text-slate-600 mb-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
            <h3 className="text-lg font-medium text-slate-700 dark:text-slate-300 mb-2">Tu carrito está vacío</h3>
            <p className="text-slate-500 dark:text-slate-400 mb-8">Agrega productos desde el catálogo para comenzar tu compra</p>
            
            <Link 
              to="/tienda/catalogo"
              className="bg-primary hover:bg-primary/90 text-white font-medium px-8 py-3 rounded-xl transition-colors"
            >
              Ir al Catálogo
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-4">
              {carrito.map((item) => (
                <div key={item.id} className="bg-white dark:bg-slate-800 rounded-2xl p-4 sm:p-6 shadow-sm border border-slate-200 dark:border-slate-700 flex flex-col sm:flex-row gap-6">
                  <div className="w-full sm:w-32 h-32 bg-slate-100 dark:bg-slate-900 rounded-xl overflow-hidden shrink-0">
                    <img src={item.imagen || item.imagen_url} alt={item.nombre} className="w-full h-full object-cover" />
                  </div>
                  
                  <div className="flex-1 flex flex-col justify-between">
                    <div className="flex justify-between items-start gap-4">
                      <div>
                        <h3 className="font-bold text-slate-900 dark:text-white text-lg line-clamp-2">{item.nombre}</h3>
                        {item.categoria && (
                          <span className="text-sm text-slate-500 dark:text-slate-400 mt-1 block">{item.categoria}</span>
                        )}
                      </div>
                      <button 
                        onClick={() => removerDelCarrito(item.id)}
                        className="text-slate-400 hover:text-red-500 p-2 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
                        title="Eliminar del carrito"
                      >
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>

                    <div className="flex items-center justify-between mt-4">
                      <div className="flex items-center bg-slate-100 dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-700">
                        <button 
                          onClick={() => actualizarCantidad(item.id, item.cantidad - 1)}
                          className="px-3 py-1.5 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors font-medium"
                        >
                          -
                        </button>
                        <span className="px-4 py-1.5 text-sm font-semibold text-slate-900 dark:text-white border-x border-slate-200 dark:border-slate-700">
                          {item.cantidad}
                        </span>
                        <button 
                          onClick={() => actualizarCantidad(item.id, item.cantidad + 1)}
                          className="px-3 py-1.5 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors font-medium"
                        >
                          +
                        </button>
                      </div>
                      <p className="text-xl font-bold text-primary">${(item.precio * item.cantidad).toFixed(2)}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="lg:col-span-1">
              <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-sm border border-slate-200 dark:border-slate-700 sticky top-6">
                <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-6">Resumen del pedido</h2>
                
                <div className="space-y-4 mb-6">
                  <div className="flex justify-between text-slate-600 dark:text-slate-400">
                    <span>Subtotal ({cantidadCarrito} productos)</span>
                    <span className="font-medium text-slate-900 dark:text-white">${totalCarrito.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-slate-600 dark:text-slate-400">
                    <span>Envío</span>
                    <span className="font-medium text-green-500">Gratis</span>
                  </div>
                  <div className="border-t border-slate-200 dark:border-slate-700 pt-4 flex justify-between items-center">
                    <span className="text-lg font-bold text-slate-900 dark:text-white">Total</span>
                    <span className="text-2xl font-extrabold text-primary">${totalCarrito.toFixed(2)}</span>
                  </div>
                </div>

                {errorCompra && (
                  <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-500 text-sm text-center font-medium">
                    {errorCompra}
                  </div>
                )}

                <button 
                  onClick={handleComprar}
                  disabled={comprando}
                  className="w-full bg-primary hover:bg-primary/90 disabled:opacity-50 disabled:hover:bg-primary text-white py-4 rounded-xl font-bold transition-all shadow-lg shadow-primary/20 flex items-center justify-center gap-2"
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
              </div>
            </div>
          </div>
        )}
      </div>
    </TiendaLayout>
  );
}
