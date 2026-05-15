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

        // Optimized for Batch Sending (Up to 100 emails per Resend batch call)
        const batchSize = 100;
        const results = [];
        const errors = [];

        for (let i = 0; i < to.length; i += batchSize) {
            const batchTo = to.slice(i, i + batchSize);
            const batchPayload = batchTo.map(email => ({
                from: RESEND_FROM_EMAIL,
                to: email,
                subject,
                text,
                html: html || text.replace(/\n/g, '<br>'),
            }));

            try {
                const res = await fetch('https://api.resend.com/emails/batch', {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${RESEND_API_KEY}`,
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify(batchPayload),
                });

                const data = await res.json();
                
                if (!res.ok) {
                    console.error(`[Resend Error] Status: ${res.status}`, data);
                    batchTo.forEach(email => errors.push({ email, error: data }));
                } else {
                    // Resend Batch API returns an array of objects { id: '...' } or { id: '...', error: '...' }
                    // depending on the version, but usually it's a direct array of results.
                    if (Array.isArray(data.data)) {
                        data.data.forEach((item, index) => {
                            if (item.error) {
                                errors.push({ email: batchTo[index], error: item.error });
                            } else {
                                results.push({ email: batchTo[index], id: item.id });
                            }
                        });
                    } else if (data.id) {
                        // Single success response? (Unlikely for batch but safe)
                        batchTo.forEach(email => results.push({ email, id: data.id }));
                    } else {
                        // Success but unexpected format
                        batchTo.forEach(email => results.push({ email, id: 'batch-success' }));
                    }
                }
            } catch (err) {
                console.error(`[Fetch Error]`, err);
                batchTo.forEach(email => errors.push({ email, error: err.message }));
            }
        }

        return new Response(
            JSON.stringify({ 
                success: results, 
                failed: errors, 
                totalSent: results.length, 
                totalFailed: errors.length,
                details: errors.length > 0 ? 'Revisa los logs de Supabase para ver los errores detallados de Resend.' : 'Todos los correos procesados.'
            }),
            { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
    } catch (error) {
        return new Response(
            JSON.stringify({ error: error.message }),
            { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
    }
});
