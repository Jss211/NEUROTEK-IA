import { useState, useEffect, useRef } from 'react';
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
  const [profileOpen, setProfileOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const profileRef = useRef(null);

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

  // Close profile dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (profileRef.current && !profileRef.current.contains(e.target)) {
        setProfileOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Close mobile menu on route change
  useEffect(() => {
    setMobileMenuOpen(false);
    setProfileOpen(false);
  }, [location.pathname]);

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

  const navLinks = [
    { to: '/tienda', label: 'Inicio', exact: true },
    { to: '/tienda/catalogo', label: 'Catálogo' },
    ...(user ? [
      { to: '/tienda/historial', label: 'Mis Compras' },
    ] : []),
  ];

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#0f1117] text-slate-900 dark:text-white font-sans">
      
      {/* ===== TOP NAVBAR ===== */}
      <header className="sticky top-0 z-50 bg-white/80 dark:bg-[#13151f]/80 backdrop-blur-xl border-b border-black/5 dark:border-white/5">
        <div className="w-full px-4 sm:px-6">
          <div className="flex items-center justify-between h-16 relative">
            
            {/* Left: Logo */}
            <NavLink to="/tienda" className="flex items-center gap-2.5 shrink-0">
              <div className="w-9 h-9 bg-primary rounded-xl flex items-center justify-center">
                <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <span className="font-bold text-slate-900 dark:text-white text-lg hidden sm:block">
                NeuroTek <span className="text-primary text-sm font-medium">Store</span>
              </span>
            </NavLink>

            {/* Center: Nav Links */}
            <nav className="hidden md:flex items-center gap-1 absolute left-1/2 -translate-x-1/2">
              {navLinks.map((link) => {
                const isActive = link.exact
                  ? location.pathname === link.to
                  : location.pathname.startsWith(link.to);
                return (
                  <NavLink
                    key={link.to}
                    to={link.to}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                      isActive
                        ? 'bg-primary/10 text-primary'
                        : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/5'
                    }`}
                  >
                    {link.label}
                  </NavLink>
                );
              })}
            </nav>

            {/* Right: Actions */}
            <div className="flex items-center gap-2">
              
              {/* Dark Mode Toggle */}
              <button
                onClick={toggleTheme}
                className="w-9 h-9 rounded-lg flex items-center justify-center text-slate-500 dark:text-slate-400 hover:bg-black/5 dark:hover:bg-white/5 hover:text-slate-900 dark:hover:text-white transition"
                title={isDarkMode ? 'Modo Claro' : 'Modo Oscuro'}
              >
                {isDarkMode ? (
                  <svg className="w-5 h-5 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4 8a4 4 0 11-8 0 4 4 0 018 0zm-.464 4.95l.707.707a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414zm2.12-10.607a1 1 0 010 1.414l-.706.707a1 1 0 11-1.414-1.414l.707-.707a1 1 0 011.414 0zM17 11a1 1 0 100-2h-1a1 1 0 100 2h1zm-7 4a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zM5.05 6.464A1 1 0 106.465 5.05l-.708-.707a1 1 0 00-1.414 1.414l.707.707zm1.414 8.486l-.707.707a1 1 0 01-1.414-1.414l.707-.707a1 1 0 011.414 1.414zM4 11a1 1 0 100-2H3a1 1 0 000 2h1z" clipRule="evenodd" />
                  </svg>
                ) : (
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z" />
                  </svg>
                )}
              </button>

              {/* Notifications */}
              {user && (
                <NavLink
                  to="/tienda/notificaciones"
                  className="w-9 h-9 rounded-lg flex items-center justify-center text-slate-500 dark:text-slate-400 hover:bg-black/5 dark:hover:bg-white/5 hover:text-slate-900 dark:hover:text-white transition relative"
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                  </svg>
                  <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full" />
                </NavLink>
              )}

              {/* Cart Button */}
              <button
                onClick={() => setIsCarritoOpen(true)}
                className="w-9 h-9 rounded-lg flex items-center justify-center text-slate-500 dark:text-slate-400 hover:bg-black/5 dark:hover:bg-white/5 hover:text-slate-900 dark:hover:text-white transition relative"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
                {cantidadCarrito > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 bg-red-500 text-white text-[10px] font-bold w-4.5 h-4.5 min-w-[18px] min-h-[18px] rounded-full flex items-center justify-center border-2 border-white dark:border-[#13151f]">
                    {cantidadCarrito}
                  </span>
                )}
              </button>

              {/* Divider */}
              <div className="w-px h-6 bg-black/10 dark:bg-white/10 mx-1 hidden sm:block" />

              {/* Profile / Login */}
              {user ? (
                <div className="relative" ref={profileRef}>
                  <button
                    onClick={() => setProfileOpen(!profileOpen)}
                    className="flex items-center gap-2.5 px-2 py-1.5 rounded-xl hover:bg-black/5 dark:hover:bg-white/5 transition"
                  >
                    <div className="relative shrink-0">
                      {avatarUrl ? (
                        <img src={avatarUrl} alt="Perfil" className="w-8 h-8 rounded-full object-cover border-2 border-primary/30" />
                      ) : (
                        <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center text-xs font-bold text-white">
                          {iniciales}
                        </div>
                      )}
                      <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-400 border-2 border-white dark:border-[#13151f] rounded-full" />
                    </div>
                    <span className="text-sm font-semibold text-slate-900 dark:text-white hidden sm:block">{nombre}</span>
                    <svg className={`w-4 h-4 text-slate-400 transition-transform hidden sm:block ${profileOpen ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>

                  {/* Dropdown */}
                  {profileOpen && (
                    <div className="absolute right-0 top-full mt-2 w-56 bg-white dark:bg-[#1a1d2e] border border-black/10 dark:border-white/10 rounded-xl shadow-2xl shadow-black/10 dark:shadow-black/40 py-2 z-50 animate-in fade-in slide-in-from-top-2 duration-200">
                      <div className="px-4 py-3 border-b border-black/5 dark:border-white/5">
                        <p className="text-sm font-semibold text-slate-900 dark:text-white">{nombre}</p>
                        <p className="text-xs text-slate-500 truncate">{user?.email}</p>
                      </div>
                      <NavLink
                        to="/tienda/perfil"
                        className="flex items-center gap-3 px-4 py-2.5 text-sm text-slate-600 dark:text-slate-300 hover:bg-black/5 dark:hover:bg-white/5 transition"
                      >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                        Mi Perfil
                      </NavLink>
                      <NavLink
                        to="/tienda/historial"
                        className="flex items-center gap-3 px-4 py-2.5 text-sm text-slate-600 dark:text-slate-300 hover:bg-black/5 dark:hover:bg-white/5 transition"
                      >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                        </svg>
                        Mis Compras
                      </NavLink>
                      <div className="border-t border-black/5 dark:border-white/5 mt-1 pt-1">
                        <button
                          onClick={handleLogout}
                          className="flex items-center gap-3 px-4 py-2.5 text-sm text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 transition w-full"
                        >
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                          </svg>
                          Cerrar Sesión
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <button
                  onClick={() => navigate('/login?redirect=' + location.pathname)}
                  className="bg-primary hover:bg-primary/90 text-white font-bold px-4 py-2 rounded-xl text-sm transition-all shadow-md shadow-primary/20 flex items-center gap-2"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
                  </svg>
                  <span className="hidden sm:inline">Iniciar Sesión</span>
                </button>
              )}

              {/* Mobile menu button */}
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="w-9 h-9 rounded-lg flex items-center justify-center text-slate-500 dark:text-slate-400 hover:bg-black/5 dark:hover:bg-white/5 md:hidden transition"
              >
                {mobileMenuOpen ? (
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                ) : (
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                  </svg>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Nav Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-black/5 dark:border-white/5 bg-white dark:bg-[#13151f] px-4 py-3 space-y-1">
            {navLinks.map((link) => {
              const isActive = link.exact
                ? location.pathname === link.to
                : location.pathname.startsWith(link.to);
              return (
                <NavLink
                  key={link.to}
                  to={link.to}
                  className={`block px-4 py-2.5 rounded-lg text-sm font-medium transition ${
                    isActive
                      ? 'bg-primary/10 text-primary'
                      : 'text-slate-600 dark:text-slate-400 hover:bg-black/5 dark:hover:bg-white/5'
                  }`}
                >
                  {link.label}
                </NavLink>
              );
            })}
          </div>
        )}
      </header>

      {/* ===== MAIN CONTENT ===== */}
      <main className="min-h-[calc(100vh-64px)]">
        {children}
      </main>

      {/* Cart Drawer */}
      <CarritoDrawer />
    </div>
  );
}
