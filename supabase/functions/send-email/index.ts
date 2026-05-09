import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';

const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY') || '';
const RESEND_FROM_EMAIL = Deno.env.get('RESEND_FROM_EMAIL') || 'hola@amaru-fighter.com';

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface SendEmailRequest {
    to: string[];
    subject: string;
    text: string;
    html?: string;
}

serve(async (req) => {
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders });
    }

    try {
        const { to, subject, text, html }: SendEmailRequest = await req.json();

        if (!RESEND_API_KEY) {
            return new Response(
                JSON.stringify({ error: 'RESEND_API_KEY no configurada. Agrega la variable de entorno en Supabase.' }),
                { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            );
        }

        if (!to || to.length === 0 || !subject || !text) {
            return new Response(
                JSON.stringify({ error: 'Faltan campos requeridos: to, subject, text' }),
                { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            );
        }

        const results = [];
        const errors = [];

        // Resend batch API supports up to 100 emails per request
        for (const email of to) {
            try {
                const res = await fetch('https://api.resend.com/emails', {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${RESEND_API_KEY}`,
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        from: RESEND_FROM_EMAIL,
                        to: email,
                        subject,
                        text,
                        html: html || text.replace(/\n/g, '<br>'),
                    }),
                });

                const data = await res.json();
                if (!res.ok) {
                    errors.push({ email, error: data });
                } else {
                    results.push({ email, id: data.id });
                }
            } catch (err) {
                errors.push({ email, error: err.message });
            }
        }

        return new Response(
            JSON.stringify({ success: results, failed: errors, totalSent: results.length, totalFailed: errors.length }),
            { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
    } catch (error) {
        return new Response(
            JSON.stringify({ error: error.message }),
            { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
    }
});
