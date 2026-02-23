import { useState } from "react";
import { TrendingUp, Plus, Calendar, Target } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";

const mockTransactions = [
  { id: 1, date: "Feb 20, 2026", amount: 200, note: "Monthly contribution" },
  { id: 2, date: "Jan 20, 2026", amount: 200, note: "Monthly contribution" },
  { id: 3, date: "Dec 20, 2025", amount: 500, note: "Bonus savings" },
  { id: 4, date: "Nov 20, 2025", amount: 200, note: "Monthly contribution" },
  { id: 5, date: "Oct 20, 2025", amount: 200, note: "Monthly contribution" },
];

const Wallet = () => {
  const [showAdd, setShowAdd] = useState(false);
  const savedAmount = 4800;
  const goalAmount = 12000;
  const progress = (savedAmount / goalAmount) * 100;

  return (
    <div className="section-padding bg-secondary min-h-screen">
      <div className="container mx-auto max-w-4xl">
        <h1 className="text-3xl md:text-4xl font-bold text-secondary-foreground mb-2">
          My Hajj Wallet
        </h1>
        <p className="text-muted-foreground mb-8">Track your savings and reach your goal.</p>

        {/* Progress Card */}
        <div className="bg-card rounded-xl p-6 md:p-8 card-shadow mb-8 animate-fade-in">
          <div className="flex items-center justify-between mb-6">
            <div>
              <p className="text-muted-foreground text-sm mb-1">Total Saved</p>
              <p className="text-4xl font-bold text-primary">${savedAmount.toLocaleString()}</p>
            </div>
            <div className="text-right">
              <p className="text-muted-foreground text-sm mb-1">Goal</p>
              <p className="text-2xl font-semibold text-card-foreground">${goalAmount.toLocaleString()}</p>
            </div>
          </div>

          <Progress value={progress} className="h-3 mb-3" />
          <p className="text-sm text-muted-foreground">{progress.toFixed(0)}% of your goal reached</p>

          <div className="grid grid-cols-3 gap-4 mt-6 pt-6 border-t">
            <div className="text-center">
              <div className="flex items-center justify-center mb-1">
                <TrendingUp className="h-4 w-4 text-primary mr-1" />
              </div>
              <p className="text-sm font-semibold text-card-foreground">$200</p>
              <p className="text-xs text-muted-foreground">Monthly avg</p>
            </div>
            <div className="text-center">
              <div className="flex items-center justify-center mb-1">
                <Calendar className="h-4 w-4 text-primary mr-1" />
              </div>
              <p className="text-sm font-semibold text-card-foreground">36 months</p>
              <p className="text-xs text-muted-foreground">Est. completion</p>
            </div>
            <div className="text-center">
              <div className="flex items-center justify-center mb-1">
                <Target className="h-4 w-4 text-primary mr-1" />
              </div>
              <p className="text-sm font-semibold text-card-foreground">$7,200</p>
              <p className="text-xs text-muted-foreground">Remaining</p>
            </div>
          </div>
        </div>

        {/* Add Contribution */}
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold">Recent Contributions</h2>
          <Button onClick={() => setShowAdd(!showAdd)} size="sm" className="gap-1">
            <Plus className="h-4 w-4" /> Add
          </Button>
        </div>

        {showAdd && (
          <div className="bg-card rounded-xl p-6 card-shadow mb-6 animate-scale-in">
            <h3 className="font-semibold mb-4">New Contribution</h3>
            <div className="flex gap-3">
              <Input type="number" placeholder="Amount ($)" className="flex-1" />
              <Input type="text" placeholder="Note (optional)" className="flex-1" />
              <Button>Save</Button>
            </div>
          </div>
        )}

        {/* Transaction History */}
        <div className="bg-card rounded-xl card-shadow overflow-hidden">
          {mockTransactions.map((tx, i) => (
            <div
              key={tx.id}
              className={`flex items-center justify-between px-6 py-4 ${
                i < mockTransactions.length - 1 ? "border-b" : ""
              }`}
            >
              <div>
                <p className="font-medium text-card-foreground">{tx.note}</p>
                <p className="text-sm text-muted-foreground">{tx.date}</p>
              </div>
              <p className="font-semibold text-primary">+${tx.amount}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Wallet;
