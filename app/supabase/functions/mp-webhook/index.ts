import { serve } from "https://deno.land/std@0.177.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3"

const MP_ACCESS_TOKEN = Deno.env.get('MP_ACCESS_TOKEN') ?? '';
const SUPABASE_URL = Deno.env.get('SUPABASE_URL') ?? '';
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';

serve(async (req) => {
  try {
    const url = new URL(req.url);
    const id = url.searchParams.get('data.id') || url.searchParams.get('id');
    const type = url.searchParams.get('type') || url.searchParams.get('topic');

    let body = {};
    if (req.method === 'POST') {
      try {
        body = await req.json();
      } catch (e) {
        console.log("No JSON body");
      }
    }

    const paymentId = body?.data?.id || id;
    const paymentType = body?.type || body?.action || type;

    if (paymentType === 'payment' || paymentType === 'payment.created' || paymentType?.includes('payment')) {
      if (!paymentId) return new Response('OK - No ID', { status: 200 });

      // Fetch payment details from MP
      const mpResponse = await fetch(`https://api.mercadopago.com/v1/payments/${paymentId}`, {
        headers: { 'Authorization': `Bearer ${MP_ACCESS_TOKEN}` }
      });
      const paymentData = await mpResponse.json();

      if (paymentData.status === 'approved') {
        const metadata = paymentData.metadata || {};
        const userId = metadata.user_id || paymentData.external_reference;
        
        let planId = metadata.plan_id;
        if (!planId && paymentData.additional_info?.items?.[0]?.id) {
            planId = paymentData.additional_info.items[0].id;
        }
        
        const limit = metadata.limit ? Number(metadata.limit) : 2;

        if (userId) {
          const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

          const expiryDate = new Date();
          expiryDate.setDate(expiryDate.getDate() + 30); // 30 dias de suscripción

          // Actualizar Perfil (activar membresía)
          const { error: profileError } = await supabase
            .from('profiles')
            .update({
              membership_status: 'active',
              membership_expiry: expiryDate.toISOString(),
              membership_limit: limit,
              membership_plan_id: planId,
              updated_at: new Date().toISOString()
            })
            .eq('id', userId);

          if (profileError) throw profileError;

          // Limpiar pagos pendientes obsoletos para evitar duplicados en la sección del administrador
          await supabase
            .from('payments')
            .delete()
            .eq('user_id', userId)
            .eq('status', 'pending');

          // Registrar pago
          await supabase
            .from('payments')
            .upsert({
              id: `MP-${paymentId}`,
              user_id: userId,
              amount: paymentData.transaction_amount,
              description: paymentData.description || 'Suscripción AmaruApp',
              status: 'approved',
              payment_method: 'mercadopago',
              plan_id: planId
            });
        }
      }
    }

    return new Response('OK', { status: 200 })
  } catch (error) {
    console.error('Webhook processing failed:', error)
    return new Response('Webhook Error', { status: 500 })
  }
})
