import { createContext, useContext, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

const AuthContext = createContext({})

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  const assignRole = async (currentUser) => {
    if (!currentUser) return null
    const { data: perfil } = await supabase
      .from('usuarios')
      .select('rol')
      .eq('id', currentUser.id)
      .single()
    
    // Usa el rol real de la base de datos, o 'cliente' por defecto
    currentUser.role = perfil?.rol || 'cliente'
    return currentUser
  }

  useEffect(() => {
    // Obtener sesión actual
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      const currentUser = await assignRole(session?.user ?? null)
      setUser(currentUser)
      setLoading(false)
    })

    // Escuchar cambios de sesión
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      const currentUser = await assignRole(session?.user ?? null)
      setUser(currentUser)
    })

    return () => subscription.unsubscribe()
  }, [])

  return (
    <AuthContext.Provider value={{ user, loading }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
