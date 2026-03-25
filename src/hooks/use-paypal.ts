import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

let paypalScriptPromise: Promise<void> | null = null;

export function usePayPal() {
  const [ready, setReady] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const diagnoseFunctionReachability = useCallback(async () => {
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    if (!supabaseUrl) return null;

    try {
      const res = await fetch(`${supabaseUrl}/functions/v1/paypal-checkout`, {
        method: "OPTIONS",
      });

      if (res.status === 404) {
        return "Payment service is not deployed yet (paypal-checkout not found).";
      }
    } catch {
      return "Could not reach payment service endpoint. Please check network/CORS settings.";
    }

    return null;
  }, []);

  const invokePayPalFunction = useCallback(async (payload: Record<string, any>) => {
    const { data, error: invokeError } = await supabase.functions.invoke("paypal-checkout", {
      body: payload,
    });

    if (invokeError) {
      if (invokeError.message?.includes("Failed to send a request to the Edge Function")) {
        const diagnosis = await diagnoseFunctionReachability();
        if (diagnosis) {
          throw new Error(diagnosis);
        }
      }

      throw new Error(invokeError.message || "Failed to contact payment service");
    }

    return data;
  }, [diagnoseFunctionReachability]);

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

        const data = await invokePayPalFunction({ action: "get-client-id" });
        const clientId = data?.clientId as string | undefined;

        if (!clientId) {
          throw new Error("Failed to get PayPal config");
        }

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
  }, [invokePayPalFunction]);

  const createOrder = useCallback(
    async (amount: number, description: string, metadata?: Record<string, any>) => {
      const { data: session } = await supabase.auth.getSession();
      const token = session?.session?.access_token;
      if (!token) throw new Error("Not authenticated");

      const data = await invokePayPalFunction({
        action: "create-order",
        amount,
        description,
        metadata,
      });
      const orderId = data?.orderId as string | undefined;

      if (!orderId) {
        throw new Error("Failed to create order");
      }

      return orderId as string;
    },
    [invokePayPalFunction]
  );

  const captureOrder = useCallback(
    async (orderId: string, type: string, extra?: Record<string, any>) => {
      const { data: session } = await supabase.auth.getSession();
      const token = session?.session?.access_token;
      if (!token) throw new Error("Not authenticated");

      return await invokePayPalFunction({
        action: "capture-order",
        orderId,
        type,
        ...extra,
      });
    },
    [invokePayPalFunction]
  );

  return { ready, loading, error, createOrder, captureOrder };
}
