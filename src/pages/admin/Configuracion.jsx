import { useState, useEffect } from 'react';
import AdminLayout from '../../components/admin/AdminLayout';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../lib/supabase';
import Toast from '../../components/Toast';
import { ColorSwatchPicker } from '../../components/ui/heroui-color-swatch-picker';

const availableColors = ["#00f3ff", "#ff00ff", "#00ff00", "#ff5e00", "#ccff00", "#ffffff", "#06b6d4", "#F43F5E"];

export default function Configuracion() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('perfil');
  const [isEditing, setIsEditing] = useState(false);
  const [toast, setToast] = useState(null);
  
  // Theme state
  const [primaryColor, setPrimaryColor] = useState(localStorage.getItem('app-primary-color') || '#00f3ff');
  
  useEffect(() => {
    document.documentElement.style.setProperty('--app-primary', primaryColor);
    localStorage.setItem('app-primary-color', primaryColor);
  }, [primaryColor]);

  const [fotoPreview, setFotoPreview] = useState(user?.user_metadata?.avatar_url || null);
  const [fotoFile, setFotoFile] = useState(null);

  const [perfilForm, setPerfilForm] = useState({
    nombre: user?.user_metadata?.full_name?.split(' ')[0] || '',
    apellido: user?.user_metadata?.full_name?.split(' ').slice(1).join(' ') || '',
    email: user?.email || '',
    telefono: user?.user_metadata?.telefono || '',
    empresa: user?.user_metadata?.empresa || '',
    rol: user?.role || 'cliente'
  });

  const [notificacionesSettings, setNotificacionesSettings] = useState({
    email: true,
    stockBajo: true,
    nuevosClientes: true,
    reportesSemanales: true,
    actualizacionesSistema: false,
    marketing: false
  });

  const [aparienciaSettings, setAparienciaSettings] = useState({
    tema: localStorage.getItem('app-theme') || 'Oscuro',
    idioma: localStorage.getItem('app-lang') || 'Español',
    zonaHoraria: 'Eastern Time (ET)',
    moneda: 'USD ($)',
    modoCompacto: false,
  });

  // Theme preview effect
  useEffect(() => {
    if (aparienciaSettings.tema === 'Oscuro' || aparienciaSettings.tema === 'Sistema') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    localStorage.setItem('app-theme', aparienciaSettings.tema);
  }, [aparienciaSettings.tema]);

  // IP Guide State
  const [sessionInfo, setSessionInfo] = useState(null);

  useEffect(() => {
    const fetchSession = async () => {
      try {
        const response = await fetch('https://ip.guide/');
        if (response.ok) {
          const data = await response.json();
          setSessionInfo({
            city: data.location?.city || 'Desconocido',
            country: data.location?.country || 'Desconocido',
            ip: data.ip
          });
        }
      } catch (error) {
        console.error('Error fetching IP data:', error);
      }
    };
    fetchSession();
  }, []);

  // Keep form in sync if user updates
  useEffect(() => {
    if (user && !isEditing) {
      setFotoPreview(user.user_metadata?.avatar_url || null);
      setFotoFile(null);
      setPerfilForm(prev => ({
        ...prev,
        nombre: user.user_metadata?.full_name?.split(' ')[0] || '',
        apellido: user.user_metadata?.full_name?.split(' ').slice(1).join(' ') || '',
        telefono: user.user_metadata?.telefono || '',
        empresa: user.user_metadata?.empresa || '',
      }));
    }
  }, [user, isEditing]);

  const handleTabChange = (tab) => setActiveTab(tab);

  const handleFotoChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setFotoFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setFotoPreview(reader.result); // Just for local preview
      };
      reader.readAsDataURL(file);
    }
  };

  const handleGuardarCambios = async () => {
    try {
      setToast({ message: 'Guardando datos...', type: 'warning' });
      const fullName = `${perfilForm.nombre} ${perfilForm.apellido}`.trim();
      
      let finalAvatarUrl = user?.user_metadata?.avatar_url;

      // Upload to Supabase Storage if a new file was selected
      if (fotoFile) {
        setToast({ message: 'Subiendo foto...', type: 'warning' });
        const fileExt = fotoFile.name.split('.').pop();
        const fileName = `${user.id}-${Date.now()}.${fileExt}`;
        
        const { error: uploadError } = await supabase.storage
          .from('avatars')
          .upload(fileName, fotoFile, { upsert: true });

        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage
          .from('avatars')
          .getPublicUrl(fileName);
          
        finalAvatarUrl = publicUrl;
      }

      const { data, error } = await supabase.auth.updateUser({
        data: {
          full_name: fullName,
          avatar_url: finalAvatarUrl,
          telefono: perfilForm.telefono
        }
      });

      if (error) throw error;
      
      // Update public 'usuarios' table to keep it in sync for the Team Members page
      const { error: dbError } = await supabase.from('usuarios').update({
        nombre: fullName,
        telefono: perfilForm.telefono,
        avatar_url: finalAvatarUrl
      }).eq('id', user.id);
      
      if (dbError) {
        console.error('Error actualizando tabla usuarios:', dbError);
        // We don't throw to avoid breaking the whole save process, just log it
      }
      
      localStorage.removeItem('user-local-avatar'); // Limpiar cualquier avatar local viejo
      setToast({ message: 'Datos guardados con éxito', type: 'success' });
      setIsEditing(false);
      setFotoFile(null);
    } catch (error) {
      setToast({ message: 'Error al guardar: ' + error.message, type: 'error' });
    }
  };

  const handleGuardarNotificaciones = () => {
    setToast({ message: 'Guardando preferencias...', type: 'warning' });
    setTimeout(() => {
      setToast({ message: 'Preferencias actualizadas', type: 'success' });
    }, 800);
  };

  const [seguridadForm, setSeguridadForm] = useState({
    contrasenaActual: '',
    nuevaContrasena: '',
    confirmarContrasena: ''
  });
  const [is2faEnabled, setIs2faEnabled] = useState(false);

  const handleGuardarSeguridad = () => {
    if (seguridadForm.nuevaContrasena !== seguridadForm.confirmarContrasena) {
      setToast({ message: 'Las contraseñas no coinciden', type: 'error' });
      return;
    }
    setToast({ message: 'Actualizando seguridad...', type: 'warning' });
    setTimeout(() => {
      setToast({ message: 'Contraseña actualizada', type: 'success' });
      setSeguridadForm({ contrasenaActual: '', nuevaContrasena: '', confirmarContrasena: '' });
    }, 800);
  };

  const handleGuardarApariencia = () => {
    setToast({ message: 'Guardando preferencias...', type: 'warning' });
    
    // Guardar configuraciones permanentemente
    localStorage.setItem('app-primary-color', primaryColor);
    localStorage.setItem('app-theme', aparienciaSettings.tema);
    localStorage.setItem('app-lang', aparienciaSettings.idioma);
    
    setTimeout(() => {
      setToast({ message: '¡Preferencias globales guardadas!', type: 'success' });
    }, 800);
  };

  const handleDeleteAccount = () => {
    if(window.confirm('¿Estás seguro de que deseas eliminar tu cuenta? Esta acción no se puede deshacer.')) {
      setToast({ message: 'Procesando solicitud...', type: 'warning' });
    }
  };

  // Helper component for Toggle Switch
  const ToggleSwitch = ({ checked, onChange }) => (
    <button 
      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${checked ? 'bg-primary' : 'bg-slate-200 dark:bg-slate-700'}`}
      onClick={onChange}
    >
      <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${checked ? 'translate-x-6' : 'translate-x-1'}`} />
    </button>
  );

  return (
    <AdminLayout>
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} duration={2000} />}
      <div className="p-6 text-slate-900 dark:text-white max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-1">Configuración</h1>
          <p className="text-slate-400 dark:text-slate-500 dark:text-slate-400">Personaliza tu experiencia en NeuroTek</p>
        </div>

        {/* Tabs Menu */}
        <div className="flex gap-2 p-1.5 bg-slate-100 dark:bg-slate-800/50 rounded-xl mb-8 w-max border border-slate-200 dark:border-slate-700/50">
          <button 
            onClick={() => handleTabChange('perfil')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${activeTab === 'perfil' ? 'bg-slate-200 dark:bg-slate-700 text-slate-900 dark:text-white' : 'text-slate-400 dark:text-slate-500 dark:text-slate-400 hover:text-slate-200'}`}
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
            Perfil
          </button>
          <button 
            onClick={() => handleTabChange('notificaciones')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${activeTab === 'notificaciones' ? 'bg-slate-200 dark:bg-slate-700 text-slate-900 dark:text-white' : 'text-slate-400 dark:text-slate-500 dark:text-slate-400 hover:text-slate-200'}`}
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
            </svg>
            Notificaciones
          </button>
          <button 
            onClick={() => handleTabChange('seguridad')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${activeTab === 'seguridad' ? 'bg-slate-200 dark:bg-slate-700 text-slate-900 dark:text-white' : 'text-slate-400 dark:text-slate-500 dark:text-slate-400 hover:text-slate-200'}`}
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
            Seguridad
          </button>
          <button 
            onClick={() => handleTabChange('apariencia')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${activeTab === 'apariencia' ? 'bg-slate-200 dark:bg-slate-700 text-slate-900 dark:text-white' : 'text-slate-400 dark:text-slate-500 dark:text-slate-400 hover:text-slate-200'}`}
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" />
            </svg>
            Apariencia
          </button>
        </div>

        {/* Contenido de las Pestañas */}
        <div className="bg-white dark:bg-[#1a1d27] border border-slate-200 dark:border-slate-700/50 rounded-xl overflow-hidden shadow-lg shadow-black/20">
          
          {/* Pestaña: Perfil */}
          {activeTab === 'perfil' && (
            <div className="p-8">
              <div className="flex justify-between items-center mb-8">
                <div>
                  <h2 className="text-xl font-bold mb-1">Información Personal</h2>
                  <p className="text-slate-400 dark:text-slate-500 dark:text-slate-400 text-sm">Actualiza tu información de perfil y foto.</p>
                </div>
                {!isEditing ? (
                  <button onClick={() => setIsEditing(true)} className="bg-slate-200 dark:bg-slate-700 hover:bg-slate-600 text-slate-900 dark:text-white px-4 py-2 rounded-md text-sm font-medium transition-colors">
                    Editar Datos
                  </button>
                ) : (
                  <button onClick={() => setIsEditing(false)} className="border border-slate-600 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:bg-slate-700 px-4 py-2 rounded-md text-sm font-medium transition-colors">
                    Cancelar
                  </button>
                )}
              </div>

              {/* Subida de foto en su propio "cuadrito" */}
              <div className={`bg-slate-100 dark:bg-slate-800/30 border border-slate-200 dark:border-slate-700/50 rounded-lg p-6 mb-8 flex items-center gap-6 ${!isEditing ? 'opacity-70' : ''}`}>
                <div className="relative group">
                  <div className="w-24 h-24 rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden border-2 border-slate-600 flex items-center justify-center relative">
                    {fotoPreview ? (
                      <img src={fotoPreview} alt="Perfil" className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-3xl font-bold text-slate-400 dark:text-slate-500 dark:text-slate-400">
                        {perfilForm.nombre ? perfilForm.nombre[0].toUpperCase() : 'U'}
                      </span>
                    )}
                    {/* Overlay para hover */}
                    {isEditing && (
                      <label className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
                        <svg className="w-6 h-6 text-slate-900 dark:text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                        <input type="file" className="hidden" accept="image/*" onChange={handleFotoChange} />
                      </label>
                    )}
                  </div>
                </div>
                <div>
                  <h3 className="font-semibold mb-1">Foto de perfil</h3>
                  <p className="text-xs text-slate-400 dark:text-slate-500 dark:text-slate-400 mb-3">Sube una foto tuya para que tu equipo pueda reconocerte. <br/>Recomendado: JPG, PNG cuadrados.</p>
                  <label className={`px-4 py-2 rounded-md text-sm font-medium transition-colors inline-block ${isEditing ? 'bg-slate-200 dark:bg-slate-700 hover:bg-slate-600 text-slate-900 dark:text-white cursor-pointer' : 'bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500 cursor-not-allowed'}`}>
                    Seleccionar Archivo
                    <input type="file" className="hidden" accept="image/*" onChange={handleFotoChange} disabled={!isEditing} />
                  </label>
                </div>
              </div>

              {/* Formulario en "cuadrito" principal */}
              <div className="bg-slate-100 dark:bg-slate-800/30 border border-slate-200 dark:border-slate-700/50 rounded-lg p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                  <div>
                    <label className="block text-sm font-medium text-slate-600 dark:text-slate-300 mb-2">Nombre</label>
                    <input 
                      type="text" 
                      className={`w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-md px-4 py-2.5 text-sm text-slate-900 dark:text-white focus:outline-none transition-colors ${isEditing ? 'focus:border-primary focus:ring-1 focus:ring-primary' : 'opacity-70 cursor-not-allowed'}`}
                      value={perfilForm.nombre}
                      onChange={(e) => setPerfilForm({...perfilForm, nombre: e.target.value})}
                      placeholder="Ej. Juan"
                      disabled={!isEditing}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-600 dark:text-slate-300 mb-2">Apellido</label>
                    <input 
                      type="text" 
                      className={`w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-md px-4 py-2.5 text-sm text-slate-900 dark:text-white focus:outline-none transition-colors ${isEditing ? 'focus:border-primary focus:ring-1 focus:ring-primary' : 'opacity-70 cursor-not-allowed'}`}
                      value={perfilForm.apellido}
                      onChange={(e) => setPerfilForm({...perfilForm, apellido: e.target.value})}
                      placeholder="Ej. Pérez"
                      disabled={!isEditing}
                    />
                  </div>
                </div>

                <div className="mb-6">
                  <label className="block text-sm font-medium text-slate-600 dark:text-slate-300 mb-2">Correo Electrónico <span className="text-xs text-slate-400 dark:text-slate-500 font-normal ml-2">(No se puede cambiar)</span></label>
                  <input 
                    type="email" 
                    className="w-full bg-white dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700/50 rounded-md px-4 py-2.5 text-sm text-slate-400 dark:text-slate-500 cursor-not-allowed opacity-70"
                    value={perfilForm.email}
                    disabled
                  />
                </div>

                <div className="mb-6">
                  <label className="block text-sm font-medium text-slate-600 dark:text-slate-300 mb-2">Teléfono</label>
                  <input 
                    type="text" 
                    className={`w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-md px-4 py-2.5 text-sm text-slate-900 dark:text-white focus:outline-none transition-colors ${isEditing ? 'focus:border-primary focus:ring-1 focus:ring-primary' : 'opacity-70 cursor-not-allowed'}`}
                    value={perfilForm.telefono}
                    onChange={(e) => setPerfilForm({...perfilForm, telefono: e.target.value})}
                    placeholder="+1 234 567 8900"
                    disabled={!isEditing}
                  />
                </div>

                <div className="mb-8">
                  <label className="block text-sm font-medium text-slate-600 dark:text-slate-300 mb-2">Rol (Tu rol actual en el sistema)</label>
                  <input 
                    type="text"
                    className="w-full bg-white dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700/50 rounded-md px-4 py-2.5 text-sm text-slate-400 dark:text-slate-500 dark:text-slate-400 capitalize cursor-not-allowed opacity-70"
                    value={perfilForm.rol}
                    disabled
                  />
                </div>

                {isEditing && (
                  <div>
                    <button 
                      onClick={handleGuardarCambios}
                      className="bg-primary hover:bg-primary/80 text-slate-900 dark:text-white px-6 py-2.5 rounded-md text-sm font-bold transition-colors shadow-lg shadow-primary/20"
                    >
                      Guardar Cambios
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Pestaña: Notificaciones */}
          {activeTab === 'notificaciones' && (
            <div className="p-8">
              <div className="mb-8">
                <h2 className="text-xl font-bold mb-1">Preferencias de Notificaciones</h2>
                <p className="text-slate-400 dark:text-slate-500 dark:text-slate-400 text-sm">Controla cómo y cuándo recibes notificaciones</p>
              </div>

              <div className="bg-slate-100 dark:bg-slate-800/30 border border-slate-200 dark:border-slate-700/50 rounded-lg">
                <div className="p-6 border-b border-slate-200 dark:border-slate-700/50 flex justify-between items-center">
                  <div className="flex gap-3">
                    <svg className="w-5 h-5 text-slate-400 dark:text-slate-500 dark:text-slate-400 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                    <div>
                      <h3 className="text-slate-900 dark:text-white font-medium mb-1">Notificaciones por Email</h3>
                      <p className="text-sm text-slate-400 dark:text-slate-500 dark:text-slate-400">Recibe actualizaciones por correo electrónico</p>
                    </div>
                  </div>
                  <ToggleSwitch 
                    checked={notificacionesSettings.email} 
                    onChange={() => setNotificacionesSettings({...notificacionesSettings, email: !notificacionesSettings.email})} 
                  />
                </div>

                <div className="p-6 border-b border-slate-200 dark:border-slate-700/50 flex justify-between items-center">
                  <div>
                    <h3 className="text-slate-900 dark:text-white font-medium mb-1">Alertas de Stock Bajo</h3>
                    <p className="text-sm text-slate-400 dark:text-slate-500 dark:text-slate-400">Notificaciones cuando productos tengan stock bajo</p>
                  </div>
                  <ToggleSwitch 
                    checked={notificacionesSettings.stockBajo} 
                    onChange={() => setNotificacionesSettings({...notificacionesSettings, stockBajo: !notificacionesSettings.stockBajo})} 
                  />
                </div>

                <div className="p-6 border-b border-slate-200 dark:border-slate-700/50 flex justify-between items-center">
                  <div>
                    <h3 className="text-slate-900 dark:text-white font-medium mb-1">Nuevos Clientes Registrados</h3>
                    <p className="text-sm text-slate-400 dark:text-slate-500 dark:text-slate-400">Alerta cuando se registre un nuevo usuario en la tienda</p>
                  </div>
                  <ToggleSwitch 
                    checked={notificacionesSettings.nuevosClientes} 
                    onChange={() => setNotificacionesSettings({...notificacionesSettings, nuevosClientes: !notificacionesSettings.nuevosClientes})} 
                  />
                </div>

                <div className="p-6 border-b border-slate-200 dark:border-slate-700/50 flex justify-between items-center">
                  <div>
                    <h3 className="text-slate-900 dark:text-white font-medium mb-1">Reportes Semanales</h3>
                    <p className="text-sm text-slate-400 dark:text-slate-500 dark:text-slate-400">Resumen semanal de ventas y estadísticas</p>
                  </div>
                  <ToggleSwitch 
                    checked={notificacionesSettings.reportesSemanales} 
                    onChange={() => setNotificacionesSettings({...notificacionesSettings, reportesSemanales: !notificacionesSettings.reportesSemanales})} 
                  />
                </div>

                <div className="p-6 border-b border-slate-200 dark:border-slate-700/50 flex justify-between items-center">
                  <div>
                    <h3 className="text-slate-900 dark:text-white font-medium mb-1">Actualizaciones del Sistema</h3>
                    <p className="text-sm text-slate-400 dark:text-slate-500 dark:text-slate-400">Notificaciones sobre nuevas funciones</p>
                  </div>
                  <ToggleSwitch 
                    checked={notificacionesSettings.actualizacionesSistema} 
                    onChange={() => setNotificacionesSettings({...notificacionesSettings, actualizacionesSistema: !notificacionesSettings.actualizacionesSistema})} 
                  />
                </div>

                <div className="p-6 flex justify-between items-center">
                  <div>
                    <h3 className="text-slate-900 dark:text-white font-medium mb-1">Marketing y Promociones</h3>
                    <p className="text-sm text-slate-400 dark:text-slate-500 dark:text-slate-400">Recibe ofertas y promociones especiales</p>
                  </div>
                  <ToggleSwitch 
                    checked={notificacionesSettings.marketing} 
                    onChange={() => setNotificacionesSettings({...notificacionesSettings, marketing: !notificacionesSettings.marketing})} 
                  />
                </div>
              </div>

              <div className="mt-6">
                <button 
                  onClick={handleGuardarNotificaciones}
                  className="bg-primary hover:bg-primary/80 text-slate-900 dark:text-white px-6 py-2.5 rounded-md text-sm font-bold transition-colors shadow-lg shadow-primary/20"
                >
                  Guardar Preferencias
                </button>
              </div>
            </div>
          )}

          {/* Pestaña: Seguridad */}
          {activeTab === 'seguridad' && (
            <div className="p-8">
              {/* Sección: Contraseña */}
              <div className="bg-slate-100 dark:bg-slate-800/30 border border-slate-200 dark:border-slate-700/50 rounded-lg p-6 mb-8">
                <div className="mb-6">
                  <h2 className="text-xl font-bold mb-1">Seguridad de la Cuenta</h2>
                  <p className="text-slate-400 dark:text-slate-500 dark:text-slate-400 text-sm">Gestiona tu contraseña y opciones de seguridad</p>
                </div>

                <div className="space-y-5 max-w-md">
                  <div>
                    <label className="block text-sm font-medium text-slate-600 dark:text-slate-300 mb-2">Contraseña Actual</label>
                    <input 
                      type="password" 
                      className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-md px-4 py-2.5 text-sm text-slate-900 dark:text-white focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors"
                      value={seguridadForm.contrasenaActual}
                      onChange={(e) => setSeguridadForm({...seguridadForm, contrasenaActual: e.target.value})}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-600 dark:text-slate-300 mb-2">Nueva Contraseña</label>
                    <input 
                      type="password" 
                      className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-md px-4 py-2.5 text-sm text-slate-900 dark:text-white focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors"
                      value={seguridadForm.nuevaContrasena}
                      onChange={(e) => setSeguridadForm({...seguridadForm, nuevaContrasena: e.target.value})}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-600 dark:text-slate-300 mb-2">Confirmar Nueva Contraseña</label>
                    <input 
                      type="password" 
                      className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-md px-4 py-2.5 text-sm text-slate-900 dark:text-white focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors"
                      value={seguridadForm.confirmarContrasena}
                      onChange={(e) => setSeguridadForm({...seguridadForm, confirmarContrasena: e.target.value})}
                    />
                  </div>
                </div>

                <div className="mt-6">
                  <button 
                    onClick={handleGuardarSeguridad}
                    className="bg-primary hover:bg-primary/80 text-slate-900 dark:text-white px-6 py-2.5 rounded-md text-sm font-bold transition-colors shadow-lg shadow-primary/20"
                  >
                    Cambiar Contraseña
                  </button>
                </div>
              </div>

              {/* Sección: 2FA */}
              <div className="bg-slate-100 dark:bg-slate-800/30 border border-slate-200 dark:border-slate-700/50 rounded-lg p-6 mb-8">
                <div className="mb-6">
                  <h2 className="text-lg font-bold mb-1">Autenticación de Dos Factores</h2>
                  <p className="text-slate-400 dark:text-slate-500 dark:text-slate-400 text-sm">Agrega una capa adicional de seguridad</p>
                </div>

                <div className="flex justify-between items-center mb-6">
                  <div>
                    <h3 className="text-slate-900 dark:text-white font-medium mb-1">Habilitar 2FA</h3>
                    <p className="text-sm text-slate-400 dark:text-slate-500 dark:text-slate-400">Requiere código de verificación al iniciar sesión</p>
                  </div>
                  <ToggleSwitch 
                    checked={is2faEnabled} 
                    onChange={() => {
                      setIs2faEnabled(!is2faEnabled);
                      if (!is2faEnabled) {
                         setToast({ message: 'Abriendo configuración de 2FA...', type: 'warning' });
                      }
                    }} 
                  />
                </div>

                <div>
                  <button className="border border-slate-600 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:bg-slate-700 px-4 py-2 rounded-md text-sm font-medium transition-colors">
                    Configurar 2FA
                  </button>
                </div>
              </div>

              {/* Sección: Sesiones Activas */}
              <div className="bg-slate-100 dark:bg-slate-800/30 border border-slate-200 dark:border-slate-700/50 rounded-lg p-6">
                <div className="mb-6">
                  <h2 className="text-lg font-bold mb-1">Sesiones Activas</h2>
                  <p className="text-slate-400 dark:text-slate-500 dark:text-slate-400 text-sm">Gestiona tus dispositivos conectados</p>
                </div>

                <div className="space-y-4">
                  {/* Sesión 1 (Real IP Info) */}
                  <div className="bg-white dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700/50 rounded-lg p-4 flex justify-between items-center">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center">
                        <svg className="w-5 h-5 text-slate-400 dark:text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                        </svg>
                      </div>
                      <div>
                        <h3 className="text-slate-900 dark:text-white font-medium text-sm">Dispositivo Actual</h3>
                        <p className="text-xs text-slate-400 dark:text-slate-500">
                          {sessionInfo ? `Tu sesión actual • ${sessionInfo.city}, ${sessionInfo.country} (${sessionInfo.ip})` : 'Cargando ubicación en tiempo real...'}
                        </p>
                      </div>
                    </div>
                    <span className="bg-green-500/10 text-green-400 border border-green-500/20 px-3 py-1 rounded-full text-xs font-medium">
                      Activa
                    </span>
                  </div>

                  {/* Sesión 2 */}
                  <div className="bg-white dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700/50 rounded-lg p-4 flex justify-between items-center">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center">
                        <svg className="w-5 h-5 text-slate-400 dark:text-slate-500 dark:text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
                        </svg>
                      </div>
                      <div>
                        <h3 className="text-slate-900 dark:text-white font-medium text-sm">iPhone 15 - Safari</h3>
                        <p className="text-xs text-slate-400 dark:text-slate-500 dark:text-slate-400">Hace 2 días • Nueva York, USA</p>
                      </div>
                    </div>
                    <button className="text-slate-400 dark:text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:text-white border border-slate-200 dark:border-slate-700 hover:bg-slate-200 dark:bg-slate-700 px-3 py-1.5 rounded-md text-xs font-medium transition-colors">
                      Cerrar Sesión
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Pestaña: Apariencia */}
          {activeTab === 'apariencia' && (
            <div className="p-8">
              {/* Sección: Personalización */}
              <div className="bg-slate-100 dark:bg-slate-800/30 border border-slate-200 dark:border-slate-700/50 rounded-lg p-6 mb-8">
                <div className="mb-6">
                  <h2 className="text-xl font-bold mb-1">Personalización de la Interfaz</h2>
                  <p className="text-slate-400 dark:text-slate-500 dark:text-slate-400 text-sm">Ajusta la apariencia de la aplicación</p>
                </div>

                <div className="space-y-6">
                  {/* Selectors */}
                  <div className="border-b border-slate-200 dark:border-slate-700/50 pb-6">
                    <label className="block text-sm font-medium text-slate-900 dark:text-white mb-2">Tema</label>
                    <select 
                      className="w-full bg-transparent text-sm text-slate-600 dark:text-slate-300 focus:outline-none appearance-none cursor-pointer"
                      value={aparienciaSettings.tema}
                      onChange={(e) => setAparienciaSettings({...aparienciaSettings, tema: e.target.value})}
                    >
                      <option className="bg-slate-100 dark:bg-slate-800">Claro</option>
                      <option className="bg-slate-100 dark:bg-slate-800">Oscuro</option>
                      <option className="bg-slate-100 dark:bg-slate-800">Sistema</option>
                    </select>
                  </div>

                  <div className="border-b border-slate-200 dark:border-slate-700/50 pb-6">
                    <label className="block text-sm font-medium text-slate-900 dark:text-white mb-2">Idioma</label>
                    <select 
                      className="w-full bg-transparent text-sm text-slate-600 dark:text-slate-300 focus:outline-none appearance-none cursor-pointer"
                      value={aparienciaSettings.idioma}
                      onChange={(e) => setAparienciaSettings({...aparienciaSettings, idioma: e.target.value})}
                    >
                      <option className="bg-slate-100 dark:bg-slate-800">Español</option>
                      <option className="bg-slate-100 dark:bg-slate-800">Inglés</option>
                    </select>
                  </div>

                  <div className="border-b border-slate-200 dark:border-slate-700/50 pb-6">
                    <label className="block text-sm font-medium text-slate-900 dark:text-white mb-2">Zona Horaria</label>
                    <select 
                      className="w-full bg-transparent text-sm text-slate-600 dark:text-slate-300 focus:outline-none appearance-none cursor-pointer"
                      value={aparienciaSettings.zonaHoraria}
                      onChange={(e) => setAparienciaSettings({...aparienciaSettings, zonaHoraria: e.target.value})}
                    >
                      <option className="bg-slate-100 dark:bg-slate-800">Eastern Time (ET)</option>
                      <option className="bg-slate-100 dark:bg-slate-800">Pacific Time (PT)</option>
                      <option className="bg-slate-100 dark:bg-slate-800">Central European Time (CET)</option>
                    </select>
                  </div>

                  <div className="border-b border-slate-200 dark:border-slate-700/50 pb-6">
                    <label className="block text-sm font-medium text-slate-900 dark:text-white mb-2">Formato de Moneda</label>
                    <select 
                      className="w-full bg-transparent text-sm text-slate-600 dark:text-slate-300 focus:outline-none appearance-none cursor-pointer"
                      value={aparienciaSettings.moneda}
                      onChange={(e) => setAparienciaSettings({...aparienciaSettings, moneda: e.target.value})}
                    >
                      <option className="bg-slate-100 dark:bg-slate-800">USD ($)</option>
                      <option className="bg-slate-100 dark:bg-slate-800">EUR (€)</option>
                      <option className="bg-slate-100 dark:bg-slate-800">MXN ($)</option>
                    </select>
                  </div>

                  {/* Colores */}
                  <div className="border-b border-slate-200 dark:border-slate-700/50 pb-6">
                    <label className="block text-sm font-medium text-slate-900 dark:text-white mb-3">Color Principal de la Aplicación</label>
                    <ColorSwatchPicker value={primaryColor} onChange={(c) => setPrimaryColor(c.value)}>
                      {availableColors.map((color) => (
                        <ColorSwatchPicker.Item key={color} color={color}>
                          <ColorSwatchPicker.Swatch />
                          <ColorSwatchPicker.Indicator />
                        </ColorSwatchPicker.Item>
                      ))}
                    </ColorSwatchPicker>
                  </div>

                  {/* Toggle */}
                  <div className="flex justify-between items-center">
                    <div>
                      <h3 className="text-slate-900 dark:text-white font-medium mb-1">Modo Compacto</h3>
                      <p className="text-sm text-slate-400 dark:text-slate-500 dark:text-slate-400">Reduce el espaciado de la interfaz</p>
                    </div>
                    <ToggleSwitch 
                      checked={aparienciaSettings.modoCompacto} 
                      onChange={() => setAparienciaSettings({...aparienciaSettings, modoCompacto: !aparienciaSettings.modoCompacto})} 
                    />
                  </div>
                </div>

                <div className="mt-8">
                  <button 
                    onClick={handleGuardarApariencia}
                    className="bg-primary hover:bg-primary/80 text-slate-900 dark:text-white px-6 py-2.5 rounded-md text-sm font-bold transition-colors shadow-lg shadow-primary/20"
                  >
                    Guardar Preferencias
                  </button>
                </div>
              </div>

              {/* Sección: Privacidad y Datos */}
              <div className="bg-slate-100 dark:bg-slate-800/30 border border-slate-200 dark:border-slate-700/50 rounded-lg p-6">
                <div className="mb-6">
                  <h2 className="text-lg font-bold mb-1">Datos y Privacidad</h2>
                  <p className="text-slate-400 dark:text-slate-500 dark:text-slate-400 text-sm">Controla tus datos personales</p>
                </div>

                <div className="space-y-4">
                  <button className="w-full flex items-center justify-center gap-2 border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white px-4 py-3 rounded-md text-sm font-medium transition-colors">
                    <svg className="w-5 h-5 text-slate-400 dark:text-slate-500 dark:text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                    </svg>
                    Descargar Mis Datos
                  </button>

                  <button 
                    onClick={handleDeleteAccount}
                    className="w-full bg-red-500 hover:bg-red-600 text-slate-900 dark:text-white px-4 py-3 rounded-md text-sm font-bold transition-colors shadow-lg shadow-red-500/20"
                  >
                    Eliminar Cuenta
                  </button>
                </div>
              </div>
            </div>
          )}

        </div>
      </div>
    </AdminLayout>
  );
}

