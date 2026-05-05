import { serve } from "https://deno.land/std@0.177.0/http/server.ts"

const MP_ACCESS_TOKEN = Deno.env.get('MP_ACCESS_TOKEN') ?? '';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { plan, userId, userEmail } = await req.json()

    if (!plan || !userId) {
      throw new Error("Faltan datos para crear la preferencia")
    }

    const preferenceData = {
      items: [
        {
          id: plan.id,
          title: plan.name,
          description: `Membresía ${plan.name} en AmaruApp`,
          quantity: 1,
          currency_id: 'CLP',
          unit_price: Number(plan.price)
        }
      ],
      payer: {
        email: userEmail
      },
      back_urls: {
        success: "https://amarufighter.web.app/app/?payment=success",
        failure: "https://amarufighter.web.app/app/?payment=failure",
        pending: "https://amarufighter.web.app/app/?payment=pending"
      },
      auto_return: "approved",
      external_reference: userId,
      notification_url: "https://rjvviunpdpcwfkquxytl.supabase.co/functions/v1/mp-webhook",
      metadata: {
        user_id: userId,
        plan_id: plan.id,
        limit: plan.limit || 2
      }
    }

    const response = await fetch("https://api.mercadopago.com/checkout/preferences", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${MP_ACCESS_TOKEN}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify(preferenceData)
    })

    const mpData = await response.json()

    if (!response.ok) {
      throw new Error(`Error MP: ${JSON.stringify(mpData)}`)
    }

    return new Response(
      JSON.stringify({ id: mpData.id, init_point: mpData.init_point }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    )

  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    })
  }
})
