import { useState, useEffect } from "react";
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
import { motion, AnimatePresence } from "framer-motion";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { CreditCard, ChevronRight } from "lucide-react";
import PayPalButton from "@/components/PayPalButton";

const stagger = {
  hidden: {},
  show: { transition: { staggerChildren: 0.1 } },
};

const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  show: { opacity: 1, y: 0, transition: { type: "spring" as const, stiffness: 200, damping: 20 } },
};

// --- Stats Cards ---
const StatsCards = ({ stats, profile }: { stats: any; profile: any }) => {
  const cards = [
    {
      label: "Current Balance",
      value: `$${Number(stats.balance).toLocaleString(undefined, { minimumFractionDigits: 2 })}`,
      sub: `${stats.contribution_count ?? 0} contributions made`,
      highlight: true,
    },
    {
      label: "Goal Amount",
      value: `$${Number(stats.goal_amount).toLocaleString(undefined, { minimumFractionDigits: 2 })}`,
      sub: `$${Math.max(Number(stats.remaining), 0).toLocaleString(undefined, { minimumFractionDigits: 2 })} remaining`,
    },
    {
      label: "Membership",
      value: profile?.membership_status ?? "—",
      sub: `Tier: ${profile?.tier ?? "—"}`,
      badge: profile?.membership_status === "active",
    },
  ];

  return (
    <motion.div variants={stagger} initial="hidden" animate="show" className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
      {cards.map((card, i) => (
        <motion.div
          key={card.label}
          variants={fadeUp}
          whileHover={{ y: -6, boxShadow: "0 15px 30px -8px hsl(var(--primary) / 0.12)" }}
          className="bg-card rounded-xl card-shadow p-6"
        >
          <p className="text-sm text-muted-foreground mb-1">{card.label}</p>
          <motion.p
            className={`text-3xl font-bold ${card.highlight ? "text-primary" : ""} ${card.label === "Membership" ? "capitalize" : ""}`}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.3 + i * 0.1, type: "spring" }}
          >
            {card.value}
          </motion.p>
          <div className="flex items-center gap-2 mt-1">
            <p className="text-xs text-muted-foreground">{card.sub}</p>
            {card.badge && <Badge className="bg-primary text-primary-foreground border-0 text-[10px]">Active</Badge>}
          </div>
        </motion.div>
      ))}
    </motion.div>
  );
};

// --- Savings Progress ---
const SavingsProgress = ({ stats }: { stats: any }) => {
  const progress = Number(stats.progress_percent) || 0;
  const remaining = Math.max(Number(stats.remaining), 0);
  const goalAmount = Number(stats.goal_amount);
  const weeksToGoal = (weekly: number) => remaining <= 0 ? 0 : Math.ceil(remaining / weekly);

  return (
    <motion.div
      initial={{ opacity: 0, y: 25 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3 }}
      whileHover={{ boxShadow: "0 15px 30px -8px hsl(var(--primary) / 0.08)" }}
      className="bg-card rounded-xl card-shadow p-6 mb-8"
    >
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold">Savings Progress</h2>
        <motion.span className="text-sm text-primary font-medium" key={progress} initial={{ scale: 1.3 }} animate={{ scale: 1 }}>
          {progress.toFixed(1)}% of goal reached
        </motion.span>
      </div>
      <Progress value={progress} className="h-3 mb-2" />
      <div className="flex justify-between text-xs text-muted-foreground mb-6">
        <span>$0</span><span>${goalAmount.toLocaleString()}</span>
      </div>
      {remaining > 0 && (
        <motion.div variants={stagger} initial="hidden" animate="show" className="grid grid-cols-3 gap-4 text-sm">
          {[50, 100, 200].map((w) => (
            <motion.div key={w} variants={fadeUp} whileHover={{ scale: 1.05, y: -2 }} className="bg-secondary rounded-lg p-3 text-center">
              <p className="text-muted-foreground">At ${w}/week</p>
              <p className="font-semibold text-primary">{weeksToGoal(w)} weeks</p>
            </motion.div>
          ))}
        </motion.div>
      )}
    </motion.div>
  );
};

// --- Contribute Section ---
const ContributeSection = ({ onContributed }: { onContributed: () => void }) => {
  const [amount, setAmount] = useState("");
  const [showPayPal, setShowPayPal] = useState(false);
  const quickAmounts = [25, 50, 100];
  const parsedAmount = parseFloat(amount) || 0;

  const handlePayNow = () => {
    if (parsedAmount > 0) {
      setShowPayPal(true);
    }
  };

  // Reset PayPal when amount changes
  useEffect(() => {
    setShowPayPal(false);
  }, [amount]);

  return (
    <motion.div initial={{ opacity: 0, y: 25 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="bg-card rounded-xl card-shadow p-8 mb-8 border-2 border-primary/20">
      <div className="flex items-center gap-3 mb-2">
        <div className="p-3 bg-primary/10 rounded-xl">
          <CreditCard className="h-6 w-6 text-primary" />
        </div>
        <div>
          <h2 className="text-xl font-bold">Make a Contribution</h2>
          <p className="text-sm font-medium text-muted-foreground">Add funds to your Hajj savings wallet via PayPal</p>
        </div>
      </div>

      <div className="flex gap-3 mt-5 mb-4">
        {quickAmounts.map((amt) => (
          <motion.div key={amt} whileHover={{ scale: 1.08 }} whileTap={{ scale: 0.95 }}>
            <Button variant={amount === String(amt) ? "default" : "outline"} className="text-base font-bold px-6 h-12" onClick={() => setAmount(String(amt))}>
              ${amt}
            </Button>
          </motion.div>
        ))}
      </div>
      <Input type="number" placeholder="Custom amount ($)" value={amount} onChange={(e) => setAmount(e.target.value)} className="mb-5 h-12 text-base font-medium" />

      {!showPayPal ? (
        <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
          <Button
            onClick={handlePayNow}
            disabled={parsedAmount <= 0}
            className="w-full h-14 text-lg font-bold btn-glow"
            size="lg"
          >
            {parsedAmount > 0 ? `Pay $${parsedAmount.toFixed(2)} Now` : "Enter an amount to continue"}
          </Button>
        </motion.div>
      ) : (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
          <PayPalButton
            amount={parsedAmount}
            description={`Hajj Wallet Contribution - $${parsedAmount.toFixed(2)}`}
            type="wallet"
            onSuccess={() => {
              toast({ title: "✅ Contribution successful!", description: `$${parsedAmount.toFixed(2)} added to your Hajj fund!` });
              setAmount("");
              setShowPayPal(false);
              onContributed();
            }}
            onError={(err) => {
              toast({ title: "Payment failed", description: err, variant: "destructive" });
            }}
          />
          <Button variant="ghost" size="sm" className="w-full mt-2 text-muted-foreground" onClick={() => setShowPayPal(false)}>
            ← Change amount
          </Button>
        </motion.div>
      )}

      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.6 }} className="bg-secondary rounded-lg p-4 mt-5 text-sm font-medium text-muted-foreground">
        💡 <strong>Tip:</strong> Set up recurring contributions to reach your goal faster!
      </motion.div>
    </motion.div>
  );
};

// --- Membership Card ---
const MembershipCard = ({ profile }: { profile: any }) => {
  if (!profile) return null;
  const isActive = profile.membership_status === "active";

  return (
    <motion.div initial={{ opacity: 0, y: 25 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }} className="bg-card rounded-xl card-shadow p-6 mb-8">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-primary/10 rounded-lg">
            <CreditCard className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h2 className="text-lg font-semibold">Membership Status</h2>
            <p className="text-sm text-muted-foreground capitalize">{profile.tier} Tier • {profile.membership_status}</p>
          </div>
        </div>
        {isActive ? (
          <Badge className="bg-primary text-primary-foreground border-0">Active</Badge>
        ) : (
          <Button size="sm" disabled title="Stripe not configured yet">
            Activate Membership
          </Button>
        )}
      </div>
      {isActive && profile.next_billing_date && (
        <p className="text-xs text-muted-foreground mt-3">
          Next billing: {new Date(profile.next_billing_date).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}
        </p>
      )}
    </motion.div>
  );
};

// --- Transactions Drawer ---
const TransactionRow = ({ tx, isLast }: { tx: any; isLast: boolean }) => (
  <div className={`flex items-center justify-between px-4 py-3 ${!isLast ? "border-b" : ""}`}>
    <div>
      <p className="font-semibold text-primary">+${Number(tx.amount).toLocaleString()}</p>
      <p className="text-sm text-muted-foreground">
        {new Date(tx.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
      </p>
    </div>
    <div className="flex items-center gap-2">
      <Badge variant={tx.status === "completed" ? "default" : "secondary"} className="text-xs capitalize">{tx.status}</Badge>
      <Badge variant={tx.type === "recurring" ? "default" : "secondary"} className="text-xs">
        {tx.type === "recurring" ? "Recurring" : "One-time"}
      </Badge>
    </div>
  </div>
);

const AllTransactionsDrawer = ({ transactions }: { transactions: any[] | null }) => (
  <Sheet>
    <SheetTrigger asChild>
      <Button variant="ghost" size="sm" className="gap-1 text-primary">
        View All <ChevronRight className="h-4 w-4" />
      </Button>
    </SheetTrigger>
    <SheetContent className="w-full sm:max-w-lg overflow-y-auto">
      <SheetHeader>
        <SheetTitle>All Transactions</SheetTitle>
      </SheetHeader>
      <div className="mt-4">
        {!transactions || transactions.length === 0 ? (
          <EmptyState icon="💰" title="No transactions" description="Your transaction history will appear here." />
        ) : (
          transactions.map((tx, i) => (
            <TransactionRow key={tx.id} tx={tx} isLast={i === transactions.length - 1} />
          ))
        )}
      </div>
    </SheetContent>
  </Sheet>
);

// --- Recent Contributions ---
const RecentContributions = ({ transactions, txLoading, setAmount }: { transactions: any[] | null; txLoading: boolean; setAmount: (v: string) => void }) => {
  const recentSix = transactions?.slice(0, 6) ?? [];

  return (
    <>
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }} className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold">Recent Contributions</h2>
        <AllTransactionsDrawer transactions={transactions} />
      </motion.div>

      {txLoading ? <CardSkeleton /> : recentSix.length === 0 ? (
        <EmptyState icon="💰" title="No contributions yet" description="Make your first contribution to start your Hajj savings journey!" actionLabel="Make a Contribution" onAction={() => setAmount("50")} />
      ) : (
        <motion.div variants={stagger} initial="hidden" animate="show" className="bg-card rounded-xl card-shadow overflow-hidden mb-4">
          {recentSix.map((tx, i) => (
            <motion.div
              key={tx.id}
              variants={fadeUp}
              whileHover={{ backgroundColor: "hsl(var(--secondary) / 0.5)" }}
              className={`flex items-center justify-between px-6 py-4 transition-colors ${i < recentSix.length - 1 ? "border-b" : ""}`}
            >
              <div>
                <p className="font-semibold text-primary">+${Number(tx.amount).toLocaleString()}</p>
                <p className="text-sm text-muted-foreground">{new Date(tx.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}</p>
              </div>
              <Badge variant={tx.type === "recurring" ? "default" : "secondary"} className="text-xs">
                {tx.type === "recurring" ? "Recurring" : "One-time"}
              </Badge>
            </motion.div>
          ))}
        </motion.div>
      )}
    </>
  );
};

// --- Main Wallet Content ---
const WalletContent = () => {
  const { user } = useAuth();
  const { data: stats, loading: statsLoading, error: statsError, refetch: refetchStats } = useWalletStats();
  const { data: transactions, loading: txLoading, refetch: refetchTx } = useWalletTransactions();
  const { data: profile } = useProfile();
  const [, setDummy] = useState(0); // force re-render on contribution

  // Real-time subscription for wallet_transactions
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
  };

  if (statsLoading) return (
    <div className="section-padding min-h-screen"><div className="container mx-auto max-w-4xl space-y-6">
      <CardSkeleton /><CardSkeleton /><CardSkeleton />
    </div></div>
  );

  if (statsError) return (
    <div className="section-padding min-h-screen"><div className="container mx-auto max-w-4xl">
      <ErrorState message={statsError} onRetry={refetchStats} />
    </div></div>
  );

  if (!stats) return (
    <div className="section-padding min-h-screen"><div className="container mx-auto max-w-4xl">
      <EmptyState icon="💰" title="No wallet found" description="Your wallet hasn't been set up yet. Please contact support." />
    </div></div>
  );

  return (
    <div className="section-padding min-h-screen">
      <div className="container mx-auto max-w-4xl">
        <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }} className="mb-8">
          <h1 className="text-3xl md:text-4xl font-bold mb-2">My Hajj Wallet</h1>
          <p className="text-muted-foreground">Track your progress toward your sacred journey</p>
        </motion.div>

        <StatsCards stats={stats} profile={profile} />
        <ContributeSection onContributed={handleContributed} />
        <MembershipCard profile={profile} />
        <SavingsProgress stats={stats} />
        <RecentContributions transactions={transactions} txLoading={txLoading} setAmount={() => {}} />
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
