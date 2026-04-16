import React, { useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { FileText, Mail, PhoneCall } from "lucide-react";
import { motion } from "framer-motion";
import celebrationSvg from "@/assets/celebration.svg";
import StoreHeader from "@/components/StoreHeader";
import StoreFooter from "@/components/StoreFooter";
import { supabase } from "@/integrations/supabase/client";

const generateTrackingCode = (orderId: string): string => {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ";
  let hash = 0;
  for (let i = 0; i < orderId.length; i++) {
    hash = (hash * 31 + orderId.charCodeAt(i)) >>> 0;
  }
  const p1 = chars[hash % chars.length];
  const p2 = chars[Math.abs((hash >> 5)) % chars.length];
  const middle = String(hash % 10000).padStart(4, "0");
  const s1 = chars[Math.abs((hash >> 10)) % chars.length];
  return `${p1}${p2}-${middle}-${s1}`;
};

const ThankYou: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const rawOrder = searchParams.get("order") || "";
  const trackingCode = rawOrder ? generateTrackingCode(rawOrder) : "N/A";
  const email = searchParams.get("email") || "";

  const total = searchParams.get("total") || "";
  const snapValue = searchParams.get("snap_value") || "";

  useEffect(() => {
    window.scrollTo(0, 0);
    fireConversionEvents();
  }, []);

  const fireConversionEvents = async () => {
    try {
      const { data } = await supabase
        .from("store_settings")
        .select("value")
        .eq("key", "tracking")
        .maybeSingle();

      if (!data) return;
      const v = data.value as any;
      const totalNum = parseFloat(total) || 0;

      // Snapchat PURCHASE event - use custom conversion value if provided
      const snapchatValue = snapValue ? parseFloat(snapValue) : totalNum;
      if (v?.snapchat_pixel_id && v?.snapchat_enabled && (window as any).snaptr) {
        (window as any).snaptr('track', 'PURCHASE', {
          price: snapchatValue,
          currency: 'SAR',
          transaction_id: rawOrder,
        });
        console.log("Snapchat PURCHASE event fired with value:", snapchatValue);
      }

      // Facebook Purchase event
      if (v?.facebook_pixel_id && (v?.facebook_enabled || v?.pixel_enabled) && (window as any).fbq) {
        (window as any).fbq('track', 'Purchase', {
          value: totalNum,
          currency: 'SAR',
        });
        console.log("Facebook Purchase event fired");
      }

      // TikTok CompletePayment event
      if (v?.tiktok_pixel_id && v?.tiktok_enabled && (window as any).ttq) {
        (window as any).ttq.track('CompletePayment', {
          value: totalNum,
          currency: 'SAR',
        });
        console.log("TikTok CompletePayment event fired");
      }

      // Google Ads conversion
      if (v?.google_ads_id && v?.google_ads_enabled && v?.google_ads_conversion_label && (window as any).gtag) {
        (window as any).gtag('event', 'conversion', {
          send_to: `${v.google_ads_id}/${v.google_ads_conversion_label}`,
          value: totalNum,
          currency: 'SAR',
          transaction_id: rawOrder,
        });
        console.log("Google Ads conversion event fired");
      }
    } catch (err) {
      console.error("Conversion tracking error:", err);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col" dir="rtl">
      <StoreHeader />

      <main className="flex-1 px-4 py-6 sm:py-10 space-y-4 sm:space-y-6 max-w-lg mx-auto w-full">
        {/* ── Hero ── */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-center space-y-3"
        >
          <img src={celebrationSvg} alt="احتفال" className="w-24 sm:w-32 h-auto mx-auto" />
          <h1 className="text-base sm:text-lg font-bold text-foreground">
            شكرًا لتسوقكم عبر متجرنا 😊
          </h1>
          <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
            <span>رقم التتبع:</span>
            <span className="font-semibold text-foreground tracking-wider" dir="ltr">{trackingCode}</span>
            <button
              onClick={() => navigator.clipboard?.writeText(trackingCode)}
              className="text-muted-foreground hover:text-foreground transition-colors"
              aria-label="نسخ رقم التتبع"
            >
              <FileText className="w-3.5 h-3.5" />
            </button>
          </div>
        </motion.div>

        {/* ── Phone Call Notice ── */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.3, duration: 0.4 }}
          className="rounded-2xl border border-accent/25 bg-accent/5 p-5 text-center space-y-3"
        >
          <motion.div
            animate={{ rotate: [0, -8, 8, -8, 0] }}
            transition={{ duration: 0.5, repeat: Infinity, repeatDelay: 3 }}
            className="w-11 h-11 rounded-full bg-accent/15 flex items-center justify-center mx-auto"
          >
            <PhoneCall className="w-5 h-5 text-accent" />
          </motion.div>

          <h3 className="text-sm font-bold text-foreground">📱 انتبه لهاتفك!</h3>
          <p className="text-xs text-muted-foreground leading-relaxed">
            سيتصل بك فريقنا قريبًا <strong className="text-foreground">لتأكيد طلبك</strong> والإجابة على أي استفسارات
          </p>

          {/* Steps */}
          <div className="flex items-center justify-center gap-2 pt-1">
            <StepDot step={1} label="تأكيد الطلب" delay={0.6} />
            <div className="w-5 h-px bg-border" />
            <StepDot step={2} label="تجهيز الشحن" delay={0.9} />
            <div className="w-5 h-px bg-border" />
            <StepDot step={3} label="التوصيل" delay={1.2} />
          </div>
        </motion.div>

        {/* ── Back Button ── */}
        <div className="text-center">
          <button
            onClick={() => navigate("/")}
            className="bg-foreground text-background px-7 py-2.5 rounded-lg font-medium text-sm hover:opacity-90 transition-opacity"
          >
            العودة للمتجر
          </button>
        </div>

        {/* ── Email ── */}
        {email && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="rounded-xl bg-muted/40 py-5 px-4 text-center space-y-2"
          >
            <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center mx-auto">
              <Mail className="w-4 h-4 text-muted-foreground" />
            </div>
            <p className="text-xs text-foreground">قمنا بإرسال فاتورة الطلب على البريد الإلكتروني</p>
            <p className="text-xs text-muted-foreground font-medium" dir="ltr">{email}</p>
          </motion.div>
        )}

        {/* ── Customer Service ── */}
        <div className="rounded-xl bg-muted/40 py-5 px-4 text-center space-y-2">
          <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center mx-auto">
            <Mail className="w-4 h-4 text-muted-foreground" />
          </div>
          <p className="text-xs font-semibold text-foreground">خدمة العملاء</p>
          <a href="mailto:inovad19@gmail.com" className="text-xs text-muted-foreground font-medium" dir="ltr">
            inovad19@gmail.com
          </a>
        </div>
      </main>

      <StoreFooter />
    </div>
  );
};

function StepDot({ step, label, delay }: { step: number; label: string; delay: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay, type: "spring", stiffness: 200 }}
      className="flex flex-col items-center gap-1"
    >
      <div className="w-6 h-6 rounded-full bg-accent/15 border border-accent/25 flex items-center justify-center text-[10px] font-bold text-accent">
        {step}
      </div>
      <span className="text-[9px] text-muted-foreground whitespace-nowrap">{label}</span>
    </motion.div>
  );
}

export default ThankYou;
