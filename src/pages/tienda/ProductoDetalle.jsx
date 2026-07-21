import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import TiendaLayout from '../../components/tienda/TiendaLayout';
import { supabase } from '../../lib/supabase';
import { useTienda } from '../../context/TiendaContext';
import { useAuth } from '../../context/AuthContext';
import { Star } from 'lucide-react';

export default function ProductoDetalle() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { agregarAlCarrito } = useTienda();
  const { user } = useAuth();

  const [producto, setProducto] = useState(null);
  const [relacionados, setRelacionados] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [isWishlisted, setIsWishlisted] = useState(false);
  
  // Formularios de reseña
  const [nuevaResena, setNuevaResena] = useState('');
  const [nuevoRating, setNuevoRating] = useState(5);
  const [subiendoResena, setSubiendoResena] = useState(false);
  const [cantidad, setCantidad] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [imgError, setImgError] = useState(false);
  const [agregado, setAgregado] = useState(false);

  const [haComprado, setHaComprado] = useState(false);

  useEffect(() => {
    fetchProducto();
  }, [id]);

  async function fetchProducto() {
    setLoading(true);
    setError(null);
    setCantidad(1);
    setAgregado(false);
    setImgError(false);

    const { data, error: fetchError } = await supabase
      .from('productos')
      .select('*')
      .eq('id', id)
      .eq('activo', true)
      .single();

    if (fetchError || !data) {
      setError('Producto no encontrado');
      setLoading(false);
      return;
    }

    setProducto(data);

    // Fetch related products from same category
    const { data: related } = await supabase
      .from('productos')
      .select('*')
      .eq('categoria', data.categoria)
      .eq('activo', true)
      .neq('id', data.id)
      .limit(4);

    setRelacionados(related || []);
    
    // Fetch reviews
    const { data: revs } = await supabase
      .from('reviews')
      .select('*')
      .eq('producto_id', id)
      .order('created_at', { ascending: false });
    setReviews(revs || []);

    // Check wishlist and purchases if user is logged in
    const { data: sessionData } = await supabase.auth.getSession();
    const currentUser = sessionData?.session?.user;
    if (currentUser) {
      const { data: wlData } = await supabase
        .from('wishlist')
        .select('id')
        .eq('producto_id', id)
        .eq('usuario_id', currentUser.id)
        .maybeSingle();
      if (wlData) setIsWishlisted(true);

      // Check if user bought the product
      const { data: ordenesData } = await supabase
        .from('ordenes')
        .select('productos')
        .eq('cliente_id', currentUser.id);
      
      if (ordenesData) {
        const bought = ordenesData.some(orden => 
          Array.isArray(orden.productos) && orden.productos.some(p => p.id === id)
        );
        setHaComprado(bought);
      }
    }

    setLoading(false);
  }

  async function handleToggleWishlist() {
    if (!user) {
      alert("Inicia sesión para guardar productos en tu lista de deseos");
      return;
    }
    if (isWishlisted) {
      const { error } = await supabase.from('wishlist').delete().eq('producto_id', id).eq('usuario_id', user.id);
      if (error) return alert("Error al quitar: " + error.message);
      setIsWishlisted(false);
    } else {
      const { error } = await supabase.from('wishlist').insert({ producto_id: id, usuario_id: user.id });
      if (error) return alert("Falta crear la tabla en Supabase: " + error.message);
      setIsWishlisted(true);
    }
  }

  async function handleEnviarResena(e) {
    e.preventDefault();
    if (!user) return alert("Inicia sesión para dejar una reseña");
    if (!haComprado) return alert("Debes comprar el producto para dejar una reseña");
    if (!nuevaResena.trim()) return alert("Escribe un comentario");
    
    setSubiendoResena(true);
    const nombreUsuario = user.user_metadata?.full_name || 'Cliente';
    const avatarUrl = user.user_metadata?.avatar_url || null;
    
    const { data, error } = await supabase.from('reviews').insert({
      producto_id: id,
      usuario_id: user.id,
      nombre_usuario: nombreUsuario,
      avatar_url: avatarUrl,
      rating: nuevoRating,
      comentario: nuevaResena,
    }).select().single();

    if (error) {
      alert("Error al publicar la reseña (Probablemente falta crear la tabla en Supabase o añadir la columna avatar_url): " + error.message);
    } else if (data) {
      setReviews([data, ...reviews]);
      setNuevaResena('');
      setNuevoRating(5);
    }
    setSubiendoResena(false);
  }

  function handleAgregar() {
    if (!producto || producto.stock < 1) return;
    for (let i = 0; i < cantidad; i++) {
      agregarAlCarrito({
        id: producto.id,
        nombre: producto.nombre,
        precio: producto.en_oferta ? producto.precio_oferta : producto.precio,
        imagen: producto.imagen_url,
      });
    }
    setAgregado(true);
    setTimeout(() => setAgregado(false), 2000);
  }

  function handleCantidadChange(delta) {
    setCantidad((prev) => {
      const next = prev + delta;
      if (next < 1) return 1;
      if (producto && next > producto.stock) return producto.stock;
      return next;
    });
  }

  // Loading state
  if (loading) {
    return (
      <TiendaLayout>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="flex flex-col items-center justify-center min-h-[50vh]">
            <div className="relative">
              <div className="w-16 h-16 border-4 border-slate-200 dark:border-slate-700 border-t-primary dark:border-t-primary rounded-full animate-spin"></div>
            </div>
            <p className="mt-6 text-slate-500 dark:text-slate-400 text-sm font-medium">Cargando producto...</p>
          </div>
        </div>
      </TiendaLayout>
    );
  }

  // Error state
  if (error || !producto) {
    return (
      <TiendaLayout>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="flex flex-col items-center justify-center min-h-[50vh] text-center">
            <div className="w-20 h-20 bg-red-100 dark:bg-red-500/10 rounded-full flex items-center justify-center mb-6">
              <svg className="w-10 h-10 text-red-500 dark:text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-3">Producto no encontrado</h2>
            <p className="text-slate-500 dark:text-slate-400 mb-8 max-w-md">
              El producto que buscas no existe o ya no está disponible. Explora nuestro catálogo para encontrar lo que necesitas.
            </p>
            <Link
              to="/tienda/catalogo"
              className="inline-flex items-center gap-2 bg-primary hover:bg-primary/80 text-white font-semibold py-3 px-6 rounded-xl transition-colors shadow-lg shadow-primary/20"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              Volver al Catálogo
            </Link>
          </div>
        </div>
      </TiendaLayout>
    );
  }

  const stockBajo = producto.stock > 0 && producto.stock <= 5;
  const sinStock = producto.stock < 1;

  return (
    <TiendaLayout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

        {/* Back button */}
        <button
          onClick={() => navigate(-1)}
          className="inline-flex items-center gap-2 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white text-sm font-medium mb-8 transition-colors group"
        >
          <svg className="w-4 h-4 group-hover:-translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Volver al catálogo
        </button>

        {/* Product Detail Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 mb-16">

          {/* Product Image */}
          <div className="relative rounded-2xl overflow-hidden bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 aspect-square group">
            {!imgError && producto.imagen_url ? (
              <img
                src={producto.imagen_url}
                alt={producto.nombre}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                onError={() => setImgError(true)}
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-slate-50 dark:bg-slate-800/50">
                <svg className="w-24 h-24 text-slate-300 dark:text-slate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
            )}

            {/* Category badge */}
            <div className="absolute top-4 left-4 bg-primary/90 backdrop-blur-sm text-white text-xs font-bold px-3 py-1.5 rounded-full shadow-lg">
              {producto.categoria}
            </div>

            {/* Stock badge */}
            {stockBajo && (
              <div className="absolute top-4 right-4 bg-red-500/90 backdrop-blur-sm text-white text-xs font-bold px-3 py-1.5 rounded-full shadow-lg animate-pulse">
                ¡Últimas {producto.stock} unidades!
              </div>
            )}
            {sinStock && (
              <div className="absolute top-4 right-4 bg-slate-700/90 backdrop-blur-sm text-slate-200 text-xs font-bold px-3 py-1.5 rounded-full shadow-lg">
                Agotado
              </div>
            )}
          </div>

          {/* Product Info */}
          <div className="flex flex-col">
            {/* Brand & Model */}
            <div className="flex items-center gap-2 mb-3">
              {producto.marca && (
                <span className="text-xs font-semibold text-primary bg-primary/10 px-3 py-1 rounded-full uppercase tracking-wider">
                  {producto.marca}
                </span>
              )}
              {producto.modelo && (
                <span className="text-xs font-medium text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-3 py-1 rounded-full">
                  {producto.modelo}
                </span>
              )}
            </div>

            {/* Name */}
            <h1 className="text-3xl lg:text-4xl font-bold text-slate-900 dark:text-white mb-4 leading-tight">
              {producto.nombre}
            </h1>
            
            {/* Offer Badge */}
            {producto.en_oferta && (
              <div className="mb-4">
                <span className="inline-block bg-primary/10 border border-primary/20 text-primary text-xs font-black px-3 py-1.5 rounded-lg uppercase tracking-widest">
                  OFERTA ESPECIAL
                </span>
              </div>
            )}

            {/* Price */}
            <div className="flex items-baseline gap-3 mb-6">
              {producto.en_oferta ? (
                <>
                  <span className="text-4xl font-extrabold text-primary">
                    S/ {producto.precio_oferta.toFixed(2)}
                  </span>
                  <span className="text-xl text-slate-400 font-medium line-through">
                    S/ {producto.precio.toFixed(2)}
                  </span>
                </>
              ) : (
                <span className="text-4xl font-extrabold text-primary">
                  S/ {producto.precio.toFixed(2)}
                </span>
              )}
              <span className="text-sm text-slate-500 font-medium">PEN</span>
            </div>

            {/* Description */}
            <div className="bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 mb-6">
              <h3 className="text-sm font-semibold text-slate-500 dark:text-slate-300 uppercase tracking-wider mb-3">Descripción</h3>
              <p className="text-slate-700 dark:text-slate-400 leading-relaxed text-sm">
                {producto.descripcion || 'Sin descripción disponible para este producto.'}
              </p>
            </div>

            {/* Specs Grid */}
            <div className="grid grid-cols-2 gap-3 mb-8">
              <div className="bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-xl p-4">
                <p className="text-xs text-slate-500 font-medium mb-1">Categoría</p>
                <p className="text-sm font-semibold text-slate-900 dark:text-white">{producto.categoria}</p>
              </div>
              <div className="bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-xl p-4">
                <p className="text-xs text-slate-500 font-medium mb-1">Disponibilidad</p>
                <p className={`text-sm font-semibold ${sinStock ? 'text-red-500 dark:text-red-400' : stockBajo ? 'text-yellow-600 dark:text-yellow-400' : 'text-green-600 dark:text-green-400'}`}>
                  {sinStock ? 'Agotado' : `${producto.stock} en stock`}
                </p>
              </div>
              {producto.marca && (
                <div className="bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-xl p-4">
                  <p className="text-xs text-slate-500 font-medium mb-1">Marca</p>
                  <p className="text-sm font-semibold text-slate-900 dark:text-white">{producto.marca}</p>
                </div>
              )}
              {producto.modelo && (
                <div className="bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-xl p-4">
                  <p className="text-xs text-slate-500 font-medium mb-1">Modelo</p>
                  <p className="text-sm font-semibold text-slate-900 dark:text-white">{producto.modelo}</p>
                </div>
              )}
            </div>

            {/* Quantity & Add to Cart */}
            <div className="mt-auto space-y-4">
              {!sinStock && (
                <div className="flex items-center gap-4">
                  <label className="text-sm font-medium text-slate-600 dark:text-slate-400">Cantidad:</label>
                  <div className="flex items-center bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden">
                    <button
                      onClick={() => handleCantidadChange(-1)}
                      className="px-4 py-2 text-slate-500 hover:text-slate-900 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
                    >
                      -
                    </button>
                    <span className="w-12 text-center text-sm font-bold text-slate-900 dark:text-white border-x border-slate-200 dark:border-slate-700 py-2">
                      {cantidad}
                    </span>
                    <button
                      onClick={() => handleCantidadChange(1)}
                      className="px-4 py-2 text-slate-500 hover:text-slate-900 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
                    >
                      +
                    </button>
                  </div>
                </div>
              )}

              <div className="flex gap-4 w-full">
                <button
                  onClick={handleAgregar}
                  disabled={sinStock}
                  className={`flex-grow py-4 rounded-xl font-bold flex items-center justify-center gap-2 transition-all duration-300 ${
                    sinStock
                      ? 'bg-slate-200 dark:bg-slate-800 text-slate-400 dark:text-slate-500 cursor-not-allowed'
                      : agregado
                      ? 'bg-green-500 text-white shadow-lg shadow-green-500/25'
                      : 'bg-primary hover:bg-primary/90 text-white shadow-lg shadow-primary/25 hover:shadow-primary/40 hover:-translate-y-1'
                  }`}
                >
                  {agregado ? (
                    <>
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                      </svg>
                      ¡Añadido al carrito!
                    </>
                  ) : sinStock ? (
                    <>
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      Agotado
                    </>
                  ) : (
                    <>
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                      </svg>
                      Añadir {cantidad} al Carrito
                    </>
                  )}
                </button>
                <button
                  onClick={handleToggleWishlist}
                  className={`w-14 h-14 rounded-xl flex items-center justify-center transition-all flex-shrink-0 ${
                    isWishlisted
                      ? 'bg-pink-500/10 text-pink-500 border border-pink-500/50 shadow-[0_0_15px_rgba(236,72,153,0.3)]'
                      : 'bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-400 hover:text-pink-500 hover:bg-pink-500/10 hover:border-pink-500/30'
                  }`}
                  title={isWishlisted ? "Quitar de Lista de Deseos" : "Agregar a Lista de Deseos"}
                >
                  <svg className="w-6 h-6" fill={isWishlisted ? "currentColor" : "none"} viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={isWishlisted ? 1 : 2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* REVIEWS */}
        <div className="border-t border-slate-200 dark:border-slate-800 pt-12 mb-16">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Reseñas de Clientes ({reviews.length})</h2>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
            {/* Formulario de Reseña */}
            <div className="lg:col-span-1 bg-slate-50 dark:bg-slate-900/50 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 h-fit">
              <h3 className="font-bold text-lg mb-4 text-slate-900 dark:text-white">Dejar una reseña</h3>
              {user ? (
                haComprado ? (
                  <form onSubmit={handleEnviarResena} className="flex flex-col gap-4">
                    <div>
                      <label className="text-sm text-slate-500 mb-2 block">Calificación</label>
                      <div className="flex gap-2">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <button
                            key={star}
                            type="button"
                            onClick={() => setNuevoRating(star)}
                            className="focus:outline-none transition-transform hover:scale-110"
                          >
                            <Star className={`w-6 h-6 ${star <= nuevoRating ? 'text-yellow-400 fill-yellow-400' : 'text-slate-300 dark:text-slate-700'}`} />
                          </button>
                        ))}
                      </div>
                    </div>
                    <div>
                      <label className="text-sm text-slate-500 mb-2 block">Comentario</label>
                      <textarea
                        value={nuevaResena}
                        onChange={(e) => setNuevaResena(e.target.value)}
                        className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-3 text-sm focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
                        rows="4"
                        placeholder="¿Qué te pareció este producto?"
                        required
                      ></textarea>
                    </div>
                    <button
                      type="submit"
                      disabled={subiendoResena}
                      className="w-full bg-primary hover:bg-primary/90 text-white font-bold py-3 rounded-xl transition-all shadow-lg shadow-primary/20"
                    >
                      {subiendoResena ? 'Publicando...' : 'Publicar Reseña'}
                    </button>
                  </form>
                ) : (
                  <div className="text-center py-6">
                    <p className="text-slate-500 dark:text-slate-400 mb-4 text-sm">
                      Solo los clientes que han comprado este producto pueden dejar una reseña. ¡Adquiérelo para compartir tu opinión!
                    </p>
                  </div>
                )
              ) : (
                <div className="text-center py-6">
                  <p className="text-slate-500 dark:text-slate-400 mb-4 text-sm">Debes iniciar sesión para dejar una reseña en este producto.</p>
                  <Link to="/login" className="text-primary font-bold hover:underline">Iniciar Sesión</Link>
                </div>
              )}
            </div>

            {/* Lista de Reseñas */}
            <div className="lg:col-span-2 space-y-4">
              {reviews.length > 0 ? (
                reviews.map(review => (
                  <div key={review.id} className="bg-white dark:bg-slate-800/40 p-6 rounded-2xl border border-slate-200 dark:border-slate-700">
                    <div className="flex items-center gap-3 mb-3">
                      {review.avatar_url ? (
                        <div className="w-10 h-10 rounded-full overflow-hidden shrink-0 border border-slate-200 dark:border-slate-700">
                          <img src={review.avatar_url} alt={review.nombre_usuario} className="w-full h-full object-cover" />
                        </div>
                      ) : (
                        <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center font-bold text-primary shrink-0">
                          {review.nombre_usuario.charAt(0)}
                        </div>
                      )}
                      <div>
                        <p className="font-bold text-slate-900 dark:text-white text-sm">{review.nombre_usuario}</p>
                        <div className="flex items-center gap-1 mt-1">
                          {[...Array(5)].map((_, i) => (
                            <Star key={i} className={`w-3 h-3 ${i < review.rating ? 'text-yellow-400 fill-yellow-400' : 'text-slate-300 dark:text-slate-700'}`} />
                          ))}
                          <span className="text-xs text-slate-400 ml-2">{new Date(review.created_at).toLocaleDateString()}</span>
                        </div>
                      </div>
                    </div>
                    <p className="text-slate-600 dark:text-slate-300 text-sm leading-relaxed">{review.comentario}</p>
                  </div>
                ))
              ) : (
                <div className="h-full flex flex-col items-center justify-center p-12 bg-white dark:bg-slate-800/20 rounded-2xl border border-dashed border-slate-300 dark:border-slate-700">
                  <Star className="w-12 h-12 text-slate-300 dark:text-slate-600 mb-4" />
                  <p className="text-slate-500 dark:text-slate-400 text-center">No hay reseñas para este producto aún. ¡Anímate a ser el primero!</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Related Products */}
        {relacionados.length > 0 && (
          <div className="border-t border-slate-200 dark:border-slate-800 pt-12">
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-8">Productos Similares</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {relacionados.map((prod) => (
                <Link
                  key={prod.id}
                  to={`/tienda/producto/${prod.id}`}
                  className="bg-white dark:bg-[#13151f] rounded-2xl overflow-hidden border border-slate-200 dark:border-white/5 hover:border-primary/50 transition-all hover:-translate-y-1 hover:shadow-xl group flex flex-col"
                >
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
                  </div>
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
          </div>
        )}
      </div>
    </TiendaLayout>
  );
}
