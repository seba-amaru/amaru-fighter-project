import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Singleton: Evitar múltiples instancias de GoTrueClient en el mismo contexto.
// GoTrueClient detecta instancias múltiples bajo la misma storage key y produce
// comportamiento indefinido (timeouts, condiciones de carrera en localStorage).
if (!window.supabase) {
    window.supabase = createClient(supabaseUrl, supabaseAnonKey, {
        auth: {
            autoRefreshToken: true,
            persistSession: true,
            detectSessionInUrl: true
        }
    });
} else {
    console.warn('[Supabase] Cliente ya inicializado. Reutilizando window.supabase para evitar múltiples instancias de GoTrueClient.');
}

export default window.supabase;
