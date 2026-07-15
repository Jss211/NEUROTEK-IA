import { createClient } from '@supabase/supabase-js'

// Usamos el proxy local de Vite, ahora que los archivos gigantes fueron borrados
const supabaseUrl = typeof window !== 'undefined' ? `${window.location.origin}/api-supabase` : '/api-supabase'
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
