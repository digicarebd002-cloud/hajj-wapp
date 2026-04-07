import { useState, useEffect, useRef, useCallback } from "react";
import SEOHead from "@/components/SEOHead";
import { Link } from "react-router-dom";
import { Camera, Loader2, Gift, Copy, Users, Share2, BarChart3, CalendarDays, CheckCircle2, XCircle, RefreshCw } from "lucide-react";
import UserAnalytics from "@/components/UserAnalytics";
import PushNotificationToggle from "@/components/PushNotificationToggle";
import TwoFactorSetup from "@/components/TwoFactorSetup";
import { useAuth } from "@/contexts/AuthContext";
import { RequireAuth, EmptyState, CardSkeleton, ErrorState } from "@/components/StateHelpers";
import { useProfile, usePointsLedger, useNotificationPreferences, useWallet, useWalletTransactions } from "@/hooks/use-supabase-data";
import { useWalletSubscription } from "@/hooks/use-wallet-subscription";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { useReferral } from "@/hooks/use-referral";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { toast } from "@/hooks/use-toast";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { motion, AnimatePresence } from "framer-motion";
import {
  ShoppingBag, MessageCircle, Package, FileText, Plane,
  Phone, CreditCard, Lock, LogOut, Edit, Check, X,
  TrendingUp, Award, Zap, Star, ThumbsUp, MessageSquare,
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

const actionLabels: Record<string, { label: string; icon: React.ReactNode; color: string }> = {
  create_discussion: { label: "Created a Discussion", icon: <MessageSquare className="h-4 w-4" />, color: "bg-blue-500/15 text-blue-400" },
  create_reply: { label: "Replied to a Thread", icon: <MessageCircle className="h-4 w-4" />, color: "bg-violet-500/15 text-violet-400" },
  receive_like: { label: "Received a Like", icon: <ThumbsUp className="h-4 w-4" />, color: "bg-pink-500/15 text-pink-400" },
  best_answer: { label: "Best Answer Award", icon: <Star className="h-4 w-4" />, color: "bg-amber-500/15 text-amber-400" },
  admin_adjustment: { label: "Admin Adjustment", icon: <Zap className="h-4 w-4" />, color: "bg-primary/15 text-primary" },
  wallet_contribution: { label: "Wallet Contribution", icon: <CreditCard className="h-4 w-4" />, color: "bg-emerald-500/15 text-emerald-400" },
  referral_bonus: { label: "Referral Bonus", icon: <Gift className="h-4 w-4" />, color: "bg-orange-500/15 text-orange-400" },
  referral_welcome: { label: "Welcome Bonus", icon: <Gift className="h-4 w-4" />, color: "bg-teal-500/15 text-teal-400" },
};

function timeAgo(date: string) {
  const s = Math.floor((Date.now() - new Date(date).getTime()) / 1000);
  if (s < 60) return "just now";
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  if (s < 604800) return `${Math.floor(s / 86400)}d ago`;
  return new Date(date).toLocaleDateString();
}

// --- Goal Amount Inline Editor ---
const GoalEditor = ({ wallet, onSaved }: { wallet: any; onSaved: () => void }) => {
  const { user } = useAuth();
  const [editing, setEditing] = useState(false);
  const [val, setVal] = useState(String(wallet?.goal_amount ?? 2500));

  const save = async () => {
    const num = parseFloat(val);
    if (!num || num <= 0 || !user) return;
    const { error } = await supabase.from("wallets").update({ goal_amount: num }).eq("user_id", user.id);
    if (error) toast({ title: "Error", description: error.message, variant: "destructive" });
    else { toast({ title: "Goal updated!" }); onSaved(); }
    setEditing(false);
  };

  if (!editing) {
    return (
      <button onClick={() => setEditing(true)} className="inline-flex items-center gap-1 text-muted-foreground hover:text-primary transition-colors text-sm">
        ${Number(wallet?.goal_amount ?? 2500).toLocaleString()} <Edit className="h-3 w-3" />
      </button>
    );
  }

  return (
    <div className="inline-flex items-center gap-1">
      <Input type="number" value={val} onChange={(e) => setVal(e.target.value)} className="w-28 h-7 text-sm" />
      <Button size="icon" variant="ghost" className="h-7 w-7" onClick={save}><Check className="h-3 w-3" /></Button>
      <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => setEditing(false)}><X className="h-3 w-3" /></Button>
    </div>
  );
};

// --- Debounced Notification Toggle ---
const NotifToggle = ({ notifKey, defaultVal, userId }: { notifKey: string; defaultVal: boolean; userId: string }) => {
  const timerRef = useRef<ReturnType<typeof setTimeout>>();
  const [checked, setChecked] = useState(defaultVal);

  const handleChange = useCallback((val: boolean) => {
    setChecked(val);
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(async () => {
      await supabase.from("notification_preferences").update({ [notifKey]: val } as any).eq("user_id", userId);
    }, 500);
  }, [notifKey, userId]);

  useEffect(() => () => { if (timerRef.current) clearTimeout(timerRef.current); }, []);

  return <Switch checked={checked} onCheckedChange={handleChange} />;
};

// --- Points Showcase Section ---
const PointsShowcase = ({ pointsTotal, tier }: { pointsTotal: number; tier: string }) => {
  const { data: points, loading } = usePointsLedger(50);
  const [pointRules, setPointRules] = useState<{ label: string; points: number }[]>([]);

  useEffect(() => {
    supabase.from("points_rules").select("label, points").order("created_at").then(({ data }) => {
      setPointRules((data as any[]) || []);
    });
  }, []);

  // Calculate stats from history
  const stats = (() => {
    if (!points) return { total: pointsTotal, thisMonth: 0, discussions: 0, replies: 0, likes: 0, bestAnswers: 0 };
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    let thisMonth = 0, discussions = 0, replies = 0, likes = 0, bestAnswers = 0;
    points.forEach(p => {
      if (new Date(p.created_at) >= monthStart) thisMonth += p.points;
      if (p.action === "create_discussion") discussions++;
      if (p.action === "create_reply") replies++;
      if (p.action === "receive_like") likes++;
      if (p.action === "best_answer") bestAnswers++;
    });
    return { total: pointsTotal, thisMonth, discussions, replies, likes, bestAnswers };
  })();

  if (loading) return <CardSkeleton />;

  return (
    <div className="space-y-6">
      {/* Points Overview Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-gradient-to-br from-primary/20 to-primary/5 rounded-xl p-5 border border-primary/20 col-span-2 md:col-span-1">
          <div className="flex items-center gap-2 mb-2">
            <Award className="h-5 w-5 text-primary" />
            <span className="text-sm font-medium text-muted-foreground">Total Points</span>
          </div>
          <p className="text-3xl font-bold text-primary">{stats.total.toLocaleString()}</p>
          <p className="text-xs text-muted-foreground mt-1">{tier} Member</p>
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }} className="bg-card rounded-xl p-5 card-shadow">
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp className="h-4 w-4 text-emerald-400" />
            <span className="text-xs font-medium text-muted-foreground">This Month</span>
          </div>
          <p className="text-2xl font-bold">+{stats.thisMonth}</p>
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="bg-card rounded-xl p-5 card-shadow">
          <div className="flex items-center gap-2 mb-2">
            <Star className="h-4 w-4 text-amber-400" />
            <span className="text-xs font-medium text-muted-foreground">Best Answers</span>
          </div>
          <p className="text-2xl font-bold">{stats.bestAnswers}</p>
        </motion.div>
      </div>

      {/* Engagement Breakdown */}
      <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }} className="bg-card rounded-xl card-shadow p-6">
        <h3 className="font-semibold mb-4 flex items-center gap-2"><Zap className="h-4 w-4 text-primary" /> Engagement Breakdown</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: "Discussions", value: stats.discussions, icon: <MessageSquare className="h-4 w-4" />, color: "text-blue-400" },
            { label: "Replies", value: stats.replies, icon: <MessageCircle className="h-4 w-4" />, color: "text-violet-400" },
            { label: "Likes Received", value: stats.likes, icon: <ThumbsUp className="h-4 w-4" />, color: "text-pink-400" },
            { label: "Best Answers", value: stats.bestAnswers, icon: <Star className="h-4 w-4" />, color: "text-amber-400" },
          ].map((item, i) => (
            <div key={item.label} className="flex items-center gap-3 p-3 bg-secondary/50 rounded-lg">
              <span className={item.color}>{item.icon}</span>
              <div>
                <p className="text-lg font-bold">{item.value}</p>
                <p className="text-xs text-muted-foreground">{item.label}</p>
              </div>
            </div>
          ))}
        </div>
      </motion.div>

      {/* How to Earn */}
      {pointRules.length > 0 && (
        <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="bg-secondary/50 rounded-xl p-6">
          <h3 className="font-semibold mb-3 flex items-center gap-2">✨ How to Earn Points</h3>
          <div className="grid grid-cols-2 gap-3">
            {pointRules.map((r) => (
              <div key={r.label} className="flex items-center justify-between bg-card/50 rounded-lg px-4 py-3">
                <span className="text-sm">{r.label}</span>
                <Badge className="bg-primary/15 text-primary border-primary/30 font-bold">+{r.points}</Badge>
              </div>
            ))}
          </div>
        </motion.div>
      )}

      {/* Points History */}
      <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }} className="bg-card rounded-xl card-shadow p-6">
        <h3 className="font-semibold mb-4">Points History</h3>
        {!points || points.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-8">No points activity yet. Start engaging in the community!</p>
        ) : (
          <div className="space-y-3">
            <AnimatePresence>
              {points.map((p, i) => {
                const meta = actionLabels[p.action] || { label: p.action.replace(/_/g, " "), icon: <Zap className="h-4 w-4" />, color: "bg-muted text-muted-foreground" };
                return (
                  <motion.div
                    key={p.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.03 }}
                    className="flex items-center gap-3 p-3 rounded-lg hover:bg-secondary/30 transition-colors"
                  >
                    <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${meta.color}`}>
                      {meta.icon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{meta.label}</p>
                      <p className="text-xs text-muted-foreground">{timeAgo(p.created_at)}</p>
                    </div>
                    <span className={`font-bold text-sm ${p.points >= 0 ? "text-primary" : "text-destructive"}`}>
                      {p.points >= 0 ? "+" : ""}{p.points} pts
                    </span>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        )}
      </motion.div>
    </div>
  );
};

// --- Activity Feed (merged from points_ledger + wallet_transactions) ---
const ActivityFeed = ({ userId }: { userId: string }) => {
  const { data: points, loading: pLoading, error: pError, refetch } = usePointsLedger(30);
  const { data: txs, loading: tLoading } = useWalletTransactions();
  const loading = pLoading || tLoading;

  const merged = (() => {
    const items: { id: string; icon: React.ReactNode; iconColor: string; text: string; date: string; points?: string }[] = [];
    (points ?? []).forEach((p) => {
      const meta = actionLabels[p.action] || { label: p.action.replace(/_/g, " "), icon: <Zap className="h-4 w-4" />, color: "bg-muted text-muted-foreground" };
      items.push({
        id: p.id,
        icon: meta.icon,
        iconColor: meta.color,
        text: meta.label,
        date: p.created_at,
        points: `${p.points >= 0 ? "+" : ""}${p.points} pts`,
      });
    });
    (txs ?? []).filter(t => t.status === "completed" && t.amount > 0).forEach((t) => items.push({
      id: t.id,
      icon: <CreditCard className="h-4 w-4" />,
      iconColor: "bg-emerald-500/15 text-emerald-400",
      text: `Wallet contribution — $${Number(t.amount).toLocaleString()}`,
      date: t.created_at,
    }));
    items.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    return items.slice(0, 20);
  })();

  if (loading) return <CardSkeleton />;
  if (pError) return <ErrorState message={pError} onRetry={refetch} />;
  if (merged.length === 0) return (
    <EmptyState icon="📋" title="No activity yet" description="Start by making a contribution or joining the community!" actionLabel="Visit Community" actionTo="/community" />
  );

  return (
    <div className="space-y-3">
      {merged.map((item) => (
        <div key={item.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-secondary/30 transition-colors">
          <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${item.iconColor}`}>
            {item.icon}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">{item.text}</p>
            <p className="text-xs text-muted-foreground">{timeAgo(item.date)}</p>
          </div>
          {item.points && <span className="text-sm font-semibold text-primary">{item.points}</span>}
        </div>
      ))}
    </div>
  );
};

const AccountContent = () => {
  const { user, signOut } = useAuth();
  const { data: profile, loading: profileLoading, error: profileError, refetch: refetchProfile } = useProfile();
  const { data: wallet, loading: walletLoading, refetch: refetchWallet } = useWallet();
  const { data: transactions } = useWalletTransactions();
  const { data: notifPrefs, loading: notifsLoading } = useNotificationPreferences();
  const { config: subConfig, loading: subLoading, actionLoading: subActionLoading, subscribe, cancelSubscription, isActive: hasActiveSub, error: subError } = useWalletSubscription();
  const [userOrders, setUserOrders] = useState<{ total: number; created_at: string; status: string }[] | null>(null);
  const [userBookings, setUserBookings] = useState<{ created_at: string; status: string }[] | null>(null);
  const [communityStats, setCommunityStats] = useState({ posts: 0, helpfulVotes: 0 });

  useEffect(() => {
    if (!user) return;
    supabase.from("orders").select("total, created_at, status").eq("user_id", user.id).then(({ data }) => setUserOrders(data || []));
    supabase.from("bookings").select("created_at, status").eq("user_id", user.id).then(({ data }) => setUserBookings(data || []));
    // Fetch community stats for header pills
    Promise.all([
      supabase.from("discussions").select("id", { count: "exact", head: true }).eq("user_id", user.id),
      supabase.from("replies").select("id", { count: "exact", head: true }).eq("user_id", user.id),
      supabase.from("post_likes").select("id", { count: "exact", head: true }).eq("user_id", user.id),
    ]).then(([disc, rep, likes]) => {
      setCommunityStats({
        posts: (disc.count ?? 0) + (rep.count ?? 0),
        helpfulVotes: likes.count ?? 0,
      });
    });
  }, [user]);
  const { code: referralCode, stats: referralStats, getReferralLink } = useReferral();
  const [avatarUploading, setAvatarUploading] = useState(false);
  const avatarInputRef = useRef<HTMLInputElement>(null);

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    // Validate
    if (!file.type.startsWith("image/")) {
      toast({ title: "Please upload an image file only", variant: "destructive" });
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast({ title: "File size must not exceed 5MB", variant: "destructive" });
      return;
    }

    setAvatarUploading(true);
    try {
      const ext = file.name.split(".").pop();
      const filePath = `${user.id}/avatar.${ext}`;

      // Upload (upsert)
      const { error: uploadError } = await supabase.storage
        .from("avatars")
        .upload(filePath, file, { upsert: true, cacheControl: "0" });

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: urlData } = supabase.storage.from("avatars").getPublicUrl(filePath);
      const avatarUrl = `${urlData.publicUrl}?t=${Date.now()}`;

      // Update profile
      const { error: updateError } = await supabase
        .from("profiles")
        .update({ avatar_url: avatarUrl })
        .eq("user_id", user.id);

      if (updateError) throw updateError;

      toast({ title: "Profile picture updated!" });
      refetchProfile();
    } catch (err: any) {
      toast({ title: "Upload failed", description: err.message, variant: "destructive" });
    } finally {
      setAvatarUploading(false);
      if (avatarInputRef.current) avatarInputRef.current.value = "";
    }
  };

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
        <SEOHead title="My Account" description="Manage your Hajj Wallet profile, track savings, view activity, and update settings." noindex />
        <div className="container mx-auto max-w-5xl">
          {/* Profile Header */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="rounded-2xl p-6 md:p-8 mb-6 text-white relative overflow-hidden" style={{ background: "linear-gradient(135deg, hsl(150, 45%, 14%), hsl(142, 50%, 22%), hsl(150, 45%, 14%))" }}>
            {/* Animated dots overlay */}
            <div className="absolute inset-0 opacity-10">
              {Array.from({ length: 20 }).map((_, i) => (
                <motion.div
                  key={i}
                  className="absolute rounded-full bg-white"
                  style={{
                    width: 3 + Math.random() * 4,
                    height: 3 + Math.random() * 4,
                    left: `${Math.random() * 100}%`,
                    top: `${Math.random() * 100}%`,
                  }}
                  animate={{
                    opacity: [0.3, 0.8, 0.3],
                    scale: [1, 1.3, 1],
                  }}
                  transition={{
                    duration: 2 + Math.random() * 3,
                    repeat: Infinity,
                    delay: Math.random() * 2,
                  }}
                />
              ))}
            </div>
          <div className="relative z-10">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
            <div className="flex items-center gap-4">
              {/* Avatar with upload */}
              <div className="relative group">
                <Avatar className="h-20 w-20 ring-3 ring-white/30 ring-offset-2 ring-offset-transparent">
                  <AvatarImage src={p.avatar_url || ""} alt={p.full_name} />
                  <AvatarFallback className="bg-white/20 text-white text-2xl font-bold">
                    {initials}
                  </AvatarFallback>
                </Avatar>
                <button
                  onClick={() => avatarInputRef.current?.click()}
                  disabled={avatarUploading}
                  className="absolute inset-0 rounded-full bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center cursor-pointer"
                >
                  {avatarUploading ? (
                    <Loader2 className="h-6 w-6 text-white animate-spin" />
                  ) : (
                    <Camera className="h-6 w-6 text-white" />
                  )}
                </button>
                <input
                  ref={avatarInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleAvatarUpload}
                />
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h2 className="text-2xl font-bold text-white">{p.full_name || "New Member"}</h2>
                  <span className={tierBadgeClass[p.tier]}>{p.tier}</span>
                </div>
                <p className="text-sm text-white/70">{user?.email}</p>
                <p className="text-xs text-white/50">Member since {new Date(p.created_at).toLocaleDateString("en-US", { month: "long", year: "numeric" })}</p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[
              { icon: "💰", label: "Wallet Balance", value: `$${Number(walletBalance).toLocaleString()}`, highlight: true },
              { icon: "⭐", label: "Reward Points", value: p.points_total.toLocaleString(), highlight: false },
              { icon: "📝", label: "Posts", value: communityStats.posts.toLocaleString(), highlight: false },
              { icon: "👍", label: "Helpful Votes", value: communityStats.helpfulVotes.toLocaleString(), highlight: false },
            ].map((s) => (
              <div key={s.label} className={`rounded-xl p-4 text-center border transition-all ${s.highlight ? "bg-white/15 border-white/20" : "bg-white/10 border-white/10"}`}>
                <span className="text-xl block mb-1">{s.icon}</span>
                <p className={`text-lg font-bold capitalize ${s.highlight ? "text-white" : "text-white"}`}>{s.value}</p>
                <p className="text-xs text-white/60 font-medium">{s.label}</p>
              </div>
            ))}
          </div>
          </div>
        </motion.div>

        {/* Tabs */}
        <Tabs defaultValue="overview">
          <div className="mb-2">
            <p className="text-xs text-muted-foreground font-medium flex items-center gap-1.5 mb-3">
              <span className="inline-block w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
              Tap a section below to explore
            </p>
          </div>
          <TabsList className="mb-8 w-full grid grid-cols-3 md:grid-cols-6 gap-2 bg-transparent h-auto p-0">
            {[
              { value: "overview", icon: <TrendingUp className="h-5 w-5" />, label: "Overview" },
              { value: "subscription", icon: <CreditCard className="h-5 w-5" />, label: "Subscription" },
              { value: "analytics", icon: <BarChart3 className="h-5 w-5" />, label: "Analytics" },
              { value: "points", icon: <Award className="h-5 w-5" />, label: "Points" },
              { value: "activity", icon: <MessageCircle className="h-5 w-5" />, label: "Activity" },
              { value: "settings", icon: <Lock className="h-5 w-5" />, label: "Settings" },
            ].map((tab) => (
              <TabsTrigger
                key={tab.value}
                value={tab.value}
                asChild
              >
                <motion.button
                  whileHover={{ scale: 1.05, y: -2 }}
                  whileTap={{ scale: 0.97 }}
                  className="flex flex-col items-center gap-1.5 py-3.5 px-2 rounded-xl border-2 border-border bg-card shadow-sm cursor-pointer transition-colors duration-200 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:border-primary data-[state=active]:shadow-lg data-[state=inactive]:hover:border-primary/50 data-[state=inactive]:hover:bg-primary/5 data-[state=inactive]:hover:shadow-md h-auto group"
                >
                  <span className="transition-transform duration-200 group-hover:scale-110">{tab.icon}</span>
                  <span className="text-xs font-semibold">{tab.label}</span>
                  <span className="w-4 h-0.5 rounded-full bg-current opacity-0 data-[state=active]:opacity-100 group-hover:opacity-50 transition-opacity" />
                </motion.button>
              </TabsTrigger>
            ))}
          </TabsList>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Main Content */}
            <div className="lg:col-span-2">

          <TabsContent value="overview" className="space-y-6">
            {/* Membership Progress */}
            <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} className="bg-card rounded-xl card-shadow p-6">
              <h3 className="font-semibold mb-4 flex items-center gap-2">
                <Award className="h-5 w-5 text-primary" /> Membership Tier Progress
              </h3>
              <Progress value={tierProgress} className="h-3 mb-3" />
              <div className="flex justify-between text-xs font-medium text-muted-foreground mb-2">
                <span className="px-2 py-0.5 rounded-full bg-muted">Silver (0)</span>
                <span className="px-2 py-0.5 rounded-full bg-primary/10 text-primary">Gold (1,000)</span>
                <span className="px-2 py-0.5 rounded-full bg-muted">Platinum (2,000)</span>
              </div>
              {pointsToNext > 0 && (
                <p className="text-sm text-primary font-semibold mt-2">🎯 You're {pointsToNext} points away from {nextTier}!</p>
              )}
            </motion.div>

            {/* Savings Goal */}
            <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }} className="bg-card rounded-xl card-shadow p-6">
              <h3 className="font-semibold mb-3 flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-primary" /> Hajj Savings Goal
              </h3>
              <Progress value={savingsProgress} className="h-4 mb-3" />
              <div className="flex justify-between text-sm mb-2 items-center">
                <span className="text-lg font-bold text-primary">${Number(walletBalance).toLocaleString()}</span>
                <GoalEditor wallet={wallet} onSaved={refetchWallet} />
              </div>
              <Link to="/wallet" className="inline-flex items-center gap-1 text-sm text-primary font-semibold hover:underline mt-2">
                <CreditCard className="h-3.5 w-3.5" /> Add Funds →
              </Link>
            </motion.div>

            {/* Quick Actions */}
            <div className="grid grid-cols-2 gap-3">
              {[
                { icon: <ShoppingBag className="h-5 w-5" />, title: "Browse Store", desc: "10% member discount", to: "/store" },
                { icon: <MessageCircle className="h-5 w-5" />, title: "Community Forum", desc: "Earn points by helping", to: "/community" },
                { icon: <Plane className="h-5 w-5" />, title: "Book Package", desc: "Use wallet balance", to: "/packages" },
                { icon: <FileText className="h-5 w-5" />, title: "Download Reports", desc: "Transaction history", to: "#download-reports" },
              ].map((a, i) => (
                <motion.div key={a.title} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 * i }}>
                  {a.to === "#download-reports" ? (
                    <button
                      onClick={() => {
                        if (!transactions || transactions.length === 0) { toast({ title: "No transactions to export" }); return; }
                        const header = "Date,Type,Amount,Status\n";
                        const rows = transactions.map((t: any) => `${new Date(t.created_at).toLocaleDateString()},${t.type},$${t.amount},${t.status}`).join("\n");
                        const blob = new Blob([header + rows], { type: "text/csv" });
                        const url = URL.createObjectURL(blob);
                        const link = document.createElement("a");
                        link.href = url; link.download = "hajj-wallet-transactions.csv"; link.click();
                        URL.revokeObjectURL(url);
                        toast({ title: "Report downloaded!" });
                      }}
                      className="bg-card rounded-xl border p-4 hover:border-primary/40 hover:shadow-md transition-all flex items-start gap-3 h-full w-full text-left group"
                    >
                      <div className="p-2.5 bg-primary/10 rounded-xl text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-colors">{a.icon}</div>
                      <div><p className="font-semibold text-sm">{a.title}</p><p className="text-xs text-muted-foreground">{a.desc}</p></div>
                    </button>
                  ) : (
                    <Link to={a.to} className="bg-card rounded-xl border p-4 hover:border-primary/40 hover:shadow-md transition-all flex items-start gap-3 h-full block group">
                      <div className="p-2.5 bg-primary/10 rounded-xl text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-colors">{a.icon}</div>
                      <div><p className="font-semibold text-sm">{a.title}</p><p className="text-xs text-muted-foreground">{a.desc}</p></div>
                    </Link>
                  )}
                </motion.div>
              ))}
            </div>

            {/* Referral Card */}
            {referralCode && (
              <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} className="bg-card rounded-xl card-shadow p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                    <Gift className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold">Invite Friends, Earn Points</h3>
                    <p className="text-xs text-muted-foreground">You earn <strong>50 pts</strong> per referral, they get <strong>25 pts</strong></p>
                  </div>
                </div>

                <div className="flex items-center gap-2 mb-4">
                  <div className="flex-1 bg-secondary rounded-lg px-4 py-2.5 font-mono text-sm font-bold tracking-wider text-foreground">
                    {referralCode}
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    className="gap-1.5 shrink-0"
                    onClick={() => {
                      navigator.clipboard.writeText(getReferralLink());
                      toast({ title: "Link copied!", description: "Share it with your friends." });
                    }}
                  >
                    <Copy className="h-3.5 w-3.5" /> Copy Link
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="gap-1.5 shrink-0"
                    onClick={() => {
                      if (navigator.share) {
                        navigator.share({ title: "Join Hajj Wallet", text: "Join Hajj Wallet and get 25 bonus points!", url: getReferralLink() });
                      } else {
                        navigator.clipboard.writeText(getReferralLink());
                        toast({ title: "Link copied!" });
                      }
                    }}
                  >
                    <Share2 className="h-3.5 w-3.5" />
                  </Button>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div className="bg-primary/10 border border-primary/20 rounded-lg p-3 text-center">
                    <p className="text-lg font-bold text-primary">{referralStats.completed}</p>
                    <p className="text-xs text-muted-foreground font-medium">Referrals</p>
                  </div>
                  <div className="bg-primary/10 border border-primary/20 rounded-lg p-3 text-center">
                    <p className="text-lg font-bold text-primary">{referralStats.totalPoints}</p>
                    <p className="text-xs text-muted-foreground font-medium">Points Earned</p>
                  </div>
                  <div className="bg-primary/10 border border-primary/20 rounded-lg p-3 text-center">
                    <p className="text-lg font-bold text-primary">{referralStats.total - referralStats.completed}</p>
                    <p className="text-xs text-muted-foreground font-medium">Pending</p>
                  </div>
                </div>
              </motion.div>
            )}
          </TabsContent>

          {/* Subscription Tab */}
          <TabsContent value="subscription" className="space-y-6">
            {subLoading ? (
              <CardSkeleton />
            ) : (
              <>
                {/* Subscription Status Card */}
                <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} className="bg-card rounded-xl card-shadow p-6">
                  <div className="flex items-center justify-between mb-5">
                    <h3 className="font-semibold text-lg flex items-center gap-2">
                      <CreditCard className="h-5 w-5 text-primary" /> Membership Subscription
                    </h3>
                    <Badge className={hasActiveSub ? "bg-primary/15 text-primary border-primary/30" : "bg-destructive/15 text-destructive border-destructive/30"}>
                      {hasActiveSub ? "Active" : "Inactive"}
                    </Badge>
                  </div>

                  {hasActiveSub && subConfig?.subscription ? (
                    <div className="space-y-4">
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <div className="bg-primary/10 border border-primary/20 rounded-xl p-4">
                          <div className="flex items-center gap-2 mb-1">
                            <CreditCard className="h-4 w-4 text-primary" />
                            <span className="text-xs text-muted-foreground font-medium">Monthly Fee</span>
                          </div>
                          <p className="text-xl font-bold text-primary">${subConfig.subscription.amount}/mo</p>
                        </div>
                        <div className="bg-card border border-border rounded-xl p-4">
                          <div className="flex items-center gap-2 mb-1">
                            <CalendarDays className="h-4 w-4 text-primary" />
                            <span className="text-xs text-muted-foreground font-medium">Started</span>
                          </div>
                          <p className="text-sm font-semibold">
                            {subConfig.subscription.starts_at
                              ? new Date(subConfig.subscription.starts_at).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })
                              : "—"}
                          </p>
                        </div>
                        <div className="bg-card border border-border rounded-xl p-4">
                          <div className="flex items-center gap-2 mb-1">
                            <RefreshCw className="h-4 w-4 text-primary" />
                            <span className="text-xs text-muted-foreground font-medium">Next Billing</span>
                          </div>
                          <p className="text-sm font-semibold">
                            {subConfig.subscription.ends_at
                              ? new Date(subConfig.subscription.ends_at).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })
                              : "—"}
                          </p>
                        </div>
                      </div>

                      {/* Payment Method */}
                      <div className="bg-secondary/50 rounded-lg p-4 flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center">
                          <span className="text-lg font-bold text-blue-500">P</span>
                        </div>
                        <div className="flex-1">
                          <p className="text-sm font-semibold">PayPal</p>
                          <p className="text-xs text-muted-foreground">Subscription ID: {subConfig.subscription.paypal_subscription_id.slice(0, 16)}...</p>
                        </div>
                        <CheckCircle2 className="h-5 w-5 text-primary" />
                      </div>

                      {/* Benefits */}
                      <div className="bg-primary/5 border border-primary/10 rounded-lg p-4">
                        <h4 className="text-sm font-semibold mb-2 flex items-center gap-2">
                          <CheckCircle2 className="h-4 w-4 text-primary" /> Active Benefits
                        </h4>
                        <ul className="text-sm text-muted-foreground space-y-1.5">
                          <li className="flex items-center gap-2"><CheckCircle2 className="h-3.5 w-3.5 text-primary" /> Add funds to your Hajj Savings Wallet</li>
                          <li className="flex items-center gap-2"><CheckCircle2 className="h-3.5 w-3.5 text-primary" /> Access to exclusive member discounts</li>
                          <li className="flex items-center gap-2"><CheckCircle2 className="h-3.5 w-3.5 text-primary" /> Priority support & booking assistance</li>
                          <li className="flex items-center gap-2"><CheckCircle2 className="h-3.5 w-3.5 text-primary" /> Earn reward points on contributions</li>
                        </ul>
                      </div>

                      {/* Cancel */}
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="outline" size="sm" className="text-destructive border-destructive/30 hover:bg-destructive/10">
                            Cancel Subscription
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Cancel Subscription?</AlertDialogTitle>
                            <AlertDialogDescription>
                              Your membership will remain active until the end of your current billing cycle. After that, you won't be able to add new funds to your wallet, but existing balance remains usable.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Keep Subscription</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={cancelSubscription}
                              disabled={subActionLoading}
                              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                            >
                              {subActionLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                              Yes, Cancel
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  ) : (
                    <div className="text-center py-8 space-y-4">
                      <div className="w-16 h-16 mx-auto rounded-full bg-muted flex items-center justify-center">
                        <XCircle className="h-8 w-8 text-muted-foreground" />
                      </div>
                      <div>
                        <h4 className="font-semibold text-lg">No Active Subscription</h4>
                        <p className="text-sm text-muted-foreground max-w-sm mx-auto mt-1">
                          Subscribe to unlock wallet contributions, member discounts, and more.
                          {subConfig?.price && <span className="font-semibold text-primary"> Only ${subConfig.price}/month.</span>}
                        </p>
                      </div>
                      {subError && <p className="text-sm text-destructive">{subError}</p>}
                      <Button onClick={subscribe} disabled={subActionLoading} className="gap-2">
                        {subActionLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <CreditCard className="h-4 w-4" />}
                        Activate Membership — ${subConfig?.price ?? 15}/mo
                      </Button>
                    </div>
                  )}
                </motion.div>

                {/* Cancelled Subscription Info */}
                {subConfig?.subscription?.cancelled_at && (
                  <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-4">
                    <p className="text-sm font-medium text-amber-600 dark:text-amber-400 flex items-center gap-2">
                      <CalendarDays className="h-4 w-4" />
                      Subscription cancelled on {new Date(subConfig.subscription.cancelled_at).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}. 
                      Access remains until end of billing cycle.
                    </p>
                  </motion.div>
                )}
              </>
            )}
          </TabsContent>

          {/* Analytics Tab */}
          <TabsContent value="analytics">
            <UserAnalytics
              transactions={transactions}
              wallet={wallet}
              profile={profile}
              orders={userOrders}
              bookings={userBookings}
            />
          </TabsContent>

          {/* Points Tab */}
          <TabsContent value="points">
            <PointsShowcase pointsTotal={p.points_total} tier={p.tier} />
          </TabsContent>

          <TabsContent value="activity">
            <div className="bg-card rounded-xl card-shadow p-6">
              <h3 className="font-semibold mb-4">Recent Activity</h3>
              <ActivityFeed userId={user!.id} />
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

              {/* Two-Factor Authentication */}
              <TwoFactorSetup />

              <div className="bg-card rounded-xl card-shadow p-6 space-y-4">
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
                  <p className="text-xs text-muted-foreground mb-4">Changes are saved automatically.</p>
                  <div className="space-y-4">
                    {notificationTypes.map((n) => (
                      <div key={n.key} className="flex items-center justify-between">
                        <div><p className="text-sm font-medium">{n.label}</p><p className="text-xs text-muted-foreground">{n.desc}</p></div>
                        <NotifToggle notifKey={n.key} defaultVal={notifPrefs[n.key] as boolean} userId={user!.id} />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Push Notification Toggle */}
              <div className="mt-6">
                <PushNotificationToggle />
              </div>

              <div className="flex gap-3 mt-6">
                <Button type="submit" className="flex-1">Save Changes</Button>
                <Button type="button" variant="destructive" className="gap-2" onClick={handleSignOut}><LogOut className="h-4 w-4" /> Sign Out</Button>
              </div>
            </form>
          </TabsContent>
            </div>

            {/* Sidebar */}
            <div className="lg:col-span-1 space-y-4">
              {/* Membership Card */}
              <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="bg-card rounded-xl border p-5">
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                    <CreditCard className="h-4 w-4 text-primary" />
                  </div>
                  <h3 className="font-semibold text-sm">{p.tier} Membership</h3>
                </div>
                <div className="space-y-3">
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-muted-foreground">Monthly Fee</span>
                    <span className="font-bold text-primary">$25</span>
                  </div>
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-muted-foreground">Status</span>
                    <Badge className={`text-xs ${p.membership_status === "active" ? "bg-primary/15 text-primary border-primary/30" : "bg-muted text-muted-foreground"}`}>
                      {p.membership_status}
                    </Badge>
                  </div>
                  {p.next_billing_date && (
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-muted-foreground">Next Billing</span>
                      <span className="font-medium text-xs">{new Date(p.next_billing_date).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}</span>
                    </div>
                  )}
                </div>
                <div className="mt-4 pt-3 border-t border-border">
                  <Link to="/membership" className="text-xs text-primary font-semibold hover:underline">Manage Membership →</Link>
                </div>
              </motion.div>

              {/* Benefits Card */}
              <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }} className="bg-card rounded-xl border p-5">
                <h3 className="font-semibold text-sm mb-3 flex items-center gap-2">
                  <Star className="h-4 w-4 text-primary" /> Your Benefits
                </h3>
                <p className="text-xs text-muted-foreground mb-3">{p.tier} Member Perks</p>
                <ul className="space-y-2.5">
                  {["Priority support", "10% store discount", "Exclusive content", "Monthly webinars"].map((b) => (
                    <li key={b} className="flex items-center gap-2 text-sm">
                      <CheckCircle2 className="h-3.5 w-3.5 text-primary shrink-0" />
                      {b}
                    </li>
                  ))}
                </ul>
                {p.tier !== "Platinum" && (
                  <Link to="/membership" className="block mt-4 text-xs text-primary font-semibold hover:underline">
                    Upgrade to {p.tier === "Silver" ? "Gold" : "Platinum"} →
                  </Link>
                )}
              </motion.div>

              {/* Need Help Card */}
              <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="bg-secondary/50 rounded-xl border p-5 text-center">
                <Phone className="h-5 w-5 mx-auto text-primary mb-2" />
                <h3 className="font-semibold text-sm mb-1">Need Help?</h3>
                <p className="text-xs text-muted-foreground mb-3">Contact Support</p>
                <a href="tel:+18004255435" className="text-sm font-bold text-primary hover:underline">1-800-HAJJ-HELP</a>
                <div className="mt-3">
                  <Link to="/contact">
                    <Button variant="outline" size="sm" className="w-full rounded-lg text-xs">Send Message</Button>
                  </Link>
                </div>
              </motion.div>
            </div>
          </div>
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
