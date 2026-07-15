import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://ordywmtwdovinbtaawge.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9yZHl3bXR3ZG92aW5idGFhd2dlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODA4ODA4MjUsImV4cCI6MjA5NjQ1NjgyNX0.qI18KeCSTYwNBJXfMGzrZSWd8V5KRxBJ3_mP1RejuZc'

const supabase = createClient(supabaseUrl, supabaseKey)

async function test() {
  console.log("Probando auth con Supabase...");
  // Try to create a dummy user
  const { data, error } = await supabase.auth.signUp({
    email: 'test_neurotek@example.com',
    password: 'Password123!',
  })
  if (error) console.log("Error creando usuario:", error.message);
  else console.log("Usuario creado:", data.user?.id);

  // Sign in
  const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
    email: 'test_neurotek@example.com',
    password: 'Password123!',
  })
  if (signInError) console.log("Error login:", signInError.message);
  else {
    console.log("Login OK! Access token length:", signInData.session.access_token.length);
    // Fetch
    const { data: fetch, error: fetchErr } = await supabase.from('usuarios').select('*');
    console.log("Fetch usuarios error:", fetchErr?.message || "Ninguno");
    console.log("Usuarios fetched:", fetch?.length);
  }
}

test();
