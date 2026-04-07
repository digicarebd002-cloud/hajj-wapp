import React, { useState, useEffect } from "react";
import SEOHead from "@/components/SEOHead";
import WalletPublicLanding from "@/components/wallet/WalletPublicLanding";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { RequireAuth, EmptyState, CardSkeleton, ErrorState } from "@/components/StateHelpers";
import { useWalletStats, useWalletTransactions, useProfile } from "@/hooks/use-supabase-data";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { motion } from "framer-motion";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import {
  Wallet as WalletIcon,
  ChevronRight,
  Crown,
  Loader2,
  TrendingUp,
  Target,
  ArrowUpRight,
  ArrowDownRight,
  Plus,
  History,
  Shield,
  CreditCard,
  DollarSign,
  Zap,
  Calendar,
  CheckCircle2,
} from "lucide-react";
import PayPalButton from "@/components/PayPalButton";
import { useWalletSubscription } from "@/hooks/use-wallet-subscription";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 300, damping: 25 } },
};

// --- Hero Balance Card (Fintech style) ---
const BalanceHero = ({ stats, profile }: { stats: any; profile: any }) => {
  const balance = Number(stats.balance);
  const goalAmount = Number(stats.goal_amount);
  const progress = Number(stats.progress_percent) || 0;
  const remaining = Math.max(Number(stats.remaining), 0);

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="relative overflow-hidden rounded-2xl p-8 md:p-10 mb-6"
      style={{
        background: "linear-gradient(135deg, hsl(142, 72%, 32%) 0%, hsl(142, 60%, 22%) 50%, hsl(160, 50%, 14%) 100%)",
      }}
    >
      {/* Subtle pattern overlay */}
      <div
        className="absolute inset-0 opacity-[0.04]"
        style={{
          backgroundImage: `radial-gradient(circle at 1px 1px, white 1px, transparent 0)`,
          backgroundSize: "24px 24px",
        }}
      />

      {/* Top row */}
      <div className="relative z-10 flex items-start justify-between mb-8">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-white/15 backdrop-blur-sm flex items-center justify-center border border-white/10">
            <WalletIcon className="h-6 w-6 text-white" />
          </div>
          <div>
            <p className="text-white/70 text-sm font-medium">Hajj Savings Wallet</p>
            <div className="flex items-center gap-2">
              <span className="text-white/90 text-xs capitalize">{profile?.tier ?? "Silver"} Tier</span>
              {profile?.membership_status === "active" && (
                <span className="inline-flex items-center gap-1 bg-white/15 text-white text-[10px] font-semibold px-2 py-0.5 rounded-full">
                  <CheckCircle2 className="h-3 w-3" /> Active
                </span>
              )}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center">
            <Shield className="h-4 w-4 text-white/70" />
          </div>
        </div>
      </div>

      {/* Balance */}
      <div className="relative z-10 mb-8">
        <p className="text-white/60 text-sm font-medium mb-1 tracking-wide uppercase">Available Balance</p>
        <motion.div
          className="flex items-baseline gap-1"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
        >
          <span className="text-white/60 text-3xl font-light">$</span>
          <span className="text-white text-5xl md:text-6xl font-bold tracking-tight">
            {balance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </span>
        </motion.div>
      </div>

      {/* Goal progress bar */}
      <div className="relative z-10">
        <div className="flex items-center justify-between text-sm mb-2">
          <span className="text-white/60 font-medium">Goal Progress</span>
          <span className="text-white font-semibold">{progress.toFixed(1)}%</span>
        </div>
        <div className="w-full h-2 rounded-full bg-white/10 overflow-hidden">
          <motion.div
            className="h-full rounded-full"
            style={{ background: "linear-gradient(90deg, hsl(45, 93%, 55%), hsl(45, 93%, 47%))" }}
            initial={{ width: 0 }}
            animate={{ width: `${Math.min(progress, 100)}%` }}
            transition={{ delay: 0.5, duration: 1, ease: "easeOut" }}
          />
        </div>
        <div className="flex items-center justify-between text-xs mt-2">
          <span className="text-white/50">${balance.toLocaleString()} saved</span>
          <span className="text-white/50">${goalAmount.toLocaleString()} goal</span>
        </div>
      </div>

      {/* Bottom stats row */}
      <div className="relative z-10 grid grid-cols-3 gap-4 mt-8 pt-6 border-t border-white/10">
        <div>
          <p className="text-white/50 text-xs font-medium mb-1">Contributions</p>
          <p className="text-white text-lg font-bold">{stats.contribution_count ?? 0}</p>
        </div>
        <div>
          <p className="text-white/50 text-xs font-medium mb-1">Remaining</p>
          <p className="text-white text-lg font-bold">${remaining.toLocaleString()}</p>
        </div>
        <div>
          <p className="text-white/50 text-xs font-medium mb-1">Monthly Avg</p>
          <p className="text-white text-lg font-bold">
            ${stats.contribution_count > 0 ? Math.round(balance / Math.max(stats.contribution_count, 1)).toLocaleString() : "0"}
          </p>
        </div>
      </div>
    </motion.div>
  );
};

// --- Quick Actions ---
const QuickActions = ({ onAddMoney, onSetGoal, onHistory }: { onAddMoney: () => void; onSetGoal: () => void; onHistory: () => void }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay: 0.15 }}
    className="grid grid-cols-3 gap-3 mb-6"
  >
    <button
      onClick={onAddMoney}
      className="flex flex-col items-center gap-2 p-4 rounded-xl border transition-all duration-200 bg-primary/5 border-primary/20 hover:bg-primary/10 hover:border-primary/40 cursor-pointer"
    >
      <div className="w-10 h-10 rounded-full flex items-center justify-center bg-primary text-primary-foreground">
        <Plus className="h-5 w-5" />
      </div>
      <span className="text-xs font-semibold text-foreground">Add Money</span>
    </button>
    <button onClick={onSetGoal} className="flex flex-col items-center gap-2 p-4 rounded-xl border border-border bg-card hover:bg-secondary/50 transition-all duration-200 cursor-pointer">
      <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center text-foreground">
        <Target className="h-5 w-5" />
      </div>
      <span className="text-xs font-semibold text-foreground">Set Goal</span>
    </button>
    <button onClick={onHistory} className="flex flex-col items-center gap-2 p-4 rounded-xl border border-border bg-card hover:bg-secondary/50 transition-all duration-200 cursor-pointer">
      <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center text-foreground">
        <History className="h-5 w-5" />
      </div>
      <span className="text-xs font-semibold text-foreground">History</span>
    </button>
  </motion.div>
);

// --- Membership Banner ---
const MembershipBanner = ({
  profile,
  isActive,
  subscription,
  price,
  subLoading,
  actionLoading,
  onSubscribe,
  onCancel,
  subError,
}: {
  profile: any;
  isActive: boolean;
  subscription: any;
  price: number;
  subLoading: boolean;
  actionLoading: boolean;
  onSubscribe: () => void;
  onCancel: () => void;
  subError: string | null;
}) => {
  if (!profile) return null;
  const endsAt = subscription?.ends_at ? new Date(subscription.ends_at) : null;

  if (subLoading) {
    return (
      <div className="bg-card rounded-xl border border-border p-5 mb-6">
        <div className="flex items-center gap-3">
          <Loader2 className="h-5 w-5 animate-spin text-primary" />
          <span className="text-muted-foreground text-sm">Checking membership…</span>
        </div>
      </div>
    );
  }

  if (isActive) {
    const memberSince = subscription?.starts_at
      ? new Date(subscription.starts_at).toLocaleDateString("en-US", { month: "long", year: "numeric" })
      : profile?.created_at
        ? new Date(profile.created_at).toLocaleDateString("en-US", { month: "long", year: "numeric" })
        : "—";

    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="bg-card rounded-xl border border-primary/15 p-6 mb-6"
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
              <Crown className="h-5 w-5 text-primary" />
            </div>
            <h3 className="font-bold text-base">Membership Status</h3>
          </div>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="ghost" size="sm" className="text-xs text-muted-foreground hover:text-destructive" disabled={actionLoading}>
                {actionLoading ? <Loader2 className="h-3 w-3 animate-spin" /> : "Cancel"}
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Cancel Membership?</AlertDialogTitle>
                <AlertDialogDescription>
                  Your membership stays active until{" "}
                  {endsAt?.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" }) || "the end of your billing period"}.
                  You won't be able to add new funds after that.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Keep Membership</AlertDialogCancel>
                <AlertDialogAction onClick={onCancel} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                  Yes, Cancel
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>

        {/* Info grid */}
        <div className="grid grid-cols-2 gap-4 mb-5">
          <div className="bg-secondary/40 rounded-xl p-4">
            <p className="text-xs text-muted-foreground font-medium mb-1">Member Since</p>
            <p className="text-sm font-bold text-foreground">{memberSince}</p>
          </div>
          <div className="bg-secondary/40 rounded-xl p-4">
            <p className="text-xs text-muted-foreground font-medium mb-1">Status</p>
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
              <p className="text-sm font-bold text-primary">Active</p>
            </div>
          </div>
        </div>

        {/* Description + next payment */}
        <p className="text-xs text-muted-foreground mb-4 leading-relaxed">
          Your monthly membership fee of <span className="font-semibold text-foreground">${price.toFixed(2)}</span> supports our community platform and helps sponsor fellow members on their Hajj journey.
        </p>

        <div className="flex items-center justify-between bg-secondary/40 rounded-xl p-4">
          <div>
            <p className="text-xs text-muted-foreground font-medium">Monthly Membership</p>
            <p className="text-lg font-bold text-foreground">${price.toFixed(2)}</p>
          </div>
          {endsAt && (
            <div className="text-right">
              <p className="text-xs text-muted-foreground font-medium">Next payment</p>
              <p className="text-sm font-semibold text-foreground">
                {endsAt.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}
              </p>
            </div>
          )}
        </div>
      </motion.div>
    );
  }

  // Inactive — CTA to subscribe
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2 }}
      className="rounded-xl border-2 border-dashed border-primary/25 p-6 mb-6 bg-primary/[0.02]"
    >
      <div className="flex items-start gap-4">
        <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
          <Zap className="h-6 w-6 text-primary" />
        </div>
        <div className="flex-1">
          <h3 className="font-bold text-base mb-1">Activate Membership to Add Funds</h3>
          <p className="text-sm text-muted-foreground mb-4">
            Subscribe for ${price}/mo to unlock wallet contributions. Your existing balance remains usable anytime.
          </p>
          <div className="flex flex-wrap items-center gap-3">
            <Button onClick={onSubscribe} disabled={actionLoading} className="btn-glow font-semibold h-11">
              {actionLoading ? (
                <><Loader2 className="h-4 w-4 animate-spin mr-2" /> Processing…</>
              ) : (
                <>Activate — ${price}/mo</>
              )}
            </Button>
            <div className="flex items-center gap-4 text-xs text-muted-foreground">
              <span className="flex items-center gap-1"><CheckCircle2 className="h-3 w-3 text-primary" /> Cancel anytime</span>
              <span className="flex items-center gap-1"><Shield className="h-3 w-3 text-primary" /> Via PayPal</span>
            </div>
          </div>
          {subError && <p className="text-destructive text-xs mt-3">{subError}</p>}
        </div>
      </div>
    </motion.div>
  );
};

// --- Contribute Section (Fintech style) ---
const ContributeSection = ({ onContributed }: { onContributed: () => void }) => {
  const [amount, setAmount] = useState("");
  const [showPayPal, setShowPayPal] = useState(false);
  const quickAmounts = [25, 50, 100, 250];
  const parsedAmount = parseFloat(amount) || 0;

  const handlePayNow = () => {
    if (parsedAmount > 0) setShowPayPal(true);
  };

  useEffect(() => { setShowPayPal(false); }, [amount]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.25 }}
      className="bg-card rounded-xl border border-border p-6 mb-6"
    >
      <div className="flex items-center gap-3 mb-5">
        <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
          <DollarSign className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h3 className="font-bold text-base">Add Funds</h3>
          <p className="text-xs text-muted-foreground">Contribute to your Hajj savings via PayPal</p>
        </div>
      </div>

      {/* Quick amounts */}
      <div className="grid grid-cols-4 gap-2 mb-4">
        {quickAmounts.map((amt) => (
          <button
            key={amt}
            onClick={() => setAmount(String(amt))}
            className={`h-12 rounded-xl text-sm font-bold transition-all duration-200 border ${
              amount === String(amt)
                ? "bg-primary text-primary-foreground border-primary shadow-lg shadow-primary/20"
                : "bg-secondary/50 text-foreground border-border hover:border-primary/30 hover:bg-primary/5"
            }`}
          >
            ${amt}
          </button>
        ))}
      </div>

      {/* Custom input */}
      <div className="relative mb-5">
        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground font-semibold text-lg">$</span>
        <Input
          type="number"
          placeholder="Enter custom amount"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          className="pl-9 h-14 text-lg font-semibold border-2 focus:border-primary rounded-xl"
        />
      </div>

      {!showPayPal ? (
        <Button
          onClick={handlePayNow}
          disabled={parsedAmount <= 0}
          className="w-full h-13 text-base font-bold rounded-xl btn-glow"
          size="lg"
        >
          {parsedAmount > 0 ? (
            <span className="flex items-center gap-2">
              <ArrowUpRight className="h-5 w-5" />
              Add ${parsedAmount.toFixed(2)} to Wallet
            </span>
          ) : (
            "Enter an amount"
          )}
        </Button>
      ) : (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-3">
          <div className="bg-secondary/40 rounded-xl p-4 text-center">
            <p className="text-sm text-muted-foreground mb-1">Amount to add</p>
            <p className="text-2xl font-bold text-foreground">${parsedAmount.toFixed(2)}</p>
          </div>
          <PayPalButton
            amount={parsedAmount}
            description={`Hajj Wallet Contribution - $${parsedAmount.toFixed(2)}`}
            type="wallet"
            onSuccess={() => {
              toast({ title: "✅ Contribution successful!", description: `$${parsedAmount.toFixed(2)} added to your Hajj wallet.` });
              setAmount("");
              setShowPayPal(false);
              onContributed();
            }}
            onError={(err) => {
              toast({ title: "Payment failed", description: err, variant: "destructive" });
            }}
          />
          <Button variant="ghost" size="sm" className="w-full text-muted-foreground text-xs" onClick={() => setShowPayPal(false)}>
            ← Change amount
          </Button>
        </motion.div>
      )}
    </motion.div>
  );
};

// --- Savings Projection ---
const SavingsProjection = ({ stats }: { stats: any }) => {
  const remaining = Math.max(Number(stats.remaining), 0);
  if (remaining <= 0) return null;

  const projections = [
    { weekly: 50, label: "$50/wk" },
    { weekly: 100, label: "$100/wk" },
    { weekly: 200, label: "$200/wk" },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3 }}
      className="bg-card rounded-xl border border-border p-6 mb-6"
    >
      <div className="flex items-center gap-3 mb-5">
        <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
          <TrendingUp className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h3 className="font-bold text-base">Savings Projection</h3>
          <p className="text-xs text-muted-foreground">${remaining.toLocaleString()} remaining to reach your goal</p>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3">
        {projections.map((p) => {
          const weeks = Math.ceil(remaining / p.weekly);
          const months = Math.round(weeks / 4.33);
          return (
            <div key={p.weekly} className="text-center p-4 rounded-xl bg-secondary/40 border border-border">
              <p className="text-xs text-muted-foreground font-medium mb-2">{p.label}</p>
              <p className="text-2xl font-bold text-foreground">{weeks}</p>
              <p className="text-[10px] text-muted-foreground mt-0.5">weeks ({months} mo)</p>
            </div>
          );
        })}
      </div>
    </motion.div>
  );
};

// --- Transaction Row ---
const TransactionItem = ({ tx, isLast }: { tx: any; isLast: boolean }) => (
  <div className={`flex items-center justify-between py-4 ${!isLast ? "border-b border-border" : ""}`}>
    <div className="flex items-center gap-3">
      <div className={`w-9 h-9 rounded-full flex items-center justify-center ${
        tx.type === "recurring" ? "bg-primary/10" : "bg-secondary"
      }`}>
        {tx.type === "recurring" ? (
          <Calendar className="h-4 w-4 text-primary" />
        ) : (
          <ArrowUpRight className="h-4 w-4 text-primary" />
        )}
      </div>
      <div>
        <p className="text-sm font-semibold text-foreground">
          {tx.type === "recurring" ? "Recurring Contribution" : "One-time Contribution"}
        </p>
        <p className="text-xs text-muted-foreground">
          {new Date(tx.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
        </p>
      </div>
    </div>
    <div className="text-right">
      <p className="text-sm font-bold text-primary">+${Number(tx.amount).toLocaleString()}</p>
      <p className="text-[10px] text-muted-foreground capitalize">{tx.status}</p>
    </div>
  </div>
);

// --- All Transactions Drawer ---
const AllTransactionsDrawer = ({ transactions }: { transactions: any[] | null }) => (
  <Sheet>
    <SheetTrigger asChild>
      <button className="text-xs font-semibold text-primary hover:text-primary/80 transition-colors flex items-center gap-0.5">
        View All <ChevronRight className="h-3.5 w-3.5" />
      </button>
    </SheetTrigger>
    <SheetContent className="w-full sm:max-w-lg overflow-y-auto">
      <SheetHeader>
        <SheetTitle>Transaction History</SheetTitle>
      </SheetHeader>
      <div className="mt-4 px-1">
        {!transactions || transactions.length === 0 ? (
          <EmptyState icon="💰" title="No transactions" description="Your transaction history will appear here." />
        ) : (
          transactions.map((tx, i) => (
            <TransactionItem key={tx.id} tx={tx} isLast={i === transactions.length - 1} />
          ))
        )}
      </div>
    </SheetContent>
  </Sheet>
);

// --- Recent Transactions ---
const RecentTransactions = ({ transactions, txLoading }: { transactions: any[] | null; txLoading: boolean }) => {
  const recentSix = transactions?.slice(0, 6) ?? [];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.35 }}
      className="bg-card rounded-xl border border-border p-6 mb-6"
    >
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
            <History className="h-5 w-5 text-primary" />
          </div>
          <h3 className="font-bold text-base">Recent Transactions</h3>
        </div>
        <AllTransactionsDrawer transactions={transactions} />
      </div>

      {txLoading ? <CardSkeleton /> : recentSix.length === 0 ? (
        <div className="text-center py-8">
          <div className="w-14 h-14 rounded-full bg-secondary mx-auto flex items-center justify-center mb-3">
            <WalletIcon className="h-6 w-6 text-muted-foreground" />
          </div>
          <p className="text-sm font-medium text-muted-foreground">No transactions yet</p>
          <p className="text-xs text-muted-foreground mt-1">Your contributions will show up here</p>
        </div>
      ) : (
        <div>
          {recentSix.map((tx, i) => (
            <TransactionItem key={tx.id} tx={tx} isLast={i === recentSix.length - 1} />
          ))}
        </div>
      )}
    </motion.div>
  );
};

// --- Main Wallet Content ---
const WalletContent = () => {
  const { user } = useAuth();
  const { data: stats, loading: statsLoading, error: statsError, refetch: refetchStats } = useWalletStats();
  const { data: transactions, loading: txLoading, refetch: refetchTx } = useWalletTransactions();
  const { data: profile } = useProfile();
  const {
    config: subConfig,
    loading: subLoading,
    error: subError,
    actionLoading: subActionLoading,
    subscribe,
    cancelSubscription,
    isActive: hasActiveSubscription,
  } = useWalletSubscription();

  const [showContribute, setShowContribute] = useState(false);
  const [showGoalDialog, setShowGoalDialog] = useState(false);
  const [showGoalOnboarding, setShowGoalOnboarding] = useState(false);
  const [goalInput, setGoalInput] = useState("");
  const [goalSaving, setGoalSaving] = useState(false);
  const txSectionRef = React.useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!user?.id) return;
    const channel = supabase
      .channel(`wallet_tx_${user.id}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "wallet_transactions", filter: `user_id=eq.${user.id}` },
        () => {
          refetchStats();
          refetchTx();
        }
      )
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [user?.id, refetchStats, refetchTx]);

  const handleContributed = () => {
    refetchStats();
    refetchTx();
    setShowContribute(false);
  };

  const handleSetGoal = async () => {
    const val = parseFloat(goalInput);
    if (!val || val <= 0 || !user?.id) return;
    setGoalSaving(true);
    const { error } = await supabase.from("wallets").update({ goal_amount: val }).eq("user_id", user.id);
    setGoalSaving(false);
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "✅ Goal updated!", description: `Your savings goal is now $${val.toLocaleString()}.` });
      setShowGoalDialog(false);
      setGoalInput("");
      refetchStats();
    }
  };

  if (statsLoading) return (
    <div className="section-padding min-h-screen">
      <div className="container mx-auto max-w-2xl space-y-4">
        <CardSkeleton /><CardSkeleton /><CardSkeleton />
      </div>
    </div>
  );

  if (statsError) return (
    <div className="section-padding min-h-screen">
      <div className="container mx-auto max-w-2xl">
        <ErrorState message={statsError} onRetry={refetchStats} />
      </div>
    </div>
  );

  if (!stats) return (
    <div className="section-padding min-h-screen">
      <div className="container mx-auto max-w-2xl">
        <EmptyState icon="💰" title="No wallet found" description="Your wallet hasn't been set up yet." />
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto max-w-2xl px-4 py-8 md:py-12">
        {/* Page header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between mb-6"
        >
          <div>
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight">My Wallet</h1>
            <p className="text-sm text-muted-foreground mt-0.5">Hajj Savings Account</p>
          </div>
        </motion.div>

        {/* Balance Hero */}
        <BalanceHero stats={stats} profile={profile} />

        {/* First-login goal onboarding */}
        <AnimatePresence>
          {showGoalOnboarding && (
            <motion.div
              initial={{ opacity: 0, y: 20, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10, scale: 0.97 }}
              className="rounded-xl border-2 border-primary/30 bg-primary/5 p-6 mb-6"
            >
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-xl bg-primary/15 flex items-center justify-center shrink-0">
                  <Target className="h-6 w-6 text-primary" />
                </div>
                <div className="flex-1">
                  <h3 className="font-bold text-base mb-1">Set Your Savings Goal 🎯</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    What is your savings goal? Choose a package or set a custom amount.
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 mb-4">
                    {[
                      { label: "Essential", amount: 2500 },
                      { label: "Premium", amount: 3500 },
                      { label: "VIP", amount: 5000 },
                    ].map((pkg) => (
                      <button
                        key={pkg.label}
                        onClick={() => setGoalInput(String(pkg.amount))}
                        className={`p-3 rounded-lg border text-center transition-all ${goalInput === String(pkg.amount) ? "border-primary bg-primary/10 ring-1 ring-primary" : "border-border bg-card hover:border-primary/40"}`}
                      >
                        <p className="text-xs text-muted-foreground">{pkg.label}</p>
                        <p className="font-bold text-lg">${pkg.amount.toLocaleString()}</p>
                      </button>
                    ))}
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="relative flex-1">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground font-medium">$</span>
                      <Input
                        type="number"
                        placeholder="Custom amount"
                        value={goalInput}
                        onChange={(e) => setGoalInput(e.target.value)}
                        className="pl-7"
                      />
                    </div>
                    <Button onClick={() => { handleSetGoal(); setShowGoalOnboarding(false); localStorage.setItem("hajj_goal_set", "1"); }} disabled={goalSaving || !parseFloat(goalInput)}>
                      {goalSaving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                      Save
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => { setShowGoalOnboarding(false); localStorage.setItem("hajj_goal_set", "1"); }}>
                      Skip
                    </Button>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Quick Actions */}
        <QuickActions
          onAddMoney={() => setShowContribute(!showContribute)}
          onSetGoal={() => { setGoalInput(String(stats.goal_amount ?? 2500)); setShowGoalDialog(true); }}
          onHistory={() => txSectionRef.current?.scrollIntoView({ behavior: "smooth" })}
        />

        {/* Goal Dialog */}
        <AlertDialog open={showGoalDialog} onOpenChange={setShowGoalDialog}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Set Savings Goal</AlertDialogTitle>
              <AlertDialogDescription>
                Enter your target amount for your Hajj savings goal.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <div className="py-4">
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground font-semibold text-lg">$</span>
                <Input
                  type="number"
                  value={goalInput}
                  onChange={(e) => setGoalInput(e.target.value)}
                  className="pl-9 h-14 text-lg font-semibold"
                  placeholder="e.g. 5000"
                />
              </div>
            </div>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={handleSetGoal} disabled={goalSaving || !parseFloat(goalInput)}>
                {goalSaving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                Save Goal
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* Membership */}
        <MembershipBanner
          profile={profile}
          isActive={hasActiveSubscription}
          subscription={subConfig?.subscription}
          price={subConfig?.price ?? 25}
          subLoading={subLoading}
          actionLoading={subActionLoading}
          onSubscribe={subscribe}
          onCancel={cancelSubscription}
          subError={subError}
        />

        {/* Contribute section or subscription prompt */}
        {showContribute && (
          hasActiveSubscription ? (
            <ContributeSection onContributed={handleContributed} />
          ) : (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="rounded-xl border-2 border-dashed border-primary/25 p-6 mb-6 bg-primary/[0.02]"
            >
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-xl bg-destructive/10 flex items-center justify-center shrink-0">
                  <Shield className="h-6 w-6 text-destructive" />
                </div>
                <div className="flex-1">
                  <h3 className="font-bold text-base mb-1">Subscription Required</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    You need an active membership subscription to add money to your wallet. Subscribe for ${subConfig?.price ?? 25}/mo to unlock wallet contributions. Your existing balance remains usable anytime.
                  </p>
                  <Button onClick={subscribe} disabled={subActionLoading} className="btn-glow font-semibold h-11">
                    {subActionLoading ? (
                      <><Loader2 className="h-4 w-4 animate-spin mr-2" /> Processing…</>
                    ) : (
                      <>Activate Membership — ${subConfig?.price ?? 25}/mo</>
                    )}
                  </Button>
                  {subError && <p className="text-destructive text-xs mt-3">{subError}</p>}
                </div>
              </div>
            </motion.div>
          )
        )}

        {/* Add Money button when not showing contribute */}
        {!showContribute && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="mb-6"
          >
            <Button
              onClick={() => setShowContribute(true)}
              className="w-full h-13 rounded-xl font-bold text-base btn-glow"
              size="lg"
            >
              <Plus className="h-5 w-5 mr-2" /> Add Money to Wallet
            </Button>
          </motion.div>
        )}

        {/* Savings Projection */}
        <SavingsProjection stats={stats} />

        {/* Recent Transactions */}
        <div ref={txSectionRef}>
          <RecentTransactions transactions={transactions} txLoading={txLoading} />
        </div>
      </div>
    </div>
  );
};

const Wallet = () => {
  const { user } = useAuth();
  return (
    <>
      <SEOHead
        title="Hajj Savings Wallet"
        description="Save for your Hajj pilgrimage with a secure digital wallet. Track contributions, set goals, and watch your savings grow."
        jsonLd={{
          "@context": "https://schema.org",
          "@type": "FinancialProduct",
          name: "Hajj Savings Wallet",
          description: "Digital savings wallet for Hajj pilgrimage",
          provider: { "@type": "Organization", name: "Hajj Wallet" },
        }}
      />
      {user ? <WalletContent /> : <WalletPublicLanding />}
    </>
  );
};

export default Wallet;
