import { useState, useEffect } from "react";
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
import { Gift } from "lucide-react";

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

  // Redirect if already logged in
  useEffect(() => {
    if (user) {
      navigate(returnTo || "/account", { replace: true });
    }
  }, [user, navigate, returnTo]);

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
    navigate(returnTo || "/account", { replace: true });
  };

  if (mfaFactorId) {
    return (
      <MfaChallenge
        factorId={mfaFactorId}
        onSuccess={() => {
          toast({ title: "Welcome back!" });
          navigate(returnTo || "/account", { replace: true });
        }}
        onCancel={() => {
          setMfaFactorId(null);
          supabase.auth.signOut();
        }}
      />
    );
  }

  const handleRegister = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    const form = new FormData(e.currentTarget);
    const referralInput = (form.get("referral_code") as string || "").trim();
    const { error } = await signUp(
      form.get("email") as string,
      form.get("password") as string,
      form.get("name") as string,
      form.get("phone") as string
    );
    setLoading(false);
    if (error) {
      toast({ title: "Registration failed", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Account created!", description: "Check your email to confirm your account." });
      // Store referral code to process after email confirmation
      if (referralInput) {
        localStorage.setItem("pending_referral_code", referralInput.toUpperCase());
      }
    }
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
            <img src={logoImg} alt="Hajj Wallet" className="h-14 w-14 rounded-lg object-contain" />
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
                  <Input id="login-password" name="password" type="password" placeholder="••••••••" required />
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
                  <Input id="reg-password" name="password" type="password" placeholder="Min 6 characters" required minLength={6} />
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
