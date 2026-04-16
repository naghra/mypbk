import { useState, useEffect } from "react";
import { Flame, Eye, Clock } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

function randomBetween(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

export default function SocialProofBar() {
  const [purchaseCount, setPurchaseCount] = useState(() => randomBetween(15, 45));
  const [viewerCount, setViewerCount] = useState(() => randomBetween(8, 28));

  const { data: settings } = useQuery({
    queryKey: ["social-proof-settings"],
    queryFn: async () => {
      const { data } = await supabase
        .from("store_settings")
        .select("value")
        .eq("key", "app_config_reviews")
        .single();
      return (data?.value as Record<string, any>) || {};
    },
    staleTime: 60000,
  });

  const showPurchases = settings?.social_proof_purchases !== false;
  const showViewers = settings?.social_proof_viewers !== false;
  const showLimited = settings?.social_proof_limited !== false;

  useEffect(() => {
    const interval = setInterval(() => {
      setPurchaseCount((c) => Math.max(10, c + randomBetween(-2, 3)));
      setViewerCount((c) => Math.max(5, c + randomBetween(-3, 4)));
    }, 8000);
    return () => clearInterval(interval);
  }, []);

  if (!showPurchases && !showViewers && !showLimited) return null;

  return (
    <div className="space-y-2 mt-4">
      {showPurchases && (
        <div className="flex items-center gap-2 text-xs bg-destructive/5 text-destructive border border-destructive/10 rounded-lg px-3 py-2">
          <Flame className="w-3.5 h-3.5 flex-shrink-0 animate-pulse" />
          <span>تم شراء هذا المنتج <strong>{purchaseCount}</strong> مرة اليوم</span>
        </div>
      )}
      <div className="flex items-center gap-4">
        {showViewers && (
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
            </span>
            <Eye className="w-3 h-3" />
            <span>{viewerCount} يشاهدون الآن</span>
          </div>
        )}
        {showLimited && (
          <div className="flex items-center gap-1.5 text-xs text-amber-600">
            <Clock className="w-3 h-3" />
            <span>الكمية محدودة</span>
          </div>
        )}
      </div>
    </div>
  );
}
