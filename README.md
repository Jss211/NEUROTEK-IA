# NeuroTek - Documentación Técnica y Arquitectura

NeuroTek es una plataforma integral de comercio electrónico para componentes de PC y periféricos. Se compone de dos áreas principales unificadas en un solo proyecto:
1. **La Tienda Frontend (Storefront):** Una interfaz orientada al consumidor con un catálogo dinámico de productos, soporte multilenguaje, modo claro/oscuro y carrito de compras.
2. **El Panel de Administración (Admin Dashboard):** Un robusto back-office para gestionar productos, inventario, clientes, ventas y configuraciones de la plataforma.

Este sistema está construido con **React** y **Vite**, estilizándose a través de **Tailwind CSS** y **Framer Motion**, y utilizando **Supabase** como backend como servicio (BaaS) para la autenticación y la base de datos en tiempo real.

---

## 🏗️ Estructura del Proyecto

```text
src/
├── assets/         # Imágenes estáticas y logos del sistema.
├── components/     # Componentes de UI modulares y reutilizables.
│   ├── admin/      # Componentes exclusivos para el Panel de Administración (Layout).
│   ├── tienda/     # Componentes de la tienda (Layout, Carrito).
│   └── ui/         # Componentes atómicos (botones, tarjetas, inputs, animaciones).
├── context/        # Estados globales (React Context).
├── lib/            # Utilidades, servicios y configuración (Supabase, PDF Export).
└── pages/          # Vistas (pantallas completas) del sistema.
    ├── admin/      # Vistas del dashboard de administrador.
    └── tienda/     # Vistas públicas para el consumidor.
```

---

## 📂 Descripción Detallada de Archivos

### 1. Entrada y Enrutamiento Base
- **`src/main.jsx`**: El punto de entrada principal de React. Inicializa la aplicación y la inyecta en el DOM.
- **`src/App.jsx`**: Contiene la definición global de rutas mediante `react-router-dom`. Envuelve todas las vistas en los Proveedores de Contexto (`AuthProvider`, `ConfigProvider`, `TiendaProvider`) y gestiona las rutas públicas (`/tienda`) y privadas (`/admin`).
- **`src/index.css` & `src/App.css`**: Configuración global de estilos. `index.css` importa Tailwind CSS y define variables globales en CSS puro (para soportar cambios de colores en tiempo real).

### 2. Contextos (Gestión de Estado Global)
- **`src/context/AuthContext.jsx`**: Conecta directamente con la API de Supabase para manejar el inicio de sesión, registro, sesión activa y verificación de roles (`cliente`, `admin`, `vendedor`).
- **`src/context/ConfigContext.jsx`**: Alberga un diccionario completo de traducciones (Español/Inglés). Además, maneja configuraciones globales persistentes como el formato de moneda.
- **`src/context/TiendaContext.jsx`**: Un estado complejo y muy importante. Controla de principio a fin el Carrito de Compras (agregar, quitar, recalcular totales) y persiste el estado en `localStorage` para evitar la pérdida de la compra si el usuario recarga la página.

### 3. Vistas Principales (Pages)
**Autenticación**
- **`Login.jsx` & `Register.jsx`**: Formularios dinámicos que manejan la autenticación. `Login` tiene una lógica inteligente que redirige al Dashboard o a la Tienda dependiendo del rol del usuario de forma automática, validando un parámetro de redirección (p. ej. si ibas a pagar, después de login te devuelve al carrito).
- **`ForgotPassword.jsx`**: Flujo para recuperar la contraseña mediante Supabase auth.

**Tienda Frontend (`src/pages/tienda/`)**
- **`InicioTienda.jsx`**: La landing page con el carrusel de productos de Hero, llamadas a la acción, características y carrusel de clientes (Testimonials).
- **`CatalogoTienda.jsx`**: Muestra todo el catálogo interactivo de la base de datos, con soporte para filtrado (por marcas y categorías) y ordenamiento por precios.
- **`ProductoDetalle.jsx`**: Vista singular de un producto mostrando imágenes, información extendida, stock en tiempo real y permitiendo su adición al carrito.
- **`OfertasTienda.jsx`**: Destaca productos etiquetados en oferta con precios rebajados.
- **`NosotrosTienda.jsx`**: Página informativa utilizando el componente avanzado de presentación de perfiles (carrusel animado y elegante).
- **`SoporteTienda.jsx`**: Sistema de soporte donde los clientes dejan sus consultas.
- **`HistorialCompras.jsx`, `PerfilCliente.jsx`, `NotificacionesCliente.jsx`**: Áreas exclusivas (`ProtectedRoute`) donde los usuarios ven sus pedidos anteriores y notificaciones (p. ej., actualización del estado del pedido).

**Panel de Administrador (`src/pages/admin/`)**
- **`Dashboard.jsx`**: Resumen analítico con tarjetas de métricas en vivo, gráficas de ventas e información general de desempeño.
- **`Productos.jsx`**: CRUD de productos. Permite crear y editar componentes en Supabase, gestionar stocks y características.
- **`Inventario.jsx`**: Vista centrada estrictamente en el estado de las unidades. Advierte de niveles críticos (Stock Bajo o Sin Stock).
- **`Ordenes.jsx`**: Gestor de transacciones. Permite a los administradores actualizar el estado de una venta ("Enviado", "Completada") y notificar automáticamente al cliente.
- **`Clientes.jsx`**: CRM del negocio; visualiza los historiales de compra y contacto de los clientes de la tienda.
- **`Reportes.jsx` & `Analytics.jsx`**: Generadores de gráficos analíticos detallados, soportando exportación a reportes interactivos (PDFs generados en frontend mediante `jsPDF`).
- **`Notificaciones.jsx`**: Una bandeja de entrada en tiempo real con alertas del sistema impulsadas por PostgreSQL WebSockets de Supabase (por ejemplo, notifica de inmediato si un cliente hace una compra).
- **`Configuracion.jsx`**: Ajuste profundo de preferencias. Aquí el admin escoge el Idioma global, el color nativo principal (que modifica variables de CSS root) y el comportamiento unificado del Tema Claro/Oscuro.

### 4. Layouts y Componentes Base
- **`AdminLayout.jsx`**: El esqueleto lateral (Sidebar) y superior del panel. Escucha cambios en tiempo real en la base de datos para mostrar badges rojos en las notificaciones.
- **`TiendaLayout.jsx`**: El esqueleto del Frontend, incluyendo la barra superior de navegación inteligente. Integra botones como cambiar el modo Oscuro, selector de idiomas en vivo, e invoca el componente `CarritoDrawer.jsx`.
- **`CarritoDrawer.jsx`**: Es un menú lateral superpuesto que lista dinámicamente los ítems en el carrito usando `TiendaContext`, mostrando la factura final y los botones de compra.

### 5. Componentes de UI Reutilizables (`src/components/ui/`)
- **`ElegantCarousel.jsx`**: Un componente moderno que rota tarjetas con detalles profundos, usado específicamente en la vista de "Nosotros" para presentar a los fundadores.
- **`testimonial-card.jsx`**: Tarjeta moderna con diseño asimétrico para la sección de opiniones de los clientes y reseñas.
- **`TypewriterText.jsx`**: Componente que simula escritura de texto en pantalla (máquina de escribir) usado para el título del Hero.
- Componentes de Shadcn UI (`button.jsx`, `card.jsx`, `avatar.jsx`) implementados para mantener consistencia visual.

### 6. Archivos Lib (Configuración Core)
- **`supabase.js`**: Centraliza e inicializa la clave de API y URL para todo el proyecto, conectando la app con el backend BaaS de manera unificada.
- **`utils.js`**: Exporta `cn` (clsx + tailwind-merge) para lidiar eficientemente con colisiones de clases en Tailwind CSS (útil para componentes UI dinámicos).
- **`pdfExport.js`**: Biblioteca auxiliar que engloba la lógica de transformación de gráficos y datos en archivos PDF formales y exportables.

---

## ⚙️ Funcionalidades Especiales

### 1. Sistema de "Tema Oscuro" Unificado
El diseño usa la convención `class` en el tag `<html className="dark">`. Tanto `TiendaLayout.jsx` como `Configuracion.jsx` se sincronizan a través de `localStorage.getItem('theme')` (guardando valores `light` o `dark`). Esto garantiza que los administradores no experimenten flasheos blancos o negros al navegar desde la tienda hasta las configuraciones internas.

### 2. Autenticación Transparente
A través del `ProtectedRoute.jsx`, el sistema decide en tiempo real a qué pantalla enviarte. Si navegas al carrito, pero no tienes sesión, serás redireccionado a `/login?redirect=/tienda/carrito`. Tras hacer login, en vez de obligarte a ir al Dashboard, te devuelve de inmediato donde estabas (si eres un cliente/usuario regular). Si eres admin, te forzará ir al Panel de Control a menos que entres manualmente a la tienda.

---

## 🧰 Librerías y Dependencias Principales
El proyecto utiliza un conjunto moderno de herramientas del ecosistema React:
- **`@supabase/supabase-js`**: Cliente oficial para interactuar con la base de datos, Storage, Auth y WebSockets.
- **`react-router-dom`**: Enrutamiento dinámico para SPA (Single Page Application).
- **`tailwindcss` & `framer-motion`**: Estilizado mediante clases utilitarias de Tailwind y animaciones fluidas con Framer Motion.
- **`lucide-react`**: Colección de íconos vectoriales modernos y consistentes.
- **`recharts`**: Librería para renderizar los gráficos de ventas e inventario en el Dashboard y Analytics.
- **`jspdf` & `html2canvas`**: Utilizados para generar y exportar reportes en PDF dinámicos desde el frontend.
- **`xlsx`**: Permite la exportación del inventario a hojas de cálculo de Excel.
- **`clsx`, `tailwind-merge`, `class-variance-authority`**: Utilidades esenciales (usadas en `utils.js`) para manejar y fusionar clases condicionales de Tailwind de forma segura (fundamento de componentes tipo Shadcn).
- **`date-fns` & `react-day-picker`**: Manejo avanzado de fechas y calendarios.
- **`@radix-ui/react-*`**: Primitivas accesibles "headless" utilizadas para crear componentes UI robustos como Popovers y Avatares.

---

## 🌩️ Arquitectura Full Stack con Supabase
NeuroTek es una aplicación **Full Stack** gracias a la profunda integración con **Supabase**, actuando como Backend-as-a-Service (BaaS). Aquí explicamos cómo se aprovecha cada módulo:

### 1. Base de Datos (PostgreSQL)
Se utilizan tablas relacionales para almacenar: `usuarios`, `productos`, `inventario` y `ordenes`. El frontend hace consultas directas (SQL-like) usando el cliente de Supabase (por ejemplo, `supabase.from('productos').select('*')`). Las políticas de seguridad (RLS - Row Level Security) en el servidor protegen quién puede leer o escribir datos.

### 2. Autenticación (Auth)
La autenticación de usuarios (registro y login) se maneja a través de Supabase Auth. Los tokens JWT de sesión se administran automáticamente. Además, usamos los metadatos del usuario (`user_metadata`) para almacenar información adicional como el nombre completo (`full_name`) y teléfono directamente en su cuenta de sesión, sincronizándolo luego con nuestra tabla pública de `usuarios`.

### 3. WebSockets y Tiempo Real (Realtime)
NeuroTek utiliza el sistema `postgres_changes` de Supabase para **escuchar cambios en la base de datos en tiempo real**. 
- En `TiendaLayout.jsx`, `NotificacionesCliente.jsx` y `AdminLayout.jsx`, la app se "suscribe" a tablas como `ordenes` o `productos`. 
- Si un cliente compra algo, el stock disminuye y el panel del administrador recibe la notificación al instante (aparece la campanita roja) **sin necesidad de recargar la página**.

### 4. Almacenamiento en la Nube (Storage)
Las fotos de perfil de los usuarios y las imágenes de los productos (cuando un admin las sube) se envían al _Storage_ de Supabase (bucket de `avatars` o `products`). Luego, el sistema solicita la "Public URL" (URL pública) de esas fotos y las guarda en la base de datos para renderizarlas en los menús y el catálogo.

---

## 🚀 Cómo Iniciar en Desarrollo
```bash
# 1. Instalar dependencias requeridas (incluye Vite, Tailwind, Supabase-js, Framer Motion y más)
npm install

# 2. Levantar el servidor de desarrollo en Hot Reloading
npm run dev

# 3. Empaquetar y optimizar la app para Producción
npm run build
```
