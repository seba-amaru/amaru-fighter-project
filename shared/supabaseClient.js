import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
    console.warn('[Supabase] Variables de entorno VITE_SUPABASE_URL o VITE_SUPABASE_ANON_KEY no encontradas.');
}

// Singleton pattern para prevenir múltiples instancias de GoTrueClient en el navegador
if (!window.supabase) {
    window.supabase = createClient(supabaseUrl || '', supabaseAnonKey || '', {
        auth: {
            autoRefreshToken: true,
            persistSession: true,
            detectSessionInUrl: true
        }
    });
}

export const supabase = window.supabase;
export default supabase;

/**
 * Obtiene la sesión actual del usuario autenticado
 * @returns {Promise<import('@supabase/supabase-js').Session | null>}
 */
export async function getCurrentSession() {
    try {
        const { data: { session }, error } = await supabase.auth.getSession();
        if (error) {
            console.error('[Supabase] Error obteniendo sesión:', error);
            return null;
        }
        return session;
    } catch (err) {
        console.error('[Supabase] Excepción en getCurrentSession:', err);
        return null;
    }
}

/**
 * Verifica si el usuario actual tiene rol de administrador
 * @param {string} userId
 * @returns {Promise<{ isAdmin: boolean, profile: any }>}
 */
export async function verifyAdminRole(userId) {
    try {
        if (!userId) return { isAdmin: false, profile: null };

        const { data: profile, error } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', userId)
            .single();

        if (error) {
            console.error('[Supabase] Error consultando perfil de admin:', error);
            return { isAdmin: false, profile: null };
        }

        const isAdmin = profile?.role === 'admin';
        return { isAdmin, profile };
    } catch (err) {
        console.error('[Supabase] Excepción en verifyAdminRole:', err);
        return { isAdmin: false, profile: null };
    }
}
