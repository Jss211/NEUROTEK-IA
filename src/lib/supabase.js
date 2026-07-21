import { createClient } from '@supabase/supabase-js'

// En producción (Vercel) usamos la URL directa. En local (desarrollo) usamos el proxy para evitar el error del reloj.
const isProd = import.meta.env.PROD;
const supabaseUrl = isProd 
  ? import.meta.env.VITE_SUPABASE_URL 
  : (typeof window !== 'undefined' ? `${window.location.origin}/api-supabase` : '/api-supabase');
  
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
