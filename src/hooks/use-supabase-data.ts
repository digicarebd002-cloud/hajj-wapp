import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import type { Tables } from "@/integrations/supabase/types";

// Generic fetch hook — accepts PromiseLike (Supabase returns PostgrestBuilder)
function useQuery<T>(
  queryFn: () => PromiseLike<{ data: T | null; error: any }>,
  deps: any[] = []
) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refetch = useCallback(async () => {
    setLoading(true);
    setError(null);
    const { data, error } = await queryFn();
    if (error) setError(error.message);
    else setData(data);
    setLoading(false);
  }, deps);

  useEffect(() => { refetch(); }, [refetch]);

  return { data, loading, error, refetch };
}

// --- Profile ---
export function useProfile() {
  const { user } = useAuth();
  return useQuery<Tables<"profiles">>(
    () => supabase.from("profiles").select("*").eq("user_id", user?.id ?? "").single(),
    [user?.id]
  );
}

// --- Wallet ---
export function useWallet() {
  const { user } = useAuth();
  return useQuery<Tables<"wallets">>(
    () => supabase.from("wallets").select("*").eq("user_id", user?.id ?? "").single(),
    [user?.id]
  );
}

// --- Wallet Transactions ---
export function useWalletTransactions() {
  const { user } = useAuth();
  return useQuery<Tables<"wallet_transactions">[]>(
    () => supabase.from("wallet_transactions").select("*").eq("user_id", user?.id ?? "").order("created_at", { ascending: false }),
    [user?.id]
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
    () => supabase.from("points_ledger").select("*").eq("user_id", user?.id ?? "").order("created_at", { ascending: false }).limit(limit),
    [user?.id, limit]
  );
}

// --- Notification Preferences ---
export function useNotificationPreferences() {
  const { user } = useAuth();
  return useQuery<Tables<"notification_preferences">>(
    () => supabase.from("notification_preferences").select("*").eq("user_id", user?.id ?? "").single(),
    [user?.id]
  );
}

// --- Discussions (no FK hint, use manual join via user_id) ---
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

    const enriched = discussions.map((d) => ({
      ...d,
      profiles: profileMap.get(d.user_id) || null,
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
    // Fetch author
    const { data: profile } = await supabase.from("profiles").select("full_name, tier").eq("user_id", disc.user_id).single();
    setData({ ...disc, profiles: profile });
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

    setData(replies.map((r) => ({ ...r, profiles: profileMap.get(r.user_id) || null })));
    setLoading(false);
  }, [discussionId]);

  useEffect(() => { refetch(); }, [refetch]);
  return { data, loading, error, refetch };
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

// --- Leaderboard ---
export function useLeaderboard(limit = 5) {
  return useQuery<Tables<"profiles">[]>(
    () => supabase.from("profiles").select("*").order("points_total", { ascending: false }).limit(limit) as any,
    [limit]
  );
}
