import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { RequireAuth, EmptyState, CardSkeleton, ErrorState } from "@/components/StateHelpers";
import { useWallet, useWalletTransactions, useProfile } from "@/hooks/use-supabase-data";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

const WalletContent = () => {
  const { user } = useAuth();
  const { data: wallet, loading: walletLoading, error: walletError, refetch: refetchWallet } = useWallet();
  const { data: transactions, loading: txLoading, refetch: refetchTx } = useWalletTransactions();
  const { data: profile } = useProfile();
  const [contributionAmount, setContributionAmount] = useState("");
  const [contributing, setContributing] = useState(false);

  const quickAmounts = [25, 50, 100];

  const handleContribute = async () => {
    const amt = parseFloat(contributionAmount);
    if (!amt || amt <= 0 || !user) return;
    setContributing(true);
    const { error } = await supabase.from("wallet_transactions").insert({
      user_id: user.id,
      amount: amt,
      type: "one-time",
      status: "completed",
    });
    setContributing(false);
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Contribution successful!", description: `$${amt.toFixed(2)} added to your wallet.` });
      setContributionAmount("");
      refetchWallet();
      refetchTx();
    }
  };

  if (walletLoading) return (
    <div className="section-padding min-h-screen"><div className="container mx-auto max-w-4xl space-y-6">
      <CardSkeleton /><CardSkeleton /><CardSkeleton />
    </div></div>
  );

  if (walletError) return (
    <div className="section-padding min-h-screen"><div className="container mx-auto max-w-4xl">
      <ErrorState message={walletError} onRetry={refetchWallet} />
    </div></div>
  );

  if (!wallet) return (
    <div className="section-padding min-h-screen"><div className="container mx-auto max-w-4xl">
      <EmptyState icon="💰" title="No wallet found" description="Your wallet hasn't been set up yet. Please contact support." />
    </div></div>
  );

  const balance = Number(wallet.balance);
  const goalAmount = Number(wallet.goal_amount);
  const remaining = Math.max(goalAmount - balance, 0);
  const progress = goalAmount > 0 ? Math.min((balance / goalAmount) * 100, 100) : 0;
  const contributionCount = transactions?.length ?? 0;

  const weeksToGoal = (weekly: number) => remaining <= 0 ? 0 : Math.ceil(remaining / weekly);

  return (
    <div className="section-padding min-h-screen">
      <div className="container mx-auto max-w-4xl">
        <div className="mb-8">
          <h1 className="text-3xl md:text-4xl font-bold mb-2">My Hajj Wallet</h1>
          <p className="text-muted-foreground">Track your progress toward your sacred journey</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
          <div className="bg-card rounded-xl card-shadow p-6">
            <p className="text-sm text-muted-foreground mb-1">Current Balance</p>
            <p className="text-3xl font-bold text-primary">${balance.toLocaleString(undefined, { minimumFractionDigits: 2 })}</p>
            <p className="text-xs text-muted-foreground mt-1">{contributionCount} contributions made</p>
          </div>
          <div className="bg-card rounded-xl card-shadow p-6">
            <p className="text-sm text-muted-foreground mb-1">Goal Amount</p>
            <p className="text-3xl font-bold">${goalAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}</p>
            <p className="text-xs text-muted-foreground mt-1">${remaining.toLocaleString(undefined, { minimumFractionDigits: 2 })} remaining</p>
          </div>
          <div className="bg-card rounded-xl card-shadow p-6">
            <p className="text-sm text-muted-foreground mb-1">Membership</p>
            <p className="text-3xl font-bold capitalize">{profile?.membership_status ?? "—"}</p>
            <div className="flex items-center gap-2 mt-1">
              <p className="text-xs text-muted-foreground">Tier: {profile?.tier ?? "—"}</p>
              {profile?.membership_status === "active" && (
                <Badge className="bg-primary text-primary-foreground border-0 text-[10px]">Active</Badge>
              )}
            </div>
          </div>
        </div>

        {/* Savings Progress */}
        <div className="bg-card rounded-xl card-shadow p-6 mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">Savings Progress</h2>
            <span className="text-sm text-primary font-medium">
              {progress.toFixed(1)}% of goal reached
            </span>
          </div>
          <Progress value={progress} className="h-3 mb-2" />
          <div className="flex justify-between text-xs text-muted-foreground mb-6">
            <span>$0</span><span>${goalAmount.toLocaleString()}</span>
          </div>
          {remaining > 0 && (
            <div className="grid grid-cols-3 gap-4 text-sm">
              {[50, 100, 200].map((w) => (
                <div key={w} className="bg-secondary rounded-lg p-3 text-center">
                  <p className="text-muted-foreground">At ${w}/week</p>
                  <p className="font-semibold text-primary">{weeksToGoal(w)} weeks</p>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Contribute */}
        <div className="bg-card rounded-xl card-shadow p-6 mb-8">
          <h2 className="text-lg font-semibold mb-1">Make a Contribution</h2>
          <p className="text-sm text-muted-foreground mb-4">Add funds to your Hajj savings wallet</p>
          <div className="flex gap-2 mb-3">
            {quickAmounts.map((amt) => (
              <Button key={amt} variant={contributionAmount === String(amt) ? "default" : "outline"} size="sm" onClick={() => setContributionAmount(String(amt))}>
                ${amt}
              </Button>
            ))}
          </div>
          <div className="flex gap-3">
            <Input type="number" placeholder="Custom amount ($)" value={contributionAmount} onChange={(e) => setContributionAmount(e.target.value)} className="flex-1" />
            <Button onClick={handleContribute} disabled={!contributionAmount || contributing}>
              {contributing ? "Processing..." : "Contribute Now"}
            </Button>
          </div>
          <div className="bg-secondary rounded-lg p-4 mt-4 text-sm text-muted-foreground">
            💡 <strong>Tip:</strong> Set up recurring contributions to reach your goal faster!
          </div>
        </div>

        {/* Recent Contributions */}
        <div className="mb-4"><h2 className="text-lg font-semibold">Recent Contributions</h2></div>

        {txLoading ? <CardSkeleton /> : !transactions || transactions.length === 0 ? (
          <EmptyState icon="💰" title="No contributions yet" description="Make your first contribution to start your Hajj savings journey!" actionLabel="Make a Contribution" onAction={() => setContributionAmount("50")} />
        ) : (
          <div className="bg-card rounded-xl card-shadow overflow-hidden mb-4">
            {transactions.map((tx, i) => (
              <div key={tx.id} className={`flex items-center justify-between px-6 py-4 ${i < transactions.length - 1 ? "border-b" : ""}`}>
                <div>
                  <p className="font-semibold text-primary">+${Number(tx.amount).toLocaleString()}</p>
                  <p className="text-sm text-muted-foreground">{new Date(tx.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}</p>
                </div>
                <Badge variant={tx.type === "recurring" ? "default" : "secondary"} className="text-xs">
                  {tx.type === "recurring" ? "Recurring" : "One-time"}
                </Badge>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

const Wallet = () => (
  <RequireAuth>
    <WalletContent />
  </RequireAuth>
);

export default Wallet;
