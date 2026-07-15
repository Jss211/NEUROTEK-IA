import { useState, useEffect } from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useTienda } from '../../context/TiendaContext';
import CarritoDrawer from './CarritoDrawer';
import { supabase } from '../../lib/supabase';

export default function TiendaLayout({ children }) {
  const { user } = useAuth();
  const { carrito, setIsCarritoOpen } = useTienda();
  const location = useLocation();
  const navigate = useNavigate();

  const [isDarkMode, setIsDarkMode] = useState(() => {
    return localStorage.getItem('theme') === 'dark' || 
      (!('theme' in localStorage) && window.matchMedia('(prefers-color-scheme: dark)').matches);
  });

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [isDarkMode]);

  const toggleTheme = () => setIsDarkMode(!isDarkMode);

  const cantidadCarrito = carrito.reduce((acc, item) => acc + item.cantidad, 0);
  const nombre = user?.user_metadata?.full_name?.split(' ')[0] || user?.email || 'Usuario';
  const avatarUrl = user?.user_metadata?.avatar_url;
  const iniciales = nombre.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut()
    } catch (err) {
      console.error(err)
    } finally {
      for (let key in localStorage) {
        if (key.startsWith('sb-')) {
          localStorage.removeItem(key)
        }
      }
      window.location.href = '/login'
    }
  };

  const navItems = [
    {
      to: '/tienda',
      label: 'Inicio',
      exact: true,
      public: true,
      icon: (
        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
        </svg>
      )
    },
    {
      to: '/tienda/catalogo',
      label: 'Catálogo',
      public: true,
      icon: (
        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
        </svg>
      )
    },
    {
      to: '/tienda/historial',
      label: 'Mis Compras',
      public: false,
      icon: (
        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
        </svg>
      )
    },
    {
      to: '/tienda/perfil',
      label: 'Mi Perfil',
      public: false,
      icon: (
        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
        </svg>
      )
    },
    {
      to: '/tienda/carrito',
      label: 'Mi Carrito',
      public: true,
      icon: (
        <div className="relative">
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
          </svg>
          {cantidadCarrito > 0 && (
            <span className="absolute -top-1.5 -right-1.5 bg-red-500 text-white text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center border-2 border-white dark:border-[#13151f]">
              {cantidadCarrito}
            </span>
          )}
        </div>
      )
    },
    {
      to: '/tienda/notificaciones',
      label: 'Notificaciones',
      public: false,
      icon: (
        <div className="relative">
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
          </svg>
          {/* Asumimos que aquí el cliente puede tener nuevas alertas en un rediseño futuro, por ahora un punto opcional */}
          <span className="absolute top-0 right-0 w-2 h-2 bg-red-500 rounded-full border-2 border-white dark:border-[#13151f]"></span>
        </div>
      )
    }
  ];

  const visibleNavItems = navItems.filter(item => user ? true : item.public);

  return (
    <div className="flex h-screen bg-slate-50 dark:bg-[#0f1117] text-slate-900 dark:text-white overflow-hidden font-sans">
      
      {/* Sidebar estilo Admin */}
      <aside className="w-72 flex flex-col bg-white dark:bg-[#13151f] border-r border-black/5 dark:border-white/5 shrink-0 overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
        {/* Logo */}
        <div className="flex items-center gap-3 px-4 py-5 border-b border-black/5 dark:border-white/5 shrink-0">
          <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center shrink-0">
            <svg className="w-6 h-6 text-slate-900 dark:text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </div>
          <span className="font-bold text-slate-900 dark:text-white text-lg">NeuroTek <span className="text-primary text-sm ml-1 font-medium">Store</span></span>
        </div>

        {/* Navigation */}
        <nav className="flex-1 py-4 flex flex-col gap-1">
          <p className="text-xs font-semibold text-slate-400 dark:text-slate-500 mb-3 px-6 uppercase tracking-wider">Explorar</p>
          
          {visibleNavItems.map((item) => {
            const isActive = item.exact 
              ? location.pathname === item.to 
              : location.pathname.startsWith(item.to);
            return (
              <NavLink
                key={item.to}
                to={item.to}
                className={`group flex items-center gap-4 px-6 py-4 transition-all w-full ${
                  isActive
                    ? 'bg-primary/20 text-primary/80 border-r-4 border-primary font-bold'
                    : 'text-gray-400 hover:bg-black/5 dark:hover:bg-white/5 hover:text-slate-900 dark:hover:text-white border-r-4 border-transparent font-semibold'
                }`}
              >
                <span className="shrink-0 w-6 h-6 flex items-center justify-center transition-transform duration-300 group-hover:scale-110 group-active:scale-95">
                  {item.icon}
                </span>
                <span className="flex-1 text-[15px]">{item.label}</span>
              </NavLink>
            );
          })}
        </nav>

        {/* User footer in sidebar */}
        <div className="border-t border-black/5 dark:border-white/5 p-4 flex flex-col gap-4 shrink-0">
          
          {/* Theme Toggle Button */}
          <button 
            onClick={toggleTheme}
            className="flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-medium text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/50 hover:text-slate-900 dark:hover:text-white transition-colors"
          >
            {isDarkMode ? (
              <>
                <svg className="w-5 h-5 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                   <path fillRule="evenodd" d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4 8a4 4 0 11-8 0 4 4 0 018 0zm-.464 4.95l.707.707a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414zm2.12-10.607a1 1 0 010 1.414l-.706.707a1 1 0 11-1.414-1.414l.707-.707a1 1 0 011.414 0zM17 11a1 1 0 100-2h-1a1 1 0 100 2h1zm-7 4a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zM5.05 6.464A1 1 0 106.465 5.05l-.708-.707a1 1 0 00-1.414 1.414l.707.707zm1.414 8.486l-.707.707a1 1 0 01-1.414-1.414l.707-.707a1 1 0 011.414 1.414zM4 11a1 1 0 100-2H3a1 1 0 000 2h1z" clipRule="evenodd" />
                </svg>
                Modo Claro
              </>
            ) : (
              <>
                <svg className="w-5 h-5 text-slate-700" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z" />
                </svg>
                Modo Oscuro
              </>
            )}
          </button>

          {/* User Profile or Guest Login */}
          {user ? (
            <div className="flex items-center gap-3 px-2">
              <div className="relative shrink-0">
                {avatarUrl ? (
                  <img src={avatarUrl} alt="Perfil" className="w-10 h-10 rounded-full object-cover border-2 border-primary/50" />
                ) : (
                  <div className="w-10 h-10 bg-primary rounded-full flex items-center justify-center text-sm font-bold text-slate-900 dark:text-white">
                    {iniciales}
                  </div>
                )}
                <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-400 border-2 border-white dark:border-[#13151f] rounded-full" />
              </div>
              
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-slate-900 dark:text-white truncate">{nombre}</p>
                <p className="text-xs text-primary/80 truncate">Cliente</p>
              </div>
              
              <button 
                onClick={handleLogout}
                className="text-gray-500 hover:text-red-400 transition shrink-0"
                title="Cerrar sesión"
              >
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
              </button>
            </div>
          ) : (
            <div className="px-2 pt-2">
              <button 
                onClick={() => navigate('/login?redirect=' + location.pathname)}
                className="w-full bg-primary hover:bg-primary/90 text-white font-bold py-2.5 rounded-xl transition-all shadow-md shadow-primary/20 flex items-center justify-center gap-2"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
                </svg>
                Iniciar Sesión
              </button>
            </div>
          )}
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden relative">
        <main className="flex-1 overflow-y-auto">
          {children}
        </main>
      </div>

      {/* Cart Drawer */}
      <CarritoDrawer />
    </div>
  );
}
