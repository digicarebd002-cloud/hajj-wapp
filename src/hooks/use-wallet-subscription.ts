import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

interface WalletSubscription {
  id: string;
  status: string;
  amount: number;
  starts_at: string | null;
  ends_at: string | null;
  paypal_subscription_id: string;
  cancelled_at: string | null;
}

interface SubscriptionConfig {
  price: number;
  hasActiveSubscription: boolean;
  subscription: WalletSubscription | null;
  clientId: string | null;
  isSandbox: boolean;
}

export function useWalletSubscription() {
  const { user } = useAuth();
  const [config, setConfig] = useState<SubscriptionConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  const fetchConfig = useCallback(async () => {
    if (!user) {
      setLoading(false);
      return;
    }

    try {
      const { data, error: invokeError } = await supabase.functions.invoke("paypal-subscription", {
        body: { action: "get-config" },
      });

      if (invokeError) throw new Error(invokeError.message);
      setConfig(data as SubscriptionConfig);
      setError(null);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchConfig();
  }, [fetchConfig]);

  // Check URL params for subscription return
  useEffect(() => {
    if (!user) return;
    const params = new URLSearchParams(window.location.search);
    const subscriptionResult = params.get("subscription");
    const subId = params.get("subscription_id");

    if (subscriptionResult === "success" && subId) {
      // Activate subscription
      activateSubscription(subId).then(() => {
        // Clean URL
        const url = new URL(window.location.href);
        url.searchParams.delete("subscription");
        url.searchParams.delete("subscription_id");
        url.searchParams.delete("ba_token");
        url.searchParams.delete("token");
        window.history.replaceState({}, "", url.pathname);
      });
    } else if (subscriptionResult === "success") {
      // Try to activate pending subscription
      checkPendingSubscription();
    }
  }, [user]);

  const checkPendingSubscription = async () => {
    if (!user) return;
    // Check for any pending subscriptions and try to activate them
    const { data } = await supabase
      .from("wallet_subscriptions")
      .select("paypal_subscription_id")
      .eq("user_id", user.id)
      .eq("status", "pending")
      .order("created_at", { ascending: false })
      .limit(1);

    if (data && data.length > 0) {
      await activateSubscription(data[0].paypal_subscription_id);
    }
  };

  const subscribe = useCallback(async () => {
    if (!user) return;
    setActionLoading(true);

    try {
      const returnUrl = `${window.location.origin}/wallet?subscription=success`;
      const cancelUrl = `${window.location.origin}/wallet?subscription=cancelled`;

      const { data, error: invokeError } = await supabase.functions.invoke("paypal-subscription", {
        body: {
          action: "create-subscription",
          returnUrl,
          cancelUrl,
        },
      });

      if (invokeError) throw new Error(invokeError.message);

      if (data?.approvalUrl) {
        window.location.href = data.approvalUrl;
      } else {
        throw new Error("No approval URL received");
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setActionLoading(false);
    }
  }, [user]);

  const activateSubscription = useCallback(async (subscriptionId: string) => {
    setActionLoading(true);
    try {
      const { data, error: invokeError } = await supabase.functions.invoke("paypal-subscription", {
        body: { action: "activate-subscription", subscriptionId },
      });

      if (invokeError) throw new Error(invokeError.message);

      if (data?.success) {
        await fetchConfig();
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setActionLoading(false);
    }
  }, [fetchConfig]);

  const cancelSubscription = useCallback(async () => {
    if (!config?.subscription?.paypal_subscription_id) return;
    setActionLoading(true);

    try {
      const { data, error: invokeError } = await supabase.functions.invoke("paypal-subscription", {
        body: {
          action: "cancel-subscription",
          subscriptionId: config.subscription.paypal_subscription_id,
        },
      });

      if (invokeError) throw new Error(invokeError.message);

      if (data?.success) {
        await fetchConfig();
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setActionLoading(false);
    }
  }, [config, fetchConfig]);

  return {
    config,
    loading,
    error,
    actionLoading,
    subscribe,
    cancelSubscription,
    refetch: fetchConfig,
    isActive: config?.hasActiveSubscription ?? false,
  };
}
