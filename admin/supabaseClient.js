// Cliente de Supabase autocontenido para la Suite de Administración
// Compatible tanto con Vite (ESM) como con servidores estáticos directos (npx serve)

const SUPABASE_URL = (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_SUPABASE_URL)
    ? import.meta.env.VITE_SUPABASE_URL
    : 'https://rjvviunpdpcwfkquxytl.supabase.co';

const SUPABASE_ANON_KEY = (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_SUPABASE_ANON_KEY)
    ? import.meta.env.VITE_SUPABASE_ANON_KEY
    : 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJqdnZpdW5wZHBjd2ZrcXV4eXRsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzIxMzIyMDMsImV4cCI6MjA4NzcwODIwM30.uZGN-7CNyxIevMVvOR60ueSGf6tkiIacl-jGX2z9zcE';

export function getSupabaseClient() {
    if (window.supabaseClientInstance) {
        return window.supabaseClientInstance;
    }

    // 1. Si la librería fue cargada por script CDN (window.supabase.createClient)
    if (window.supabase && typeof window.supabase.createClient === 'function') {
        window.supabaseClientInstance = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
            auth: {
                autoRefreshToken: true,
                persistSession: true,
                detectSessionInUrl: true
            }
        });
        return window.supabaseClientInstance;
    }

    // 2. Fallback: buscar si ya hay un cliente creado previamente en window
    if (window.supabase && typeof window.supabase.from === 'function') {
        window.supabaseClientInstance = window.supabase;
        return window.supabase;
    }

    console.warn('[Supabase Admin] Supabase SDK aún no está disponible.');
    return null;
}

// Proxy transparente para exportación segura de 'supabase'
export const supabase = new Proxy({}, {
    get(target, prop) {
        const client = getSupabaseClient();
        if (!client) {
            console.error(`[Supabase Admin] Intento de acceso a supabase.${String(prop)} antes de inicializar cliente.`);
            // Devolver función dummy que retorne error manejable
            return () => ({
                select: () => Promise.resolve({ data: [], error: new Error('Supabase no inicializado') }),
                insert: () => Promise.resolve({ data: null, error: new Error('Supabase no inicializado') }),
                update: () => Promise.resolve({ data: null, error: new Error('Supabase no inicializado') }),
                delete: () => Promise.resolve({ data: null, error: new Error('Supabase no inicializado') })
            });
        }
        const val = client[prop];
        if (typeof val === 'function') {
            return val.bind(client);
        }
        return val;
    }
});

export default supabase;

export async function getCurrentSession() {
    try {
        const client = getSupabaseClient();
        if (!client || !client.auth) return null;
        const { data: { session }, error } = await client.auth.getSession();
        if (error) {
            console.warn('[Supabase Admin] Error obteniendo sesión:', error);
            return null;
        }
        return session;
    } catch (err) {
        console.warn('[Supabase Admin] Excepción en getCurrentSession:', err);
        return null;
    }
}

export async function verifyAdminRole(userId) {
    try {
        const client = getSupabaseClient();
        if (!client || !userId) return { isAdmin: false, profile: null };

        const { data: profile, error } = await client
            .from('profiles')
            .select('*')
            .eq('id', userId)
            .single();

        if (error) {
            console.warn('[Supabase Admin] Error consultando perfil admin:', error);
            return { isAdmin: false, profile: null };
        }

        return { isAdmin: profile?.role === 'admin', profile };
    } catch (err) {
        console.warn('[Supabase Admin] Excepción en verifyAdminRole:', err);
        return { isAdmin: false, profile: null };
    }
}
