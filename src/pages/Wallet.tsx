import { useState } from "react";
import { TrendingUp, Plus, Calendar, Target } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { RequireAuth, EmptyState } from "@/components/StateHelpers";
import { toast } from "@/hooks/use-toast";

const mockTransactions = [
  { id: 1, date: "Feb 20, 2026", amount: 200, type: "one-time" as const },
  { id: 2, date: "Jan 20, 2026", amount: 200, type: "recurring" as const },
  { id: 3, date: "Dec 20, 2025", amount: 500, type: "one-time" as const },
  { id: 4, date: "Nov 20, 2025", amount: 200, type: "recurring" as const },
  { id: 5, date: "Oct 20, 2025", amount: 200, type: "recurring" as const },
  { id: 6, date: "Sep 20, 2025", amount: 150, type: "one-time" as const },
];

const WalletContent = () => {
  const [contributionAmount, setContributionAmount] = useState("");
  const balance = 1250;
  const goalAmount = 2500;
  const progress = (balance / goalAmount) * 100;
  const remaining = goalAmount - balance;
  const contributionCount = 8;

  const quickAmounts = [25, 50, 100];

  const handleContribute = () => {
    const amt = parseFloat(contributionAmount);
    if (!amt || amt <= 0) return;
    toast({ title: "Contribution successful!", description: `$${amt.toFixed(2)} added to your wallet.` });
    setContributionAmount("");
  };

  const weeksToGoal = (weekly: number) => Math.ceil(remaining / weekly);

  return (
    <div className="section-padding min-h-screen">
      <div className="container mx-auto max-w-4xl">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl md:text-4xl font-bold mb-2">My Hajj Wallet</h1>
          <p className="text-muted-foreground">Track your progress toward your sacred journey</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
          <div className="bg-card rounded-xl card-shadow p-6">
            <p className="text-sm text-muted-foreground mb-1">Current Balance</p>
            <p className="text-3xl font-bold text-primary">${balance.toLocaleString()}.00</p>
            <p className="text-xs text-muted-foreground mt-1">{contributionCount} contributions made</p>
          </div>
          <div className="bg-card rounded-xl card-shadow p-6">
            <p className="text-sm text-muted-foreground mb-1">Goal Amount</p>
            <p className="text-3xl font-bold">${goalAmount.toLocaleString()}.00</p>
            <p className="text-xs text-muted-foreground mt-1">${remaining.toLocaleString()}.00 remaining</p>
          </div>
          <div className="bg-card rounded-xl card-shadow p-6">
            <p className="text-sm text-muted-foreground mb-1">Monthly Membership</p>
            <p className="text-3xl font-bold">$25.00</p>
            <div className="flex items-center gap-2 mt-1">
              <p className="text-xs text-muted-foreground">Next payment: March 1, 2026</p>
              <Badge className="bg-primary text-primary-foreground border-0 text-[10px]">Active</Badge>
            </div>
          </div>
        </div>

        {/* Savings Progress */}
        <div className="bg-card rounded-xl card-shadow p-6 mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">Savings Progress</h2>
            <span className="text-sm text-primary font-medium">
              You're {progress.toFixed(1)}% of the way to your goal!
            </span>
          </div>
          <div className="relative mb-2">
            <Progress value={progress} className="h-3" />
          </div>
          <div className="flex justify-between text-xs text-muted-foreground mb-6">
            <span>$0</span>
            <span>${goalAmount.toLocaleString()}</span>
          </div>
          <div className="grid grid-cols-3 gap-4 text-sm">
            <div className="bg-secondary rounded-lg p-3 text-center">
              <p className="text-muted-foreground">At $50/week</p>
              <p className="font-semibold text-primary">{weeksToGoal(50)} weeks</p>
            </div>
            <div className="bg-secondary rounded-lg p-3 text-center">
              <p className="text-muted-foreground">At $100/week</p>
              <p className="font-semibold text-primary">{weeksToGoal(100)} weeks</p>
            </div>
            <div className="bg-secondary rounded-lg p-3 text-center">
              <p className="text-muted-foreground">At $200/week</p>
              <p className="font-semibold text-primary">{weeksToGoal(200)} weeks</p>
            </div>
          </div>
        </div>

        {/* Contribute */}
        <div className="bg-card rounded-xl card-shadow p-6 mb-8">
          <h2 className="text-lg font-semibold mb-1">Make a Contribution</h2>
          <p className="text-sm text-muted-foreground mb-4">Add funds to your Hajj savings wallet</p>
          <div className="flex gap-2 mb-3">
            {quickAmounts.map((amt) => (
              <Button
                key={amt}
                variant={contributionAmount === String(amt) ? "default" : "outline"}
                size="sm"
                onClick={() => setContributionAmount(String(amt))}
              >
                ${amt}
              </Button>
            ))}
          </div>
          <div className="flex gap-3">
            <Input
              type="number"
              placeholder="Custom amount ($)"
              value={contributionAmount}
              onChange={(e) => setContributionAmount(e.target.value)}
              className="flex-1"
            />
            <Button onClick={handleContribute} disabled={!contributionAmount}>
              Contribute Now
            </Button>
          </div>
          <div className="bg-secondary rounded-lg p-4 mt-4 text-sm text-muted-foreground">
            💡 <strong>Tip:</strong> Set up recurring contributions to reach your goal faster!
          </div>
        </div>

        {/* Recent Contributions */}
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold">Recent Contributions</h2>
        </div>

        {mockTransactions.length === 0 ? (
          <EmptyState
            icon="💰"
            title="No contributions yet"
            description="Make your first contribution to start your Hajj savings journey!"
            actionLabel="Make a Contribution"
            onAction={() => setContributionAmount("50")}
          />
        ) : (
          <div className="bg-card rounded-xl card-shadow overflow-hidden mb-4">
            {mockTransactions.map((tx, i) => (
              <div
                key={tx.id}
                className={`flex items-center justify-between px-6 py-4 ${
                  i < mockTransactions.length - 1 ? "border-b" : ""
                }`}
              >
                <div className="flex items-center gap-3">
                  <div>
                    <p className="font-semibold text-primary">+${tx.amount}</p>
                    <p className="text-sm text-muted-foreground">{tx.date}</p>
                  </div>
                </div>
                <Badge variant={tx.type === "recurring" ? "default" : "secondary"} className="text-xs">
                  {tx.type === "recurring" ? "Recurring" : "One-time"}
                </Badge>
              </div>
            ))}
          </div>
        )}
        <button className="text-sm text-primary hover:underline">View All Transactions</button>

        {/* Membership Status */}
        <div className="bg-card rounded-xl card-shadow p-6 mt-8">
          <h2 className="text-lg font-semibold mb-3">Membership Status</h2>
          <div className="flex items-center gap-4 text-sm">
            <div>
              <span className="text-muted-foreground">Member Since: </span>
              <span className="font-medium">January 2025</span>
            </div>
            <Badge className="bg-primary text-primary-foreground border-0">Active</Badge>
          </div>
          <p className="text-sm text-muted-foreground mt-2">Monthly fee: $25.00</p>
          <p className="text-xs text-muted-foreground mt-1">
            Your membership supports the community and keeps your wallet active.
          </p>
        </div>
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
