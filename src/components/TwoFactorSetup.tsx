import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/hooks/use-toast";
import { Shield, ShieldCheck, ShieldOff, Loader2, Copy, QrCode } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";

const TwoFactorSetup = () => {
  const [mfaEnabled, setMfaEnabled] = useState(false);
  const [loading, setLoading] = useState(true);
  const [enrolling, setEnrolling] = useState(false);
  const [qrCode, setQrCode] = useState<string | null>(null);
  const [secret, setSecret] = useState<string | null>(null);
  const [factorId, setFactorId] = useState<string | null>(null);
  const [verifyCode, setVerifyCode] = useState("");
  const [verifying, setVerifying] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [disabling, setDisabling] = useState(false);

  useEffect(() => {
    checkMfaStatus();
  }, []);

  const checkMfaStatus = async () => {
    setLoading(true);
    const { data, error } = await supabase.auth.mfa.listFactors();
    if (!error && data) {
      const verified = data.totp.filter((f) => f.status === "verified");
      setMfaEnabled(verified.length > 0);
      if (verified.length > 0) {
        setFactorId(verified[0].id);
      }
    }
    setLoading(false);
  };

  const handleEnroll = async () => {
    setEnrolling(true);
    // Unenroll any unverified factors first
    const { data: factors } = await supabase.auth.mfa.listFactors();
    if (factors) {
      for (const f of factors.totp.filter((f) => f.status === "unverified")) {
        await supabase.auth.mfa.unenroll({ factorId: f.id });
      }
    }

    const { data, error } = await supabase.auth.mfa.enroll({
      factorType: "totp",
      friendlyName: "Authenticator App",
    });
    setEnrolling(false);

    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
      return;
    }

    if (data) {
      setQrCode(data.totp.qr_code);
      setSecret(data.totp.secret);
      setFactorId(data.id);
      setDialogOpen(true);
    }
  };

  const handleVerify = async () => {
    if (!factorId || verifyCode.length !== 6) return;
    setVerifying(true);

    const { data: challenge, error: challengeErr } = await supabase.auth.mfa.challenge({
      factorId,
    });

    if (challengeErr) {
      setVerifying(false);
      toast({ title: "Error", description: challengeErr.message, variant: "destructive" });
      return;
    }

    const { error: verifyErr } = await supabase.auth.mfa.verify({
      factorId,
      challengeId: challenge.id,
      code: verifyCode,
    });

    setVerifying(false);
    if (verifyErr) {
      toast({ title: "Invalid code", description: "Please check the code and try again.", variant: "destructive" });
    } else {
      toast({ title: "2FA Enabled!", description: "Two-factor authentication is now active on your account." });
      setMfaEnabled(true);
      setDialogOpen(false);
      setQrCode(null);
      setSecret(null);
      setVerifyCode("");
    }
  };

  const handleDisable = async () => {
    if (!factorId) return;
    if (!confirm("Are you sure you want to disable 2FA? This will make your account less secure.")) return;
    setDisabling(true);
    const { error } = await supabase.auth.mfa.unenroll({ factorId });
    setDisabling(false);
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "2FA Disabled", description: "Two-factor authentication has been removed." });
      setMfaEnabled(false);
      setFactorId(null);
    }
  };

  const copySecret = () => {
    if (secret) {
      navigator.clipboard.writeText(secret);
      toast({ title: "Secret copied!" });
    }
  };

  if (loading) {
    return (
      <div className="bg-card rounded-xl card-shadow p-6">
        <div className="flex items-center gap-2">
          <Loader2 className="h-4 w-4 animate-spin" />
          <span className="text-sm text-muted-foreground">Loading 2FA status...</span>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="bg-card rounded-xl card-shadow p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-lg ${mfaEnabled ? "bg-emerald-500/15" : "bg-muted"}`}>
              {mfaEnabled ? (
                <ShieldCheck className="h-5 w-5 text-emerald-500" />
              ) : (
                <Shield className="h-5 w-5 text-muted-foreground" />
              )}
            </div>
            <div>
              <h3 className="font-semibold flex items-center gap-2">
                Two-Factor Authentication
                {mfaEnabled ? (
                  <Badge className="bg-emerald-500/15 text-emerald-600 border-0 text-xs">Active</Badge>
                ) : (
                  <Badge variant="outline" className="text-xs">Inactive</Badge>
                )}
              </h3>
              <p className="text-xs text-muted-foreground">
                {mfaEnabled
                  ? "Your account is protected with an authenticator app."
                  : "Add an extra layer of security to your account."}
              </p>
            </div>
          </div>
        </div>

        {mfaEnabled ? (
          <Button variant="outline" size="sm" onClick={handleDisable} disabled={disabling} className="gap-2 text-destructive hover:text-destructive">
            {disabling ? <Loader2 className="h-4 w-4 animate-spin" /> : <ShieldOff className="h-4 w-4" />}
            Disable 2FA
          </Button>
        ) : (
          <Button size="sm" onClick={handleEnroll} disabled={enrolling} className="gap-2">
            {enrolling ? <Loader2 className="h-4 w-4 animate-spin" /> : <Shield className="h-4 w-4" />}
            Enable 2FA
          </Button>
        )}
      </div>

      {/* Enrollment Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <QrCode className="h-5 w-5 text-primary" /> Set Up Two-Factor Authentication
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Scan this QR code with your authenticator app (Google Authenticator, Authy, etc.)
            </p>

            {qrCode && (
              <div className="flex justify-center p-4 bg-white rounded-xl">
                <img src={qrCode} alt="2FA QR Code" className="w-48 h-48" />
              </div>
            )}

            {secret && (
              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground">Or enter this code manually:</Label>
                <div className="flex items-center gap-2">
                  <code className="flex-1 bg-muted px-3 py-2 rounded-lg text-xs font-mono break-all">
                    {secret}
                  </code>
                  <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0" onClick={copySecret}>
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}

            <div className="space-y-2">
              <Label>Enter the 6-digit code from your app</Label>
              <Input
                value={verifyCode}
                onChange={(e) => setVerifyCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                placeholder="000000"
                className="text-center text-2xl font-mono tracking-[0.5em] h-14"
                maxLength={6}
                autoFocus
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleVerify} disabled={verifying || verifyCode.length !== 6} className="gap-2">
              {verifying ? <Loader2 className="h-4 w-4 animate-spin" /> : <ShieldCheck className="h-4 w-4" />}
              Verify & Enable
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default TwoFactorSetup;
