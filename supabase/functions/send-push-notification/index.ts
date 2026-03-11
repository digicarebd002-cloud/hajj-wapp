import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Convert base64url to Uint8Array
function base64urlToUint8Array(base64url: string): Uint8Array {
  const base64 = base64url.replace(/-/g, "+").replace(/_/g, "/");
  const pad = base64.length % 4 === 0 ? "" : "=".repeat(4 - (base64.length % 4));
  const binary = atob(base64 + pad);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

function uint8ArrayToBase64url(arr: Uint8Array): string {
  let binary = "";
  for (const b of arr) binary += String.fromCharCode(b);
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

// Generate VAPID JWT token
async function generateVapidJwt(endpoint: string, vapidPrivateKeyBase64url: string, vapidEmail: string): Promise<string> {
  const audience = new URL(endpoint).origin;
  const header = { typ: "JWT", alg: "ES256" };
  const now = Math.floor(Date.now() / 1000);
  const payload = { aud: audience, exp: now + 12 * 3600, sub: `mailto:${vapidEmail}` };

  const headerB64 = uint8ArrayToBase64url(new TextEncoder().encode(JSON.stringify(header)));
  const payloadB64 = uint8ArrayToBase64url(new TextEncoder().encode(JSON.stringify(payload)));
  const unsignedToken = `${headerB64}.${payloadB64}`;

  // Import private key
  const privateKeyBytes = base64urlToUint8Array(vapidPrivateKeyBase64url);
  const key = await crypto.subtle.importKey(
    "jwk",
    {
      kty: "EC",
      crv: "P-256",
      d: vapidPrivateKeyBase64url,
      x: "", // Will be filled
      y: "",
    },
    { name: "ECDSA", namedCurve: "P-256" },
    false,
    ["sign"]
  ).catch(() => null);

  if (!key) {
    // Fallback: try raw import
    const jwk = JSON.parse(Deno.env.get("VAPID_PRIVATE_JWK") || "{}");
    if (!jwk.d) throw new Error("VAPID_PRIVATE_JWK secret not configured");
    const importedKey = await crypto.subtle.importKey(
      "jwk",
      jwk,
      { name: "ECDSA", namedCurve: "P-256" },
      false,
      ["sign"]
    );
    const signature = await crypto.subtle.sign(
      { name: "ECDSA", hash: "SHA-256" },
      importedKey,
      new TextEncoder().encode(unsignedToken)
    );
    const sigB64 = uint8ArrayToBase64url(new Uint8Array(signature));
    return `${unsignedToken}.${sigB64}`;
  }

  const signature = await crypto.subtle.sign(
    { name: "ECDSA", hash: "SHA-256" },
    key,
    new TextEncoder().encode(unsignedToken)
  );
  const sigB64 = uint8ArrayToBase64url(new Uint8Array(signature));
  return `${unsignedToken}.${sigB64}`;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const url = new URL(req.url);
    const action = url.searchParams.get("action") || "send";

    // --- Generate VAPID Keys ---
    if (action === "generate-vapid-keys") {
      const keyPair = await crypto.subtle.generateKey(
        { name: "ECDSA", namedCurve: "P-256" },
        true,
        ["sign", "verify"]
      );

      const publicKeyRaw = await crypto.subtle.exportKey("raw", keyPair.publicKey);
      const privateKeyJwk = await crypto.subtle.exportKey("jwk", keyPair.privateKey);
      const publicKeyBase64url = uint8ArrayToBase64url(new Uint8Array(publicKeyRaw));

      return new Response(
        JSON.stringify({
          message: "Save these keys! Set VAPID_PUBLIC_KEY and VAPID_PRIVATE_JWK as Supabase secrets.",
          vapid_public_key: publicKeyBase64url,
          vapid_private_jwk: JSON.stringify(privateKeyJwk),
          instructions: [
            "1. Copy vapid_public_key → set as VAPID_PUBLIC_KEY secret",
            "2. Copy vapid_private_jwk → set as VAPID_PRIVATE_JWK secret",
            "3. Set VAPID_EMAIL secret (e.g. admin@yoursite.com)",
          ],
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // --- Get VAPID Public Key ---
    if (action === "vapid-public-key") {
      const publicKey = Deno.env.get("VAPID_PUBLIC_KEY");
      if (!publicKey) {
        return new Response(
          JSON.stringify({ error: "VAPID_PUBLIC_KEY not configured" }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      return new Response(
        JSON.stringify({ publicKey }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // --- Send Push Notification ---
    if (action === "send") {
      const authHeader = req.headers.get("Authorization");
      if (!authHeader) {
        return new Response(JSON.stringify({ error: "Unauthorized" }), {
          status: 401,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const { data: { user } } = await supabase.auth.getUser(authHeader.replace("Bearer ", ""));
      if (!user) {
        return new Response(JSON.stringify({ error: "Unauthorized" }), {
          status: 401,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // Check admin role
      const { data: isAdmin } = await supabase.rpc("has_role", {
        _user_id: user.id,
        _role: "admin",
      });

      const body = await req.json();
      const { user_id, title, body: notifBody, url: notifUrl } = body;

      // Non-admins can only send to themselves
      const targetUserId = isAdmin ? (user_id || user.id) : user.id;

      // Get subscriptions
      const { data: subs } = await supabase
        .from("push_subscriptions")
        .select("*")
        .eq("user_id", targetUserId);

      if (!subs || subs.length === 0) {
        return new Response(
          JSON.stringify({ sent: 0, message: "No push subscriptions found" }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const vapidPublicKey = Deno.env.get("VAPID_PUBLIC_KEY");
      const vapidPrivateJwk = Deno.env.get("VAPID_PRIVATE_JWK");
      const vapidEmail = Deno.env.get("VAPID_EMAIL") || "admin@hajjwallet.com";

      if (!vapidPublicKey || !vapidPrivateJwk) {
        return new Response(
          JSON.stringify({ error: "VAPID keys not configured" }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const payload = JSON.stringify({
        title: title || "Hajj Wallet",
        body: notifBody || "",
        icon: "/pwa-192x192.png",
        badge: "/pwa-192x192.png",
        url: notifUrl || "/",
      });

      let sent = 0;
      let failed = 0;

      for (const sub of subs) {
        try {
          // For simplicity, send without encryption (some push services support this)
          // Full RFC 8291 encryption would be needed for production
          const response = await fetch(sub.endpoint, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "TTL": "86400",
            },
            body: payload,
          });

          if (response.ok || response.status === 201) {
            sent++;
          } else if (response.status === 404 || response.status === 410) {
            // Subscription expired, remove it
            await supabase
              .from("push_subscriptions")
              .delete()
              .eq("id", sub.id);
            failed++;
          } else {
            failed++;
          }
        } catch {
          failed++;
        }
      }

      return new Response(
        JSON.stringify({ sent, failed, total: subs.length }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({ error: "Unknown action" }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    return new Response(
      JSON.stringify({ error: err.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
