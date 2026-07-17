import { useState, useEffect } from 'react'
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell
} from 'recharts'
import AdminLayout from '../../components/admin/AdminLayout'
import { useAuth } from '../../context/AuthContext'
import { supabase } from '../../lib/supabase'

const estadoColor = {
  Completada: 'text-green-400 bg-green-400/10',
  Completado: 'text-green-400 bg-green-400/10',
  Pendiente:  'text-yellow-400 bg-yellow-400/10',
  Enviado:    'text-primary/80 bg-primary/80/10',
  Procesando: 'text-primary/80 bg-primary/80/10',
  Cancelada:  'text-red-400 bg-red-400/10',
}

const tipoColor = {
  Venta:     'bg-primary/20 text-primary/80',
  Restockeo: 'bg-white/10 text-slate-600 dark:text-gray-300',
}

const CATEGORY_COLORS = {
  'Periféricos': '#3b82f6',
  'Computadoras': '#a855f7',
  'Audio': '#10b981',
  'Monitores': '#f59e0b',
  'Accesorios': '#ec4899',
  'Otros': '#64748b'
}

export default function AdminDashboard() {
  const { user } = useAuth()
  const nombre = user?.user_metadata?.full_name || user?.email || 'Admin'

  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState([])
  const [ventasMensuales, setVentasMensuales] = useState([])
  const [categorias, setCategorias] = useState([])
  const [ultimosPedidos, setUltimosPedidos] = useState([])
  const [actividadReciente, setActividadReciente] = useState([])
  const [alertasStock, setAlertasStock] = useState([])

  useEffect(() => {
    fetchDashboardData()

    // Realtime listeners
    const channel = supabase.channel('dashboard_changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'ordenes' }, () => {
        fetchDashboardData()
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'productos' }, () => {
        fetchDashboardData()
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'usuarios' }, () => {
        fetchDashboardData()
      })
      .subscribe()

    return () => supabase.removeChannel(channel)
  }, [])

  const fetchDashboardData = async () => {
    try {
      const [ordenesRes, productosRes, usuariosRes] = await Promise.all([
        supabase.from('ordenes').select('*').order('fecha', { ascending: false }),
        supabase.from('productos').select('*'),
        supabase.from('usuarios').select('*').eq('rol', 'cliente')
      ])

      const ordenes = ordenesRes.data || []
      const productos = productosRes.data || []
      const clientes = usuariosRes.data || []

      // 1. Stats
      const ventasTotales = ordenes.filter(o => o.estado !== 'Cancelada').reduce((sum, o) => sum + (parseFloat(o.total) || 0), 0)
      
      const newStats = [
        {
          label: 'Ventas Totales',
          value: `S/ ${ventasTotales.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
          change: '+Realtime',
          positive: true,
          icon: (
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          ),
          color: 'text-primary/80',
          bg: 'bg-primary/10',
        },
        {
          label: 'Productos',
          value: productos.length.toString(),
          change: 'En inventario',
          positive: true,
          icon: (
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10" />
            </svg>
          ),
          color: 'text-primary/80',
          bg: 'bg-primary/10',
        },
        {
          label: 'Pedidos',
          value: ordenes.length.toString(),
          change: 'Totales',
          positive: true,
          icon: (
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
          ),
          color: 'text-primary/80',
          bg: 'bg-primary/10',
        },
        {
          label: 'Clientes',
          value: clientes.length.toString(),
          change: 'Registrados',
          positive: true,
          icon: (
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          ),
          color: 'text-primary/80',
          bg: 'bg-primary/10',
        },
      ]
      setStats(newStats)

      // 2. Últimos Pedidos
      const recentOrders = ordenes.slice(0, 5).map(o => ({
        id: o.id.toString().substring(0,8),
        cliente: o.cliente_nombre || o.cliente,
        producto: o.items + ' items',
        monto: `S/ ${(parseFloat(o.total) || 0).toFixed(2)}`,
        estado: o.estado
      }))
      setUltimosPedidos(recentOrders)

      // 3. Actividad Reciente (mezclando ultimos pedidos y alertas)
      const actividades = ordenes.slice(0, 4).map(o => ({
        producto: `Orden #${o.id.toString().substring(0,8)}`,
        tipo: 'Venta',
        tiempo: new Date(o.fecha).toLocaleDateString(),
        monto: `S/ ${parseFloat(o.total).toFixed(2)}`,
        unidades: `${o.items} items`
      }))
      setActividadReciente(actividades)

      // 4. Alertas de Stock
      const alertas = productos
        .filter(p => p.stock <= p.stock_minimo)
        .map(p => ({
          producto: p.nombre,
          stock: p.stock,
          minimo: p.stock_minimo,
          porcentaje: p.stock_minimo > 0 ? Math.min(100, Math.round((p.stock / p.stock_minimo) * 100)) : 0
        }))
        .slice(0, 5)
      setAlertasStock(alertas)

      // 5. Categorías (Inventario distribution)
      const catCount = {}
      productos.forEach(p => {
        const cat = p.categoria || 'Otros'
        catCount[cat] = (catCount[cat] || 0) + 1
      })
      const totalProds = productos.length || 1
      const catsArray = Object.keys(catCount).map(c => ({
        name: c,
        value: Math.round((catCount[c] / totalProds) * 100),
        color: CATEGORY_COLORS[c] || CATEGORY_COLORS['Otros']
      })).sort((a,b) => b.value - a.value)
      setCategorias(catsArray)

      // 6. Ventas Mensuales (Agrupando por mes real o dejando un placeholder dinámico)
      const monthly = {}
      ordenes.filter(o => o.estado !== 'Cancelada').forEach(o => {
        const d = new Date(o.fecha)
        const month = d.toLocaleString('es-ES', { month: 'short' }).substring(0, 3)
        if (!monthly[month]) monthly[month] = { mes: month, ventas: 0, ganancias: 0 }
        monthly[month].ventas += parseFloat(o.total) || 0
        monthly[month].ganancias += (parseFloat(o.total) || 0) * 0.3 // Asumiendo 30% margen por ahora
      })
      
      const chartData = Object.values(monthly)
      // Si no hay datos, mostrar algo base
      if (chartData.length === 0) {
        chartData.push({ mes: 'Act', ventas: 0, ganancias: 0 })
      }
      setVentasMensuales(chartData)

    } catch (error) {
      console.error('Error fetching dashboard data', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center min-h-[50vh]">
          <div className="text-primary animate-pulse font-medium">Sincronizando Dashboard en tiempo real...</div>
        </div>
      </AdminLayout>
    )
  }

  return (
    <AdminLayout>
      {/* Encabezado */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Dashboard</h1>
        <p className="text-slate-500 dark:text-gray-400 text-sm mt-1">
          Bienvenido de nuevo, <span className="text-primary/80 font-medium">{nombre}</span> — Resumen de tu negocio en tiempo real
        </p>
      </div>

      {/* Tarjetas de stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 mb-6">
        {stats.map((s) => (
          <div key={s.label} className="bg-white dark:bg-[#1a1d2e] border border-black/5 dark:border-white/5 rounded-xl p-5">
            <div className="flex items-center justify-between mb-3">
              <p className="text-slate-500 dark:text-gray-400 text-xs uppercase tracking-wider">{s.label}</p>
              <span className={`${s.bg} ${s.color} p-2 rounded-lg`}>{s.icon}</span>
            </div>
            <p className="text-2xl font-bold text-slate-900 dark:text-white mb-1">{s.value}</p>
            <p className={`text-xs font-medium ${s.positive ? 'text-green-400' : 'text-red-400'}`}>
              {s.change}
            </p>
          </div>
        ))}
      </div>

      {/* Gráficas */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4 mb-6">
        {/* Área chart */}
        <div className="xl:col-span-2 bg-white dark:bg-[#1a1d2e] border border-black/5 dark:border-white/5 rounded-xl p-5">
          <h2 className="text-sm font-semibold text-slate-900 dark:text-white mb-1">Ventas y Ganancias</h2>
          <p className="text-xs text-gray-500 mb-4">Ingresos reales (Margen est. 30%)</p>
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={ventasMensuales}>
              <defs>
                <linearGradient id="ventas" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor="#3b82f6" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="ganancias" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor="#60a5fa" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#60a5fa" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#ffffff08" />
              <XAxis dataKey="mes" tick={{ fill: '#6b7280', fontSize: 12 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: '#6b7280', fontSize: 12 }} axisLine={false} tickLine={false} />
              <Tooltip
                contentStyle={{ backgroundColor: '#1a1d2e', border: '1px solid #ffffff10', borderRadius: '8px', color: '#fff' }}
                formatter={(val) => [`S/ ${val.toLocaleString(undefined, {minimumFractionDigits: 2})}`, '']}
              />
              <Area type="monotone" dataKey="ventas"    stroke="#3b82f6" strokeWidth={2} fill="url(#ventas)"    name="Ventas" isAnimationActive={true} animationDuration={1500} animationBegin={300} animationEasing="ease-out" />
              <Area type="monotone" dataKey="ganancias" stroke="#60a5fa" strokeWidth={2} fill="url(#ganancias)" name="Ganancias" isAnimationActive={true} animationDuration={1500} animationBegin={500} animationEasing="ease-out" />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Pie chart categorías tech */}
        <div className="bg-white dark:bg-[#1a1d2e] border border-black/5 dark:border-white/5 rounded-xl p-5">
          <h2 className="text-sm font-semibold text-slate-900 dark:text-white mb-1">Inventario por Categoría</h2>
          <p className="text-xs text-gray-500 mb-4">Distribución en stock</p>
          <ResponsiveContainer width="100%" height={160}>
            <PieChart>
              <Pie data={categorias} cx="50%" cy="50%" innerRadius={45} outerRadius={70} dataKey="value" paddingAngle={3} isAnimationActive={true} animationDuration={1500} animationBegin={400} animationEasing="ease-out">
                {categorias.map((entry, i) => (
                  <Cell key={i} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{ backgroundColor: '#1a1d2e', border: '1px solid #ffffff10', borderRadius: '8px', color: '#fff' }}
                formatter={(val) => [`${val}%`, '']}
              />
            </PieChart>
          </ResponsiveContainer>
          <div className="space-y-2 mt-2">
            {categorias.map((c) => (
              <div key={c.name} className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full" style={{ backgroundColor: c.color }} />
                  <span className="text-slate-500 dark:text-gray-400">{c.name}</span>
                </div>
                <span className="text-slate-600 dark:text-gray-300 font-medium">{c.value}%</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Últimos pedidos */}
      <div className="bg-white dark:bg-[#1a1d2e] border border-black/5 dark:border-white/5 rounded-xl p-5 mb-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-sm font-semibold text-slate-900 dark:text-white">Últimos Pedidos</h2>
            <p className="text-xs text-gray-500">Actividad reciente</p>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-gray-500 text-xs uppercase border-b border-black/5 dark:border-white/5">
                <th className="pb-3 text-left w-[15%]">ID</th>
                <th className="pb-3 text-center w-[30%]">Cliente</th>
                <th className="pb-3 text-center w-[20%]">Items</th>
                <th className="pb-3 text-center w-[20%]">Monto</th>
                <th className="pb-3 text-center w-[15%]">Estado</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {ultimosPedidos.length === 0 ? (
                 <tr>
                   <td colSpan="5" className="py-4 text-center text-gray-500">No hay pedidos recientes</td>
                 </tr>
              ) : ultimosPedidos.map((p) => (
                <tr key={p.id} className="hover:bg-white/2 transition">
                  <td className="py-3 text-left text-slate-500 dark:text-gray-400 font-mono">#{p.id}</td>
                  <td className="py-3 text-center text-slate-900 dark:text-white">{p.cliente}</td>
                  <td className="py-3 text-center text-slate-600 dark:text-gray-300">{p.producto}</td>
                  <td className="py-3 text-center text-slate-900 dark:text-white font-medium">{p.monto}</td>
                  <td className="py-3 text-center">
                    <span className={`px-2 py-1 rounded-md text-xs font-medium ${estadoColor[p.estado] || estadoColor['Pendiente']}`}>
                      {p.estado}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Actividad Reciente + Alertas de Stock */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">

        {/* Actividad Reciente */}
        <div className="bg-white dark:bg-[#1a1d2e] border border-black/5 dark:border-white/5 rounded-xl p-5">
          <div className="mb-4">
            <h2 className="text-sm font-semibold text-slate-900 dark:text-white">Actividad Reciente</h2>
            <p className="text-xs text-gray-500">Últimas transacciones</p>
          </div>
          <div className="space-y-3">
            {actividadReciente.length === 0 ? (
               <p className="text-sm text-gray-500 text-center py-4">No hay actividad reciente</p>
            ) : actividadReciente.map((item, i) => (
              <div key={i} className="flex items-center justify-between bg-black/5 dark:bg-white/5 rounded-xl px-4 py-3">
                <div>
                  <p className="text-sm font-medium text-slate-900 dark:text-white">{item.producto}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${tipoColor[item.tipo] || tipoColor['Venta']}`}>
                      {item.tipo}
                    </span>
                    <span className="text-xs text-gray-500">{item.tiempo}</span>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-bold text-slate-900 dark:text-white">{item.monto}</p>
                  <p className="text-xs text-gray-500">{item.unidades}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Alertas de Stock Bajo */}
        <div className="bg-white dark:bg-[#1a1d2e] border border-black/5 dark:border-white/5 rounded-xl p-5">
          <div className="mb-4">
            <div className="flex items-center gap-2">
              <svg className="w-4 h-4 text-yellow-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              <h2 className="text-sm font-semibold text-slate-900 dark:text-white">Alertas de Stock Bajo</h2>
            </div>
            <p className="text-xs text-gray-500 mt-1">Productos críticos</p>
          </div>
          <div className="space-y-4">
            {alertasStock.length === 0 ? (
               <p className="text-sm text-gray-500 text-center py-4">Inventario saludable, no hay alertas</p>
            ) : alertasStock.map((item, i) => (
              <div key={i}>
                <div className="flex items-center justify-between mb-1">
                  <p className="text-sm font-medium text-slate-900 dark:text-white">{item.producto}</p>
                  <span className="text-xs bg-red-500/20 text-red-400 px-2 py-0.5 rounded-full font-medium">
                    {item.stock} uni.
                  </span>
                </div>
                {/* Barra de progreso */}
                <div className="w-full bg-white/10 rounded-full h-2">
                  <div
                    className="bg-primary h-2 rounded-full transition-all"
                    style={{ width: `${item.porcentaje}%` }}
                  />
                </div>
                <p className="text-xs text-gray-500 mt-1">Mínimo requerido: {item.minimo} unidades</p>
              </div>
            ))}
          </div>
        </div>

      </div>
    </AdminLayout>
  )
}
