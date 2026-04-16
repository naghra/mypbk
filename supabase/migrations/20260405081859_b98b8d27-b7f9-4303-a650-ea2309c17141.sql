ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS cod_network_status text DEFAULT NULL;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS cod_network_lead_id text DEFAULT NULL;