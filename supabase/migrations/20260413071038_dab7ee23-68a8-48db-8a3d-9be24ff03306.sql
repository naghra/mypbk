
-- Create product_reviews table
CREATE TABLE public.product_reviews (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  reviewer_name TEXT NOT NULL,
  reviewer_gender TEXT NOT NULL DEFAULT 'male',
  rating INTEGER NOT NULL DEFAULT 5,
  comment TEXT NOT NULL,
  dialect TEXT DEFAULT 'khaliji',
  badge_type TEXT DEFAULT 'verified_purchase',
  is_highlighted BOOLEAN NOT NULL DEFAULT false,
  highlight_label TEXT,
  review_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  sort_order INTEGER NOT NULL DEFAULT 0
);

-- Enable RLS
ALTER TABLE public.product_reviews ENABLE ROW LEVEL SECURITY;

-- Public can view reviews
CREATE POLICY "Anyone can view reviews"
ON public.product_reviews
FOR SELECT
USING (true);

-- Admins can manage reviews
CREATE POLICY "Admins can manage reviews"
ON public.product_reviews
FOR ALL
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Index for fast product lookup
CREATE INDEX idx_product_reviews_product_id ON public.product_reviews(product_id);
