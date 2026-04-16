ALTER TABLE public.products ADD COLUMN slug text UNIQUE;

-- Create index for fast slug lookups
CREATE INDEX idx_products_slug ON public.products(slug) WHERE slug IS NOT NULL;