import { useState, useMemo } from "react";
import { Star, ThumbsUp, CheckCircle2, ShieldCheck, ChevronDown, Quote, Sparkles } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { Skeleton } from "@/components/ui/skeleton";
import { motion, AnimatePresence } from "framer-motion";

interface Review {
  id: string;
  reviewer_name: string;
  reviewer_gender: string;
  rating: number;
  comment: string;
  dialect: string;
  badge_type: string;
  is_highlighted: boolean;
  highlight_label: string | null;
  review_date: string;
}

const AVATARS_MALE = [
  "https://api.dicebear.com/9.x/thumbs/svg?seed=Ali&backgroundColor=b6e3f4",
  "https://api.dicebear.com/9.x/thumbs/svg?seed=Mohammed&backgroundColor=c0aede",
  "https://api.dicebear.com/9.x/thumbs/svg?seed=Khalid&backgroundColor=d1d4f9",
  "https://api.dicebear.com/9.x/thumbs/svg?seed=Omar&backgroundColor=ffd5dc",
  "https://api.dicebear.com/9.x/thumbs/svg?seed=Ahmed&backgroundColor=ffdfbf",
];
const AVATARS_FEMALE = [
  "https://api.dicebear.com/9.x/thumbs/svg?seed=Sara&backgroundColor=ffd5dc",
  "https://api.dicebear.com/9.x/thumbs/svg?seed=Nora&backgroundColor=c0aede",
  "https://api.dicebear.com/9.x/thumbs/svg?seed=Fatima&backgroundColor=b6e3f4",
  "https://api.dicebear.com/9.x/thumbs/svg?seed=Maryam&backgroundColor=d1d4f9",
  "https://api.dicebear.com/9.x/thumbs/svg?seed=Lina&backgroundColor=ffdfbf",
];

function getAvatar(name: string, gender: string) {
  const arr = gender === "female" ? AVATARS_FEMALE : AVATARS_MALE;
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = (hash * 31 + name.charCodeAt(i)) | 0;
  return arr[Math.abs(hash) % arr.length];
}

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  if (days === 0) return "اليوم";
  if (days === 1) return "أمس";
  if (days < 7) return `منذ ${days} أيام`;
  if (days < 30) return `منذ ${Math.floor(days / 7)} أسابيع`;
  return `منذ ${Math.floor(days / 30)} شهر`;
}

function StarRating({ rating, size = "sm" }: { rating: number; size?: "sm" | "lg" }) {
  const s = size === "lg" ? "w-5 h-5" : "w-3.5 h-3.5";
  return (
    <div className="flex gap-0.5" dir="ltr">
      {[1, 2, 3, 4, 5].map((i) => (
        <Star
          key={i}
          className={`${s} transition-all duration-300 ${
            i <= rating
              ? "fill-amber-400 text-amber-400 drop-shadow-[0_0_3px_rgba(251,191,36,0.4)]"
              : "text-border"
          }`}
        />
      ))}
    </div>
  );
}

function RatingDistribution({ reviews }: { reviews: Review[] }) {
  const total = reviews.length;
  const dist = [5, 4, 3, 2, 1].map((r) => ({
    stars: r,
    count: reviews.filter((rv) => rv.rating === r).length,
    pct: total ? Math.round((reviews.filter((rv) => rv.rating === r).length / total) * 100) : 0,
  }));
  const avg = total ? (reviews.reduce((s, r) => s + r.rating, 0) / total).toFixed(1) : "0";

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="relative overflow-hidden rounded-2xl border border-border bg-gradient-to-br from-card via-card to-secondary/30"
    >
      {/* Decorative elements */}
      <div className="absolute top-0 left-0 w-32 h-32 bg-amber-400/5 rounded-full -translate-x-1/2 -translate-y-1/2" />
      <div className="absolute bottom-0 right-0 w-24 h-24 bg-amber-400/5 rounded-full translate-x-1/2 translate-y-1/2" />
      
      <div className="relative p-5 md:p-8">
        <div className="flex items-center gap-6 md:gap-10">
          {/* Score */}
          <div className="text-center flex-shrink-0">
            <div className="relative">
              <div className="text-5xl md:text-6xl font-black text-foreground tracking-tight" dir="ltr">
                {avg}
              </div>
              <div className="absolute -top-1 -right-2">
                <Sparkles className="w-4 h-4 text-amber-400 animate-pulse" />
              </div>
            </div>
            <StarRating rating={Math.round(Number(avg))} size="lg" />
            <div className="text-xs text-muted-foreground mt-2 font-medium">
              {total.toLocaleString()} تقييم
            </div>
          </div>

          {/* Separator */}
          <div className="w-px h-20 bg-gradient-to-b from-transparent via-border to-transparent hidden md:block" />

          {/* Bars */}
          <div className="flex-1 space-y-2">
            {dist.map((d) => (
              <div key={d.stars} className="flex items-center gap-2.5 text-xs group">
                <div className="flex items-center gap-1 w-10 justify-end" dir="ltr">
                  <span className="text-muted-foreground font-semibold">{d.stars}</span>
                  <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                </div>
                <div className="flex-1 h-2.5 bg-secondary rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${d.pct}%` }}
                    transition={{ duration: 0.8, delay: (5 - d.stars) * 0.1, ease: "easeOut" }}
                    className="h-full rounded-full bg-gradient-to-r from-amber-400 to-amber-500"
                  />
                </div>
                <span className="w-9 text-muted-foreground font-medium text-left tabular-nums" dir="ltr">
                  {d.pct}%
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </motion.div>
  );
}

function ReviewCard({ review, index }: { review: Review; index: number }) {
  const [helpful, setHelpful] = useState(false);
  const isHighlighted = review.is_highlighted;

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: index * 0.05 }}
      className={`group relative rounded-2xl p-4 md:p-5 transition-all duration-300 ${
        isHighlighted
          ? "bg-gradient-to-br from-amber-50/80 to-orange-50/50 border-2 border-amber-200/70 shadow-[0_4px_24px_-4px_rgba(251,191,36,0.15)]"
          : "bg-card border border-border hover:border-muted-foreground/20 hover:shadow-sm"
      }`}
    >
      {/* Highlighted badge */}
      {isHighlighted && review.highlight_label && (
        <div className="absolute -top-3 right-4 md:right-6">
          <div className="flex items-center gap-1.5 bg-gradient-to-r from-amber-500 to-orange-500 text-white text-[10px] font-bold px-3 py-1 rounded-full shadow-lg shadow-amber-500/20">
            <ThumbsUp className="w-3 h-3" />
            {review.highlight_label}
          </div>
        </div>
      )}

      {/* Quote icon for highlighted */}
      {isHighlighted && (
        <Quote className="absolute top-4 left-4 w-8 h-8 text-amber-300/30 rotate-180" />
      )}

      <div className="flex items-start gap-3.5">
        {/* Avatar */}
        <div className={`relative flex-shrink-0 ${isHighlighted ? "mt-1" : ""}`}>
          <img
            src={getAvatar(review.reviewer_name, review.reviewer_gender)}
            alt={review.reviewer_name}
            className="w-11 h-11 rounded-full bg-secondary ring-2 ring-background shadow-sm"
            loading="lazy"
          />
          {review.badge_type === "trusted_customer" && (
            <div className="absolute -bottom-0.5 -right-0.5 w-4 h-4 bg-emerald-500 rounded-full flex items-center justify-center ring-2 ring-background">
              <ShieldCheck className="w-2.5 h-2.5 text-white" />
            </div>
          )}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-bold text-sm text-foreground">{review.reviewer_name}</span>
            <span className={`inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full ${
              review.badge_type === "trusted_customer"
                ? "text-emerald-700 bg-emerald-50 border border-emerald-200/80"
                : "text-sky-700 bg-sky-50 border border-sky-200/80"
            }`}>
              {review.badge_type === "trusted_customer" ? (
                <><ShieldCheck className="w-3 h-3" /> عميل موثوق</>
              ) : (
                <><CheckCircle2 className="w-3 h-3" /> تم الشراء</>
              )}
            </span>
          </div>

          <div className="flex items-center gap-2.5 mt-1.5">
            <StarRating rating={review.rating} />
            <span className="text-[10px] text-muted-foreground font-medium">
              {timeAgo(review.review_date)}
            </span>
          </div>

          <p className={`text-sm leading-relaxed mt-2.5 ${
            isHighlighted ? "text-foreground font-medium" : "text-foreground/80"
          }`}>
            {review.comment}
          </p>

          <button
            onClick={() => setHelpful(!helpful)}
            className={`mt-3 inline-flex items-center gap-1.5 text-[11px] font-medium px-3 py-1.5 rounded-full transition-all duration-200 ${
              helpful
                ? "bg-primary text-primary-foreground shadow-sm"
                : "text-muted-foreground bg-secondary hover:bg-muted-foreground/10"
            }`}
          >
            <ThumbsUp className={`w-3 h-3 transition-transform ${helpful ? "scale-110" : ""}`} />
            {helpful ? "شكراً لك ✓" : "مفيد"}
          </button>
        </div>
      </div>
    </motion.div>
  );
}

export default function ProductReviews({ productId }: { productId?: string }) {
  const [visibleCount, setVisibleCount] = useState(6);

  const { data: reviews = [], isLoading } = useQuery({
    queryKey: ["product-reviews", productId],
    queryFn: async () => {
      if (!productId) return [];
      const { data, error } = await supabase
        .from("product_reviews")
        .select("*")
        .eq("product_id", productId)
        .order("review_date", { ascending: false });
      if (error) throw error;
      return data as Review[];
    },
    enabled: !!productId,
  });

  const shuffled = useMemo(() => {
    if (!reviews.length) return [];
    const highlighted = reviews.filter((r) => r.is_highlighted);
    const rest = reviews.filter((r) => !r.is_highlighted);
    for (let i = rest.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [rest[i], rest[j]] = [rest[j], rest[i]];
    }
    return [...highlighted, ...rest];
  }, [reviews]);

  if (!productId) return null;

  if (isLoading) {
    return (
      <section className="py-10">
        <div className="container space-y-4">
          <Skeleton className="h-8 w-48 rounded-xl" />
          <Skeleton className="h-36 w-full rounded-2xl" />
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-32 w-full rounded-2xl" />
            ))}
          </div>
        </div>
      </section>
    );
  }

  if (!reviews.length) return null;

  const visible = shuffled.slice(0, visibleCount);
  const hasMore = visibleCount < shuffled.length;
  const remaining = shuffled.length - visibleCount;

  return (
    <section className="py-10 md:py-16">
      <div className="container">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="flex items-center justify-between mb-6"
        >
          <div>
            <h2 className="text-xl md:text-2xl font-black text-foreground">
              تقييمات العملاء
            </h2>
            <p className="text-xs text-muted-foreground mt-1">
              آراء حقيقية من عملائنا
            </p>
          </div>
          <div className="flex items-center gap-1.5 bg-secondary px-3 py-1.5 rounded-full">
            <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
            <span className="text-sm font-bold text-foreground" dir="ltr">
              {reviews.length ? (reviews.reduce((s, r) => s + r.rating, 0) / reviews.length).toFixed(1) : "0"}
            </span>
          </div>
        </motion.div>

        {/* Rating Distribution */}
        <RatingDistribution reviews={reviews} />

        {/* Reviews List */}
        <div className="mt-6 space-y-3">
          <AnimatePresence>
            {visible.map((review, i) => (
              <ReviewCard key={review.id} review={review} index={i} />
            ))}
          </AnimatePresence>
        </div>

        {/* Load More */}
        {hasMore && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="mt-8 text-center"
          >
            <button
              onClick={() => setVisibleCount((c) => c + 10)}
              className="group inline-flex items-center gap-2 px-8 py-3 rounded-full bg-foreground text-background text-sm font-bold hover:opacity-90 transition-all duration-200 shadow-lg shadow-foreground/10"
            >
              <ChevronDown className="w-4 h-4 group-hover:translate-y-0.5 transition-transform" />
              عرض المزيد ({remaining} تقييم)
            </button>
          </motion.div>
        )}
      </div>
    </section>
  );
}
