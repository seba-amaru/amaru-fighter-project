import { serve } from "https://deno.land/std@0.177.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3"

const MP_ACCESS_TOKEN = Deno.env.get('MP_ACCESS_TOKEN') ?? '';
const SUPABASE_URL = Deno.env.get('SUPABASE_URL') ?? '';
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';

async function calculateCorrectAmount(supabase, planId, userId, metadata) {
  try {
    let finalAmount = 0;
    let discountPercent = 0;
    let concept = 'Membresía AmaruApp';

    const { data: plan } = await supabase
      .from('membership_plans')
      .select('name, price')
      .eq('id', planId)
      .single();
    
    if (plan) {
      finalAmount = Number(plan.price) || 0;
      concept = plan.name || concept;
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('active_promo')
      .eq('id', userId)
      .single();

    if (profile?.active_promo) {
      const { data: discount } = await supabase
        .from('discounts')
        .select('percent, code')
        .eq('code', profile.active_promo)
        .single();
      
      if (discount && discount.percent) {
        discountPercent = discount.percent;
      }
    }

    if (metadata.isProportional === 'true' && metadata.daysLeft && metadata.daysInMonth) {
      const dailyRate = finalAmount / Number(metadata.daysInMonth);
      const daysLeft = Number(metadata.daysLeft);
      finalAmount = Math.round(dailyRate * daysLeft);
      concept += ' (Proporcional)';
    }

    if (discountPercent > 0) {
      finalAmount = Math.round(finalAmount * (1 - discountPercent / 100));
      concept += ` (-${discountPercent}% LFNM2026)`;
    }

    return { amount: finalAmount, concept, discountPercent };
  } catch (err) {
    console.error('Error calculating amount:', err);
    return { 
      amount: 0, 
      concept: 'Membresía AmaruApp',
      discountPercent: 0
    };
  }
}

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

        if (userId && planId) {
          const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

          const { amount, concept, discountPercent } = await calculateCorrectAmount(
            supabase, planId, userId, metadata
          );

          const expiryDate = new Date();
          expiryDate.setDate(expiryDate.getDate() + 30);

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

          await supabase
            .from('payments')
            .delete()
            .eq('user_id', userId)
            .eq('status', 'pending');

          const finalAmount = amount > 0 ? amount : Number(paymentData.transaction_amount || 0);
          
          await supabase
            .from('payments')
            .upsert({
              id: `MP-${paymentId}`,
              user_id: userId,
              amount: finalAmount,
              concept: concept || paymentData.description || 'Suscripción AmaruApp',
              status: 'approved',
              payment_method: 'mercadopago'
            });
          
          console.log(`Payment registered: user=${userId}, amount=${finalAmount}, concept=${concept}`);
        }
      }
    }

    return new Response('OK', { status: 200 })
  } catch (error) {
    console.error('Webhook processing failed:', error)
    return new Response('Webhook Error', { status: 500 })
  }
})
