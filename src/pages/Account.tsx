import { useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { RequireAuth, EmptyState } from "@/components/StateHelpers";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { toast } from "@/hooks/use-toast";
import {
  Edit,
  ShoppingBag,
  MessageCircle,
  Package,
  FileText,
  Phone,
  CreditCard,
  Star,
  LogOut,
  Lock,
} from "lucide-react";

const demoProfile = {
  full_name: "Fatima Ahmed",
  email: "fatima@example.com",
  phone: "+1 (555) 123-4567",
  tier: "Gold",
  membership_status: "active",
  points_total: 1890,
  member_since: "January 2025",
  wallet_balance: 2450,
  community_posts: 23,
  helpful_votes: 45,
};

const demoActivity = [
  { icon: "💰", description: "Contributed $100 to wallet", time: "2 hours ago" },
  { icon: "💬", description: "Posted 'First-time Hajj tips'", time: "1 day ago" },
  { icon: "💬", description: "Replied to 'Savings challenge'", time: "2 days ago" },
  { icon: "👍", description: "Received 5 likes on your reply", time: "3 days ago" },
  { icon: "💰", description: "Contributed $50 to wallet", time: "1 week ago" },
  { icon: "⭐", description: "Earned 25 points for Best Answer", time: "1 week ago" },
];

const notificationTypes = [
  { key: "contributions", label: "Contributions", desc: "Wallet deposits and updates" },
  { key: "membership", label: "Membership", desc: "Billing and tier changes" },
  { key: "bookings", label: "Bookings", desc: "Package and travel updates" },
  { key: "community", label: "Community", desc: "Posts, replies, and likes" },
  { key: "sponsorship", label: "Sponsorship", desc: "Sponsorship cycle updates" },
  { key: "system_notifications", label: "System", desc: "Security and account alerts" },
  { key: "store", label: "Store", desc: "Order and shipping updates" },
];

const tierBadgeClass: Record<string, string> = {
  Silver: "tier-badge-silver",
  Gold: "tier-badge-gold",
  Platinum: "tier-badge-platinum",
};

const AccountContent = () => {
  const { user, signOut } = useAuth();
  const p = demoProfile;
  const tierProgress = (p.points_total / 2000) * 100;
  const pointsToNext = p.tier === "Gold" ? 2000 - p.points_total : p.tier === "Silver" ? 1000 - p.points_total : 0;

  const handleSignOut = async () => {
    await signOut();
    toast({ title: "Signed out" });
  };

  return (
    <div className="section-padding min-h-screen">
      <div className="container mx-auto max-w-4xl">
        {/* Profile Header */}
        <div className="bg-card rounded-xl card-shadow p-6 mb-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
            <div className="flex items-center gap-4">
              <div className="w-20 h-20 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-2xl font-bold">
                {p.full_name.split(" ").map((n) => n[0]).join("")}
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h2 className="text-2xl font-bold">{p.full_name}</h2>
                  <span className={tierBadgeClass[p.tier]}>{p.tier}</span>
                </div>
                <p className="text-sm text-muted-foreground">{user?.email}</p>
                <p className="text-xs text-muted-foreground">Member since {p.member_since}</p>
              </div>
            </div>
            <Button variant="ghost" size="sm" className="gap-1">
              <Edit className="h-4 w-4" /> Edit Profile
            </Button>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[
              { icon: "💰", label: "Wallet Balance", value: `$${p.wallet_balance.toLocaleString()}` },
              { icon: "⭐", label: "Reward Points", value: p.points_total.toLocaleString() },
              { icon: "💬", label: "Community Posts", value: p.community_posts.toString() },
              { icon: "👍", label: "Helpful Votes", value: p.helpful_votes.toString() },
            ].map((s) => (
              <div key={s.label} className="bg-secondary rounded-lg p-3 text-center">
                <span className="text-lg">{s.icon}</span>
                <p className="text-lg font-bold">{s.value}</p>
                <p className="text-xs text-muted-foreground">{s.label}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="overview">
          <TabsList className="mb-6">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="activity">Activity</TabsTrigger>
            <TabsTrigger value="settings">Settings</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            {/* Membership Progress */}
            <div className="bg-card rounded-xl card-shadow p-6">
              <h3 className="font-semibold mb-4">Membership Tier Progress</h3>
              <Progress value={tierProgress} className="h-3 mb-2" />
              <div className="flex justify-between text-xs text-muted-foreground mb-2">
                <span>Silver (0)</span>
                <span>Gold (1,000)</span>
                <span>Platinum (2,000)</span>
              </div>
              {pointsToNext > 0 && (
                <p className="text-sm text-primary font-medium">
                  You're {pointsToNext} points away from {p.tier === "Gold" ? "Platinum" : "Gold"}!
                </p>
              )}
            </div>

            {/* Savings Goal */}
            <div className="bg-card rounded-xl card-shadow p-6">
              <h3 className="font-semibold mb-2">Hajj Savings Goal</h3>
              <Progress value={98} className="h-3 mb-2" />
              <div className="flex justify-between text-sm mb-2">
                <span className="font-bold text-primary">${p.wallet_balance.toLocaleString()}</span>
                <span className="text-muted-foreground">$2,500</span>
              </div>
              <p className="text-xs text-muted-foreground">Total Saved (lifetime): $8,920</p>
              <Link to="/wallet" className="text-sm text-primary hover:underline mt-2 inline-block">
                Add Funds →
              </Link>
            </div>

            {/* Quick Actions */}
            <div className="grid grid-cols-2 gap-4">
              {[
                { icon: <ShoppingBag className="h-5 w-5" />, title: "Browse Store", desc: "10% member discount", to: "/store" },
                { icon: <MessageCircle className="h-5 w-5" />, title: "Community Forum", desc: "Earn points by helping", to: "/community" },
                { icon: <Package className="h-5 w-5" />, title: "Book Package", desc: "Use wallet balance", to: "/packages" },
                { icon: <FileText className="h-5 w-5" />, title: "Download Reports", desc: "Transaction history", to: "#" },
              ].map((a) => (
                <Link key={a.title} to={a.to} className="bg-card rounded-xl card-shadow p-4 hover:shadow-lg transition-shadow flex items-start gap-3">
                  <div className="p-2 bg-primary/10 rounded-lg text-primary">{a.icon}</div>
                  <div>
                    <p className="font-medium text-sm">{a.title}</p>
                    <p className="text-xs text-muted-foreground">{a.desc}</p>
                  </div>
                </Link>
              ))}
            </div>

            {/* Gold Membership */}
            <div className="bg-card rounded-xl card-shadow p-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="font-semibold flex items-center gap-2">
                    <CreditCard className="h-5 w-5 text-accent" /> Gold Membership
                  </h3>
                  <p className="text-sm text-muted-foreground">Monthly Fee: $25.00 · Next Billing: March 1, 2026</p>
                </div>
                <Badge className="bg-primary text-primary-foreground border-0">Active</Badge>
              </div>
              <div className="grid grid-cols-2 gap-2 text-sm mb-4">
                {["Priority support", "10% store discount", "Exclusive content", "Monthly webinars"].map((perk) => (
                  <div key={perk} className="flex items-center gap-1.5 text-muted-foreground">
                    <Star className="h-3 w-3 text-accent" /> {perk}
                  </div>
                ))}
              </div>
              <div className="flex gap-3">
                <Button variant="outline" size="sm">Update Payment Method</Button>
                <Button size="sm">Upgrade to Platinum</Button>
              </div>
            </div>

            {/* Need Help */}
            <div className="bg-secondary rounded-xl p-6 text-center">
              <h3 className="font-semibold mb-1">Need Help?</h3>
              <p className="text-sm text-muted-foreground flex items-center justify-center gap-2">
                Contact Support: <Phone className="h-4 w-4" /> 1-800-HAJJ-HELP
              </p>
            </div>
          </TabsContent>

          <TabsContent value="activity">
            <div className="bg-card rounded-xl card-shadow p-6">
              <h3 className="font-semibold mb-4">Recent Activity</h3>
              {demoActivity.length === 0 ? (
                <EmptyState
                  icon="📋"
                  title="No activity yet"
                  description="Start engaging with the community!"
                  actionLabel="Visit Community"
                  actionTo="/community"
                />
              ) : (
                <div className="space-y-4">
                  {demoActivity.map((a, i) => (
                    <div key={i} className="flex items-start gap-3">
                      <span className="text-lg mt-0.5">{a.icon}</span>
                      <div className="flex-1">
                        <p className="text-sm">{a.description}</p>
                        <p className="text-xs text-muted-foreground">{a.time}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="settings" className="space-y-6">
            <div className="bg-card rounded-xl card-shadow p-6 space-y-4">
              <h3 className="font-semibold">Profile Information</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2"><Label>Full Name</Label><Input defaultValue={p.full_name} /></div>
                <div className="space-y-2"><Label>Email</Label><Input defaultValue={user?.email || ""} type="email" /></div>
                <div className="space-y-2"><Label>Phone</Label><Input defaultValue={p.phone} type="tel" /></div>
              </div>
            </div>

            <div className="bg-card rounded-xl card-shadow p-6 space-y-4">
              <h3 className="font-semibold flex items-center gap-2"><Lock className="h-4 w-4" /> Change Password</h3>
              <div className="space-y-3">
                <div className="space-y-2"><Label>Current Password</Label><Input type="password" placeholder="••••••••" /></div>
                <div className="space-y-2"><Label>New Password</Label><Input type="password" placeholder="Min 6 characters" /></div>
                <div className="space-y-2"><Label>Confirm New Password</Label><Input type="password" placeholder="Confirm" /></div>
              </div>
            </div>

            <div className="bg-card rounded-xl card-shadow p-6">
              <h3 className="font-semibold mb-4">Notification Preferences</h3>
              <div className="space-y-4">
                {notificationTypes.map((n) => (
                  <div key={n.key} className="flex items-center justify-between">
                    <div><p className="text-sm font-medium">{n.label}</p><p className="text-xs text-muted-foreground">{n.desc}</p></div>
                    <Switch defaultChecked />
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-card rounded-xl card-shadow p-6">
              <h3 className="font-semibold mb-3">Language</h3>
              <select className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm">
                <option>English</option>
                <option>العربية</option>
                <option>Français</option>
                <option>Türkçe</option>
                <option>Bahasa Indonesia</option>
              </select>
            </div>

            <div className="flex gap-3">
              <Button className="flex-1" onClick={() => toast({ title: "Settings saved!" })}>Save Changes</Button>
              <Button variant="destructive" className="gap-2" onClick={handleSignOut}><LogOut className="h-4 w-4" /> Sign Out</Button>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

const Account = () => (
  <RequireAuth>
    <AccountContent />
  </RequireAuth>
);

export default Account;
