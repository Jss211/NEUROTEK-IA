import { useState, useEffect } from 'react';
import AdminLayout from '../../components/admin/AdminLayout';
import { useAuth } from '../../context/AuthContext';
import { useConfig } from '../../context/ConfigContext';
import { supabase } from '../../lib/supabase';
import Toast from '../../components/Toast';
import { ColorSwatchPicker } from '../../components/ui/heroui-color-swatch-picker';

const availableColors = ["#2962FF", "#b026ff", "#00E676", "#FFD600", "#ccff00", "#FF3D00", "#6200EA", "#00E5FF"];

export default function Configuracion() {
  const { user } = useAuth();
  const { language, setLanguage, currency, setCurrency, t } = useConfig();
  const [activeTab, setActiveTab] = useState('perfil');
  const [isEditing, setIsEditing] = useState(false);
  const [toast, setToast] = useState(null);
  
  // Theme state
  const [primaryColor, setPrimaryColor] = useState(localStorage.getItem('app-primary-color') || '#2962FF');
  
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

  const getInitialTheme = () => {
    const theme = localStorage.getItem('theme');
    return theme || 'dark';
  };

  const [aparienciaSettings, setAparienciaSettings] = useState({
    tema: getInitialTheme(),
    modoCompacto: false,
  });

  const [ddTema, setDdTema] = useState(false);
  const [ddLang, setDdLang] = useState(false);
  const [ddCurrency, setDdCurrency] = useState(false);

  // Theme preview effect
  useEffect(() => {
    if (aparienciaSettings.tema === 'dark' || aparienciaSettings.tema === 'system') {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
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
    if (user?.email === 'demo@neurotek.com') {
      setToast({ message: t('admin.conf.toast.demo'), type: 'error' });
      return;
    }
    try {
      setToast({ message: t('admin.conf.toast.saving_data'), type: 'warning' });
      const fullName = `${perfilForm.nombre} ${perfilForm.apellido}`.trim();
      
      let finalAvatarUrl = user?.user_metadata?.avatar_url;

      // Upload to Supabase Storage if a new file was selected
      if (fotoFile) {
        setToast({ message: t('admin.conf.toast.uploading_photo'), type: 'warning' });
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
      const { data: existingUser } = await supabase.from('usuarios').select('rol, estado').eq('id', user.id).single();
      const payload = {
        id: user.id,
        nombre: fullName,
        telefono: perfilForm.telefono,
        avatar_url: finalAvatarUrl || null,
        email: user.email,
        rol: existingUser?.rol || 'cliente',
        estado: existingUser?.estado || 'Activo'
      };
      const { data: updatedRows, error: dbError } = await supabase.from('usuarios').upsert(payload).select();
      
      if (dbError) {
        console.error('Error actualizando tabla usuarios:', dbError);
        setToast({ message: `Error en DB: ${dbError.message}`, type: 'error' });
        return;
      }
      
      if (!updatedRows || updatedRows.length === 0) {
        setToast({ message: 'Aviso: Los datos se guardaron en tu cuenta, pero tu perfil público (rol/clientes) está bloqueado por permisos de seguridad (RLS) en la base de datos.', type: 'warning' });
        // We still let it finish so the form resets
      }
      
      localStorage.removeItem('user-local-avatar'); // Limpiar cualquier avatar local viejo
      setToast({ message: t('admin.conf.toast.data_saved'), type: 'success' });
      setIsEditing(false);
      setFotoFile(null);
    } catch (error) {
      setToast({ message: t('admin.conf.toast.error_saving') + error.message, type: 'error' });
    }
  };

  const handleGuardarNotificaciones = () => {
    setToast({ message: t('admin.conf.toast.saving_prefs'), type: 'warning' });
    setTimeout(() => {
      setToast({ message: t('admin.conf.toast.prefs_updated'), type: 'success' });
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
      setToast({ message: t('admin.conf.toast.passwords_not_match'), type: 'error' });
      return;
    }
    setToast({ message: t('admin.conf.toast.updating_security'), type: 'warning' });
    setTimeout(() => {
      setToast({ message: t('admin.conf.toast.password_updated'), type: 'success' });
      setSeguridadForm({ contrasenaActual: '', nuevaContrasena: '', confirmarContrasena: '' });
    }, 800);
  };

  const handleGuardarApariencia = () => {
    setToast({ message: t('admin.conf.toast.saving_prefs'), type: 'warning' });
    
    // Guardar configuraciones permanentemente
    localStorage.setItem('app-primary-color', primaryColor);
    localStorage.setItem('theme', aparienciaSettings.tema === 'Claro' ? 'light' : 'dark');
    
    setTimeout(() => {
      setToast({ message: t('admin.conf.toast.global_prefs_saved'), type: 'success' });
    }, 800);
  };

  const handleDownloadData = async () => {
    setToast({ message: t('admin.conf.toast.processing_request'), type: 'warning' });
    try {
      // Fetch all user-related data
      const [profileRes, ordersRes, productsRes, inventoryRes, clientsRes] = await Promise.all([
        supabase.from('usuarios').select('*').eq('id', user?.id).single(),
        supabase.from('ordenes').select('*'),
        supabase.from('productos').select('*'),
        supabase.from('inventario').select('*'),
        supabase.from('usuarios').select('*').eq('rol', 'cliente'),
      ]);

      const exportData = {
        exportDate: new Date().toISOString(),
        profile: profileRes.data || { email: user?.email, name: user?.user_metadata?.full_name },
        orders: ordersRes.data || [],
        products: productsRes.data || [],
        inventory: inventoryRes.data || [],
        clients: clientsRes.data || [],
        settings: {
          theme: aparienciaSettings.tema,
          language,
          currency,
          primaryColor,
        }
      };

      const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `neurotek-data-${new Date().toISOString().slice(0, 10)}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      setToast({ message: t('admin.conf.toast.data_downloaded') || 'Datos descargados exitosamente', type: 'success' });
    } catch (err) {
      setToast({ message: 'Error al descargar datos', type: 'error' });
    }
  };

  const handleDeleteAccount = () => {
    if(window.confirm(t('admin.conf.toast.confirm_delete'))) {
      setToast({ message: t('admin.conf.toast.processing_request'), type: 'warning' });
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
          <h1 className="text-3xl font-bold mb-1">{t('config.title')}</h1>
          <p className="text-slate-400 dark:text-slate-500 dark:text-slate-400">{t('config.subtitle')}</p>
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
            {t('config.tab.profile')}
          </button>
          <button 
            onClick={() => handleTabChange('notificaciones')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${activeTab === 'notificaciones' ? 'bg-slate-200 dark:bg-slate-700 text-slate-900 dark:text-white' : 'text-slate-400 dark:text-slate-500 dark:text-slate-400 hover:text-slate-200'}`}
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
            </svg>
            {t('config.tab.notifications')}
          </button>

          <button 
            onClick={() => handleTabChange('apariencia')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${activeTab === 'apariencia' ? 'bg-slate-200 dark:bg-slate-700 text-slate-900 dark:text-white' : 'text-slate-400 dark:text-slate-500 dark:text-slate-400 hover:text-slate-200'}`}
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" />
            </svg>
            {t('config.tab.appearance')}
          </button>
        </div>

        {/* Contenido de las Pestañas */}
        <div className="bg-white dark:bg-[#1a1d27] border border-slate-200 dark:border-slate-700/50 rounded-xl overflow-hidden shadow-lg shadow-black/20">
          
          {/* Pestaña: Perfil */}
          {activeTab === 'perfil' && (
            <div className="p-8">
              <div className="flex justify-between items-center mb-8">
                <div>
                  <h2 className="text-xl font-bold mb-1">{t('admin.conf.personal_info.title')}</h2>
                  <p className="text-slate-400 dark:text-slate-500 dark:text-slate-400 text-sm">{t('admin.conf.personal_info.subtitle')}</p>
                </div>
                {!isEditing ? (
                  <button onClick={() => setIsEditing(true)} className="bg-slate-200 dark:bg-slate-700 hover:bg-slate-600 text-slate-900 dark:text-white px-4 py-2 rounded-md text-sm font-medium transition-colors">
                    {t('admin.conf.personal_info.edit')}
                  </button>
                ) : (
                  <button onClick={() => setIsEditing(false)} className="border border-slate-600 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:bg-slate-700 px-4 py-2 rounded-md text-sm font-medium transition-colors">
                    {t('admin.conf.personal_info.cancel')}
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
                  <h3 className="font-semibold mb-1">{t('admin.conf.personal_info.profile_pic')}</h3>
                  <p className="text-xs text-slate-400 dark:text-slate-500 dark:text-slate-400 mb-3">{t('admin.conf.personal_info.profile_pic_desc_1')} <br/>{t('admin.conf.personal_info.profile_pic_desc_2')}</p>
                  <label className={`px-4 py-2 rounded-md text-sm font-medium transition-colors inline-block ${isEditing ? 'bg-slate-200 dark:bg-slate-700 hover:bg-slate-600 text-slate-900 dark:text-white cursor-pointer' : 'bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500 cursor-not-allowed'}`}>
                    {t('admin.conf.personal_info.select_file')}
                    <input type="file" className="hidden" accept="image/*" onChange={handleFotoChange} disabled={!isEditing} />
                  </label>
                </div>
              </div>

              {/* Formulario en "cuadrito" principal */}
              <div className="bg-slate-100 dark:bg-slate-800/30 border border-slate-200 dark:border-slate-700/50 rounded-lg p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                  <div>
                    <label className="block text-sm font-medium text-slate-600 dark:text-slate-300 mb-2">{t('admin.conf.personal_info.first_name')}</label>
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
                    <label className="block text-sm font-medium text-slate-600 dark:text-slate-300 mb-2">{t('admin.conf.personal_info.last_name')}</label>
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
                  <label className="block text-sm font-medium text-slate-600 dark:text-slate-300 mb-2">{t('admin.conf.personal_info.email')} <span className="text-xs text-slate-400 dark:text-slate-500 font-normal ml-2">{t('admin.conf.personal_info.cannot_change')}</span></label>
                  <input 
                    type="email" 
                    className="w-full bg-white dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700/50 rounded-md px-4 py-2.5 text-sm text-slate-400 dark:text-slate-500 cursor-not-allowed opacity-70"
                    value={perfilForm.email}
                    disabled
                  />
                </div>

                <div className="mb-6">
                  <label className="block text-sm font-medium text-slate-600 dark:text-slate-300 mb-2">{t('admin.conf.personal_info.phone')}</label>
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
                  <label className="block text-sm font-medium text-slate-600 dark:text-slate-300 mb-2">{t('admin.conf.personal_info.role')}</label>
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
                      {t('admin.conf.personal_info.save')}
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
                <h2 className="text-xl font-bold mb-1">{t('admin.conf.notif.title')}</h2>
                <p className="text-slate-400 dark:text-slate-500 dark:text-slate-400 text-sm">{t('admin.conf.notif.subtitle')}</p>
              </div>

              <div className="bg-slate-100 dark:bg-slate-800/30 border border-slate-200 dark:border-slate-700/50 rounded-lg">
                <div className="p-6 border-b border-slate-200 dark:border-slate-700/50 flex justify-between items-center">
                  <div>
                    <h3 className="text-slate-900 dark:text-white font-medium mb-1">{t('admin.conf.notif.stock_title')}</h3>
                    <p className="text-sm text-slate-400 dark:text-slate-500 dark:text-slate-400">{t('admin.conf.notif.stock_desc')}</p>
                  </div>
                  <ToggleSwitch 
                    checked={notificacionesSettings.stockBajo} 
                    onChange={() => setNotificacionesSettings({...notificacionesSettings, stockBajo: !notificacionesSettings.stockBajo})} 
                  />
                </div>

                <div className="p-6 border-b border-slate-200 dark:border-slate-700/50 flex justify-between items-center">
                  <div>
                    <h3 className="text-slate-900 dark:text-white font-medium mb-1">{t('admin.conf.notif.new_clients_title')}</h3>
                    <p className="text-sm text-slate-400 dark:text-slate-500 dark:text-slate-400">{t('admin.conf.notif.new_clients_desc')}</p>
                  </div>
                  <ToggleSwitch 
                    checked={notificacionesSettings.nuevosClientes} 
                    onChange={() => setNotificacionesSettings({...notificacionesSettings, nuevosClientes: !notificacionesSettings.nuevosClientes})} 
                  />
                </div>

                <div className="p-6 flex justify-between items-center">
                  <div>
                    <h3 className="text-slate-900 dark:text-white font-medium mb-1">{t('admin.conf.notif.weekly_reports_title')}</h3>
                    <p className="text-sm text-slate-400 dark:text-slate-500 dark:text-slate-400">{t('admin.conf.notif.weekly_reports_desc')}</p>
                  </div>
                  <ToggleSwitch 
                    checked={notificacionesSettings.reportesSemanales} 
                    onChange={() => setNotificacionesSettings({...notificacionesSettings, reportesSemanales: !notificacionesSettings.reportesSemanales})} 
                  />
                </div>


              </div>

              <div className="mt-6">
                <button 
                  onClick={handleGuardarNotificaciones}
                  className="bg-primary hover:bg-primary/80 text-slate-900 dark:text-white px-6 py-2.5 rounded-md text-sm font-bold transition-colors shadow-lg shadow-primary/20"
                >
                  {t('admin.conf.save_prefs')}
                </button>
              </div>
            </div>
          )}


          {/* Pestaña: Apariencia */}
          {activeTab === 'apariencia' && (
            <div className="p-8">
              {/* Sección: Personalización */}
              <div className="bg-slate-100 dark:bg-slate-800/30 border border-slate-200 dark:border-slate-700/50 rounded-lg p-6 mb-8">
                <div className="mb-6">
                  <h2 className="text-xl font-bold mb-1">{t('config.appearance.title')}</h2>
                  <p className="text-slate-400 dark:text-slate-500 dark:text-slate-400 text-sm">{t('config.appearance.subtitle')}</p>
                </div>

                <div className="space-y-6">
                  {/* Tema */}
                  <div>
                    <label className="block text-sm font-medium text-slate-900 dark:text-white mb-2">{t('config.appearance.theme')}</label>
                    <div className="relative">
                      <button
                        onClick={() => { setDdTema(o => !o); setDdLang(false); setDdCurrency(false); }}
                        className="w-full flex items-center justify-between bg-slate-50 dark:bg-white/5 border border-black/5 dark:border-white/10 rounded-xl px-4 py-3 text-sm text-slate-600 dark:text-slate-300"
                      >
                        <span>
                          {aparienciaSettings.tema === 'light' ? t('config.appearance.theme.light') 
                           : aparienciaSettings.tema === 'dark' ? t('config.appearance.theme.dark') 
                           : 'Sistema'}
                        </span>
                        <svg className={`w-4 h-4 transition-transform ${ddTema ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                      </button>
                      {ddTema && (
                        <>
                          <div className="fixed inset-0 z-10" onClick={() => setDdTema(false)} />
                          <div className="absolute left-0 right-0 mt-1 z-20 bg-white dark:bg-[#1a1d2e] border border-black/10 dark:border-white/10 rounded-xl overflow-hidden shadow-xl">
                            {[{v: 'light', l: t('config.appearance.theme.light')}, {v: 'dark', l: t('config.appearance.theme.dark')}, {v: 'system', l: 'Sistema'}].map((op) => (
                              <button
                                key={op.v}
                                onClick={() => { setAparienciaSettings({...aparienciaSettings, tema: op.v}); setDdTema(false); }}
                                className={`w-full text-left px-4 py-2.5 text-sm transition hover:bg-primary/10 hover:text-primary ${
                                  aparienciaSettings.tema === op.v ? 'text-primary font-semibold' : 'text-slate-600 dark:text-gray-300'
                                }`}
                              >
                                {op.l}
                              </button>
                            ))}
                          </div>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Idioma */}
                  <div>
                    <label className="block text-sm font-medium text-slate-900 dark:text-white mb-2">{t('config.appearance.language')}</label>
                    <div className="relative">
                      <button
                        onClick={() => { setDdLang(o => !o); setDdTema(false); setDdCurrency(false); }}
                        className="w-full flex items-center justify-between bg-slate-50 dark:bg-white/5 border border-black/5 dark:border-white/10 rounded-xl px-4 py-3 text-sm text-slate-600 dark:text-slate-300"
                      >
                        <span>{language === 'es' ? t('config.appearance.language.es') : t('config.appearance.language.en')}</span>
                        <svg className={`w-4 h-4 transition-transform ${ddLang ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                      </button>
                      {ddLang && (
                        <>
                          <div className="fixed inset-0 z-10" onClick={() => setDdLang(false)} />
                          <div className="absolute left-0 right-0 mt-1 z-20 bg-white dark:bg-[#1a1d2e] border border-black/10 dark:border-white/10 rounded-xl overflow-hidden shadow-xl">
                            {[{v:'es', l: t('config.appearance.language.es')}, {v:'en', l: t('config.appearance.language.en')}].map((op) => (
                              <button
                                key={op.v}
                                onClick={() => { setLanguage(op.v); setDdLang(false); setToast({ message: 'Idioma actualizado', type: 'success' }); }}
                                className={`w-full text-left px-4 py-2.5 text-sm transition hover:bg-primary/10 hover:text-primary ${
                                  language === op.v ? 'text-primary font-semibold' : 'text-slate-600 dark:text-gray-300'
                                }`}
                              >
                                {op.l}
                              </button>
                            ))}
                          </div>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Moneda */}
                  <div>
                    <label className="block text-sm font-medium text-slate-900 dark:text-white mb-2">{t('config.appearance.currency')}</label>
                    <div className="relative">
                      <button
                        onClick={() => { setDdCurrency(o => !o); setDdTema(false); setDdLang(false); }}
                        className="w-full flex items-center justify-between bg-slate-50 dark:bg-white/5 border border-black/5 dark:border-white/10 rounded-xl px-4 py-3 text-sm text-slate-600 dark:text-slate-300"
                      >
                        <span>{currency === 'PEN' ? t('config.appearance.currency.pen') : currency === 'USD' ? t('config.appearance.currency.usd') : t('config.appearance.currency.mxn')}</span>
                        <svg className={`w-4 h-4 transition-transform ${ddCurrency ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                      </button>
                      {ddCurrency && (
                        <>
                          <div className="fixed inset-0 z-10" onClick={() => setDdCurrency(false)} />
                          <div className="absolute left-0 right-0 mt-1 z-20 bg-white dark:bg-[#1a1d2e] border border-black/10 dark:border-white/10 rounded-xl overflow-hidden shadow-xl">
                            {[{v:'PEN', l: t('config.appearance.currency.pen')}, {v:'USD', l: t('config.appearance.currency.usd')}, {v:'MXN', l: t('config.appearance.currency.mxn')}].map((op) => (
                              <button
                                key={op.v}
                                onClick={() => { setCurrency(op.v); setDdCurrency(false); setToast({ message: 'Moneda actualizada', type: 'success' }); }}
                                className={`w-full text-left px-4 py-2.5 text-sm transition hover:bg-primary/10 hover:text-primary ${
                                  currency === op.v ? 'text-primary font-semibold' : 'text-slate-600 dark:text-gray-300'
                                }`}
                              >
                                {op.l}
                              </button>
                            ))}
                          </div>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Colores */}
                  <div>
                    <label className="block text-sm font-medium text-slate-900 dark:text-white mb-3">{t('admin.conf.app_color')}</label>
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
                      <h3 className="text-slate-900 dark:text-white font-medium mb-1">{t('admin.conf.compact_mode')}</h3>
                      <p className="text-sm text-slate-400 dark:text-slate-500 dark:text-slate-400">{t('admin.conf.compact_desc')}</p>
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
                    {t('admin.conf.save_prefs')}
                  </button>
                </div>
              </div>

              {/* Sección: Privacidad y Datos */}
              <div className="bg-slate-100 dark:bg-slate-800/30 border border-slate-200 dark:border-slate-700/50 rounded-lg p-6">
                <div className="mb-6">
                  <h2 className="text-lg font-bold mb-1">{t('admin.conf.privacy.title')}</h2>
                  <p className="text-slate-400 dark:text-slate-500 dark:text-slate-400 text-sm">{t('admin.conf.privacy.desc')}</p>
                </div>

                <div className="space-y-4">
                  <button onClick={handleDownloadData} className="w-full flex items-center justify-center gap-2 border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white px-4 py-3 rounded-md text-sm font-medium transition-colors">
                    <svg className="w-5 h-5 text-slate-400 dark:text-slate-500 dark:text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                    </svg>
                    {t('admin.conf.privacy.download')}
                  </button>

                  <button 
                    onClick={handleDeleteAccount}
                    className="w-full bg-red-500 hover:bg-red-600 text-slate-900 dark:text-white px-4 py-3 rounded-md text-sm font-bold transition-colors shadow-lg shadow-red-500/20"
                  >
                    {t('admin.conf.privacy.delete')}
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

