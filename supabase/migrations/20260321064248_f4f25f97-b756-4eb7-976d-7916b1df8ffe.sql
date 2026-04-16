
CREATE TABLE public.page_visits (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  visitor_id text NOT NULL,
  page_path text NOT NULL DEFAULT '/',
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.page_visits ENABLE ROW LEVEL SECURITY;

-- Anyone can insert visits (anonymous visitors)
CREATE POLICY "Anyone can insert visits"
  ON public.page_visits FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

-- Only admins can read visits
CREATE POLICY "Admins can read visits"
  ON public.page_visits FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- Create index for fast recent queries
CREATE INDEX idx_page_visits_created_at ON public.page_visits (created_at DESC);

-- Auto-cleanup: delete visits older than 24 hours via a function
CREATE OR REPLACE FUNCTION public.cleanup_old_visits()
RETURNS void
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  DELETE FROM public.page_visits WHERE created_at < now() - interval '24 hours';
$$;
