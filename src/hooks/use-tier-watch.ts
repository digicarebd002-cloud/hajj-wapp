import { useState, useEffect, useRef } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";

/**
 * Watches the user's tier and fires callback when it changes.
 * Returns current tier for display.
 */
export function useTierWatch() {
  const { user } = useAuth();
  const [tier, setTier] = useState<string | null>(null);
  const [upgradedTo, setUpgradedTo] = useState<string | null>(null);
  const prevTierRef = useRef<string | null>(null);

  const fetchTier = async () => {
    if (!user) return;
    const { data } = await supabase
      .from("profiles")
      .select("tier")
      .eq("user_id", user.id)
      .single();
    if (!data) return;

    const newTier = data.tier;
    const prevTier = prevTierRef.current;

    // Only fire upgrade if we had a previous tier and it changed upward
    if (prevTier && newTier !== prevTier) {
      const tierOrder = ["Silver", "Gold", "Platinum"];
      if (tierOrder.indexOf(newTier) > tierOrder.indexOf(prevTier)) {
        setUpgradedTo(newTier);
      }
    }

    prevTierRef.current = newTier;
    setTier(newTier);
  };

  useEffect(() => {
    if (!user) return;
    fetchTier();
  }, [user?.id]);

  const dismissUpgrade = () => setUpgradedTo(null);

  return { tier, upgradedTo, dismissUpgrade, refetchTier: fetchTier };
}
