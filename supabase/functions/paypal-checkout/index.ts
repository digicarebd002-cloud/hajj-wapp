// PayPal Checkout Edge Function v2
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

async function getPayPalCredentials(supabaseAdmin: any) {
  const { data } = await supabaseAdmin
    .from("site_settings")
    .select("key, value")
    .in("key", [
      "paypal_enabled",
      "paypal_mode",
      "paypal_sandbox_client_id",
      "paypal_sandbox_secret",
      "paypal_live_client_id",
      "paypal_live_secret",
    ]);

  const settings: Record<string, string> = {};
  (data || []).forEach((r: any) => (settings[r.key] = r.value));

  if (settings.paypal_enabled !== "true") {
    throw new Error("PayPal is not enabled");
  }

  const isSandbox = settings.paypal_mode === "sandbox";
  const clientId = isSandbox ? settings.paypal_sandbox_client_id : settings.paypal_live_client_id;
  const secret = isSandbox ? settings.paypal_sandbox_secret : settings.paypal_live_secret;
  const baseUrl = isSandbox
    ? "https://api-m.sandbox.paypal.com"
    : "https://api-m.paypal.com";

  if (!clientId || !secret) {
    throw new Error("PayPal credentials not configured");
  }

  return { clientId, secret, baseUrl, isSandbox };
}

async function getAccessToken(baseUrl: string, clientId: string, secret: string) {
  const res = await fetch(`${baseUrl}/v1/oauth2/token`, {
    method: "POST",
    headers: {
      Authorization: `Basic ${btoa(`${clientId}:${secret}`)}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: "grant_type=client_credentials",
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`PayPal auth failed: ${err}`);
  }

  const data = await res.json();
  return data.access_token;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!supabaseUrl || !serviceRoleKey) {
      console.error("Missing required environment variables", {
        hasSupabaseUrl: !!supabaseUrl,
        hasServiceRoleKey: !!serviceRoleKey,
      });

      return new Response(
        JSON.stringify({ error: "Server configuration error: Missing Supabase credentials" }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey);

    // Verify user auth
    const authHeader = req.headers.get("authorization");
    if (!authHeader) throw new Error("Not authenticated");

    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);
    if (authError || !user) throw new Error("Invalid token");

    const body = await req.json();
    const { action } = body;

    const { clientId, secret, baseUrl, isSandbox } = await getPayPalCredentials(supabaseAdmin);
    const accessToken = await getAccessToken(baseUrl, clientId, secret);

    if (action === "get-client-id") {
      return new Response(
        JSON.stringify({ clientId, isSandbox }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (action === "create-order") {
      const { amount, currency = "USD", description = "Payment", metadata } = body;

      if (!amount || amount <= 0) throw new Error("Invalid amount");

      const orderRes = await fetch(`${baseUrl}/v2/checkout/orders`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          intent: "CAPTURE",
          purchase_units: [
            {
              amount: {
                currency_code: currency,
                value: amount.toFixed(2),
              },
              description,
              custom_id: JSON.stringify({
                user_id: user.id,
                type: metadata?.type || "wallet",
                ...metadata,
              }),
            },
          ],
          application_context: {
            brand_name: "Hajj Wallet",
            shipping_preference: "NO_SHIPPING",
          },
        }),
      });

      if (!orderRes.ok) {
        const err = await orderRes.text();
        throw new Error(`PayPal create order failed: ${err}`);
      }

      const order = await orderRes.json();
      return new Response(
        JSON.stringify({ orderId: order.id }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (action === "capture-order") {
      const { orderId, type, bookingData, orderData } = body;

      if (!orderId) throw new Error("Missing orderId");

      const captureRes = await fetch(
        `${baseUrl}/v2/checkout/orders/${orderId}/capture`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${accessToken}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (!captureRes.ok) {
        const err = await captureRes.text();
        throw new Error(`PayPal capture failed: ${err}`);
      }

      const captureData = await captureRes.json();
      const captureAmount = parseFloat(
        captureData.purchase_units?.[0]?.payments?.captures?.[0]?.amount?.value || "0"
      );
      const captureId =
        captureData.purchase_units?.[0]?.payments?.captures?.[0]?.id || "";

      // Process based on type
      if (type === "wallet") {
        // Add to wallet
        await supabaseAdmin.from("wallet_transactions").insert({
          user_id: user.id,
          amount: captureAmount,
          type: "one-time",
          status: "completed",
        });
      } else if (type === "booking" && bookingData) {
        // Create booking
        const { data: booking } = await supabaseAdmin
          .from("bookings")
          .insert({
            ...bookingData,
            user_id: user.id,
            payment_method: "paypal",
            status: "confirmed",
          })
          .select("id")
          .single();

        if (booking) {
          return new Response(
            JSON.stringify({
              success: true,
              captureId,
              amount: captureAmount,
              bookingId: booking.id,
            }),
            { headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }
      } else if (type === "order" && orderData) {
        // Create store order
        const { data: order } = await supabaseAdmin
          .from("orders")
          .insert({
            user_id: user.id,
            subtotal: orderData.subtotal,
            discount: orderData.discount,
            total: captureAmount,
            status: "paid",
          })
          .select("id")
          .single();

        if (order && orderData.items) {
          await supabaseAdmin.from("order_items").insert(
            orderData.items.map((item: any) => ({
              order_id: order.id,
              product_id: item.product_id,
              size: item.size,
              color: item.color,
              quantity: item.quantity,
              unit_price: item.unit_price,
            }))
          );

          return new Response(
            JSON.stringify({
              success: true,
              captureId,
              amount: captureAmount,
              orderId: order.id,
            }),
            { headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }
      } else if (type === "membership" && body.planData) {
        const { planData } = body;
        const now = new Date();
        const endsAt = new Date(now);
        endsAt.setMonth(endsAt.getMonth() + 1);

        await supabaseAdmin.from("membership_payments").insert({
          user_id: user.id,
          plan_id: planData.id,
          amount: captureAmount,
          status: "completed",
          payment_method: "paypal",
          starts_at: now.toISOString(),
          ends_at: endsAt.toISOString(),
        });

        await supabaseAdmin.from("profiles").update({
          membership_status: "active",
          tier: planData.name,
          next_billing_date: endsAt.toISOString(),
        }).eq("user_id", user.id);
      }

      return new Response(
        JSON.stringify({
          success: true,
          captureId,
          amount: captureAmount,
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    throw new Error(`Unknown action: ${action}`);
  } catch (error: any) {
    console.error("PayPal checkout error:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
