
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS has_gift boolean NOT NULL DEFAULT false;

ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS gift_sku text;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS gift_name text;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS gift_selected_at timestamp with time zone;
