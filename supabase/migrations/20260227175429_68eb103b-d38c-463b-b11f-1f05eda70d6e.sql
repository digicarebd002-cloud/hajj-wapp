
-- View: v_community_stats
CREATE OR REPLACE VIEW public.v_community_stats AS
SELECT
  (SELECT COUNT(*) FROM public.profiles) AS members,
  (SELECT COUNT(*) FROM public.discussions) AS discussions,
  (SELECT COUNT(*) FROM public.replies) AS replies;

-- View: v_monthly_leaderboard (top contributors this month)
CREATE OR REPLACE VIEW public.v_monthly_leaderboard AS
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

-- RPC: increment_view_count
CREATE OR REPLACE FUNCTION public.increment_view_count(p_discussion_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  UPDATE public.discussions SET views = views + 1 WHERE id = p_discussion_id;
END;
$$;

-- Grant access to views
GRANT SELECT ON public.v_community_stats TO anon, authenticated;
GRANT SELECT ON public.v_monthly_leaderboard TO anon, authenticated;
