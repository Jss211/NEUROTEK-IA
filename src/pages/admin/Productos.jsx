import { useState, useEffect, useRef } from 'react'
import AdminLayout from '../../components/admin/AdminLayout'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../context/AuthContext'

const CATEGORIAS = ['Periféricos', 'Computadoras', 'Audio', 'Monitores', 'Accesorios', 'Redes', 'Almacenamiento', 'Case', 'PC Completa', 'Disco SSD', 'Estabilizador', 'Fuente de Poder', 'Memoria RAM', 'Placa Madre', 'Tarjetas de Video']

const FORM_VACIO = {
  nombre: '', descripcion: '', precio: '', stock: '',
  categoria: '', marca: '', modelo: '', activo: true, imagen_url: ''
}

export default function Productos() {
  const { user } = useAuth()
  const [productos, setProductos] = useState([])
  const [loading, setLoading] = useState(true)
  const [modalAbierto, setModalAbierto] = useState(false)
  const [detalleProducto, setDetalleProducto] = useState(null)
  const [editando, setEditando] = useState(null)
  const [form, setForm] = useState(FORM_VACIO)
  const [imagenFile, setImagenFile] = useState(null)
  const [imagenPreview, setImagenPreview] = useState('')
  const [guardando, setGuardando] = useState(false)
  const [error, setError] = useState('')
  const [filtro, setFiltro] = useState('')
  const [categoriaFiltro, setCategoriaFiltro] = useState('')
  const [eliminando, setEliminando] = useState(null)
  const fileRef = useRef()

  useEffect(() => { cargarProductos() }, [])

  const cargarProductos = async () => {
    setLoading(true)
    const { data, err } = await supabase
      .from('productos')
      .select('*')
      .order('created_at', { ascending: false })
    if (err) {
      console.error('Error cargando productos:', err)
    } else {
      setProductos(data || [])
    }
    setLoading(false)
  }

  const abrirModal = (producto = null) => {
    setError('')
    setImagenFile(null)
    if (producto) {
      setEditando(producto.id)
      setForm({
        nombre: producto.nombre || '',
        descripcion: producto.descripcion || '',
        precio: producto.precio || '',
        stock: producto.stock || '',
        categoria: producto.categoria || '',
        marca: producto.marca || '',
        modelo: producto.modelo || '',
        activo: producto.activo ?? true,
        imagen_url: producto.imagen_url || ''
      })
      setImagenPreview(producto.imagen_url || '')
    } else {
      setEditando(null)
      setForm(FORM_VACIO)
      setImagenPreview('')
    }
    setModalAbierto(true)
  }

  const cerrarModal = () => {
    setModalAbierto(false)
    setEditando(null)
    setForm(FORM_VACIO)
    setImagenFile(null)
    setImagenPreview('')
    setError('')
  }

  const handleImagenChange = (e) => {
    const file = e.target.files[0]
    if (!file) return
    setImagenFile(file)
    setImagenPreview(URL.createObjectURL(file))
  }

  const subirImagen = async (file) => {
    const ext = file.name.split('.').pop()
    const nombre = `${Date.now()}.${ext}`
    const { error } = await supabase.storage
      .from('productos')
      .upload(nombre, file, { upsert: true })
    if (error) throw error
    const { data } = supabase.storage.from('productos').getPublicUrl(nombre)
    return data.publicUrl
  }

  const handleGuardar = async (e) => {
    e.preventDefault()
    setError('')
    if (user?.email === 'demo@neurotek.com') {
      setError('Acción deshabilitada en modo Demo (Solo Lectura).')
      return
    }
    if (!form.nombre || !form.precio) {
      setError('El nombre y el precio son obligatorios.')
      return
    }
    setGuardando(true)
    try {
      let imagen_url = form.imagen_url
      if (imagenFile) imagen_url = await subirImagen(imagenFile)

      const datos = {
        nombre: form.nombre,
        descripcion: form.descripcion,
        precio: parseFloat(form.precio),
        stock: parseInt(form.stock) || 0,
        categoria: form.categoria,
        marca: form.marca,
        modelo: form.modelo,
        activo: form.activo,
        imagen_url,
      }

      if (editando) {
        await supabase.from('productos').update(datos).eq('id', editando)
      } else {
        await supabase.from('productos').insert([datos])
      }

      await cargarProductos()
      cerrarModal()
    } catch (err) {
      setError('Error al guardar: ' + err.message)
    }
    setGuardando(false)
  }

  const handleEliminar = async (id) => {
    if (user?.email === 'demo@neurotek.com') {
      window.alert('Acción deshabilitada en modo Demo (Solo Lectura).')
      return
    }
    setEliminando(id)
    await supabase.from('productos').delete().eq('id', id)
    await cargarProductos()
    setEliminando(null)
  }

  const toggleActivo = async (id, activo) => {
    if (user?.email === 'demo@neurotek.com') {
      window.alert('Acción deshabilitada en modo Demo (Solo Lectura).')
      return
    }
    await supabase.from('productos').update({ activo: !activo }).eq('id', id)
    await cargarProductos()
  }

  const productosFiltrados = productos.filter(p => {
    const matchTexto = p.nombre?.toLowerCase().includes(filtro.toLowerCase()) ||
      p.marca?.toLowerCase().includes(filtro.toLowerCase())
    const matchCat = categoriaFiltro ? p.categoria === categoriaFiltro : true
    return matchTexto && matchCat
  })

  const categoriasDisponibles = Array.from(new Set(productos.map(p => p.categoria).filter(Boolean)))

  return (
    <AdminLayout>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Productos</h1>
          <p className="text-slate-500 dark:text-gray-400 text-sm mt-1">{productos.length} productos registrados</p>
        </div>
        <button
          onClick={() => abrirModal()}
          className="flex items-center gap-2 bg-primary hover:bg-primary/80 text-slate-900 dark:text-white font-semibold px-4 py-2.5 rounded-xl transition text-sm"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Nuevo producto
        </button>
      </div>

      {/* Filtros */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="flex items-center gap-2 bg-white dark:bg-[#1a1d2e] border border-black/10 dark:border-white/10 rounded-xl px-4 py-2.5 flex-1">
          <svg className="w-4 h-4 text-slate-500 dark:text-gray-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            placeholder="Buscar por nombre o marca..."
            value={filtro}
            onChange={e => setFiltro(e.target.value)}
            className="bg-transparent text-sm text-slate-600 dark:text-gray-300 placeholder-gray-500 outline-none w-full"
          />
        </div>
        <select
          value={categoriaFiltro}
          onChange={e => setCategoriaFiltro(e.target.value)}
          className="bg-white dark:bg-[#1a1d2e] border border-black/10 dark:border-white/10 rounded-xl px-4 py-2.5 text-sm text-slate-600 dark:text-gray-300 outline-none cursor-pointer"
        >
          <option className="bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white" value="">Todas las categorías</option>
          {categoriasDisponibles.map(c => (
            <option className="bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white" key={c} value={c}>{c}</option>
          ))}
        </select>
      </div>

      {/* Grid */}
      {loading ? (
        <div className="flex items-center justify-center h-48">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      ) : productosFiltrados.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-48 text-center">
          <div className="w-14 h-14 bg-primary/10 rounded-full flex items-center justify-center mb-3">
            <svg className="w-7 h-7 text-primary/80" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10" />
            </svg>
          </div>
          <p className="text-slate-900 dark:text-white font-medium">No hay productos</p>
          <p className="text-gray-500 text-sm mt-1">Agrega tu primer producto con el botón de arriba</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-4">
          {productosFiltrados.map(p => (
            <div key={p.id} className="bg-white dark:bg-[#1a1d2e] border border-black/5 dark:border-white/5 rounded-xl overflow-hidden hover:border-primary/30 transition group">
              {/* Imagen — clic abre detalle */}
              <div
                className="h-56 bg-slate-50 dark:bg-[#0f1117] flex items-center justify-center overflow-hidden cursor-pointer relative"
                onClick={() => setDetalleProducto(p)}
              >
                {p.imagen_url ? (
                  <img src={p.imagen_url} alt={p.nombre} className="w-full h-full object-contain p-3" />
                ) : (
                  <svg className="w-12 h-12 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                )}
                {/* Overlay hover */}
                <div className="absolute inset-0 bg-primary/10 opacity-0 group-hover:opacity-100 transition flex items-center justify-center">
                  <span className="text-slate-900 dark:text-white text-xs font-medium bg-black/50 px-3 py-1 rounded-full">Ver detalle</span>
                </div>
              </div>

              {/* Info */}
              <div className="p-4">
                <div className="flex items-start justify-between gap-2 mb-1">
                  <h3 className="text-slate-900 dark:text-white font-semibold text-sm leading-tight">{p.nombre}</h3>
                  <span className={`shrink-0 text-xs px-2 py-0.5 rounded-full ${p.activo ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
                    {p.activo ? 'Activo' : 'Inactivo'}
                  </span>
                </div>
                {p.categoria && <p className="text-xs text-primary/80 mb-2">{p.categoria}</p>}
                {p.descripcion && <p className="text-xs text-gray-500 mb-3 line-clamp-2">{p.descripcion}</p>}

                <div className="flex items-center justify-between mb-3">
                  <span className="text-xl font-bold text-slate-900 dark:text-white">S/ {parseFloat(p.precio).toFixed(2)}</span>
                  <span className={`text-xs px-2 py-1 rounded-lg ${p.stock <= 5 ? 'bg-red-500/20 text-red-400' : 'bg-black/5 dark:bg-white/5 text-slate-500 dark:text-gray-400'}`}>
                    Stock: {p.stock}
                  </span>
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => abrirModal(p)}
                    className="flex-1 flex items-center justify-center gap-1 bg-primary/10 hover:bg-primary/20 text-primary/80 text-xs font-medium py-2 rounded-lg transition"
                  >
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                    Editar
                  </button>
                  <button
                    onClick={() => toggleActivo(p.id, p.activo)}
                    className="flex items-center justify-center bg-black/5 dark:bg-white/5 hover:bg-white/10 text-slate-500 dark:text-gray-400 p-2 rounded-lg transition"
                    title={p.activo ? 'Desactivar' : 'Activar'}
                  >
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M3 3l18 18" />
                    </svg>
                  </button>
                  <button
                    onClick={() => handleEliminar(p.id)}
                    disabled={eliminando === p.id}
                    className="flex items-center justify-center bg-red-500/10 hover:bg-red-500/20 text-red-400 p-2 rounded-lg transition"
                  >
                    {eliminando === p.id ? (
                      <div className="w-3.5 h-3.5 border-2 border-red-400 border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    )}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── MODAL DETALLE PRODUCTO ── */}
      {detalleProducto && (
        <div className="fixed inset-0 bg-black/80 flex items-start justify-center z-50 p-4 pt-8 overflow-y-auto" onClick={() => setDetalleProducto(null)}>
          <div className="bg-slate-50 dark:bg-[#0f1117] border border-black/10 dark:border-white/10 rounded-2xl w-full max-w-5xl" onClick={e => e.stopPropagation()}>
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-black/10 dark:border-white/10">
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">Detalles del Producto</h2>
              <button onClick={() => setDetalleProducto(null)} className="w-8 h-8 flex items-center justify-center rounded-lg text-slate-500 dark:text-gray-400 hover:text-slate-900 dark:text-white hover:bg-white/10 transition">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Body */}
            <div className="flex flex-col md:flex-row">
              {/* Imagen arriba-izquierda */}
              <div className="md:w-[42%] bg-white dark:bg-[#1a1d2e] rounded-bl-2xl p-5">
                <div className="bg-white rounded-xl overflow-hidden">
                  {detalleProducto.imagen_url ? (
                    <img src={detalleProducto.imagen_url} alt={detalleProducto.nombre}
                      className="w-full object-contain" style={{ maxHeight: '380px' }} />
                  ) : (
                    <div className="flex flex-col items-center gap-3 text-slate-500 dark:text-gray-400 py-16">
                      <svg className="w-16 h-16" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10" />
                      </svg>
                      <p className="text-sm">Sin imagen</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Info derecha con scroll */}
              <div className="md:w-[58%] p-6 space-y-4 overflow-y-auto" style={{ maxHeight: '80vh' }}>
                {detalleProducto.categoria && (
                  <span className="inline-block text-xs text-primary/80 bg-primary/15 border border-primary/20 px-3 py-1 rounded-full font-medium">
                    {detalleProducto.categoria}
                  </span>
                )}
                <h3 className="text-2xl font-bold text-slate-900 dark:text-white leading-tight">{detalleProducto.nombre}</h3>
                <div className="flex items-center gap-2">
                  <div className="flex gap-0.5">
                    {[1,2,3,4].map(i => (
                      <svg key={i} className="w-4 h-4 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                      </svg>
                    ))}
                    <svg className="w-4 h-4 text-gray-600" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                  </div>
                  <span className="text-xs text-gray-500">(Sin reseñas aún)</span>
                </div>
                <div className="bg-primary/10 border border-primary/20 rounded-xl p-4 space-y-2">
                  <div className="flex items-baseline gap-2">
                    <span className="text-sm text-primary/80 font-medium">Precio:</span>
                    <span className="text-2xl font-bold text-slate-900 dark:text-white">S/ {parseFloat(detalleProducto.precio || 0).toFixed(2)}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-primary/80 font-medium">Disponibilidad:</span>
                    <span className={`text-sm font-semibold ${detalleProducto.stock <= 5 ? 'text-red-400' : 'text-green-400'}`}>
                      {detalleProducto.stock} unidades en stock
                    </span>
                  </div>
                </div>
                <div>
                  <p className="font-semibold text-slate-900 dark:text-white mb-2">Descripción del Producto</p>
                  <p className="text-sm text-slate-500 dark:text-gray-400 leading-relaxed">
                    {detalleProducto.descripcion || 'Sin descripción disponible.'}
                  </p>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { label: 'Marca', value: detalleProducto.marca },
                    { label: 'Modelo', value: detalleProducto.modelo },
                    { label: 'Categoría', value: detalleProducto.categoria },
                    { label: 'Estado', value: detalleProducto.activo ? 'Activo' : 'Inactivo', badge: true, activo: detalleProducto.activo }
                  ].map(item => (
                    <div key={item.label} className="bg-black/5 dark:bg-white/5 border border-black/5 dark:border-white/5 rounded-xl p-3">
                      <p className="text-xs text-gray-500 mb-1">{item.label}</p>
                      {item.badge ? (
                        <span className={`inline-block text-xs px-2 py-0.5 rounded-full font-medium ${item.activo ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
                          {item.value}
                        </span>
                      ) : (
                        <p className="text-sm text-slate-900 dark:text-white font-medium">{item.value || '—'}</p>
                      )}
                    </div>
                  ))}
                </div>
                <div className="flex gap-3 pt-1">
                  <button onClick={() => { setDetalleProducto(null); abrirModal(detalleProducto) }}
                    className="flex-1 bg-primary hover:bg-primary/80 text-slate-900 dark:text-white font-semibold py-2.5 rounded-xl transition text-sm">
                    Editar producto
                  </button>
                  <button onClick={() => setDetalleProducto(null)}
                    className="flex-1 bg-black/5 dark:bg-white/5 hover:bg-white/10 text-slate-600 dark:text-gray-300 font-semibold py-2.5 rounded-xl transition text-sm">
                    Cerrar
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── MODAL AGREGAR/EDITAR ── */}
      {modalAbierto && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-[#1a1d2e] border border-black/10 dark:border-white/10 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-black/5 dark:border-white/5">
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                {editando ? 'Editar producto' : 'Nuevo producto'}
              </h2>
              <button onClick={cerrarModal} className="text-slate-500 dark:text-gray-400 hover:text-slate-900 dark:text-white transition">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <form onSubmit={handleGuardar} className="p-6 space-y-4">
              {/* Imagen */}
              <div>
                <label className="text-xs text-slate-500 dark:text-gray-400 font-medium block mb-2">Imagen del producto</label>
                <div
                  onClick={() => fileRef.current.click()}
                  className="border-2 border-dashed border-black/10 dark:border-white/10 hover:border-primary/50 rounded-xl h-48 flex flex-col items-center justify-center cursor-pointer transition overflow-hidden"
                >
                  {imagenPreview ? (
                    <img src={imagenPreview} alt="preview" className="w-full h-full object-contain p-2" />
                  ) : (
                    <>
                      <svg className="w-8 h-8 text-gray-500 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      <p className="text-sm text-gray-500">Clic para subir imagen</p>
                      <p className="text-xs text-gray-600">JPG, PNG, WEBP</p>
                    </>
                  )}
                </div>
                <input ref={fileRef} type="file" accept="image/*" onChange={handleImagenChange} className="hidden" />
              </div>

              <div>
                <label className="text-xs text-slate-500 dark:text-gray-400 font-medium block mb-1">Nombre *</label>
                <input type="text" value={form.nombre} onChange={e => setForm({...form, nombre: e.target.value})}
                  placeholder="Ej: Mouse Logitech MX Master 3"
                  className="w-full bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 rounded-xl px-4 py-2.5 text-sm text-slate-900 dark:text-white placeholder-gray-500 outline-none focus:border-primary transition" />
              </div>

              <div>
                <label className="text-xs text-slate-500 dark:text-gray-400 font-medium block mb-1">Descripción</label>
                <textarea value={form.descripcion} onChange={e => setForm({...form, descripcion: e.target.value})}
                  placeholder="Describe el producto..." rows={3}
                  className="w-full bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 rounded-xl px-4 py-2.5 text-sm text-slate-900 dark:text-white placeholder-gray-500 outline-none focus:border-primary transition resize-none" />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-slate-500 dark:text-gray-400 font-medium block mb-1">Precio (USD) *</label>
                  <input type="number" min="0" step="0.01" value={form.precio} onChange={e => setForm({...form, precio: e.target.value})}
                    placeholder="0.00"
                    className="w-full bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 rounded-xl px-4 py-2.5 text-sm text-slate-900 dark:text-white placeholder-gray-500 outline-none focus:border-primary transition" />
                </div>
                <div>
                  <label className="text-xs text-slate-500 dark:text-gray-400 font-medium block mb-1">Stock</label>
                  <input type="number" min="0" value={form.stock} onChange={e => setForm({...form, stock: e.target.value})}
                    placeholder="0"
                    className="w-full bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 rounded-xl px-4 py-2.5 text-sm text-slate-900 dark:text-white placeholder-gray-500 outline-none focus:border-primary transition" />
                </div>
              </div>

              <div>
                <label className="text-xs text-slate-500 dark:text-gray-400 font-medium block mb-1">Categoría</label>
                <select value={form.categoria} onChange={e => setForm({...form, categoria: e.target.value})}
                  className="w-full bg-slate-50 dark:bg-[#0f1117] border border-black/10 dark:border-white/10 rounded-xl px-4 py-2.5 text-sm text-slate-600 dark:text-gray-300 outline-none focus:border-primary transition">
                  <option value="">Selecciona una categoría</option>
                  {CATEGORIAS.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-gray-400 font-medium block mb-1">Marca</label>
                  <input type="text" value={form.marca} onChange={e => setForm({...form, marca: e.target.value})}
                    placeholder="Ej: Logitech"
                    className="w-full bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 rounded-xl px-4 py-2.5 text-sm text-slate-900 dark:text-white placeholder-gray-500 outline-none focus:border-primary transition" />
                </div>
                <div>
                  <label className="text-xs text-gray-400 font-medium block mb-1">Modelo</label>
                  <input type="text" value={form.modelo} onChange={e => setForm({...form, modelo: e.target.value})}
                    placeholder="Ej: MX Master 3"
                    className="w-full bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 rounded-xl px-4 py-2.5 text-sm text-slate-900 dark:text-white placeholder-gray-500 outline-none focus:border-primary transition" />
                </div>
              </div>

              <div className="flex items-center gap-3">
                <button type="button" onClick={() => setForm({...form, activo: !form.activo})}
                  className={`w-11 h-6 rounded-full transition-all ${form.activo ? 'bg-primary' : 'bg-white/10'}`}>
                  <div className={`w-5 h-5 bg-white rounded-full shadow transition-all mx-0.5 ${form.activo ? 'translate-x-5' : 'translate-x-0'}`} />
                </button>
                <span className="text-sm text-gray-300">Producto activo (visible en tienda)</span>
              </div>

              {error && (
                <div className="bg-red-500/10 border border-red-500/20 text-red-400 text-sm px-4 py-3 rounded-xl">{error}</div>
              )}

              <div className="flex gap-3 pt-2">
                <button type="button" onClick={cerrarModal}
                  className="flex-1 bg-black/5 dark:bg-white/5 hover:bg-white/10 text-gray-300 font-semibold py-3 rounded-xl transition text-sm">
                  Cancelar
                </button>
                <button type="submit" disabled={guardando}
                  className="flex-1 bg-primary hover:bg-primary/80 disabled:opacity-60 text-slate-900 dark:text-white font-semibold py-3 rounded-xl transition text-sm flex items-center justify-center gap-2">
                  {guardando && <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />}
                  {guardando ? 'Guardando...' : editando ? 'Guardar cambios' : 'Agregar producto'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </AdminLayout>
  )
}
