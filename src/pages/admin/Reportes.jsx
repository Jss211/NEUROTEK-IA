import { useState, useRef, useEffect } from 'react'
import { format } from 'date-fns'
import { DatePicker } from '../../components/ui/DatePicker'
import {
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts'
import AdminLayout from '../../components/admin/AdminLayout'
import { exportElementToPdf } from '../../lib/pdfExport'
import { supabase } from '../../lib/supabase'

const tooltipStyle = {
  contentStyle: { backgroundColor: '#1a1d2e', border: '1px solid #ffffff10', borderRadius: '8px', color: '#fff', fontSize: '12px' },
}

const CUSTOM_LABEL = ({ cx, cy, midAngle, outerRadius, name, value }) => {
  const RADIAN = Math.PI / 180
  const radius = outerRadius + 35
  const x = cx + radius * Math.cos(-midAngle * RADIAN)
  const y = cy + radius * Math.sin(-midAngle * RADIAN)
  return (
    <text x={x} y={y} fill="#9ca3af" textAnchor={x > cx ? 'start' : 'end'} dominantBaseline="central" fontSize={12}>
      {`${name}: ${value}%`}
    </text>
  )
}

const CATEGORY_COLORS = {
  'Electronicos': '#06b6d4',
  'Accesorios': '#6366f1',
  'Periféricos': '#a855f7',
  'Computadoras': '#10b981',
  'Monitores': '#f59e0b',
  'Audio': '#ec4899',
  'Otros': '#64748b'
}

export default function Reportes() {
  const [fecha, setFecha] = useState(new Date())
  const [exportando, setExportando] = useState(false)
  const reporteRef = useRef(null)

  const [loading, setLoading] = useState(true)
  const [metricasGlobales, setMetricasGlobales] = useState({ ventasTotales: 0, totalProductos: 0, totalClientes: 0 })
  const [ventasGastos, setVentasGastos] = useState([])
  const [tendenciaVentas, setTendenciaVentas] = useState([])
  const [distribucionCat, setDistribucionCat] = useState([])

  useEffect(() => {
    fetchReportData()
  }, [])

  const fetchReportData = async () => {
    setLoading(true)
    try {
      const { data: ordenes } = await supabase.from('ordenes').select('*').neq('estado', 'Cancelada')
      const { data: productos } = await supabase.from('productos').select('*')
      const { data: clientes } = await supabase.from('usuarios').select('*').eq('rol', 'cliente')

      const ordenesData = ordenes || []
      const productosData = productos || []
      const clientesData = clientes || []

      // 1. Resumen Global
      const ventasTotales = ordenesData.reduce((sum, o) => sum + (parseFloat(o.total) || 0), 0)
      const totalProductos = ordenesData.reduce((sum, o) => sum + (parseInt(o.items) || 0), 0)
      setMetricasGlobales({ ventasTotales, totalProductos, totalClientes: clientesData.length })

      // 2. Ventas vs Gastos (Agrupados por mes, asumiendo 70% de gasto como costo de mercancía)
      const monthly = {}
      ordenesData.forEach(o => {
        const d = new Date(o.fecha)
        const month = d.toLocaleString('es-ES', { month: 'short' }).substring(0, 3)
        if (!monthly[month]) monthly[month] = { mes: month, ventas: 0, gastos: 0 }
        monthly[month].ventas += parseFloat(o.total) || 0
        monthly[month].gastos += (parseFloat(o.total) || 0) * 0.7 
      })
      
      const arrMonthly = Object.values(monthly).length > 0 ? Object.values(monthly) : [{mes: 'Act', ventas: 0, gastos: 0}]
      setVentasGastos(arrMonthly)
      
      // 3. Tendencia de Ventas (Usamos los mismos datos de ventas mensuales para la tendencia)
      const arrTendencia = arrMonthly.map(item => ({ mes: item.mes, ventas: item.ventas }))
      setTendenciaVentas(arrTendencia)

      // 4. Distribución por Categoría (Porcentaje en base al inventario y precios)
      const catCount = {}
      let totalValorInventario = 0
      productosData.forEach(p => {
        const cat = p.categoria || 'Otros'
        const valor = parseFloat(p.precio) || 1
        if (!catCount[cat]) catCount[cat] = 0
        catCount[cat] += valor
        totalValorInventario += valor
      })

      if (totalValorInventario === 0) totalValorInventario = 1
      const catsArray = Object.keys(catCount).map(c => ({
        name: c,
        value: Math.round((catCount[c] / totalValorInventario) * 100),
        color: CATEGORY_COLORS[c] || CATEGORY_COLORS['Otros']
      })).filter(c => c.value > 0).sort((a,b) => b.value - a.value)
      
      setDistribucionCat(catsArray.length > 0 ? catsArray : [{name: 'Sin datos', value: 100, color: '#64748b'}])

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
        element: reporteRef.current,
        fileName: `reporte-neurotek-${format(new Date(), 'yyyy-MM-dd')}.pdf`,
        fallbackTitle: 'Reporte NeuroTek',
        fallbackSections: [
          {
            title: 'Resumen',
            lines: [
              `Ventas Totales: $${metricasGlobales.ventasTotales.toLocaleString()}`,
              `Productos Vendidos (Items): ${metricasGlobales.totalProductos}`,
              `Clientes Registrados: ${metricasGlobales.totalClientes}`,
            ],
          },
          {
            title: 'Ventas vs Gastos (Est)',
            lines: ventasGastos.map((item) => `${item.mes}: ventas $${item.ventas.toLocaleString()}, gastos $${item.gastos.toLocaleString()}`),
          },
          {
            title: 'Distribucion por Categoria',
            lines: distribucionCat.map((item) => `${item.name}: ${item.value}%`),
          },
        ],
      })
    } catch (e) {
      console.error(e)
    } finally {
      setExportando(false)
    }
  }

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center min-h-[50vh]">
          <div className="animate-pulse text-primary font-medium">Sincronizando reportes en tiempo real...</div>
        </div>
      </AdminLayout>
    )
  }

  return (
    <AdminLayout>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Reportes</h1>
          <p className="text-slate-500 dark:text-gray-400 text-sm mt-1">Análisis y reportes detallados en tiempo real</p>
        </div>
        <div className="flex items-center gap-3">
          <DatePicker date={fecha} onSelect={(d) => d && setFecha(d)} className="bg-white dark:bg-transparent" />
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
                Exportar
              </span>
            )}
          </button>
        </div>
      </div>

      <div ref={reporteRef} className="space-y-6">
        {/* KPIs */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white dark:bg-[#1a1d2e] border border-black/5 dark:border-white/5 rounded-xl p-5">
            <p className="text-sm text-slate-500 dark:text-gray-400 mb-1">Ventas Totales</p>
            <p className="text-2xl font-bold text-slate-900 dark:text-white">${metricasGlobales.ventasTotales.toLocaleString(undefined, {minimumFractionDigits: 2})}</p>
            <p className="text-xs text-green-500 mt-1">↑ En base a órdenes</p>
          </div>
          <div className="bg-white dark:bg-[#1a1d2e] border border-black/5 dark:border-white/5 rounded-xl p-5">
            <p className="text-sm text-slate-500 dark:text-gray-400 mb-1">Productos Vendidos</p>
            <p className="text-2xl font-bold text-slate-900 dark:text-white">{metricasGlobales.totalProductos.toLocaleString()}</p>
            <p className="text-xs text-green-500 mt-1">↑ Total de items</p>
          </div>
          <div className="bg-white dark:bg-[#1a1d2e] border border-black/5 dark:border-white/5 rounded-xl p-5">
            <p className="text-sm text-slate-500 dark:text-gray-400 mb-1">Total Clientes</p>
            <p className="text-2xl font-bold text-slate-900 dark:text-white">{metricasGlobales.totalClientes}</p>
            <p className="text-xs text-green-500 mt-1">↑ Usuarios registrados</p>
          </div>
        </div>

        {/* Graficos Principales */}
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          <div className="bg-white dark:bg-[#1a1d2e] border border-black/5 dark:border-white/5 rounded-xl p-6">
            <h2 className="text-sm font-semibold text-slate-900 dark:text-white mb-6">Ventas vs Gastos Operativos (Est.)</h2>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={ventasGastos}>
                <CartesianGrid strokeDasharray="3 3" stroke="#ffffff08" vertical={false} />
                <XAxis dataKey="mes" stroke="#6b7280" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="#6b7280" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(val) => `$${val/1000}k`} />
                <Tooltip {...tooltipStyle} formatter={(val) => [`$${val.toLocaleString(undefined, {minimumFractionDigits: 2})}`, '']} />
                <Legend />
                <Bar dataKey="ventas" name="Ventas Brutas" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                <Bar dataKey="gastos" name="Costos Estimados" fill="#f43f5e" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="bg-white dark:bg-[#1a1d2e] border border-black/5 dark:border-white/5 rounded-xl p-6">
            <h2 className="text-sm font-semibold text-slate-900 dark:text-white mb-6">Tendencia de Crecimiento</h2>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={tendenciaVentas}>
                <CartesianGrid strokeDasharray="3 3" stroke="#ffffff08" vertical={false} />
                <XAxis dataKey="mes" stroke="#6b7280" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="#6b7280" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(val) => `$${val/1000}k`} />
                <Tooltip {...tooltipStyle} formatter={(val) => [`$${val.toLocaleString(undefined, {minimumFractionDigits: 2})}`, 'Ventas']} />
                <Line type="monotone" dataKey="ventas" stroke="#10b981" strokeWidth={3} dot={{ fill: '#10b981', strokeWidth: 2, r: 4 }} activeDot={{ r: 6 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Distribucion */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-1 bg-white dark:bg-[#1a1d2e] border border-black/5 dark:border-white/5 rounded-xl p-6">
            <h2 className="text-sm font-semibold text-slate-900 dark:text-white mb-6">Valor por Categoría</h2>
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={distribucionCat}
                  cx="50%" cy="50%"
                  labelLine={false}
                  label={CUSTOM_LABEL}
                  outerRadius={80}
                  innerRadius={50}
                  dataKey="value"
                  paddingAngle={5}
                >
                  {distribucionCat.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip {...tooltipStyle} formatter={(val) => [`${val}%`, '']} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          
          <div className="lg:col-span-2 bg-white dark:bg-[#1a1d2e] border border-black/5 dark:border-white/5 rounded-xl p-6 flex flex-col justify-center">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">Resumen Ejecutivo</h3>
            <p className="text-slate-500 dark:text-gray-400 text-sm leading-relaxed mb-6">
              Este reporte en tiempo real detalla las operaciones de tu negocio, extrayendo datos reales de Supabase. 
              Los márgenes de ganancia e ingresos están tabulados al momento del cierre de cada mes.
            </p>
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-black/5 dark:bg-white/5 rounded-lg p-4">
                <p className="text-xs text-slate-500 dark:text-gray-400 mb-1">Mejor Mes (Estimado)</p>
                <p className="font-semibold text-slate-900 dark:text-white">
                  {ventasGastos.length > 0 ? [...ventasGastos].sort((a,b) => b.ventas - a.ventas)[0].mes : 'N/A'}
                </p>
              </div>
              <div className="bg-black/5 dark:bg-white/5 rounded-lg p-4">
                <p className="text-xs text-slate-500 dark:text-gray-400 mb-1">Categoría Dominante</p>
                <p className="font-semibold text-slate-900 dark:text-white">
                  {distribucionCat.length > 0 ? distribucionCat[0].name : 'N/A'}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  )
}
