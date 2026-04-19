import { useState, useEffect, useCallback } from "react";
import SEOHead from "@/components/SEOHead";
import MfaChallenge from "@/components/MfaChallenge";
import { useNavigate, useSearchParams } from "react-router-dom";
import logoImg from "@/assets/logo.png";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { processReferralCode } from "@/hooks/use-referral";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/hooks/use-toast";
import { motion } from "framer-motion";
import { Gift, Crown, Loader2, CreditCard, CheckCircle2 } from "lucide-react";

const Auth = () => {
  const { signIn, signUp, user, returnTo } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [loading, setLoading] = useState(false);
  const [forgotMode, setForgotMode] = useState(false);
  const [resetEmail, setResetEmail] = useState("");
  const [resetLoading, setResetLoading] = useState(false);
  const [mfaFactorId, setMfaFactorId] = useState<string | null>(null);
  const refCode = searchParams.get("ref") || "";

  // Subscription gate state (shown after registration / when logged-in user has no sub)
  const [showSubGate, setShowSubGate] = useState(false);
  const [checkingSub, setCheckingSub] = useState(false);
  const [subscribing, setSubscribing] = useState(false);
  const [activating, setActivating] = useState(false);

  const handleForgotPassword = async () => {
    if (!resetEmail.trim()) return;
    setResetLoading(true);
    const { error } = await supabase.auth.resetPasswordForEmail(resetEmail, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    setResetLoading(false);
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Reset link sent!", description: "Check your email for the password reset link." });
      setForgotMode(false);
    }
  };

  const checkSubscription = useCallback(async () => {
    setCheckingSub(true);
    try {
      const { data, error } = await supabase.functions.invoke("paypal-subscription", {
        body: { action: "get-config" },
      });
      if (error) throw error;
      return data?.hasActiveSubscription === true;
    } catch (err) {
      console.error("Subscription check error:", err);
      return false;
    } finally {
      setCheckingSub(false);
    }
  }, []);

  // When a user is logged in: only proceed to wallet if they have an active subscription.
  // Otherwise, show the inline subscription gate on this same page.
  useEffect(() => {
    if (!user) return;
    const params = new URLSearchParams(window.location.search);
    const result = params.get("subscription");
    const subId = params.get("subscription_id");

    // Returning from PayPal approval
    if (result === "success" && subId) {
      (async () => {
        setActivating(true);
        try {
          const { data, error } = await supabase.functions.invoke("paypal-subscription", {
            body: { action: "activate-subscription", subscriptionId: subId },
          });
          if (error) throw error;
          if (data?.success) {
            toast({ title: "✅ সাবস্ক্রিপশন সক্রিয়!", description: "আপনার অ্যাকাউন্ট সম্পূর্ণ সক্রিয় হয়েছে।" });
            navigate(returnTo || "/wallet", { replace: true });
            return;
          }
          throw new Error("Activation failed");
        } catch (err: any) {
          toast({ title: "Activation Error", description: err.message, variant: "destructive" });
          setShowSubGate(true);
        } finally {
          setActivating(false);
        }
      })();
      return;
    }

    if (result === "cancelled") {
      toast({ title: "পেমেন্ট বাতিল হয়েছে", description: "একাউন্ট সক্রিয় করতে সাবস্ক্রিপশন প্রয়োজন।", variant: "destructive" });
      setShowSubGate(true);
      return;
    }

    // Normal logged-in arrival: verify subscription before allowing navigation
    (async () => {
      const ok = await checkSubscription();
      if (ok) {
        navigate(returnTo || "/wallet", { replace: true });
      } else {
        setShowSubGate(true);
      }
    })();
  }, [user, navigate, returnTo, checkSubscription]);

  const startSubscription = async () => {
    setSubscribing(true);
    try {
      const returnUrl = `${window.location.origin}/auth?subscription=success`;
      const cancelUrl = `${window.location.origin}/auth?subscription=cancelled`;

      const { data: subData, error: subError } = await supabase.functions.invoke("paypal-subscription", {
        body: { action: "create-subscription", returnUrl, cancelUrl },
      });

      if (subError) throw subError;

      if (subData?.approvalUrl) {
        window.location.href = subData.approvalUrl;
        return;
      }
      throw new Error("No approval URL received");
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
      setSubscribing(false);
    }
  };

  const handleLogin = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    const form = new FormData(e.currentTarget);
    const { error } = await signIn(form.get("email") as string, form.get("password") as string);
    setLoading(false);
    if (error) {
      toast({ title: "Login failed", description: error.message, variant: "destructive" });
      return;
    }

    // Check if MFA is required
    const { data: factors } = await supabase.auth.mfa.listFactors();
    const verifiedFactors = factors?.totp.filter((f) => f.status === "verified") || [];
    if (verifiedFactors.length > 0) {
      setMfaFactorId(verifiedFactors[0].id);
      return;
    }

    toast({ title: "Welcome back!" });
    // The user effect above will check subscription and either navigate or show the gate.
  };

  const handleRegister = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    const form = new FormData(e.currentTarget);
    const referralInput = (form.get("referral_code") as string || "").trim();
    const { error, data } = await signUp(
      form.get("email") as string,
      form.get("password") as string,
      form.get("name") as string,
      form.get("phone") as string
    );
    if (error) {
      setLoading(false);
      toast({ title: "Registration failed", description: error.message, variant: "destructive" });
      return;
    }

    // Auto-confirm user email via edge function
    const userId = data?.user?.id;
    if (userId) {
      try {
        await supabase.functions.invoke("confirm-user", { body: { user_id: userId } });
      } catch (_) { /* silent fallback */ }
    }
    if (referralInput) {
      localStorage.setItem("pending_referral_code", referralInput.toUpperCase());
    }

    toast({ title: "অ্যাকাউন্ট তৈরি হয়েছে!", description: "এখন $15 সাবস্ক্রিপশন পেমেন্ট সম্পন্ন করুন।" });
    setShowSubGate(true);
    setLoading(false);

    // Immediately redirect to PayPal — subscription is mandatory
    await startSubscription();
  };

  // Process pending referral after login
  useEffect(() => {
    if (!user) return;
    const pendingCode = localStorage.getItem("pending_referral_code");
    if (pendingCode) {
      localStorage.removeItem("pending_referral_code");
      processReferralCode(pendingCode, user.id).then((success) => {
        if (success) {
          toast({ title: "🎁 Referral bonus!", description: "You earned 25 bonus points for using a referral code!" });
        }
      });
    }
  }, [user]);

  if (mfaFactorId) {
    return (
      <MfaChallenge
        factorId={mfaFactorId}
        onSuccess={() => {
          toast({ title: "Welcome back!" });
          setMfaFactorId(null);
          // The user effect will check subscription and route accordingly.
        }}
        onCancel={() => {
          setMfaFactorId(null);
          supabase.auth.signOut();
        }}
      />
    );
  }

  // Activating subscription after PayPal return
  if (activating) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-3">
          <Loader2 className="h-10 w-10 animate-spin text-primary mx-auto" />
          <p className="text-muted-foreground">সাবস্ক্রিপশন সক্রিয় করা হচ্ছে...</p>
        </div>
      </div>
    );
  }

  // Logged in but no active subscription — show mandatory subscription gate
  if (user && showSubGate) {
    return (
      <div className="section-padding min-h-screen flex items-center justify-center">
        <SEOHead title="Activate Subscription" description="Complete your $15/month subscription to activate your Hajj Wallet account." noindex />
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-md text-center"
        >
          <div className="bg-card rounded-xl card-shadow p-8 space-y-6">
            <img src={logoImg} alt="Hajj Wallet" className="h-16 w-16 mx-auto object-contain" />
            <div className="flex items-center justify-center gap-2 text-primary text-sm">
              <CheckCircle2 className="h-4 w-4" />
              <span>অ্যাকাউন্ট তৈরি হয়েছে</span>
            </div>
            <div>
              <Crown className="h-12 w-12 text-primary mx-auto mb-3" />
              <h2 className="text-xl font-bold">সাবস্ক্রিপশন সক্রিয় করুন</h2>
              <p className="text-muted-foreground mt-2 text-sm">
                আপনার অ্যাকাউন্ট ব্যবহার শুরু করতে $15 মাসিক সাবস্ক্রিপশন বাধ্যতামূলক।
                পেমেন্ট সম্পন্ন না হওয়া পর্যন্ত কোনো ফিচার ব্যবহার করা যাবে না।
              </p>
            </div>

            <div className="bg-primary/5 rounded-lg p-4 border border-primary/20">
              <div className="flex items-center justify-center gap-2 mb-2">
                <CreditCard className="h-5 w-5 text-primary" />
                <span className="font-semibold text-lg">$15/মাস</span>
              </div>
              <p className="text-xs text-muted-foreground">
                PayPal দিয়ে নিরাপদ পেমেন্ট • যেকোনো সময় বাতিল করা যাবে
              </p>
            </div>

            <Button
              onClick={startSubscription}
              disabled={subscribing || checkingSub}
              className="w-full"
              size="lg"
            >
              {subscribing ? (
                <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> PayPal-এ রিডাইরেক্ট করা হচ্ছে...</>
              ) : (
                <><Crown className="h-4 w-4 mr-2" /> সাবস্ক্রাইব করুন - $15/মাস</>
              )}
            </Button>

            <button
              onClick={async () => {
                await supabase.auth.signOut();
                setShowSubGate(false);
              }}
              className="text-xs text-muted-foreground hover:text-foreground underline block w-full"
            >
              সাইন আউট করুন
            </button>
          </div>
        </motion.div>
      </div>
    );
  }

  // Logged-in user, checking subscription — show loader to prevent form flash
  if (user && checkingSub) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="section-padding min-h-screen flex items-center justify-center">
      <SEOHead title="Sign In or Create Account" description="Join Hajj Wallet to save for Hajj, access community features, and book packages." noindex />
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, type: "spring", stiffness: 200, damping: 20 }}
        className="w-full max-w-md"
      >
        <div className="text-center mb-8">
          <motion.span
            className="text-4xl inline-block"
            animate={{ rotate: [0, -5, 5, 0] }}
            transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
          >
            <img src={logoImg} alt="Hajj Wallet" className="h-16 w-16 object-contain" />
          </motion.span>
          <h1 className="text-2xl font-bold mt-3">Welcome to Hajj Wallet</h1>
          <p className="text-muted-foreground mt-1">Start your sacred journey today</p>
        </div>

        <div className="bg-card rounded-xl card-shadow p-6">
          {refCode && (
            <div className="mb-4 p-3 rounded-lg bg-primary/10 border border-primary/20 flex items-center gap-2">
              <Gift className="h-4 w-4 text-primary shrink-0" />
              <p className="text-sm text-primary font-medium">You've been referred! Sign up to earn <strong>25 bonus points</strong>.</p>
            </div>
          )}
          <Tabs defaultValue={refCode ? "register" : "login"}>
            <TabsList className="w-full">
              <TabsTrigger value="login" className="flex-1">Login</TabsTrigger>
              <TabsTrigger value="register" className="flex-1">Register</TabsTrigger>
            </TabsList>

            <TabsContent value="login">
              <form onSubmit={handleLogin} className="space-y-4 mt-4">
                <div className="space-y-2">
                  <Label htmlFor="login-email">Email</Label>
                  <Input id="login-email" name="email" type="email" placeholder="you@example.com" required />
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="login-password">Password</Label>
                    <button
                      type="button"
                      onClick={() => setForgotMode(true)}
                      className="text-xs text-primary hover:underline"
                    >
                      Forgot Password?
                    </button>
                  </div>
                  <Input id="login-password" name="password" type="password" placeholder="••••••••" required minLength={8} />
                </div>
                <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                  <Button type="submit" className="w-full" disabled={loading}>
                    {loading ? "Signing in..." : "Sign In"}
                  </Button>
                </motion.div>
              </form>

              {/* Forgot Password Modal */}
              {forgotMode && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mt-4 p-4 rounded-xl bg-secondary/50 border border-border space-y-3"
                >
                  <h3 className="font-semibold text-sm">Reset Password</h3>
                  <p className="text-xs text-muted-foreground">Enter your email and we'll send you a reset link.</p>
                  <Input
                    type="email"
                    placeholder="you@example.com"
                    value={resetEmail}
                    onChange={(e) => setResetEmail(e.target.value)}
                  />
                  <div className="flex gap-2">
                    <Button size="sm" onClick={handleForgotPassword} disabled={resetLoading || !resetEmail.trim()}>
                      {resetLoading ? "Sending..." : "Send Reset Link"}
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => setForgotMode(false)}>
                      Cancel
                    </Button>
                  </div>
                </motion.div>
              )}
            </TabsContent>

            <TabsContent value="register">
              <form onSubmit={handleRegister} className="space-y-4 mt-4">
                <div className="space-y-2">
                  <Label htmlFor="reg-name">Full Name</Label>
                  <Input id="reg-name" name="name" placeholder="Your full name" required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="reg-email">Email</Label>
                  <Input id="reg-email" name="email" type="email" placeholder="you@example.com" required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="reg-phone">Phone Number</Label>
                  <Input id="reg-phone" name="phone" type="tel" placeholder="+1 (555) 000-0000" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="reg-password">Password</Label>
                  <Input id="reg-password" name="password" type="password" placeholder="Min 8 characters" required minLength={8} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="reg-referral" className="flex items-center gap-1.5">
                    <Gift className="h-3.5 w-3.5 text-primary" /> Referral Code <span className="text-xs text-muted-foreground">(optional)</span>
                  </Label>
                  <Input id="reg-referral" name="referral_code" placeholder="e.g. ABC12345" defaultValue={refCode} className="uppercase" />
                </div>
                <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                  <Button type="submit" className="w-full" disabled={loading}>
                    {loading ? "Creating account..." : "Create Account"}
                  </Button>
                </motion.div>
              </form>
            </TabsContent>
          </Tabs>

        </div>
      </motion.div>
    </div>
  );
};

export default Auth;
