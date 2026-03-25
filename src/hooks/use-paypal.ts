import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

let paypalScriptPromise: Promise<void> | null = null;

export function usePayPal() {
  const [ready, setReady] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    const init = async () => {
      try {
        // Get PayPal client ID from edge function
        const { data: session } = await supabase.auth.getSession();
        const token = session?.session?.access_token;
        if (!token) {
          setError("Not authenticated");
          setLoading(false);
          return;
        }

        const projectId = import.meta.env.VITE_SUPABASE_PROJECT_ID;
        const res = await fetch(
          `https://${projectId}.supabase.co/functions/v1/paypal-checkout`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({ action: "get-client-id" }),
          }
        );

        if (!res.ok) {
          const err = await res.json();
          throw new Error(err.error || "Failed to get PayPal config");
        }

        const { clientId } = await res.json();

        // Load PayPal JS SDK
        if (!paypalScriptPromise) {
          paypalScriptPromise = new Promise((resolve, reject) => {
            if ((window as any).paypal) { resolve(); return; }
            const script = document.createElement("script");
            script.src = `https://www.paypal.com/sdk/js?client-id=${clientId}&currency=USD&intent=capture`;
            script.async = true;
            script.onload = () => resolve();
            script.onerror = () => reject(new Error("Failed to load PayPal SDK"));
            document.head.appendChild(script);
          });
        }

        await paypalScriptPromise;
        if (!cancelled) {
          setReady(true);
          setLoading(false);
        }
      } catch (err: any) {
        if (!cancelled) {
          setError(err.message);
          setLoading(false);
        }
      }
    };

    init();
    return () => { cancelled = true; };
  }, []);

  const createOrder = useCallback(
    async (amount: number, description: string, metadata?: Record<string, any>) => {
      const { data: session } = await supabase.auth.getSession();
      const token = session?.session?.access_token;
      if (!token) throw new Error("Not authenticated");

      const projectId = import.meta.env.VITE_SUPABASE_PROJECT_ID;
      const res = await fetch(
        `https://${projectId}.supabase.co/functions/v1/paypal-checkout`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ action: "create-order", amount, description, metadata }),
        }
      );

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to create order");
      }

      const { orderId } = await res.json();
      return orderId as string;
    },
    []
  );

  const captureOrder = useCallback(
    async (orderId: string, type: string, extra?: Record<string, any>) => {
      const { data: session } = await supabase.auth.getSession();
      const token = session?.session?.access_token;
      if (!token) throw new Error("Not authenticated");

      const projectId = import.meta.env.VITE_SUPABASE_PROJECT_ID;
      const res = await fetch(
        `https://${projectId}.supabase.co/functions/v1/paypal-checkout`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ action: "capture-order", orderId, type, ...extra }),
        }
      );

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to capture payment");
      }

      return await res.json();
    },
    []
  );

  return { ready, loading, error, createOrder, captureOrder };
}
