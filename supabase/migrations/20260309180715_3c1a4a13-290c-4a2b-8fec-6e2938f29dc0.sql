
-- Add tracking/shipping columns to orders table
ALTER TABLE public.orders 
  ADD COLUMN IF NOT EXISTS tracking_number text DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS shipping_carrier text DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS shipping_address jsonb DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS estimated_delivery timestamptz DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS shipped_at timestamptz DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS delivered_at timestamptz DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS cancelled_at timestamptz DEFAULT NULL;
