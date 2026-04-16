import { useState, useMemo, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Star, Trash2, Sparkles, Plus, Loader2, MessageSquare, Pencil, Search, Filter, Flame, Eye, Clock, Package, Globe } from "lucide-react";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { ConfirmDeleteDialog } from "@/components/ConfirmDeleteDialog";
import { motion, AnimatePresence } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";

const badgeLabels: Record<string, string> = {
  verified_purchase: "✔ تم الشراء",
  trusted_customer: "✔ عميل موثوق",
};

const dialectLabels: Record<string, string> = {
  khaliji: "خليجي",
  egyptian: "مصري",
  moroccan: "مغربي",
  levantine: "شامي",
};

function ReviewStars({ rating, size = "sm" }: { rating: number; size?: "sm" | "md" }) {
  const w = size === "sm" ? "w-3.5 h-3.5" : "w-4 h-4";
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((i) => (
        <Star key={i} className={`${w} ${i <= rating ? "fill-amber-400 text-amber-400" : "text-muted-foreground/30"}`} />
      ))}
    </div>
  );
}

function ReviewAvatar({ name, gender }: { name: string; gender: string }) {
  const colors = gender === "female"
    ? ["bg-pink-100 text-pink-600", "bg-rose-100 text-rose-600", "bg-fuchsia-100 text-fuchsia-600"]
    : ["bg-blue-100 text-blue-600", "bg-indigo-100 text-indigo-600", "bg-cyan-100 text-cyan-600"];
  const color = colors[name.length % colors.length];
  const initials = name.split(" ").map(n => n[0]).join("").slice(0, 2);
  return (
    <div className={`w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold ${color} flex-shrink-0`}>
      {initials}
    </div>
  );
}

export default function AdminReviews() {
  const queryClient = useQueryClient();
  const [selectedProduct, setSelectedProduct] = useState<string>("");
  const [generateDialect, setGenerateDialect] = useState<string>("mixed");
  const [generateCount, setGenerateCount] = useState("50");
  const [editReview, setEditReview] = useState<any>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [addOpen, setAddOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [ratingFilter, setRatingFilter] = useState<string>("all");
  const [dialectFilter, setDialectFilter] = useState<string>("all");
  const [socialProof, setSocialProof] = useState({
    social_proof_purchases: true,
    social_proof_viewers: true,
    social_proof_limited: true,
  });
  const [socialProofSaving, setSocialProofSaving] = useState(false);
  const [newReview, setNewReview] = useState({
    reviewer_name: "",
    reviewer_gender: "male",
    rating: 5,
    comment: "",
    badge_type: "verified_purchase",
  });

  // Load social proof settings
  useEffect(() => {
    const loadSocialProof = async () => {
      const { data } = await supabase
        .from("store_settings")
        .select("value")
        .eq("key", "app_config_reviews")
        .maybeSingle();
      if (data?.value && typeof data.value === "object") {
        const v = data.value as Record<string, any>;
        setSocialProof({
          social_proof_purchases: v.social_proof_purchases !== false,
          social_proof_viewers: v.social_proof_viewers !== false,
          social_proof_limited: v.social_proof_limited !== false,
        });
      }
    };
    loadSocialProof();
  }, []);

  const saveSocialProof = async (newState: typeof socialProof) => {
    setSocialProofSaving(true);
    setSocialProof(newState);
    const { error } = await supabase.from("store_settings").upsert(
      { key: "app_config_reviews", value: newState as any },
      { onConflict: "key" }
    );
    if (error) {
      toast.error("فشل في حفظ الإعدادات");
    } else {
      toast.success("تم حفظ الإعدادات");
    }
    setSocialProofSaving(false);
  };

  const { data: products = [] } = useQuery({
    queryKey: ["admin-products-list"],
    queryFn: async () => {
      const { data } = await supabase.from("products").select("id, name_ar, category, product_images(url, is_main)").order("name_ar");
      return (data || []).map((p: any) => {
        const mainImg = p.product_images?.find((img: any) => img.is_main);
        const firstImg = p.product_images?.[0];
        return { ...p, image_url: mainImg?.url || firstImg?.url || null };
      });
    },
  });

  const { data: reviews = [], isLoading } = useQuery({
    queryKey: ["admin-reviews", selectedProduct],
    queryFn: async () => {
      if (!selectedProduct) return [];
      const { data } = await supabase
        .from("product_reviews")
        .select("*")
        .eq("product_id", selectedProduct)
        .order("created_at", { ascending: false });
      return data || [];
    },
    enabled: !!selectedProduct,
  });

  const filteredReviews = useMemo(() => {
    let result = reviews;
    if (searchQuery) {
      result = result.filter((r: any) =>
        r.reviewer_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        r.comment.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    if (ratingFilter !== "all") {
      result = result.filter((r: any) => r.rating === Number(ratingFilter));
    }
    if (dialectFilter !== "all") {
      result = result.filter((r: any) => r.dialect === dialectFilter);
    }
    return result;
  }, [reviews, searchQuery, ratingFilter, dialectFilter]);

  // Stats
  const stats = useMemo(() => {
    if (!reviews.length) return null;
    const avg = (reviews.reduce((s: number, r: any) => s + r.rating, 0) / reviews.length).toFixed(1);
    const dist = [5, 4, 3, 2, 1].map(star => ({
      star,
      count: reviews.filter((r: any) => r.rating === star).length,
      pct: Math.round((reviews.filter((r: any) => r.rating === star).length / reviews.length) * 100),
    }));
    return { avg, total: reviews.length, dist };
  }, [reviews]);

  const generateMutation = useMutation({
    mutationFn: async () => {
      const product = products.find((p) => p.id === selectedProduct);
      if (!product) throw new Error("اختر منتج أولاً");
      const { data, error } = await supabase.functions.invoke("generate-reviews", {
        body: {
          productId: selectedProduct,
          productName: product.name_ar,
          productCategory: product.category,
          count: parseInt(generateCount),
          dialect: generateDialect !== "mixed" ? generateDialect : undefined,
        },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      return data;
    },
    onSuccess: (data) => {
      toast.success(`تم توليد ${data.count} تقييم بنجاح`);
      queryClient.invalidateQueries({ queryKey: ["admin-reviews", selectedProduct] });
    },
    onError: (e: any) => toast.error(e.message || "حدث خطأ"),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("product_reviews").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("تم الحذف");
      queryClient.invalidateQueries({ queryKey: ["admin-reviews", selectedProduct] });
      setDeleteId(null);
    },
  });

  const deleteAllMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("product_reviews").delete().eq("product_id", selectedProduct);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("تم حذف جميع التقييمات");
      queryClient.invalidateQueries({ queryKey: ["admin-reviews", selectedProduct] });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (review: any) => {
      const { error } = await supabase
        .from("product_reviews")
        .update({
          reviewer_name: review.reviewer_name,
          comment: review.comment,
          rating: review.rating,
          badge_type: review.badge_type,
          is_highlighted: review.is_highlighted,
          highlight_label: review.highlight_label,
        })
        .eq("id", review.id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("تم التحديث");
      queryClient.invalidateQueries({ queryKey: ["admin-reviews", selectedProduct] });
      setEditReview(null);
    },
  });

  const addMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("product_reviews").insert({
        product_id: selectedProduct,
        ...newReview,
        review_date: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString(),
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("تمت الإضافة");
      queryClient.invalidateQueries({ queryKey: ["admin-reviews", selectedProduct] });
      setAddOpen(false);
      setNewReview({ reviewer_name: "", reviewer_gender: "male", rating: 5, comment: "", badge_type: "verified_purchase" });
    },
  });

  const selectedProductName = products.find((p) => p.id === selectedProduct)?.name_ar;

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-xl font-bold text-foreground flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-amber-500/10 flex items-center justify-center">
              <Star className="w-4 h-4 text-amber-500" />
            </div>
            التقييمات والمراجعات
          </h1>
          <p className="text-xs text-muted-foreground mt-1">توليد وإدارة تقييمات المنتجات بالذكاء الاصطناعي</p>
        </div>
      </div>

      {/* Social Proof Controls */}
      <div className="rounded-2xl border border-border/60 bg-card/80 backdrop-blur-sm overflow-hidden">
        <div className="p-4 border-b border-border/40 bg-muted/30">
          <h2 className="text-sm font-bold text-foreground">⚡ محفزات التحويل (Social Proof)</h2>
          <p className="text-[11px] text-muted-foreground mt-0.5">عناصر نفسية تظهر في صفحة المنتج لزيادة معدل الشراء</p>
        </div>
        <div className="p-4 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-destructive/10 flex items-center justify-center">
                <Flame className="w-4 h-4 text-destructive" />
              </div>
              <div>
                <Label className="text-sm font-medium">عدد المشتريات اليوم</Label>
                <p className="text-[10px] text-muted-foreground">مثال: "تم شراء هذا المنتج 27 مرة اليوم"</p>
              </div>
            </div>
            <Switch
              checked={socialProof.social_proof_purchases}
              disabled={socialProofSaving}
              onCheckedChange={(v) => saveSocialProof({ ...socialProof, social_proof_purchases: v })}
            />
          </div>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center">
                <Eye className="w-4 h-4 text-emerald-600" />
              </div>
              <div>
                <Label className="text-sm font-medium">عدد المشاهدين الآن</Label>
                <p className="text-[10px] text-muted-foreground">مثال: "26 يشاهدون الآن"</p>
              </div>
            </div>
            <Switch
              checked={socialProof.social_proof_viewers}
              disabled={socialProofSaving}
              onCheckedChange={(v) => saveSocialProof({ ...socialProof, social_proof_viewers: v })}
            />
          </div>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-amber-500/10 flex items-center justify-center">
                <Clock className="w-4 h-4 text-amber-600" />
              </div>
              <div>
                <Label className="text-sm font-medium">الكمية محدودة</Label>
                <p className="text-[10px] text-muted-foreground">تظهر عبارة "الكمية محدودة" لخلق إلحاح</p>
              </div>
            </div>
            <Switch
              checked={socialProof.social_proof_limited}
              disabled={socialProofSaving}
              onCheckedChange={(v) => saveSocialProof({ ...socialProof, social_proof_limited: v })}
            />
          </div>
        </div>
      </div>

      {/* Product Selector Card */}
      <div className="rounded-2xl border border-border/60 bg-card/80 backdrop-blur-sm overflow-hidden">
        <div className="p-4 border-b border-border/40 bg-muted/30">
          <label className="text-xs font-medium text-muted-foreground mb-2 block flex items-center gap-1.5">
            <Package className="w-3.5 h-3.5" />
            اختر المنتج
          </label>
          <Select value={selectedProduct} onValueChange={setSelectedProduct}>
            <SelectTrigger className="h-11 rounded-xl bg-background">
              <SelectValue placeholder="اختر المنتج لإدارة تقييماته" />
            </SelectTrigger>
            <SelectContent className="max-h-[300px]">
              {products.map((p) => (
                <SelectItem key={p.id} value={p.id}>
                  <div className="flex items-center gap-2.5 py-0.5">
                    {p.image_url ? (
                      <img src={p.image_url} alt={p.name_ar} className="w-7 h-7 rounded-lg object-cover flex-shrink-0" />
                    ) : (
                      <div className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                        <Package className="w-3.5 h-3.5 text-primary" />
                      </div>
                    )}
                    <div className="flex flex-col items-start">
                      <span className="text-sm font-medium leading-tight">{p.name_ar}</span>
                      {p.category && (
                        <span className="text-[10px] text-muted-foreground leading-tight">{p.category}</span>
                      )}
                    </div>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {selectedProduct && (
          <div className="p-4 space-y-3">
            {/* Action Buttons */}
            <div className="flex flex-wrap gap-2">
              <div className="flex items-center gap-1.5 flex-1 min-w-[200px]">
                <Select value={generateCount} onValueChange={setGenerateCount}>
                  <SelectTrigger className="w-[90px] h-9 rounded-lg text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="20">20 تقييم</SelectItem>
                    <SelectItem value="50">50 تقييم</SelectItem>
                    <SelectItem value="100">100 تقييم</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={generateDialect} onValueChange={setGenerateDialect}>
                  <SelectTrigger className="w-[110px] h-9 rounded-lg text-xs">
                    <Globe className="w-3 h-3 ml-1" />
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="mixed">لهجات متنوعة</SelectItem>
                    <SelectItem value="khaliji">خليجي فقط</SelectItem>
                    <SelectItem value="egyptian">مصري فقط</SelectItem>
                    <SelectItem value="moroccan">مغربي فقط</SelectItem>
                    <SelectItem value="shami">شامي فقط</SelectItem>
                  </SelectContent>
                </Select>
                <Button
                  onClick={() => generateMutation.mutate()}
                  disabled={generateMutation.isPending}
                  size="sm"
                  className="gap-1.5 h-9 rounded-lg bg-gradient-to-l from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white border-0 shadow-sm flex-1"
                >
                  {generateMutation.isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
                  <span className="text-xs">توليد بالذكاء الاصطناعي</span>
                </Button>
              </div>
              <Dialog open={addOpen} onOpenChange={setAddOpen}>
                <DialogTrigger asChild>
                  <Button variant="outline" size="sm" className="gap-1.5 h-9 rounded-lg text-xs">
                    <Plus className="w-3.5 h-3.5" /> إضافة يدوي
                  </Button>
                </DialogTrigger>
                <DialogContent className="rounded-2xl">
                  <DialogHeader>
                    <DialogTitle className="text-right">إضافة تقييم يدوي</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4 pt-2">
                    <div className="space-y-1.5">
                      <label className="text-xs font-medium text-muted-foreground">اسم المراجع</label>
                      <Input
                        placeholder="مثال: أحمد محمد"
                        value={newReview.reviewer_name}
                        onChange={(e) => setNewReview({ ...newReview, reviewer_name: e.target.value })}
                        className="h-10 rounded-xl"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1.5">
                        <label className="text-xs font-medium text-muted-foreground">التقييم</label>
                        <Select value={String(newReview.rating)} onValueChange={(v) => setNewReview({ ...newReview, rating: Number(v) })}>
                          <SelectTrigger className="h-10 rounded-xl"><SelectValue /></SelectTrigger>
                          <SelectContent>
                            {[5, 4, 3, 2, 1].map((r) => (
                              <SelectItem key={r} value={String(r)}>
                                <span className="flex items-center gap-1">{r} <Star className="w-3 h-3 fill-amber-400 text-amber-400" /></span>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-xs font-medium text-muted-foreground">الجنس</label>
                        <Select value={newReview.reviewer_gender} onValueChange={(v) => setNewReview({ ...newReview, reviewer_gender: v })}>
                          <SelectTrigger className="h-10 rounded-xl"><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="male">ذكر</SelectItem>
                            <SelectItem value="female">أنثى</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-medium text-muted-foreground">التعليق</label>
                      <Textarea
                        placeholder="اكتب تعليق المراجعة..."
                        value={newReview.comment}
                        onChange={(e) => setNewReview({ ...newReview, comment: e.target.value })}
                        className="rounded-xl min-h-[80px]"
                      />
                    </div>
                    <Button
                      onClick={() => addMutation.mutate()}
                      disabled={addMutation.isPending || !newReview.reviewer_name || !newReview.comment}
                      className="w-full h-10 rounded-xl"
                    >
                      {addMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : "إضافة التقييم"}
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
              {reviews.length > 0 && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => deleteAllMutation.mutate()}
                  disabled={deleteAllMutation.isPending}
                  className="gap-1.5 h-9 rounded-lg text-xs text-destructive hover:text-destructive border-destructive/20 hover:bg-destructive/5"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  حذف الكل
                </Button>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Stats Card */}
      {stats && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-2xl border border-border/60 bg-card/80 backdrop-blur-sm p-4"
        >
          <div className="flex items-start gap-4">
            {/* Average */}
            <div className="text-center flex-shrink-0">
              <div className="text-3xl font-bold text-foreground">{stats.avg}</div>
              <ReviewStars rating={Math.round(Number(stats.avg))} size="md" />
              <div className="text-[11px] text-muted-foreground mt-1">{stats.total} تقييم</div>
            </div>
            {/* Distribution */}
            <div className="flex-1 space-y-1.5">
              {stats.dist.map(({ star, count, pct }) => (
                <div key={star} className="flex items-center gap-2 text-xs">
                  <span className="w-3 text-muted-foreground font-medium">{star}</span>
                  <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                  <div className="flex-1 h-2 bg-muted/50 rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${pct}%` }}
                      transition={{ duration: 0.5, delay: (5 - star) * 0.08 }}
                      className="h-full bg-amber-400 rounded-full"
                    />
                  </div>
                  <span className="w-8 text-left text-muted-foreground tabular-nums">{pct}%</span>
                </div>
              ))}
            </div>
          </div>
        </motion.div>
      )}

      {/* Reviews List */}
      {selectedProduct && (
        <div className="space-y-3">
          {/* Search & Filter */}
          {reviews.length > 0 && (
            <div className="flex gap-2 flex-wrap">
              <div className="relative flex-1 min-w-[150px]">
                <Search className="w-3.5 h-3.5 absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="ابحث في التقييمات..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="h-9 rounded-lg pr-9 text-xs"
                />
              </div>
              <Select value={ratingFilter} onValueChange={setRatingFilter}>
                <SelectTrigger className="w-[100px] h-9 rounded-lg text-xs">
                  <Filter className="w-3 h-3 ml-1" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">كل النجوم</SelectItem>
                  {[5, 4, 3, 2, 1].map(r => (
                    <SelectItem key={r} value={String(r)}>{r} نجوم</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={dialectFilter} onValueChange={setDialectFilter}>
                <SelectTrigger className="w-[110px] h-9 rounded-lg text-xs">
                  <Globe className="w-3 h-3 ml-1" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">كل اللهجات</SelectItem>
                  {Object.entries(dialectLabels).map(([key, label]) => (
                    <SelectItem key={key} value={key}>{label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>{filteredReviews.length} تقييم {searchQuery || ratingFilter !== "all" ? `(من ${reviews.length})` : ""}</span>
            <span className="text-[11px]">{selectedProductName}</span>
          </div>

          {isLoading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
            </div>
          ) : reviews.length === 0 ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center py-16 border border-dashed border-border/60 rounded-2xl bg-muted/20"
            >
              <div className="w-12 h-12 rounded-2xl bg-amber-500/10 flex items-center justify-center mx-auto mb-3">
                <MessageSquare className="w-6 h-6 text-amber-500" />
              </div>
              <p className="text-sm font-medium text-foreground">لا توجد تقييمات بعد</p>
              <p className="text-xs text-muted-foreground mt-1">استخدم زر "توليد بالذكاء الاصطناعي" لإنشاء تقييمات تلقائياً</p>
            </motion.div>
          ) : (
            <div className="space-y-2">
              <AnimatePresence mode="popLayout">
                {filteredReviews.map((r: any, idx: number) => (
                  <motion.div
                    key={r.id}
                    layout
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ duration: 0.2, delay: idx < 10 ? idx * 0.03 : 0 }}
                    className="rounded-xl border border-border/50 bg-card/80 backdrop-blur-sm p-3 hover:border-border transition-colors group"
                  >
                    <div className="flex items-start gap-3">
                      <ReviewAvatar name={r.reviewer_name} gender={r.reviewer_gender} />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-sm font-semibold text-foreground">{r.reviewer_name}</span>
                          <ReviewStars rating={r.rating} />
                          {r.badge_type && badgeLabels[r.badge_type] && (
                            <Badge variant="secondary" className="text-[10px] h-5 px-1.5 font-normal bg-emerald-50 text-emerald-700 border-emerald-200/50">
                              {badgeLabels[r.badge_type]}
                            </Badge>
                          )}
                          {r.dialect && dialectLabels[r.dialect] && (
                            <Badge variant="outline" className="text-[10px] h-5 px-1.5 font-normal border-primary/20 text-primary/70">
                              <Globe className="w-2.5 h-2.5 ml-0.5" />
                              {dialectLabels[r.dialect]}
                            </Badge>
                          )}
                          {r.is_highlighted && (
                            <Badge variant="secondary" className="text-[10px] h-5 px-1.5 font-normal bg-amber-50 text-amber-700 border-amber-200/50">
                              {r.highlight_label || "مميز"}
                            </Badge>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground mt-1.5 leading-relaxed line-clamp-3">{r.comment}</p>
                        <div className="text-[10px] text-muted-foreground/50 mt-1.5">
                          {new Date(r.review_date).toLocaleDateString("ar-SA", { year: "numeric", month: "short", day: "numeric" })}
                        </div>
                      </div>
                      <div className="flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-7 w-7 rounded-lg"
                          onClick={() => setEditReview({ ...r })}
                        >
                          <Pencil className="w-3 h-3 text-muted-foreground" />
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-7 w-7 rounded-lg"
                          onClick={() => setDeleteId(r.id)}
                        >
                          <Trash2 className="w-3 h-3 text-destructive" />
                        </Button>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          )}
        </div>
      )}

      {/* Empty state when no product selected */}
      {!selectedProduct && (
        <div className="text-center py-20">
          <div className="w-14 h-14 rounded-2xl bg-muted/40 flex items-center justify-center mx-auto mb-4">
            <Star className="w-7 h-7 text-muted-foreground/40" />
          </div>
          <p className="text-sm text-muted-foreground">اختر منتجًا للبدء في إدارة تقييماته</p>
        </div>
      )}

      {/* Edit Dialog */}
      <Dialog open={!!editReview} onOpenChange={(o) => !o && setEditReview(null)}>
        <DialogContent className="rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-right">تعديل التقييم</DialogTitle>
          </DialogHeader>
          {editReview && (
            <div className="space-y-4 pt-2">
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground">اسم المراجع</label>
                <Input
                  value={editReview.reviewer_name}
                  onChange={(e) => setEditReview({ ...editReview, reviewer_name: e.target.value })}
                  className="h-10 rounded-xl"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground">التقييم</label>
                <Select value={String(editReview.rating)} onValueChange={(v) => setEditReview({ ...editReview, rating: Number(v) })}>
                  <SelectTrigger className="h-10 rounded-xl"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {[5, 4, 3, 2, 1].map((r) => (
                      <SelectItem key={r} value={String(r)}>
                        <span className="flex items-center gap-1">{r} <Star className="w-3 h-3 fill-amber-400 text-amber-400" /></span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground">التعليق</label>
                <Textarea
                  value={editReview.comment}
                  onChange={(e) => setEditReview({ ...editReview, comment: e.target.value })}
                  className="rounded-xl min-h-[80px]"
                />
              </div>
              <Button
                onClick={() => updateMutation.mutate(editReview)}
                disabled={updateMutation.isPending}
                className="w-full h-10 rounded-xl"
              >
                {updateMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : "حفظ التعديلات"}
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <ConfirmDeleteDialog
        open={!!deleteId}
        onOpenChange={(o) => !o && setDeleteId(null)}
        onConfirm={() => deleteId && deleteMutation.mutate(deleteId)}
        title="حذف التقييم"
        description="هل أنت متأكد من حذف هذا التقييم؟"
      />
    </div>
  );
}
