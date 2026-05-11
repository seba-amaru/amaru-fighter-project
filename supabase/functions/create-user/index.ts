import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.4';

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface CreateUserRequest {
    email: string;
    password: string;
    full_name: string;
    memberData?: Record<string, unknown>;
}

serve(async (req) => {
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders });
    }

    try {
        const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
        const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';

        if (!supabaseUrl || !serviceRoleKey) {
            return new Response(
                JSON.stringify({ error: 'SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY no configuradas' }),
                { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            );
        }

        const { email, password, full_name, memberData }: CreateUserRequest = await req.json();

        if (!email || !password || !full_name) {
            return new Response(
                JSON.stringify({ error: 'Faltan campos requeridos: email, password, full_name' }),
                { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            );
        }

        // Create admin client
        const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
            auth: { autoRefreshToken: false, persistSession: false }
        });

        // Create user with email confirmed (no confirmation email sent)
        const { data: userData, error: authError } = await supabaseAdmin.auth.admin.createUser({
            email,
            password,
            email_confirm: true,
            user_metadata: { full_name }
        });

        if (authError) {
            return new Response(
                JSON.stringify({ error: authError.message }),
                { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            );
        }

        const userId = userData.user?.id;
        if (!userId) {
            return new Response(
                JSON.stringify({ error: 'No se pudo obtener el ID del usuario creado' }),
                { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            );
        }

        // Create profile
        const { error: profileError } = await supabaseAdmin
            .from('profiles')
            .insert({
                id: userId,
                email,
                full_name,
                ...memberData
            });

        if (profileError) {
            // Rollback: delete the auth user if profile creation fails
            await supabaseAdmin.auth.admin.deleteUser(userId);
            return new Response(
                JSON.stringify({ error: profileError.message }),
                { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            );
        }

        return new Response(
            JSON.stringify({ success: true, userId, email }),
            { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
    } catch (error) {
        return new Response(
            JSON.stringify({ error: error.message }),
            { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
    }
});
