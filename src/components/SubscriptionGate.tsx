import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { motion } from "framer-motion";
import { Crown, Loader2, CreditCard } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";
import logoImg from "@/assets/logo.png";

interface SubscriptionGateProps {
  children: React.ReactNode;
}

const SubscriptionGate = ({ children }: SubscriptionGateProps) => {
  const { user, loading: authLoading } = useAuth();
  const [hasSubscription, setHasSubscription] = useState<boolean | null>(null);
  const [checking, setChecking] = useState(true);
  const [subscribing, setSubscribing] = useState(false);

  const checkSubscription = useCallback(async () => {
    if (!user) {
      setChecking(false);
      return;
    }

    try {
      const { data, error } = await supabase.functions.invoke("paypal-subscription", {
        body: { action: "get-config" },
      });

      if (error) throw error;
      setHasSubscription(data?.hasActiveSubscription ?? false);
    } catch (err) {
      console.error("Subscription check error:", err);
      setHasSubscription(false);
    } finally {
      setChecking(false);
    }
  }, [user]);

  useEffect(() => {
    checkSubscription();
  }, [checkSubscription]);

  // Handle subscription return URL
  useEffect(() => {
    if (!user) return;
    const params = new URLSearchParams(window.location.search);
    const result = params.get("subscription");
    const subId = params.get("subscription_id");

    if (result === "success" && subId) {
      activateAndRefresh(subId);
    }
  }, [user]);

  const activateAndRefresh = async (subscriptionId: string) => {
    try {
      const { data, error } = await supabase.functions.invoke("paypal-subscription", {
        body: { action: "activate-subscription", subscriptionId },
      });

      if (error) throw error;
      if (data?.success) {
        toast({ title: "✅ Subscription activated!", description: "Your account is now fully active." });
        setHasSubscription(true);
        // Clean URL
        const url = new URL(window.location.href);
        url.searchParams.delete("subscription");
        url.searchParams.delete("subscription_id");
        url.searchParams.delete("ba_token");
        url.searchParams.delete("token");
        window.history.replaceState({}, "", url.pathname);
      }
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    }
  };

  const handleSubscribe = async () => {
    if (!user) return;
    setSubscribing(true);

    try {
      const returnUrl = `${window.location.origin}${window.location.pathname}?subscription=success`;
      const cancelUrl = `${window.location.origin}${window.location.pathname}?subscription=cancelled`;

      const { data, error } = await supabase.functions.invoke("paypal-subscription", {
        body: { action: "create-subscription", returnUrl, cancelUrl },
      });

      if (error) throw error;

      if (data?.approvalUrl) {
        window.location.href = data.approvalUrl;
      } else {
        throw new Error("No approval URL received");
      }
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setSubscribing(false);
    }
  };

  // Not logged in or still loading - render children (other guards handle auth)
  if (authLoading || !user) return <>{children}</>;

  // Still checking subscription
  if (checking) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // Has active subscription - render children
  if (hasSubscription) return <>{children}</>;

  // No subscription - show gate
  return (
    <div className="min-h-screen flex items-center justify-center section-padding">
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md text-center"
      >
        <div className="bg-card rounded-xl card-shadow p-8 space-y-6">
          <img src={logoImg} alt="Hajj Wallet" className="h-16 w-16 mx-auto object-contain" />
          <div>
            <Crown className="h-12 w-12 text-primary mx-auto mb-3" />
            <h2 className="text-xl font-bold">Subscription required</h2>
            <p className="text-muted-foreground mt-2 text-sm">
              A mandatory $15 monthly subscription is required to use Hajj Wallet.
              This covers your first month of service.
            </p>
          </div>

          <div className="bg-primary/5 rounded-lg p-4 border border-primary/20">
            <div className="flex items-center justify-center gap-2 mb-2">
              <CreditCard className="h-5 w-5 text-primary" />
              <span className="font-semibold text-lg">$15/month</span>
            </div>
            <p className="text-xs text-muted-foreground">
              Secure payment with PayPal • Cancel anytime
            </p>
          </div>

          <Button
            onClick={handleSubscribe}
            disabled={subscribing}
            className="w-full"
            size="lg"
          >
            {subscribing ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" /> Processing...
              </>
            ) : (
              <>
                <Crown className="h-4 w-4 mr-2" /> Subscribe - $15/month
              </>
            )}
          </Button>

          <p className="text-xs text-muted-foreground">
            Once payment is complete, you will automatically get access to the wallet.
          </p>
        </div>
      </motion.div>
    </div>
  );
};

export default SubscriptionGate;
