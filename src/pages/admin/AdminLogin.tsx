import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useIsAdmin } from "@/hooks/use-admin";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "@/hooks/use-toast";
import { motion } from "framer-motion";
import { Shield, Lock, Mail, ArrowLeft, Loader2 } from "lucide-react";
import logoImg from "@/assets/logo.png";

const AdminLogin = () => {
  const { signIn, user } = useAuth();
  const { isAdmin, loading: adminLoading } = useIsAdmin();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [forgotMode, setForgotMode] = useState(false);
  const [resetEmail, setResetEmail] = useState("");
  const [resetLoading, setResetLoading] = useState(false);

  // Redirect if already logged in as admin
  useEffect(() => {
    if (!adminLoading && user && isAdmin) {
      navigate("/admin", { replace: true });
    }
  }, [user, isAdmin, adminLoading, navigate]);

  const handleLogin = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    const form = new FormData(e.currentTarget);
    const email = form.get("email") as string;
    const password = form.get("password") as string;

    const { error } = await signIn(email, password);
    if (error) {
      setLoading(false);
      toast({ title: "Login failed", description: error.message, variant: "destructive" });
      return;
    }

    setTimeout(() => setLoading(false), 2000);
  };

  const handleForgotPassword = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!resetEmail.trim()) return;
    setResetLoading(true);
    const { error } = await supabase.auth.resetPasswordForEmail(resetEmail.trim(), {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    setResetLoading(false);
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({
        title: "Reset link sent!",
        description: "If this email is registered, a password reset link has been sent. Check your inbox (and spam folder).",
      });
      setForgotMode(false);
      setResetEmail("");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-secondary/30 to-background p-4">
      <motion.div
        initial={{ opacity: 0, y: 30, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="w-full max-w-md"
      >
        <div className="bg-card rounded-2xl shadow-2xl border border-border/50 overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-primary/10 via-primary/5 to-transparent p-8 text-center border-b border-border/30">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", delay: 0.2 }}
              className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center mx-auto mb-4 shadow-lg shadow-primary/25"
            >
              <Shield className="h-8 w-8 text-primary-foreground" />
            </motion.div>
            <div className="flex items-center justify-center gap-3 mb-2">
              <img src={logoImg} alt="Logo" className="w-12 h-12 object-contain" />
              <h1 className="text-2xl font-bold text-foreground">
                {forgotMode ? "Reset Password" : "Admin Panel"}
              </h1>
            </div>
            <p className="text-sm text-muted-foreground">
              {forgotMode ? "We'll email you a reset link" : "Authorized personnel only"}
            </p>
          </div>

          {/* Form */}
          {forgotMode ? (
            <form onSubmit={handleForgotPassword} className="p-8 space-y-5">
              <div className="space-y-2">
                <Label htmlFor="reset-email" className="text-sm font-medium">Admin Email Address</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="reset-email"
                    type="email"
                    placeholder="admin@example.com"
                    required
                    className="pl-10"
                    autoComplete="email"
                    value={resetEmail}
                    onChange={(e) => setResetEmail(e.target.value)}
                  />
                </div>
                <p className="text-xs text-muted-foreground">
                  Enter the email of your admin account. A reset link will be sent if it exists.
                </p>
              </div>

              <Button type="submit" className="w-full gap-2 rounded-xl" size="lg" disabled={resetLoading}>
                {resetLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Sending...
                  </>
                ) : (
                  <>
                    <Mail className="h-4 w-4" />
                    Send Reset Link
                  </>
                )}
              </Button>

              <button
                type="button"
                onClick={() => {
                  setForgotMode(false);
                  setResetEmail("");
                }}
                className="w-full flex items-center justify-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                <ArrowLeft className="h-3.5 w-3.5" />
                Back to login
              </button>
            </form>
          ) : (
            <form onSubmit={handleLogin} className="p-8 space-y-5">
              <div className="space-y-2">
                <Label htmlFor="admin-email" className="text-sm font-medium">Email Address</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="admin-email"
                    name="email"
                    type="email"
                    placeholder="admin@example.com"
                    required
                    className="pl-10"
                    autoComplete="email"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="admin-password" className="text-sm font-medium">Password</Label>
                  <button
                    type="button"
                    onClick={() => setForgotMode(true)}
                    className="text-xs text-primary hover:underline font-medium"
                  >
                    Forgot password?
                  </button>
                </div>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="admin-password"
                    name="password"
                    type="password"
                    placeholder="••••••••"
                    required
                    className="pl-10"
                    autoComplete="current-password"
                  />
                </div>
              </div>

              <Button type="submit" className="w-full gap-2 rounded-xl" size="lg" disabled={loading}>
                {loading ? (
                  <span className="flex items-center gap-2">
                    <span className="h-4 w-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
                    Verifying...
                  </span>
                ) : (
                  <>
                    <Shield className="h-4 w-4" />
                    Sign In to Admin
                  </>
                )}
              </Button>

              <p className="text-xs text-center text-muted-foreground mt-4">
                This login is restricted to administrators only.
                <br />
                If you're a regular user, please use the{" "}
                <a href="/auth" className="text-primary hover:underline">main login</a>.
              </p>
            </form>
          )}
        </div>
      </motion.div>
    </div>
  );
};

export default AdminLogin;
