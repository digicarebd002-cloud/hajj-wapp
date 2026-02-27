
-- Fix: Recreate views with SECURITY INVOKER
CREATE OR REPLACE VIEW public.v_community_stats
WITH (security_invoker = true)
AS
SELECT
  (SELECT COUNT(*) FROM public.profiles) AS members,
  (SELECT COUNT(*) FROM public.discussions) AS discussions,
  (SELECT COUNT(*) FROM public.replies) AS replies;

CREATE OR REPLACE VIEW public.v_monthly_leaderboard
WITH (security_invoker = true)
AS
SELECT
  p.user_id,
  p.full_name,
  p.tier,
  p.avatar_url,
  COALESCE(SUM(pl.points), 0) AS monthly_points
FROM public.profiles p
LEFT JOIN public.points_ledger pl
  ON pl.user_id = p.user_id
  AND pl.created_at >= date_trunc('month', now())
GROUP BY p.user_id, p.full_name, p.tier, p.avatar_url
ORDER BY monthly_points DESC
LIMIT 10;
