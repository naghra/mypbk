import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import CodOrderForm from "@/components/CodOrderForm";
import StoreFooter from "@/components/StoreFooter";

const OrderLanding = () => {
  const [product, setProduct] = useState<{
    id: string;
    name_ar: string;
    price: number;
    compare_at_price: number | null;
  } | null>(null);
  const [productImage, setProductImage] = useState<string>("");

  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from("products")
        .select("id, name_ar, price, compare_at_price")
        .eq("status", "active")
        .order("created_at", { ascending: true })
        .limit(1)
        .maybeSingle();

      if (data) {
        setProduct(data);
        const { data: img } = await supabase
          .from("product_images")
          .select("url")
          .eq("product_id", data.id)
          .eq("is_main", true)
          .maybeSingle();
        if (img?.url) setProductImage(img.url);
      }
    })();
  }, []);

  return (
    <div className="min-h-screen bg-muted/30 flex flex-col" dir="rtl">
      <main className="flex-1 flex items-center justify-center px-4 py-8 md:py-16">
        {product ? (
          <CodOrderForm
            productName={product.name_ar}
            productId={product.id}
            unitPrice={product.price}
            compareAtPrice={product.compare_at_price ?? undefined}
            productImage={productImage || undefined}
          />
        ) : (
          <div className="text-center text-muted-foreground">جاري التحميل...</div>
        )}
      </main>
      <StoreFooter />
    </div>
  );
};

export default OrderLanding;
