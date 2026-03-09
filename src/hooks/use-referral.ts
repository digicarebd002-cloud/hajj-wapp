import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

interface Referral {
  id: string;
  referral_code: string;
  referred_id: string | null;
  status: string;
  points_awarded: number;
  created_at: string;
  completed_at: string | null;
}

export function useReferral() {
  const { user } = useAuth();
  const [code, setCode] = useState<string | null>(null);
  const [referrals, setReferrals] = useState<Referral[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ total: 0, completed: 0, totalPoints: 0 });

  const fetchData = useCallback(async () => {
    if (!user) { setLoading(false); return; }
    setLoading(true);

    // Get or create referral code
    const { data: codeData } = await supabase.rpc("get_or_create_referral_code", { p_user_id: user.id });
    if (codeData) setCode(codeData as string);

    // Get all referrals by this user
    const { data: refs } = await supabase
      .from("referrals")
      .select("*")
      .eq("referrer_id", user.id)
      .order("created_at", { ascending: false });

    const allRefs = (refs as Referral[]) ?? [];
    setReferrals(allRefs);

    const completed = allRefs.filter((r) => r.status === "completed");
    setStats({
      total: allRefs.length,
      completed: completed.length,
      totalPoints: completed.reduce((sum, r) => sum + r.points_awarded, 0),
    });

    setLoading(false);
  }, [user]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const getReferralLink = useCallback(() => {
    if (!code) return "";
    return `${window.location.origin}/auth?ref=${code}`;
  }, [code]);

  return { code, referrals, loading, stats, getReferralLink, refetch: fetchData };
}

export async function processReferralCode(code: string, userId: string): Promise<boolean> {
  const { data } = await supabase.rpc("process_referral", {
    p_referral_code: code,
    p_referred_user_id: userId,
  });
  return data === true;
}
