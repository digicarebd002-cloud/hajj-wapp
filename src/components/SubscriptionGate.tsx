import { useEffect, useState, useCallback } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { motion } from "framer-motion";
import { Crown, Loader2, Shield, CheckCircle2 } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import logoImg from "@/assets/logo.png";
import PayPalSubscribePlanButton from "@/components/PayPalSubscribePlanButton";

interface SubscriptionGateProps {
  children: React.ReactNode;
}

const SubscriptionGate = ({ children }: SubscriptionGateProps) => {
  const { user, loading: authLoading } = useAuth();
  const [hasSubscription, setHasSubscription] = useState<boolean | null>(null);
  const [checking, setChecking] = useState(true);

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

  const handleApproved = useCallback(
    async (subscriptionId: string) => {
      try {
        const { data, error } = await supabase.functions.invoke("paypal-subscription", {
          body: {
            action: "record-plan-subscription",
            subscriptionId,
            planId: "P-1D83979625931534RNHYMMPQ",
            amount: 15,
          },
        });
        if (error) throw error;
        if (data?.success) {
          toast({
            title: "Subscription activated",
            description: "Your $15/month membership is now active.",
          });
          setHasSubscription(true);
        }
      } catch (err: any) {
        toast({
          title: "Activation failed",
          description: err.message,
          variant: "destructive",
        });
      }
    },
    []
  );

  if (authLoading || !user) return <>{children}</>;

  if (checking) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (hasSubscription) return <>{children}</>;

  return (
    <div className="min-h-screen flex items-center justify-center section-padding">
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md"
      >
        <div className="bg-card rounded-xl card-shadow p-8 space-y-6 text-center">
          <img src={logoImg} alt="Hajj Wallet" className="h-16 w-16 mx-auto object-contain" />
          <div>
            <Crown className="h-12 w-12 text-primary mx-auto mb-3" />
            <h2 className="text-xl font-bold">Subscription required</h2>
            <p className="text-muted-foreground mt-2 text-sm">
              A mandatory $15/month subscription is required to use Hajj Wallet.
              Subscribe with PayPal to continue.
            </p>
          </div>

          <div className="bg-primary/5 rounded-lg p-4 border border-primary/20">
            <p className="font-semibold text-lg">$15.00 / month</p>
            <p className="text-xs text-muted-foreground mt-1">
              Auto-renews monthly • Cancel anytime
            </p>
          </div>

          <PayPalSubscribePlanButton onApproved={handleApproved} />

          <div className="flex items-center justify-center gap-4 text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <Shield className="h-3 w-3 text-primary" /> Secure via PayPal
            </span>
            <span className="flex items-center gap-1">
              <CheckCircle2 className="h-3 w-3 text-primary" /> Cancel anytime
            </span>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default SubscriptionGate;
