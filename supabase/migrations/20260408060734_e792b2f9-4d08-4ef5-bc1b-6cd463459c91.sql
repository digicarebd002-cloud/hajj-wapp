-- Fix site_settings: don't expose secret keys publicly
DROP POLICY IF EXISTS "Anyone can view site settings" ON public.site_settings;
CREATE POLICY "Anyone can view non-secret settings"
  ON public.site_settings FOR SELECT
  USING (
    key NOT LIKE '%secret%' 
    AND key NOT LIKE '%_secret' 
    AND key NOT LIKE 'stripe_%_secret_key'
    AND key NOT LIKE 'paypal_%_secret'
    AND key NOT LIKE '%webhook_secret%'
  );