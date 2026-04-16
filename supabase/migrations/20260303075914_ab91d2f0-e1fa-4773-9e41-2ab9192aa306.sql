
-- The restrictive "Admins can manage orders" ALL policy blocks non-admin inserts
-- Replace it with specific UPDATE/DELETE policies for admins only
DROP POLICY IF EXISTS "Admins can manage orders" ON public.orders;

CREATE POLICY "Admins can update orders"
ON public.orders
FOR UPDATE
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can delete orders"
ON public.orders
FOR DELETE
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

-- Same issue for order_items
DROP POLICY IF EXISTS "Admins can manage order items" ON public.order_items;

CREATE POLICY "Admins can update order items"
ON public.order_items
FOR UPDATE
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can delete order items"
ON public.order_items
FOR DELETE
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

-- Also need a permissive SELECT policy for admins on orders (the existing one is restrictive)
DROP POLICY IF EXISTS "Users can view own orders" ON public.orders;
CREATE POLICY "Users can view own orders"
ON public.orders
FOR SELECT
USING ((user_id = auth.uid()) OR has_role(auth.uid(), 'admin'::app_role));

DROP POLICY IF EXISTS "View order items" ON public.order_items;
CREATE POLICY "View order items"
ON public.order_items
FOR SELECT
USING (EXISTS (
  SELECT 1 FROM orders WHERE orders.id = order_items.order_id 
  AND (orders.user_id = auth.uid() OR has_role(auth.uid(), 'admin'::app_role))
));
