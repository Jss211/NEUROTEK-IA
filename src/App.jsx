import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import { TiendaProvider } from './context/TiendaContext'
import { ConfigProvider } from './context/ConfigContext'
import ProtectedRoute from './components/ProtectedRoute'

// Auth
import Login from './pages/Login'
import Register from './pages/Register'
import ForgotPassword from './pages/ForgotPassword'

// Admin
import AdminDashboard from './pages/admin/Dashboard'
import Productos from './pages/admin/Productos'
import Inventario from './pages/admin/Inventario'
import Ordenes from './pages/admin/Ordenes'
import Clientes from './pages/admin/Clientes'
import Notificaciones from './pages/admin/Notificaciones'
import Analytics from './pages/admin/Analytics'
import Reportes from './pages/admin/Reportes'
import Equipo from './pages/admin/Equipo'
import Configuracion from './pages/admin/Configuracion'

// Tienda (Clientes)
import InicioTienda from './pages/tienda/InicioTienda'
import CatalogoTienda from './pages/tienda/CatalogoTienda'
import OfertasTienda from './pages/tienda/OfertasTienda'
import NosotrosTienda from './pages/tienda/NosotrosTienda'
import SoporteTienda from './pages/tienda/SoporteTienda'

import ProductoDetalle from './pages/tienda/ProductoDetalle'
import HistorialCompras from './pages/tienda/HistorialCompras'
import PerfilCliente from './pages/tienda/PerfilCliente'
import Carrito from './pages/tienda/Carrito'
import NotificacionesCliente from './pages/tienda/NotificacionesCliente'

export default function App() {
  return (
    <AuthProvider>
      <ConfigProvider>
        <TiendaProvider>
          <BrowserRouter>
            <Routes>
              {/* Públicas */}
              <Route path="/" element={<Navigate to="/tienda" replace />} />
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route path="/forgot-password" element={<ForgotPassword />} />

              {/* Cliente — rutas públicas */}
              <Route path="/tienda" element={<InicioTienda />} />
              <Route path="/tienda/catalogo" element={<CatalogoTienda />} />
              <Route path="/tienda/ofertas" element={<OfertasTienda />} />
              <Route path="/tienda/nosotros" element={<NosotrosTienda />} />
              <Route path="/tienda/soporte" element={<SoporteTienda />} />
              <Route path="/tienda/producto/:id" element={<ProductoDetalle />} />
              <Route path="/tienda/carrito" element={<Carrito />} />

              {/* Cliente — rutas privadas protegidas */}
              <Route path="/tienda/historial" element={<ProtectedRoute allowedRoles={['cliente']}><HistorialCompras /></ProtectedRoute>} />
              <Route path="/tienda/perfil" element={<ProtectedRoute allowedRoles={['cliente']}><PerfilCliente /></ProtectedRoute>} />
              <Route path="/tienda/notificaciones" element={<ProtectedRoute allowedRoles={['cliente']}><NotificacionesCliente /></ProtectedRoute>} />


              {/* Admin / Vendedor — protegidas */}
              <Route path="/admin" element={<Navigate to="/admin/dashboard" replace />} />
              <Route path="/admin/dashboard"     element={<ProtectedRoute allowedRoles={['admin', 'vendedor']}><AdminDashboard /></ProtectedRoute>} />
              <Route path="/admin/productos"     element={<ProtectedRoute allowedRoles={['admin', 'vendedor']}><Productos /></ProtectedRoute>} />
              <Route path="/admin/inventario"    element={<ProtectedRoute allowedRoles={['admin', 'vendedor']}><Inventario /></ProtectedRoute>} />
              <Route path="/admin/ordenes"       element={<ProtectedRoute allowedRoles={['admin', 'vendedor']}><Ordenes /></ProtectedRoute>} />
              <Route path="/admin/clientes"      element={<ProtectedRoute allowedRoles={['admin', 'vendedor']}><Clientes /></ProtectedRoute>} />
              <Route path="/admin/analytics"     element={<ProtectedRoute allowedRoles={['admin', 'vendedor']}><Analytics /></ProtectedRoute>} />
              <Route path="/admin/reportes"      element={<ProtectedRoute allowedRoles={['admin']}><Reportes /></ProtectedRoute>} />
              <Route path="/admin/notificaciones" element={<ProtectedRoute allowedRoles={['admin', 'vendedor']}><Notificaciones /></ProtectedRoute>} />
              
              {/* Solo Admin */}
              <Route path="/admin/equipo"        element={<ProtectedRoute allowedRoles={['admin']}><Equipo /></ProtectedRoute>} />
              <Route path="/admin/configuracion" element={<ProtectedRoute allowedRoles={['admin', 'vendedor', 'cliente']}><Configuracion /></ProtectedRoute>} />

              {/* Dashboard viejo → redirige al admin */}
              <Route path="/dashboard" element={<Navigate to="/admin/dashboard" replace />} />
            </Routes>
          </BrowserRouter>
        </TiendaProvider>
      </ConfigProvider>
    </AuthProvider>
  )
}
