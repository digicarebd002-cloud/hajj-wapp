import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import type { Tables } from "@/integrations/supabase/types";

// Generic fetch hook — accepts PromiseLike (Supabase returns PostgrestBuilder)
function useQuery<T>(
  queryFn: () => PromiseLike<{ data: T | null; error: any }>,
  deps: any[] = [],
  { enabled = true }: { enabled?: boolean } = {}
) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refetch = useCallback(async () => {
    if (!enabled) { setLoading(false); return; }
    setLoading(true);
    setError(null);
    const { data, error } = await queryFn();
    if (error) setError(error.message);
    else setData(data);
    setLoading(false);
  }, [...deps, enabled]);

  useEffect(() => { refetch(); }, [refetch]);

  return { data, loading, error, refetch };
}

// --- Profile ---
export function useProfile() {
  const { user } = useAuth();
  return useQuery<Tables<"profiles">>(
    () => supabase.from("profiles").select("*").eq("user_id", user!.id).single(),
    [user?.id],
    { enabled: !!user?.id }
  );
}

// --- Wallet ---
export function useWallet() {
  const { user } = useAuth();
  return useQuery<Tables<"wallets">>(
    () => supabase.from("wallets").select("*").eq("user_id", user!.id).single(),
    [user?.id],
    { enabled: !!user?.id }
  );
}

// --- Wallet Transactions ---
export function useWalletTransactions() {
  const { user } = useAuth();
  return useQuery<Tables<"wallet_transactions">[]>(
    () => supabase.from("wallet_transactions").select("*").eq("user_id", user!.id).order("created_at", { ascending: false }),
    [user?.id],
    { enabled: !!user?.id }
  );
}

// --- Wallet Stats (RPC) ---
export function useWalletStats() {
  const { user } = useAuth();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refetch = useCallback(async () => {
    if (!user?.id) return;
    setLoading(true);
    const { data, error } = await supabase.rpc("get_wallet_stats", { p_user_id: user.id });
    if (error) setError(error.message);
    else setData(data);
    setLoading(false);
  }, [user?.id]);

  useEffect(() => { refetch(); }, [refetch]);
  return { data, loading, error, refetch };
}

// --- Points Ledger (Activity) ---
export function usePointsLedger(limit = 20) {
  const { user } = useAuth();
  return useQuery<Tables<"points_ledger">[]>(
    () => supabase.from("points_ledger").select("*").eq("user_id", user!.id).order("created_at", { ascending: false }).limit(limit),
    [user?.id, limit],
    { enabled: !!user?.id }
  );
}

// --- Notification Preferences ---
export function useNotificationPreferences() {
  const { user } = useAuth();
  return useQuery<Tables<"notification_preferences">>(
    () => supabase.from("notification_preferences").select("*").eq("user_id", user!.id).single(),
    [user?.id],
    { enabled: !!user?.id }
  );
}

// --- Discussions (with profiles, reply_count, like_count) ---
export function useDiscussions() {
  const [data, setData] = useState<any[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refetch = useCallback(async () => {
    setLoading(true);
    setError(null);
    const { data: discussions, error: dErr } = await supabase
      .from("discussions")
      .select("*, reply_count:replies(count)")
      .order("created_at", { ascending: false });

    if (dErr) { setError(dErr.message); setLoading(false); return; }
    if (!discussions || discussions.length === 0) { setData([]); setLoading(false); return; }

    // Fetch author profiles
    const userIds = [...new Set(discussions.map((d) => d.user_id))];
    const { data: profiles } = await supabase.from("profiles").select("user_id, full_name, tier").in("user_id", userIds);
    const profileMap = new Map((profiles ?? []).map((p) => [p.user_id, p]));

    // Fetch like counts per discussion
    const discIds = discussions.map((d) => d.id);
    const { data: likes } = await supabase.from("post_likes").select("discussion_id").in("discussion_id", discIds).not("discussion_id", "is", null);
    const likeMap = new Map<string, number>();
    (likes ?? []).forEach((l) => {
      likeMap.set(l.discussion_id!, (likeMap.get(l.discussion_id!) ?? 0) + 1);
    });

    const enriched = discussions.map((d) => ({
      ...d,
      profiles: profileMap.get(d.user_id) || null,
      like_count: likeMap.get(d.id) ?? 0,
    }));
    setData(enriched);
    setLoading(false);
  }, []);

  useEffect(() => { refetch(); }, [refetch]);
  return { data, loading, error, refetch };
}

// --- Single Discussion ---
export function useDiscussion(id: string) {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refetch = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    setError(null);
    const { data: disc, error: dErr } = await supabase.from("discussions").select("*").eq("id", id).single();
    if (dErr) { setError(dErr.message); setLoading(false); return; }
    const { data: profile } = await supabase.from("profiles").select("full_name, tier").eq("user_id", disc.user_id).single();

    // Get like count for this discussion
    const { count } = await supabase.from("post_likes").select("*", { count: "exact", head: true }).eq("discussion_id", id);

    setData({ ...disc, profiles: profile, like_count: count ?? 0 });
    setLoading(false);
  }, [id]);

  useEffect(() => { refetch(); }, [refetch]);
  return { data, loading, error, refetch };
}

// --- Replies for a discussion ---
export function useReplies(discussionId: string) {
  const [data, setData] = useState<any[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refetch = useCallback(async () => {
    if (!discussionId) return;
    setLoading(true);
    setError(null);
    const { data: replies, error: rErr } = await supabase
      .from("replies")
      .select("*")
      .eq("discussion_id", discussionId)
      .order("is_best_answer", { ascending: false })
      .order("created_at", { ascending: true });

    if (rErr) { setError(rErr.message); setLoading(false); return; }
    if (!replies || replies.length === 0) { setData([]); setLoading(false); return; }

    const userIds = [...new Set(replies.map((r) => r.user_id))];
    const { data: profiles } = await supabase.from("profiles").select("user_id, full_name, tier").in("user_id", userIds);
    const profileMap = new Map((profiles ?? []).map((p) => [p.user_id, p]));

    // Get like counts per reply
    const replyIds = replies.map((r) => r.id);
    const { data: likes } = await supabase.from("post_likes").select("reply_id").in("reply_id", replyIds).not("reply_id", "is", null);
    const likeMap = new Map<string, number>();
    (likes ?? []).forEach((l) => {
      likeMap.set(l.reply_id!, (likeMap.get(l.reply_id!) ?? 0) + 1);
    });

    setData(replies.map((r) => ({ ...r, profiles: profileMap.get(r.user_id) || null, like_count: likeMap.get(r.id) ?? 0 })));
    setLoading(false);
  }, [discussionId]);

  useEffect(() => { refetch(); }, [refetch]);
  return { data, loading, error, refetch };
}

// --- User's liked post IDs (for optimistic UI) ---
export function useUserLikes(userId: string | undefined) {
  const [likedDiscussions, setLikedDiscussions] = useState<Set<string>>(new Set());
  const [likedReplies, setLikedReplies] = useState<Set<string>>(new Set());

  const refetch = useCallback(async () => {
    if (!userId) return;
    const { data } = await supabase.from("post_likes").select("discussion_id, reply_id").eq("user_id", userId);
    const dSet = new Set<string>();
    const rSet = new Set<string>();
    (data ?? []).forEach((l) => {
      if (l.discussion_id) dSet.add(l.discussion_id);
      if (l.reply_id) rSet.add(l.reply_id);
    });
    setLikedDiscussions(dSet);
    setLikedReplies(rSet);
  }, [userId]);

  useEffect(() => { refetch(); }, [refetch]);

  return { likedDiscussions, likedReplies, setLikedDiscussions, setLikedReplies, refetch };
}

// --- Products ---
export function useProducts() {
  return useQuery<(Tables<"products"> & { product_variants: Tables<"product_variants">[] })[]>(
    () => supabase.from("products").select("*, product_variants(*)").order("created_at", { ascending: false }) as any,
    []
  );
}

// --- Packages ---
export function usePackages() {
  return useQuery<(Tables<"packages"> & { package_features: Tables<"package_features">[] })[]>(
    () => supabase.from("packages").select("*, package_features(*)").order("price", { ascending: true }) as any,
    []
  );
}

// --- Community Stats (counts) ---
export function useCommunityStats() {
  const [stats, setStats] = useState({ members: 0, discussions: 0, replies: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      const [d, r, m] = await Promise.all([
        supabase.from("discussions").select("*", { count: "exact", head: true }),
        supabase.from("replies").select("*", { count: "exact", head: true }),
        supabase.from("profiles").select("*", { count: "exact", head: true }),
      ]);
      setStats({
        discussions: d.count ?? 0,
        replies: r.count ?? 0,
        members: m.count ?? 0,
      });
      setLoading(false);
    };
    fetchStats();
  }, []);

  return { stats, loading };
}

// --- Monthly Leaderboard ---
export function useMonthlyLeaderboard(limit = 10) {
  const [data, setData] = useState<any[] | null>(null);
  const [loading, setLoading] = useState(true);

  const refetch = useCallback(async () => {
    setLoading(true);
    // Use profiles ordered by points_total as fallback (views are security_invoker now)
    const { data } = await supabase.from("profiles").select("user_id, full_name, tier, avatar_url, points_total").order("points_total", { ascending: false }).limit(limit);
    setData(data);
    setLoading(false);
  }, [limit]);

  useEffect(() => {
    refetch();
    const interval = setInterval(refetch, 60000);
    return () => clearInterval(interval);
  }, [refetch]);

  return { data, loading, refetch };
}

// --- Leaderboard (legacy) ---
export function useLeaderboard(limit = 5) {
  return useQuery<Tables<"profiles">[]>(
    () => supabase.from("profiles").select("*").order("points_total", { ascending: false }).limit(limit) as any,
    [limit]
  );
}
