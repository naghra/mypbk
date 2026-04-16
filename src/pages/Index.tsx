import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Heart, ShoppingBag, Package, Flame, Star } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { useCurrency } from "@/hooks/useCurrency";
import { getProductCurrencySymbol } from "@/lib/format-price";
import StoreHeader from "@/components/StoreHeader";
import StoreFooter from "@/components/StoreFooter";
import TestimonialsSection from "@/components/TestimonialsSection";
import TrackingPixels from "@/components/TrackingPixels";
import { useTrackVisit } from "@/hooks/useTrackVisit";

type Product = {
  id: string;
  slug: string | null;
  name_ar: string;
  description_ar: string | null;
  price: number;
  compare_at_price: number | null;
  inventory: number;
  currency_enabled?: boolean;
  currency_code?: string | null;
  images: { url: string; is_main: boolean }[];
};

const Index = () => {
  useTrackVisit("/");
  const { currency } = useCurrency();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [storeName, setStoreName] = useState("");
  const [heroTitle, setHeroTitle] = useState("عروض ما تتفوت");
  const [announcementText, setAnnouncementText] = useState("توصيل مجاني في جميع أنحاء المملكة");

  useEffect(() => {
    const fetchData = async () => {
      const { data: productsData } = await supabase
        .from("products")
        .select("id, slug, name_ar, description_ar, price, compare_at_price, inventory, currency_enabled, currency_code, hidden_from_home, product_images(url, is_main)")
        .eq("status", "active")
        .order("created_at", { ascending: false });

      if (productsData) {
        setProducts(
          productsData
            .filter((p: any) => !(p as any).hidden_from_home)
            .map((p: any) => ({
              ...p,
              images: p.product_images || [],
            }))
        );
      }

      const { data: settings } = await supabase
        .from("store_settings")
        .select("value")
        .eq("key", "store_info")
        .maybeSingle();

      if (settings?.value) {
        const v = settings.value as any;
        if (v.name) setStoreName(v.name);
      }

      setLoading(false);
    };
    fetchData();
  }, []);

  return (
    <div className="min-h-screen flex flex-col bg-background" dir="rtl">
      <TrackingPixels />
      
      {/* Announcement Bar */}
      <div className="bg-foreground text-background py-2 overflow-hidden">
        <div className="animate-marquee whitespace-nowrap flex gap-16 text-sm">
          {[...Array(4)].map((_, i) => (
            <span key={i} className="inline-flex items-center gap-2">
              <span>✦</span> {announcementText}
              <span className="mx-4">✦</span> توصيل سريع لجميع المناطق
              <span className="mx-4">✦</span> الدفع عند الاستلام
            </span>
          ))}
        </div>
      </div>

      <StoreHeader />
      
      <main className="flex-1">
        {/* Hero Section */}
        <section className="py-10 md:py-16 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <h1 className="text-3xl md:text-5xl font-black text-foreground mb-4">
              {heroTitle}
            </h1>
            <div className="flex items-center justify-center gap-3">
              <div className="h-[2px] w-16 md:w-24 bg-foreground/20" />
              <div className="w-3 h-3 rounded-full border-2 border-foreground/30" />
              <div className="h-[2px] w-16 md:w-24 bg-foreground/20" />
            </div>
          </motion.div>
        </section>

        {/* Products Grid */}
        <section className="container pb-16">
          {loading ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-5">
              {[...Array(8)].map((_, i) => (
                <div key={i} className="animate-pulse">
                  <div className="aspect-[3/4] rounded-2xl bg-muted/40" />
                  <div className="mt-3 space-y-2 px-1">
                    <div className="h-3 w-3/4 mx-auto rounded-full bg-muted/40" />
                    <div className="h-3 w-1/2 mx-auto rounded-full bg-muted/40" />
                  </div>
                </div>
              ))}
            </div>
          ) : products.length === 0 ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex flex-col items-center justify-center py-20 text-center"
            >
              <Package className="w-16 h-16 text-muted-foreground/30 mb-4" />
              <p className="text-lg text-muted-foreground">لا توجد منتجات حالياً</p>
            </motion.div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-5">
              <AnimatePresence>
                {products.map((product, i) => (
                  <ProductCard key={product.id} product={product} index={i} systemCurrency={currency} />
                ))}
              </AnimatePresence>
            </div>
          )}
        </section>

        {/* Testimonials */}
        <TestimonialsSection />
      </main>

      <StoreFooter />
    </div>
  );
};

function ProductCard({ product, index, systemCurrency }: { product: Product; index: number; systemCurrency: import("@/hooks/useCurrency").CurrencyConfig }) {
  const [liked, setLiked] = useState(false);
  const [imgLoaded, setImgLoaded] = useState(false);
  const thumb = product.images.find(i => i.is_main)?.url || product.images[0]?.url || null;
  const hasDiscount = product.compare_at_price && product.compare_at_price > product.price;
  const discountPercent = hasDiscount ? Math.round(((product.compare_at_price! - product.price) / product.compare_at_price!) * 100) : 0;
  const currencySymbol = getProductCurrencySymbol(product, systemCurrency);
  const productLink = `/product/${product.slug || product.id}`;

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: Math.min(index * 0.06, 0.5), ease: [0.25, 0.46, 0.45, 0.94] }}
      className="group relative"
    >
      <div className="relative overflow-hidden rounded-2xl bg-muted/20 product-card-shadow transition-shadow duration-300 hover:product-card-shadow-hover">
        {/* Image */}
        <Link to={productLink} className="block relative aspect-[3/4] overflow-hidden">
          {thumb ? (
            <>
              {!imgLoaded && (
                <div className="absolute inset-0 bg-muted/30 animate-pulse" />
              )}
              <img
                src={thumb}
                alt={product.name_ar}
                className={`w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-110 ${imgLoaded ? "opacity-100" : "opacity-0"}`}
                loading="lazy"
                onLoad={() => setImgLoaded(true)}
              />
            </>
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-muted/10">
              <Package className="w-12 h-12 text-muted-foreground/15" />
            </div>
          )}
          
          {/* Gradient overlay on hover */}
          <div className="absolute inset-0 bg-gradient-to-t from-foreground/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          
          {/* Quick view button on hover */}
          <div className="absolute bottom-0 left-0 right-0 p-3 translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-out">
            <span className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl bg-background/95 backdrop-blur-sm text-foreground font-bold text-xs shadow-lg">
              <ShoppingBag className="w-3.5 h-3.5" />
              عرض المنتج
            </span>
          </div>
        </Link>

        {/* Badges */}
        <div className="absolute top-2.5 right-2.5 flex flex-col gap-1.5">
          {hasDiscount && (
            <motion.span
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.3 + index * 0.05, type: "spring", stiffness: 200 }}
              className="inline-flex items-center gap-1 bg-destructive text-destructive-foreground text-[10px] font-bold px-2 py-1 rounded-lg shadow-sm"
            >
              <Flame className="w-3 h-3" />
              {discountPercent}%-
            </motion.span>
          )}
          {product.inventory <= 5 && product.inventory > 0 && (
            <span className="inline-flex items-center gap-1 bg-accent text-accent-foreground text-[10px] font-bold px-2 py-1 rounded-lg shadow-sm">
              <Star className="w-3 h-3" />
              كمية محدودة
            </span>
          )}
        </div>

        {/* Like button */}
        <button
          onClick={(e) => { e.preventDefault(); setLiked(!liked); }}
          className="absolute top-2.5 left-2.5 w-8 h-8 rounded-full bg-background/80 backdrop-blur-sm flex items-center justify-center shadow-sm hover:shadow-md hover:scale-110 transition-all duration-200 z-10"
        >
          <Heart className={`w-3.5 h-3.5 transition-all duration-300 ${liked ? "fill-destructive text-destructive scale-110" : "text-foreground/50"}`} />
        </button>
      </div>

      {/* Product Info */}
      <div className="mt-3 px-0.5 space-y-1.5">
        <Link to={productLink}>
          <h3 className="text-sm font-bold text-foreground line-clamp-1 group-hover:text-accent transition-colors duration-200">
            {product.name_ar}
          </h3>
        </Link>
        
        <div className="flex items-center gap-2">
          <span className={`text-base font-black ${hasDiscount ? "text-destructive" : "text-foreground"}`}>
            {product.price.toLocaleString("en-US")} {currencySymbol}
          </span>
          {hasDiscount && (
            <span className="text-xs text-muted-foreground line-through">
              {product.compare_at_price?.toLocaleString("en-US")}
            </span>
          )}
        </div>
      </div>
    </motion.div>
  );
}

export default Index;
