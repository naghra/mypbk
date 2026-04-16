import { useState, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { Gift, CheckCircle2, Loader2, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import StoreFooter from "@/components/StoreFooter";

const TIMEOUT_SECONDS = 120;

const GiftSelection = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const orderId = searchParams.get("order_id") || "";
  const productId = searchParams.get("product_id") || "";

  const [selectedSku, setSelectedSku] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [alreadySelected, setAlreadySelected] = useState(false);
  const [existingGift, setExistingGift] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [timeLeft, setTimeLeft] = useState(TIMEOUT_SECONDS);
  const [orderTotal, setOrderTotal] = useState<number | null>(null);

  // Load gifts from DB, filtered by product
  const { data: giftOptions = [] } = useQuery({
    queryKey: ["gift-options", productId],
    queryFn: async () => {
      const { data } = await supabase
        .from("gifts")
        .select("*")
        .eq("is_active", true)
        .order("sort_order", { ascending: true });

      if (!data) return [];

      // Filter by product_id: show gifts linked to this product or linked to all (empty product_ids)
      return data.filter((g: any) => {
        const pIds = g.product_ids || [];
        return pIds.length === 0 || (productId && pIds.includes(productId));
      });
    },
  });

  useEffect(() => {
    if (!orderId) { navigate("/"); return; }
    let cancelled = false;
    (async () => {
      try {
        const { data, error } = await supabase.functions.invoke("get-order-status", {
          body: { order_id: orderId },
        });
        if (cancelled) return;
        if (error || !data?.success || !data?.order) { navigate("/"); return; }
        if (data.order.gift_sku) {
          setAlreadySelected(true);
          setExistingGift(data.order.gift_name || data.order.gift_sku);
        }
        setOrderTotal(data.order.total ?? null);
      } catch { if (!cancelled) navigate("/"); }
      finally { if (!cancelled) setLoading(false); }
    })();
    return () => { cancelled = true; };
  }, [orderId, navigate]);

  useEffect(() => {
    if (loading || alreadySelected || giftOptions.length === 0) return;
    const interval = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          handleSubmit(giftOptions[0]?.sku);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [loading, alreadySelected, giftOptions]);

  const handleSubmit = async (sku?: string) => {
    const finalSku = sku || selectedSku;
    if (!finalSku || submitting) return;
    setSubmitting(true);
    try {
      const { data, error } = await supabase.functions.invoke("select-gift", {
        body: { order_id: orderId, sku: finalSku },
      });
      if (error) throw error;
      if (!data?.success) throw new Error(data?.error || "Failed");
      navigate(`/thank-you?order=${encodeURIComponent(orderId)}&total=${orderTotal || 0}`);
    } catch {
      navigate(`/thank-you?order=${encodeURIComponent(orderId)}&total=${orderTotal || 0}`);
    }
  };

  const formatTime = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m}:${String(sec).padStart(2, "0")}`;
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (alreadySelected) {
    return (
      <div className="min-h-screen flex flex-col bg-background" dir="rtl">
        <main className="flex-1 flex items-center justify-center px-4 py-16">
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="max-w-md w-full text-center space-y-6">
            <div className="w-20 h-20 rounded-full bg-emerald-100 flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-10 h-10 text-emerald-600" />
            </div>
            <h2 className="text-2xl font-bold text-foreground">تم اختيار هديتك مسبقاً</h2>
            <p className="text-muted-foreground">هديتك: <strong>{existingGift}</strong></p>
            <Button onClick={() => navigate(`/thank-you?order=${encodeURIComponent(orderId)}&total=${orderTotal || 0}`)} className="rounded-xl">
              الذهاب لصفحة الشكر
            </Button>
          </motion.div>
        </main>
        <StoreFooter />
      </div>
    );
  }

  if (giftOptions.length === 0) {
    // No gifts available, skip to thank you
    navigate(`/thank-you?order=${encodeURIComponent(orderId)}&total=${orderTotal || 0}`);
    return null;
  }

  return (
    <div className="min-h-[100dvh] flex flex-col bg-gradient-to-b from-pink-50/50 via-background to-background dark:from-pink-950/10" dir="rtl">
      <main className="flex-1 flex flex-col justify-center px-4 py-4 max-w-lg mx-auto w-full">
        {/* Header */}
        <div className="text-center space-y-2 mb-4">
          <motion.div
            initial={{ scale: 0, rotate: -180 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ type: "spring", delay: 0.1 }}
            className="w-16 h-16 rounded-2xl bg-gradient-to-br from-pink-500 via-rose-500 to-red-500 flex items-center justify-center mx-auto shadow-xl shadow-pink-300/40 dark:shadow-pink-900/40"
          >
            <Gift className="w-8 h-8 text-white" />
          </motion.div>
          <motion.h1
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-xl font-extrabold text-foreground"
          >
            🎁 مبروك! لديك هدية مجانية
          </motion.h1>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="text-muted-foreground text-sm"
          >
            اختر هديتك المفضلة قبل انتهاء الوقت
          </motion.p>
        </div>

        {/* Timer */}
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.3 }}
          className={`flex items-center justify-center gap-2 px-4 py-2 rounded-2xl text-sm font-bold mx-auto w-fit mb-5 ${
            timeLeft <= 30
              ? "bg-red-100 text-red-600 border border-red-200 dark:bg-red-950/40 dark:border-red-800"
              : "bg-amber-100 text-amber-700 border border-amber-200 dark:bg-amber-950/40 dark:border-amber-800"
          }`}
        >
          <Clock className="w-4 h-4" />
          <span className="tabular-nums">{formatTime(timeLeft)}</span>
          <span className="text-xs font-normal opacity-70">متبقي</span>
        </motion.div>

        {/* Gift Options */}
        <div className={`grid gap-3 mb-5 ${giftOptions.length === 1 ? "grid-cols-1 max-w-xs mx-auto" : "grid-cols-2"}`}>
          {giftOptions.map((gift: any, idx: number) => {
            const isSelected = selectedSku === gift.sku;
            return (
              <motion.button
                key={gift.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 + idx * 0.1, type: "spring" }}
                onClick={() => setSelectedSku(gift.sku)}
                className={`relative rounded-2xl border-2 overflow-hidden transition-all duration-300 text-right bg-card group ${
                  isSelected
                    ? "border-pink-500 ring-4 ring-pink-500/20 shadow-lg shadow-pink-200/30 dark:shadow-pink-900/20 scale-[1.02]"
                    : "border-border hover:border-pink-300 hover:shadow-md"
                }`}
              >
                {/* Image */}
                <div className="aspect-square bg-gradient-to-br from-muted to-muted/50 overflow-hidden relative">
                  {gift.image_url ? (
                    <img
                      src={gift.image_url}
                      alt={gift.name}
                      className="w-full h-full object-contain transition-transform duration-500 group-hover:scale-110"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Gift className="w-12 h-12 text-pink-300" />
                    </div>
                  )}
                  {/* Free badge */}
                  <div className="absolute top-2 right-2">
                    <span className="inline-block text-[10px] font-bold text-white bg-gradient-to-r from-pink-500 to-rose-500 px-2.5 py-1 rounded-full shadow-lg">
                      مجاناً 🎁
                    </span>
                  </div>
                </div>

                {/* Info */}
                <div className="p-3 space-y-2">
                  <p className="font-bold text-foreground text-xs leading-snug line-clamp-2">{gift.name}</p>
                  <div className="flex items-center gap-1.5">
                    <span className="text-[10px] text-emerald-600 bg-emerald-50 dark:bg-emerald-950/30 px-2 py-0.5 rounded-full font-medium">
                      ✔ متاح الآن
                    </span>
                  </div>
                </div>

                {/* Selection indicator */}
                {isSelected && (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="absolute top-2 left-2 w-7 h-7 bg-pink-500 rounded-full flex items-center justify-center shadow-lg"
                  >
                    <CheckCircle2 className="w-5 h-5 text-white" />
                  </motion.div>
                )}
              </motion.button>
            );
          })}
        </div>
      </main>

      {/* Sticky CTA */}
      <div className="sticky bottom-0 bg-background/95 backdrop-blur-md border-t border-border px-4 py-3 max-w-lg mx-auto w-full">
        <Button
          onClick={() => handleSubmit()}
          disabled={!selectedSku || submitting}
          className="w-full rounded-2xl h-13 text-base gap-2 font-bold bg-primary hover:bg-primary/90 text-primary-foreground border-0 shadow-lg shadow-foreground/10"
          size="lg"
        >
          {submitting ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : (
            <Gift className="w-5 h-5" />
          )}
          {submitting ? "جاري التأكيد..." : "تأكيد اختيار الهدية 🎁"}
        </Button>
      </div>

      <StoreFooter />
    </div>
  );
};

export default GiftSelection;
