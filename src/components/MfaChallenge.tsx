import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "@/hooks/use-toast";
import { Shield, Loader2, ArrowLeft } from "lucide-react";
import logoImg from "@/assets/logo.png";

interface MfaChallengeProps {
  factorId: string;
  onSuccess: () => void;
  onCancel: () => void;
}

const MfaChallenge = ({ factorId, onSuccess, onCancel }: MfaChallengeProps) => {
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);

  const handleVerify = async () => {
    if (code.length !== 6) return;
    setLoading(true);

    const { data: challenge, error: challengeErr } = await supabase.auth.mfa.challenge({
      factorId,
    });

    if (challengeErr) {
      setLoading(false);
      toast({ title: "Error", description: challengeErr.message, variant: "destructive" });
      return;
    }

    const { error: verifyErr } = await supabase.auth.mfa.verify({
      factorId,
      challengeId: challenge.id,
      code,
    });

    setLoading(false);
    if (verifyErr) {
      toast({ title: "Invalid code", description: "Please try again.", variant: "destructive" });
      setCode("");
    } else {
      onSuccess();
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center section-padding">
      <div className="w-full max-w-sm mx-auto space-y-6">
        <div className="text-center">
          <img src={logoImg} alt="Logo" className="h-12 mx-auto mb-4" />
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 text-primary text-sm font-medium mb-3">
            <Shield className="h-4 w-4" /> Two-Factor Authentication
          </div>
          <h1 className="text-2xl font-bold mb-1">Verify Your Identity</h1>
          <p className="text-sm text-muted-foreground">
            Enter the 6-digit code from your authenticator app.
          </p>
        </div>

        <div className="bg-card rounded-xl card-shadow p-6 space-y-4">
          <div className="space-y-2">
            <Label>Authentication Code</Label>
            <Input
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
              placeholder="000000"
              className="text-center text-2xl font-mono tracking-[0.5em] h-14"
              maxLength={6}
              autoFocus
              onKeyDown={(e) => e.key === "Enter" && handleVerify()}
            />
          </div>

          <Button
            onClick={handleVerify}
            disabled={loading || code.length !== 6}
            className="w-full gap-2"
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Shield className="h-4 w-4" />}
            Verify
          </Button>

          <button
            onClick={onCancel}
            className="w-full text-sm text-muted-foreground hover:text-foreground transition-colors flex items-center justify-center gap-1.5"
          >
            <ArrowLeft className="h-3.5 w-3.5" /> Back to login
          </button>
        </div>
      </div>
    </div>
  );
};

export default MfaChallenge;
