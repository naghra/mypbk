ALTER TABLE public.products 
ADD COLUMN currency_enabled boolean NOT NULL DEFAULT false,
ADD COLUMN currency_code text DEFAULT NULL;