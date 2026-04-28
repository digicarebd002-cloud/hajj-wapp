// PayPal Subscription Edge Function for Wallet Access
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
      "wallet_subscription_price",
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
  const price = parseFloat(settings.wallet_subscription_price || "15");

  if (!clientId || !secret) {
    throw new Error("PayPal credentials not configured");
  }

  return { clientId, secret, baseUrl, isSandbox, price };
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

async function ensureProductAndPlan(
  baseUrl: string,
  accessToken: string,
  price: number,
  supabaseAdmin: any
) {
  // Check if we already have a stored plan ID
  const { data: planSetting } = await supabaseAdmin
    .from("site_settings")
    .select("value")
    .eq("key", "paypal_subscription_plan_id")
    .maybeSingle();

  if (planSetting?.value) {
    // Verify plan still exists
    const checkRes = await fetch(`${baseUrl}/v1/billing/plans/${planSetting.value}`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    if (checkRes.ok) {
      return planSetting.value;
    }
  }

  // Create product
  const productRes = await fetch(`${baseUrl}/v1/catalogs/products`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      name: "Hajj Wallet Access",
      description: "Monthly subscription to access Hajj savings wallet contributions",
      type: "SERVICE",
      category: "SOFTWARE",
    }),
  });

  if (!productRes.ok) {
    const err = await productRes.text();
    throw new Error(`Failed to create PayPal product: ${err}`);
  }

  const product = await productRes.json();

  // Create plan
  const planRes = await fetch(`${baseUrl}/v1/billing/plans`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      product_id: product.id,
      name: "Wallet Access Subscription",
      description: `Monthly $${price.toFixed(2)} subscription for wallet access`,
      billing_cycles: [
        {
          frequency: { interval_unit: "MONTH", interval_count: 1 },
          tenure_type: "REGULAR",
          sequence: 1,
          total_cycles: 0, // infinite
          pricing_scheme: {
            fixed_price: { value: price.toFixed(2), currency_code: "USD" },
          },
        },
      ],
      payment_preferences: {
        auto_bill_outstanding: true,
        payment_failure_threshold: 3,
      },
    }),
  });

  if (!planRes.ok) {
    const err = await planRes.text();
    throw new Error(`Failed to create PayPal plan: ${err}`);
  }

  const plan = await planRes.json();

  // Store plan ID
  await supabaseAdmin
    .from("site_settings")
    .upsert(
      { key: "paypal_subscription_plan_id", value: plan.id, updated_at: new Date().toISOString() },
      { onConflict: "key" }
    );

  return plan.id;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!supabaseUrl || !serviceRoleKey) {
      return new Response(
        JSON.stringify({ error: "Server configuration error: missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY" }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey);
    const body = await req.json();
    const { action } = body;

    // Webhook doesn't need auth.
    // PayPal sends webhooks in native format with `event_type` and `resource`
    // fields (no `action`). Detect either form.
    if (action === "webhook" || (typeof body?.event_type === "string" && body?.resource)) {
      return await handleWebhook(body, supabaseAdmin);
    }

    // Verify user auth
    const authHeader = req.headers.get("authorization");
    if (!authHeader) throw new Error("Not authenticated");

    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);
    if (authError || !user) throw new Error("Invalid token");

    // Record a subscription created via PayPal hosted plan button (separate
    // client ID). We trust the subscriptionID returned by PayPal's JS SDK
    // because the user just completed the approval flow in PayPal's popup.
    if (action === "record-plan-subscription") {
      const { subscriptionId, planId, amount } = body;
      if (!subscriptionId) throw new Error("Missing subscriptionId");

      // Server-side verification: ask PayPal directly whether this subscription
      // exists, is active/approved, and what its real billing dates are.
      let verifiedStatus: string | null = null;
      let verifiedNextBilling: string | null = null;
      let verifiedPlanId: string | null = null;
      try {
        const { clientId, secret, baseUrl } = await getPayPalCredentials(supabaseAdmin);
        const accessToken = await getAccessToken(baseUrl, clientId, secret);
        const verifyRes = await fetch(
          `${baseUrl}/v1/billing/subscriptions/${subscriptionId}`,
          { headers: { Authorization: `Bearer ${accessToken}` } }
        );
        if (verifyRes.ok) {
          const subData = await verifyRes.json();
          verifiedStatus = subData.status;
          verifiedNextBilling = subData?.billing_info?.next_billing_time || null;
          verifiedPlanId = subData?.plan_id || null;
        } else {
          const errTxt = await verifyRes.text();
          console.warn(
            `PayPal verify failed for ${subscriptionId} [${verifyRes.status}]: ${errTxt}. ` +
              `This usually means the hosted plan belongs to a different PayPal merchant ` +
              `than the configured admin credentials. Falling back to trusting client.`
          );
        }
      } catch (e: any) {
        console.warn("PayPal verify threw, falling back to client trust:", e?.message);
      }

      // If we successfully verified and PayPal says it's NOT active/approved, reject.
      if (verifiedStatus && !["ACTIVE", "APPROVED"].includes(verifiedStatus)) {
        return new Response(
          JSON.stringify({
            success: false,
            error: `Subscription not active on PayPal (status: ${verifiedStatus})`,
          }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const now = new Date();
      const endsAt = verifiedNextBilling ? new Date(verifiedNextBilling) : (() => {
        const d = new Date(now);
        d.setMonth(d.getMonth() + 1);
        return d;
      })();

      // Upsert by paypal_subscription_id for this user
      const { data: existing } = await supabaseAdmin
        .from("wallet_subscriptions")
        .select("id")
        .eq("user_id", user.id)
        .eq("paypal_subscription_id", subscriptionId)
        .maybeSingle();

      if (existing?.id) {
        await supabaseAdmin
          .from("wallet_subscriptions")
          .update({
            status: "active",
            starts_at: now.toISOString(),
            ends_at: endsAt.toISOString(),
            cancelled_at: null,
          })
          .eq("id", existing.id);
      } else {
        await supabaseAdmin.from("wallet_subscriptions").insert({
          user_id: user.id,
          paypal_subscription_id: subscriptionId,
          paypal_plan_id: verifiedPlanId || planId || "P-1D83979625931534RNHYMMPQ",
          status: "active",
          amount: amount ?? 15,
          starts_at: now.toISOString(),
          ends_at: endsAt.toISOString(),
        });
      }

      return new Response(
        JSON.stringify({ success: true, verified: !!verifiedStatus }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // get-config does not need PayPal API access — it only reads DB state.
    if (action === "get-config") {
      const { data: activeSub } = await supabaseAdmin
        .from("wallet_subscriptions")
        .select("*")
        .eq("user_id", user.id)
        .in("status", ["active", "pending"])
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      // Try to read price from settings, fallback to 15
      let price = 15;
      try {
        const { data: priceRow } = await supabaseAdmin
          .from("site_settings")
          .select("value")
          .eq("key", "wallet_subscription_price")
          .maybeSingle();
        if (priceRow?.value) price = parseFloat(priceRow.value) || 15;
      } catch (_) {}

      return new Response(
        JSON.stringify({
          price,
          hasActiveSubscription: activeSub?.status === "active",
          subscription: activeSub,
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Remaining actions require admin-configured PayPal API credentials.
    const { clientId, secret, baseUrl, isSandbox, price } = await getPayPalCredentials(supabaseAdmin);
    const accessToken = await getAccessToken(baseUrl, clientId, secret);

    if (action === "create-subscription") {
      const { returnUrl, cancelUrl } = body;
      const planId = await ensureProductAndPlan(baseUrl, accessToken, price, supabaseAdmin);

      const subRes = await fetch(`${baseUrl}/v1/billing/subscriptions`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          plan_id: planId,
          subscriber: {
            email_address: user.email,
          },
          application_context: {
            brand_name: "Hajj Wallet",
            shipping_preference: "NO_SHIPPING",
            user_action: "SUBSCRIBE_NOW",
            return_url: returnUrl || `${req.headers.get("origin")}/wallet?subscription=success`,
            cancel_url: cancelUrl || `${req.headers.get("origin")}/wallet?subscription=cancelled`,
          },
        }),
      });

      if (!subRes.ok) {
        const err = await subRes.text();
        throw new Error(`Failed to create subscription: ${err}`);
      }

      const subscription = await subRes.json();

      // Store pending subscription
      await supabaseAdmin.from("wallet_subscriptions").insert({
        user_id: user.id,
        paypal_subscription_id: subscription.id,
        paypal_plan_id: planId,
        status: "pending",
        amount: price,
      });

      const approvalLink = subscription.links?.find((l: any) => l.rel === "approve")?.href;

      return new Response(
        JSON.stringify({ subscriptionId: subscription.id, approvalUrl: approvalLink }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (action === "activate-subscription") {
      const { subscriptionId } = body;
      if (!subscriptionId) throw new Error("Missing subscriptionId");

      // Check subscription status from PayPal
      const statusRes = await fetch(`${baseUrl}/v1/billing/subscriptions/${subscriptionId}`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });

      if (!statusRes.ok) throw new Error("Failed to check subscription status");

      const subData = await statusRes.json();
      const now = new Date();
      const endsAt = new Date(now);
      endsAt.setMonth(endsAt.getMonth() + 1);

      if (subData.status === "ACTIVE" || subData.status === "APPROVED") {
        await supabaseAdmin
          .from("wallet_subscriptions")
          .update({
            status: "active",
            starts_at: now.toISOString(),
            ends_at: endsAt.toISOString(),
          })
          .eq("paypal_subscription_id", subscriptionId)
          .eq("user_id", user.id);

        return new Response(
          JSON.stringify({ success: true, status: "active" }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      return new Response(
        JSON.stringify({ success: false, status: subData.status }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (action === "cancel-subscription") {
      const { subscriptionId } = body;
      if (!subscriptionId) throw new Error("Missing subscriptionId");

      const cancelRes = await fetch(
        `${baseUrl}/v1/billing/subscriptions/${subscriptionId}/cancel`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${accessToken}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ reason: "User requested cancellation" }),
        }
      );

      if (!cancelRes.ok && cancelRes.status !== 204) {
        const err = await cancelRes.text();
        throw new Error(`Failed to cancel subscription: ${err}`);
      }

      await supabaseAdmin
        .from("wallet_subscriptions")
        .update({
          status: "cancelled",
          cancelled_at: new Date().toISOString(),
        })
        .eq("paypal_subscription_id", subscriptionId)
        .eq("user_id", user.id);

      return new Response(
        JSON.stringify({ success: true }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (action === "check-status") {
      const { data: activeSub } = await supabaseAdmin
        .from("wallet_subscriptions")
        .select("*")
        .eq("user_id", user.id)
        .eq("status", "active")
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (!activeSub) {
        return new Response(
          JSON.stringify({ active: false }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Check if subscription has expired
      if (activeSub.ends_at && new Date(activeSub.ends_at) < new Date()) {
        // Check with PayPal if it renewed
        const statusRes = await fetch(
          `${baseUrl}/v1/billing/subscriptions/${activeSub.paypal_subscription_id}`,
          { headers: { Authorization: `Bearer ${accessToken}` } }
        );

        if (statusRes.ok) {
          const subData = await statusRes.json();
          if (subData.status === "ACTIVE") {
            // Renew locally
            const now = new Date();
            const newEnds = new Date(now);
            newEnds.setMonth(newEnds.getMonth() + 1);

            await supabaseAdmin
              .from("wallet_subscriptions")
              .update({
                starts_at: now.toISOString(),
                ends_at: newEnds.toISOString(),
              })
              .eq("id", activeSub.id);

            return new Response(
              JSON.stringify({ active: true, subscription: { ...activeSub, ends_at: newEnds.toISOString() } }),
              { headers: { ...corsHeaders, "Content-Type": "application/json" } }
            );
          } else {
            // Subscription cancelled/expired on PayPal side
            await supabaseAdmin
              .from("wallet_subscriptions")
              .update({ status: "expired" })
              .eq("id", activeSub.id);

            return new Response(
              JSON.stringify({ active: false }),
              { headers: { ...corsHeaders, "Content-Type": "application/json" } }
            );
          }
        }
      }

      return new Response(
        JSON.stringify({ active: true, subscription: activeSub }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    throw new Error(`Unknown action: ${action}`);
  } catch (error: any) {
    console.error("PayPal subscription error:", error?.message, error?.stack);
    return new Response(
      JSON.stringify({
        error: error?.message || String(error) || "Unknown server error",
        stack: error?.stack?.split("\n").slice(0, 3).join(" | "),
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

async function handleWebhook(body: any, supabaseAdmin: any) {
  const { event_type, resource } = body;

  console.log("PayPal webhook event:", event_type);

  try {
    if (event_type === "BILLING.SUBSCRIPTION.ACTIVATED") {
      const subscriptionId = resource?.id;
      if (subscriptionId) {
        const now = new Date();
        const endsAt = new Date(now);
        endsAt.setMonth(endsAt.getMonth() + 1);

        await supabaseAdmin
          .from("wallet_subscriptions")
          .update({
            status: "active",
            starts_at: now.toISOString(),
            ends_at: endsAt.toISOString(),
          })
          .eq("paypal_subscription_id", subscriptionId);
      }
    }

    if (event_type === "BILLING.SUBSCRIPTION.CANCELLED" || event_type === "BILLING.SUBSCRIPTION.EXPIRED") {
      const subscriptionId = resource?.id;
      if (subscriptionId) {
        await supabaseAdmin
          .from("wallet_subscriptions")
          .update({
            status: event_type.includes("CANCELLED") ? "cancelled" : "expired",
            cancelled_at: new Date().toISOString(),
          })
          .eq("paypal_subscription_id", subscriptionId);
      }
    }

    if (event_type === "PAYMENT.SALE.COMPLETED") {
      // Recurring payment received - extend subscription
      const subscriptionId = resource?.billing_agreement_id;
      if (subscriptionId) {
        const now = new Date();
        const newEnds = new Date(now);
        newEnds.setMonth(newEnds.getMonth() + 1);

        await supabaseAdmin
          .from("wallet_subscriptions")
          .update({
            status: "active",
            starts_at: now.toISOString(),
            ends_at: newEnds.toISOString(),
            cancelled_at: null,
          })
          .eq("paypal_subscription_id", subscriptionId);
      }
    }

    // Payment failed — keep status active until expiry, but log it.
    if (event_type === "BILLING.SUBSCRIPTION.PAYMENT.FAILED") {
      console.warn("Subscription payment failed:", resource?.id);
    }

    // Suspended (e.g. PayPal paused due to failed payments)
    if (event_type === "BILLING.SUBSCRIPTION.SUSPENDED") {
      const subscriptionId = resource?.id;
      if (subscriptionId) {
        await supabaseAdmin
          .from("wallet_subscriptions")
          .update({ status: "expired", cancelled_at: new Date().toISOString() })
          .eq("paypal_subscription_id", subscriptionId);
      }
    }
  } catch (err) {
    console.error("Webhook processing error:", err);
  }

  return new Response(
    JSON.stringify({ received: true }),
    { headers: { ...corsHeaders, "Content-Type": "application/json" } }
  );
}
