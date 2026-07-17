import { useRef, useState, useEffect } from 'react'
import { format } from 'date-fns'
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, BarChart, Bar, Legend, AreaChart, Area
} from 'recharts'
import AdminLayout from '../../components/admin/AdminLayout'
import { DatePicker } from '../../components/ui/DatePicker'
import { exportElementToPdf } from '../../lib/pdfExport'
import { supabase } from '../../lib/supabase'

const TABS = ['Ingresos', 'Productos', 'Categorias', 'Por Horario']

const tooltipStyle = {
  contentStyle: {
    backgroundColor: '#1a1d2e',
    border: '1px solid #ffffff10',
    borderRadius: '8px',
    color: '#fff',
    fontSize: '12px',
  },
}

export default function Analytics() {
  const [tabActiva, setTabActiva] = useState('Ingresos')
  const [fecha, setFecha] = useState(new Date())
  const [exportando, setExportando] = useState(false)
  const analyticsRef = useRef(null)

  const [loading, setLoading] = useState(true)
  const [ventasMensuales, setVentasMensuales] = useState([])
  const [productosMasVendidos, setProductosMasVendidos] = useState([])
  const [porHorario, setPorHorario] = useState([])
  const [categoriaData, setCategoriaData] = useState([])
  const [metricasGlobales, setMetricasGlobales] = useState({ ventasTotales: 0, totalPedidos: 0, totalClientes: 0 })

  useEffect(() => {
    fetchAnalyticsData()
  }, [fecha])

  const fetchAnalyticsData = async () => {
    setLoading(true)
    try {
      // Calculate date range: first day of selected month to selected date
      const selectedYear = fecha.getFullYear()
      const selectedMonth = fecha.getMonth()
      const selectedDay = fecha.getDate()

      const startOfMonth = new Date(selectedYear, selectedMonth, 1)
      startOfMonth.setHours(0, 0, 0, 0)
      const isoStart = startOfMonth.toISOString()

      const endOfDay = new Date(fecha)
      endOfDay.setHours(23, 59, 59, 999)
      const isoEnd = endOfDay.toISOString()

      // Fetch orders only within the selected month up to the selected day
      const { data: ordenes } = await supabase.from('ordenes').select('*').neq('estado', 'Cancelada').gte('fecha', isoStart).lte('fecha', isoEnd)
      const { data: productos } = await supabase.from('productos').select('*')
      const { data: clientes } = await supabase.from('usuarios').select('*').eq('rol', 'cliente')

      const ordenesData = ordenes || []
      const productosData = productos || []
      const clientesData = clientes || []

      // Metricas globales (for the selected period)
      const ventasTotales = ordenesData.reduce((sum, o) => sum + (parseFloat(o.total) || 0), 0)
      setMetricasGlobales({
        ventasTotales,
        totalPedidos: ordenesData.length,
        totalClientes: clientesData.length
      })

      // 1. Ventas DIARIAS dentro del mes seleccionado (agrupando por día)
      const daily = {}
      // Pre-fill all days from 1 to selectedDay so the chart shows even empty days
      for (let d = 1; d <= selectedDay; d++) {
        const label = `${d}`
        daily[label] = { mes: label, ventas: 0, pedidos: 0, clientes: 0 }
      }
      ordenesData.forEach(o => {
        const d = new Date(o.fecha)
        const dayNum = `${d.getDate()}`
        if (daily[dayNum]) {
          daily[dayNum].ventas += parseFloat(o.total) || 0
          daily[dayNum].pedidos += 1
        }
      })
      // Approximate unique clients per day
      const clientesPorDia = {}
      ordenesData.forEach(o => {
        const d = new Date(o.fecha)
        const dayNum = `${d.getDate()}`
        if (!clientesPorDia[dayNum]) clientesPorDia[dayNum] = new Set()
        clientesPorDia[dayNum].add(o.cliente || o.cliente_nombre || o.user_id)
      })
      Object.keys(clientesPorDia).forEach(day => {
        if (daily[day]) daily[day].clientes = clientesPorDia[day].size
      })

      const sortedDaily = Object.values(daily).sort((a, b) => parseInt(a.mes) - parseInt(b.mes))
      setVentasMensuales(sortedDaily.length > 0 ? sortedDaily : [{ mes: '1', ventas: 0, pedidos: 0, clientes: 0 }])

      // 2. Productos mas vendidos (based on orders in selected period)
      const productoConteo = {}
      ordenesData.forEach(o => {
        const nombre = o.producto_nombre || o.items_detalle || null
        if (nombre) {
          if (!productoConteo[nombre]) productoConteo[nombre] = { nombre, unidades: 0, ingresos: 0 }
          productoConteo[nombre].unidades += parseInt(o.items) || 1
          productoConteo[nombre].ingresos += parseFloat(o.total) || 0
        }
      })
      let topProductos = Object.values(productoConteo).sort((a, b) => b.ingresos - a.ingresos).slice(0, 6)
      // Fallback if no structured product data in orders
      if (topProductos.length === 0) {
        topProductos = productosData.slice(0, 6).map(p => ({
          nombre: p.nombre,
          unidades: parseInt(p.stock) || 0,
          ingresos: (parseFloat(p.precio) || 0) * (parseInt(p.stock) || 1)
        })).sort((a, b) => b.ingresos - a.ingresos)
      }
      setProductosMasVendidos(topProductos)

      // 3. Por horario (orders in selected period)
      const horarioMap = { '00:00': 0, '04:00': 0, '08:00': 0, '12:00': 0, '16:00': 0, '20:00': 0, '23:00': 0 }
      ordenesData.forEach(o => {
        const hour = new Date(o.fecha).getHours()
        let slot = '00:00'
        if (hour >= 4 && hour < 8) slot = '04:00'
        else if (hour >= 8 && hour < 12) slot = '08:00'
        else if (hour >= 12 && hour < 16) slot = '12:00'
        else if (hour >= 16 && hour < 20) slot = '16:00'
        else if (hour >= 20 && hour < 23) slot = '20:00'
        else if (hour === 23) slot = '23:00'
        horarioMap[slot] += 1
      })
      const horarioArr = Object.keys(horarioMap).map(k => ({ hora: k, ventas: horarioMap[k] }))
      setPorHorario(horarioArr)

      // 4. Categoría Data (based on orders in selected period)
      const catCount = {}
      ordenesData.forEach(o => {
        const cat = o.categoria || 'Otros'
        if (!catCount[cat]) catCount[cat] = { cat, ventas: 0, pedidos: 0 }
        catCount[cat].pedidos += 1
        catCount[cat].ventas += parseFloat(o.total) || 0
      })
      // Fallback to product categories if orders don't have category field
      if (Object.keys(catCount).length === 0 || (Object.keys(catCount).length === 1 && catCount['Otros'])) {
        const catFromProducts = {}
        productosData.forEach(p => {
          const cat = p.categoria || 'Otros'
          if (!catFromProducts[cat]) catFromProducts[cat] = { cat, ventas: 0, pedidos: 0 }
          catFromProducts[cat].pedidos += 1
          catFromProducts[cat].ventas += parseFloat(p.precio) * 2 || 0
        })
        setCategoriaData(Object.values(catFromProducts).length > 0 ? Object.values(catFromProducts) : [{ cat: 'Varios', ventas: 0, pedidos: 0 }])
      } else {
        setCategoriaData(Object.values(catCount))
      }

    } catch (error) {
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  const handleExportarPDF = async () => {
    setExportando(true)
    try {
      await exportElementToPdf({
        element: analyticsRef.current,
        fileName: `analytics-neurotek-${format(new Date(), 'yyyy-MM-dd')}.pdf`,
        fallbackTitle: 'Analytics NeuroTek',
        fallbackSections: [
          {
            title: 'Metricas Globales',
            lines: [
              `Ventas Totales: S/ ${metricasGlobales.ventasTotales.toLocaleString()}`,
              `Total Pedidos: ${metricasGlobales.totalPedidos}`,
              `Total Clientes: ${metricasGlobales.totalClientes}`,
            ],
          },
          {
            title: 'Ventas mensuales',
            lines: ventasMensuales.map((item) => `${item.mes}: ventas S/ ${item.ventas.toLocaleString()}, pedidos ${item.pedidos}, clientes ${item.clientes}`),
          },
          {
            title: 'Productos mas vendidos',
            lines: productosMasVendidos.map((item) => `${item.nombre}: ${item.unidades} unidades, S/ ${item.ingresos.toLocaleString()} ingresos`),
          },
        ],
      })
    } catch (error) {
      console.error(error)
    } finally {
      setExportando(false)
    }
  }

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center min-h-[50vh]">
          <div className="animate-pulse text-primary font-medium">Sincronizando métricas en tiempo real...</div>
        </div>
      </AdminLayout>
    )
  }

  return (
    <AdminLayout>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Analytics</h1>
          <p className="text-slate-500 dark:text-gray-400 text-sm mt-1">Análisis detallado de rendimiento y métricas</p>
        </div>
        <div className="flex items-center gap-3">
          <DatePicker date={fecha} onDateChange={(d) => d && setFecha(d)} className="bg-white dark:bg-transparent" />
          <button
            onClick={handleExportarPDF}
            disabled={exportando}
            className="bg-primary hover:bg-primary/90 text-white dark:text-slate-900 px-4 py-2 rounded-xl text-sm font-semibold transition disabled:opacity-50 flex items-center gap-2"
          >
            {exportando ? (
              <span className="flex items-center gap-2">
                <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
                Generando...
              </span>
            ) : (
              <span className="flex items-center gap-2">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
                Exportar Reporte
              </span>
            )}
          </button>
        </div>
      </div>

      <div ref={analyticsRef} className="space-y-6">
        <div className="flex space-x-1 bg-black/5 dark:bg-white/5 p-1 rounded-xl w-fit mb-6">
          {TABS.map((tab) => (
            <button
              key={tab}
              onClick={() => setTabActiva(tab)}
              className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                tabActiva === tab
                  ? 'bg-white dark:bg-[#1a1d2e] text-slate-900 dark:text-white shadow-sm'
                  : 'text-slate-500 hover:text-slate-700 dark:text-gray-400 dark:hover:text-gray-300 hover:bg-black/5 dark:hover:bg-white/5'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        {tabActiva === 'Ingresos' && (
          <div className="grid grid-cols-1 gap-6">
            <div className="bg-white dark:bg-[#1a1d2e] border border-black/5 dark:border-white/5 rounded-xl p-6">
              <h2 className="text-sm font-semibold text-slate-900 dark:text-white mb-1">Evolución de Ingresos</h2>
              <p className="text-xs text-gray-500 mb-4">Ventas diarias — {fecha.toLocaleString('es-ES', { month: 'long', year: 'numeric' })} (hasta el día {fecha.getDate()})</p>
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={ventasMensuales}>
                  <defs>
                    <linearGradient id="colorVentas" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#ffffff08" />
                  <XAxis dataKey="mes" stroke="#6b7280" fontSize={12} tickLine={false} axisLine={false} />
                  <YAxis stroke="#6b7280" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `S/ ${value >= 1000 ? (value/1000).toFixed(1) + 'k' : value}`} />
                  <Tooltip {...tooltipStyle} formatter={(val) => [`S/ ${val.toLocaleString()}`, 'Ventas']} />
                  <Area type="monotone" dataKey="ventas" stroke="#3b82f6" strokeWidth={3} fillOpacity={1} fill="url(#colorVentas)" isAnimationActive={true} animationDuration={1500} animationBegin={300} animationEasing="ease-out" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {tabActiva === 'Productos' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white dark:bg-[#1a1d2e] border border-black/5 dark:border-white/5 rounded-xl p-6">
              <h2 className="text-sm font-semibold text-slate-900 dark:text-white mb-6">Top Productos por Ingresos</h2>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={productosMasVendidos} layout="vertical" margin={{ left: 40 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#ffffff08" horizontal={false} />
                  <XAxis type="number" stroke="#6b7280" fontSize={12} tickLine={false} axisLine={false} />
                  <YAxis dataKey="nombre" type="category" stroke="#6b7280" fontSize={12} tickLine={false} axisLine={false} />
                  <Tooltip {...tooltipStyle} formatter={(val) => [`S/ ${val.toLocaleString()}`, 'Ingresos']} />
                  <Bar dataKey="ingresos" fill="#10b981" radius={[0, 4, 4, 0]} barSize={20} isAnimationActive={true} animationDuration={1500} animationBegin={300} animationEasing="ease-out" />
                </BarChart>
              </ResponsiveContainer>
            </div>
            
            <div className="bg-white dark:bg-[#1a1d2e] border border-black/5 dark:border-white/5 rounded-xl p-6">
              <h2 className="text-sm font-semibold text-slate-900 dark:text-white mb-4">Detalle de Productos Top</h2>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-gray-500 border-b border-black/5 dark:border-white/5">
                      <th className="pb-3 text-left font-medium">Producto</th>
                      <th className="pb-3 text-right font-medium">Unidades</th>
                      <th className="pb-3 text-right font-medium">Ingresos</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-black/5 dark:divide-white/5">
                    {productosMasVendidos.map((p, i) => (
                      <tr key={i}>
                        <td className="py-3 text-slate-900 dark:text-white">{p.nombre}</td>
                        <td className="py-3 text-right text-slate-600 dark:text-gray-300">{p.unidades}</td>
                        <td className="py-3 text-right font-semibold text-green-500">S/ {p.ingresos.toLocaleString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {tabActiva === 'Categorias' && (
          <div className="bg-white dark:bg-[#1a1d2e] border border-black/5 dark:border-white/5 rounded-xl p-6">
            <h2 className="text-sm font-semibold text-slate-900 dark:text-white mb-6">Desempeño por Categoría</h2>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={categoriaData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#ffffff08" vertical={false} />
                <XAxis dataKey="cat" stroke="#6b7280" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis yAxisId="left" stroke="#6b7280" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(val) => `S/ ${val/1000}k`} />
                <YAxis yAxisId="right" orientation="right" stroke="#6b7280" fontSize={12} tickLine={false} axisLine={false} />
                <Tooltip {...tooltipStyle} />
                <Legend />
                <Bar yAxisId="left" dataKey="ventas" name="Ventas (S/)" fill="#6366f1" radius={[4, 4, 0, 0]} isAnimationActive={true} animationDuration={1500} animationBegin={300} animationEasing="ease-out" />
                <Bar yAxisId="right" dataKey="pedidos" name="Pedidos" fill="#06b6d4" radius={[4, 4, 0, 0]} isAnimationActive={true} animationDuration={1500} animationBegin={500} animationEasing="ease-out" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}

        {tabActiva === 'Por Horario' && (
          <div className="bg-white dark:bg-[#1a1d2e] border border-black/5 dark:border-white/5 rounded-xl p-6">
            <h2 className="text-sm font-semibold text-slate-900 dark:text-white mb-6">Actividad por Horario</h2>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={porHorario}>
                <CartesianGrid strokeDasharray="3 3" stroke="#ffffff08" vertical={false} />
                <XAxis dataKey="hora" stroke="#6b7280" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="#6b7280" fontSize={12} tickLine={false} axisLine={false} />
                <Tooltip {...tooltipStyle} formatter={(val) => [`${val} ventas`, 'Frecuencia']} />
                <Line type="monotone" dataKey="ventas" stroke="#f59e0b" strokeWidth={3} dot={{ fill: '#f59e0b', strokeWidth: 2, r: 4 }} activeDot={{ r: 6 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>
    </AdminLayout>
  )
}
