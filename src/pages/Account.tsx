import { useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { RequireAuth, EmptyState, CardSkeleton, ErrorState } from "@/components/StateHelpers";
import { useProfile, usePointsLedger, useNotificationPreferences, useWallet } from "@/hooks/use-supabase-data";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { toast } from "@/hooks/use-toast";
import {
  Edit, ShoppingBag, MessageCircle, Package, FileText,
  Phone, CreditCard, Star, LogOut, Lock,
} from "lucide-react";

const tierBadgeClass: Record<string, string> = {
  Silver: "tier-badge-silver",
  Gold: "tier-badge-gold",
  Platinum: "tier-badge-platinum",
};

const notificationTypes = [
  { key: "contributions" as const, label: "Contributions", desc: "Wallet deposits and updates" },
  { key: "membership" as const, label: "Membership", desc: "Billing and tier changes" },
  { key: "bookings" as const, label: "Bookings", desc: "Package and travel updates" },
  { key: "community" as const, label: "Community", desc: "Posts, replies, and likes" },
  { key: "sponsorship" as const, label: "Sponsorship", desc: "Sponsorship cycle updates" },
  { key: "system_notifications" as const, label: "System", desc: "Security and account alerts" },
  { key: "store" as const, label: "Store", desc: "Order and shipping updates" },
];

const actionIcons: Record<string, string> = {
  create_discussion: "💬",
  create_reply: "💬",
  receive_like: "👍",
  best_answer: "⭐",
  wallet_contribution: "💰",
};

const AccountContent = () => {
  const { user, signOut } = useAuth();
  const { data: profile, loading: profileLoading, error: profileError, refetch: refetchProfile } = useProfile();
  const { data: wallet, loading: walletLoading } = useWallet();
  const { data: activity, loading: activityLoading, error: activityError, refetch: refetchActivity } = usePointsLedger();
  const { data: notifPrefs, loading: notifsLoading } = useNotificationPreferences();

  const handleSignOut = async () => {
    await signOut();
    toast({ title: "Signed out" });
  };

  const handleSaveProfile = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const { error } = await supabase.from("profiles").update({
      full_name: fd.get("full_name") as string,
      phone: fd.get("phone") as string,
    }).eq("user_id", user!.id);
    if (error) toast({ title: "Error saving", description: error.message, variant: "destructive" });
    else { toast({ title: "Settings saved!" }); refetchProfile(); }
  };

  const handleToggleNotif = async (key: string, checked: boolean) => {
    if (!notifPrefs) return;
    await supabase.from("notification_preferences").update({ [key]: checked }).eq("user_id", user!.id);
  };

  if (profileLoading) return <div className="section-padding min-h-screen"><div className="container mx-auto max-w-4xl space-y-6"><CardSkeleton /><CardSkeleton /><CardSkeleton /></div></div>;
  if (profileError) return <div className="section-padding min-h-screen"><div className="container mx-auto max-w-4xl"><ErrorState message={profileError} onRetry={refetchProfile} /></div></div>;
  if (!profile) return <div className="section-padding min-h-screen"><div className="container mx-auto max-w-4xl"><EmptyState icon="👤" title="Profile not found" description="Your profile hasn't been created yet." /></div></div>;

  const p = profile;
  const tierThresholds = { Silver: 0, Gold: 1000, Platinum: 2000 };
  const nextTier = p.tier === "Silver" ? "Gold" : p.tier === "Gold" ? "Platinum" : null;
  const nextThreshold = nextTier ? tierThresholds[nextTier as keyof typeof tierThresholds] : tierThresholds.Platinum;
  const tierProgress = Math.min((p.points_total / nextThreshold) * 100, 100);
  const pointsToNext = nextTier ? nextThreshold - p.points_total : 0;
  const walletBalance = wallet?.balance ?? 0;
  const goalAmount = wallet?.goal_amount ?? 2500;
  const savingsProgress = goalAmount > 0 ? Math.min((walletBalance / goalAmount) * 100, 100) : 0;
  const initials = p.full_name ? p.full_name.split(" ").map((n) => n[0]).join("").slice(0, 2) : "?";

  return (
    <div className="section-padding min-h-screen">
      <div className="container mx-auto max-w-4xl">
        {/* Profile Header */}
        <div className="bg-card rounded-xl card-shadow p-6 mb-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
            <div className="flex items-center gap-4">
              <div className="w-20 h-20 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-2xl font-bold">
                {initials}
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h2 className="text-2xl font-bold">{p.full_name || "New Member"}</h2>
                  <span className={tierBadgeClass[p.tier]}>{p.tier}</span>
                </div>
                <p className="text-sm text-muted-foreground">{user?.email}</p>
                <p className="text-xs text-muted-foreground">Member since {new Date(p.created_at).toLocaleDateString("en-US", { month: "long", year: "numeric" })}</p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[
              { icon: "💰", label: "Wallet Balance", value: `$${Number(walletBalance).toLocaleString()}` },
              { icon: "⭐", label: "Reward Points", value: p.points_total.toLocaleString() },
              { icon: "💬", label: "Tier", value: p.tier },
              { icon: "📊", label: "Status", value: p.membership_status },
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
                <span>Silver (0)</span><span>Gold (1,000)</span><span>Platinum (2,000)</span>
              </div>
              {pointsToNext > 0 && (
                <p className="text-sm text-primary font-medium">You're {pointsToNext} points away from {nextTier}!</p>
              )}
            </div>

            {/* Savings Goal */}
            <div className="bg-card rounded-xl card-shadow p-6">
              <h3 className="font-semibold mb-2">Hajj Savings Goal</h3>
              <Progress value={savingsProgress} className="h-3 mb-2" />
              <div className="flex justify-between text-sm mb-2">
                <span className="font-bold text-primary">${Number(walletBalance).toLocaleString()}</span>
                <span className="text-muted-foreground">${Number(goalAmount).toLocaleString()}</span>
              </div>
              <Link to="/wallet" className="text-sm text-primary hover:underline mt-2 inline-block">Add Funds →</Link>
            </div>

            {/* Quick Actions */}
            <div className="grid grid-cols-2 gap-4">
              {[
                { icon: <ShoppingBag className="h-5 w-5" />, title: "Browse Store", desc: "Member discount", to: "/store" },
                { icon: <MessageCircle className="h-5 w-5" />, title: "Community Forum", desc: "Earn points", to: "/community" },
                { icon: <Package className="h-5 w-5" />, title: "Book Package", desc: "Use wallet balance", to: "/packages" },
                { icon: <FileText className="h-5 w-5" />, title: "My Wallet", desc: "View transactions", to: "/wallet" },
              ].map((a) => (
                <Link key={a.title} to={a.to} className="bg-card rounded-xl card-shadow p-4 hover:shadow-lg transition-shadow flex items-start gap-3">
                  <div className="p-2 bg-primary/10 rounded-lg text-primary">{a.icon}</div>
                  <div><p className="font-medium text-sm">{a.title}</p><p className="text-xs text-muted-foreground">{a.desc}</p></div>
                </Link>
              ))}
            </div>

            {/* Membership */}
            <div className="bg-card rounded-xl card-shadow p-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="font-semibold flex items-center gap-2"><CreditCard className="h-5 w-5 text-accent" /> {p.tier} Membership</h3>
                  <p className="text-sm text-muted-foreground">Status: {p.membership_status}</p>
                </div>
                <Badge className="bg-primary text-primary-foreground border-0 capitalize">{p.membership_status}</Badge>
              </div>
            </div>

            <div className="bg-secondary rounded-xl p-6 text-center">
              <h3 className="font-semibold mb-1">Need Help?</h3>
              <p className="text-sm text-muted-foreground flex items-center justify-center gap-2">Contact Support: <Phone className="h-4 w-4" /> 1-800-HAJJ-HELP</p>
            </div>
          </TabsContent>

          <TabsContent value="activity">
            <div className="bg-card rounded-xl card-shadow p-6">
              <h3 className="font-semibold mb-4">Recent Activity</h3>
              {activityLoading ? <CardSkeleton /> : activityError ? <ErrorState message={activityError} onRetry={refetchActivity} /> : !activity || activity.length === 0 ? (
                <EmptyState icon="📋" title="No activity yet" description="Start engaging with the community to earn points!" actionLabel="Visit Community" actionTo="/community" />
              ) : (
                <div className="space-y-4">
                  {activity.map((a) => (
                    <div key={a.id} className="flex items-start gap-3">
                      <span className="text-lg mt-0.5">{actionIcons[a.action] || "⭐"}</span>
                      <div className="flex-1">
                        <p className="text-sm">{a.action.replace(/_/g, " ")} <span className="font-semibold text-primary">+{a.points} pts</span></p>
                        <p className="text-xs text-muted-foreground">{new Date(a.created_at).toLocaleDateString()}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="settings" className="space-y-6">
            <form onSubmit={handleSaveProfile}>
              <div className="bg-card rounded-xl card-shadow p-6 space-y-4">
                <h3 className="font-semibold">Profile Information</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2"><Label>Full Name</Label><Input name="full_name" defaultValue={p.full_name} /></div>
                  <div className="space-y-2"><Label>Email</Label><Input defaultValue={user?.email || ""} type="email" disabled /></div>
                  <div className="space-y-2"><Label>Phone</Label><Input name="phone" defaultValue={p.phone || ""} type="tel" /></div>
                </div>
              </div>

              <div className="bg-card rounded-xl card-shadow p-6 space-y-4 mt-6">
                <h3 className="font-semibold flex items-center gap-2"><Lock className="h-4 w-4" /> Change Password</h3>
                <div className="space-y-3">
                  <div className="space-y-2"><Label>New Password</Label><Input type="password" placeholder="Min 6 characters" id="new-password" /></div>
                </div>
                <Button type="button" variant="outline" size="sm" onClick={async () => {
                  const pw = (document.getElementById("new-password") as HTMLInputElement)?.value;
                  if (!pw || pw.length < 6) { toast({ title: "Password too short", variant: "destructive" }); return; }
                  const { error } = await supabase.auth.updateUser({ password: pw });
                  if (error) toast({ title: "Error", description: error.message, variant: "destructive" });
                  else toast({ title: "Password updated!" });
                }}>Update Password</Button>
              </div>

              {!notifsLoading && notifPrefs && (
                <div className="bg-card rounded-xl card-shadow p-6 mt-6">
                  <h3 className="font-semibold mb-4">Notification Preferences</h3>
                  <div className="space-y-4">
                    {notificationTypes.map((n) => (
                      <div key={n.key} className="flex items-center justify-between">
                        <div><p className="text-sm font-medium">{n.label}</p><p className="text-xs text-muted-foreground">{n.desc}</p></div>
                        <Switch defaultChecked={notifPrefs[n.key] as boolean} onCheckedChange={(checked) => handleToggleNotif(n.key, checked)} />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex gap-3 mt-6">
                <Button type="submit" className="flex-1">Save Changes</Button>
                <Button type="button" variant="destructive" className="gap-2" onClick={handleSignOut}><LogOut className="h-4 w-4" /> Sign Out</Button>
              </div>
            </form>
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
