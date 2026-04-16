import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { ConfirmDeleteDialog } from "@/components/ConfirmDeleteDialog";
import { Badge } from "@/components/ui/badge";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import {
  Gift, Plus, Trash2, Pencil, Loader2, Image as ImageIcon,
  Package, Sparkles, Link2, ToggleLeft, ToggleRight, GripVertical
} from "lucide-react";

export default function AdminGifts() {
  const queryClient = useQueryClient();
  const [editGift, setEditGift] = useState<any>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [addOpen, setAddOpen] = useState(false);
  const [form, setForm] = useState({
    name: "", sku: "", image_url: "", is_active: true, product_ids: [] as string[],
  });

  const { data: gifts = [], isLoading } = useQuery({
    queryKey: ["admin-gifts"],
    queryFn: async () => {
      const { data } = await supabase
        .from("gifts")
        .select("*")
        .order("sort_order", { ascending: true });
      return data || [];
    },
  });

  const { data: products = [] } = useQuery({
    queryKey: ["admin-products-for-gifts"],
    queryFn: async () => {
      const { data } = await supabase.from("products").select("id, name_ar").order("name_ar");
      return data || [];
    },
  });

  const upsertMutation = useMutation({
    mutationFn: async (gift: any) => {
      if (gift.id) {
        const { error } = await supabase.from("gifts").update({
          name: gift.name, sku: gift.sku, image_url: gift.image_url,
          is_active: gift.is_active, product_ids: gift.product_ids,
        }).eq("id", gift.id);
        if (error) throw error;
      } else {
        const maxSort = gifts.length;
        const { error } = await supabase.from("gifts").insert({
          name: gift.name, sku: gift.sku, image_url: gift.image_url,
          is_active: gift.is_active, product_ids: gift.product_ids, sort_order: maxSort,
        });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      toast.success(editGift ? "تم تحديث الهدية" : "تم إضافة الهدية");
      queryClient.invalidateQueries({ queryKey: ["admin-gifts"] });
      resetForm();
    },
    onError: (e: any) => toast.error(e.message),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("gifts").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("تم حذف الهدية");
      queryClient.invalidateQueries({ queryKey: ["admin-gifts"] });
    },
  });

  const toggleMutation = useMutation({
    mutationFn: async ({ id, is_active }: { id: string; is_active: boolean }) => {
      const { error } = await supabase.from("gifts").update({ is_active }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["admin-gifts"] }),
  });

  const resetForm = () => {
    setForm({ name: "", sku: "", image_url: "", is_active: true, product_ids: [] });
    setEditGift(null);
    setAddOpen(false);
  };

  const openEdit = (gift: any) => {
    setForm({
      name: gift.name, sku: gift.sku, image_url: gift.image_url || "",
      is_active: gift.is_active, product_ids: gift.product_ids || [],
    });
    setEditGift(gift);
    setAddOpen(true);
  };

  const handleSubmit = () => {
    if (!form.name.trim() || !form.sku.trim()) {
      toast.error("الاسم و SKU مطلوبان");
      return;
    }
    upsertMutation.mutate({ ...form, id: editGift?.id });
  };

  const activeCount = useMemo(() => gifts.filter((g: any) => g.is_active).length, [gifts]);

  const getLinkedProducts = (pIds: string[]) => {
    if (!pIds?.length) return "كل المنتجات";
    return pIds.map(id => products.find(p => p.id === id)?.name_ar || "—").join("، ");
  };

  // Upload image
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const ext = file.name.split(".").pop();
    const path = `gifts/${Date.now()}.${ext}`;
    const { error } = await supabase.storage.from("product-images").upload(path, file);
    if (error) { toast.error("فشل رفع الصورة"); return; }
    const { data: urlData } = supabase.storage.from("product-images").getPublicUrl(path);
    setForm(prev => ({ ...prev, image_url: urlData.publicUrl }));
    toast.success("تم رفع الصورة");
  };

  return (
    <div className="space-y-5">
      {/* Stats Header */}
      <div className="grid grid-cols-2 gap-3">
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-2xl border border-border/60 bg-gradient-to-br from-pink-50 to-rose-50 dark:from-pink-950/20 dark:to-rose-950/20 p-4"
        >
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-pink-500 to-rose-500 flex items-center justify-center shadow-lg shadow-pink-200/50 dark:shadow-pink-900/30">
              <Gift className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">{gifts.length}</p>
              <p className="text-[11px] text-muted-foreground">إجمالي الهدايا</p>
            </div>
          </div>
        </motion.div>
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="rounded-2xl border border-border/60 bg-gradient-to-br from-emerald-50 to-green-50 dark:from-emerald-950/20 dark:to-green-950/20 p-4"
        >
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-green-500 flex items-center justify-center shadow-lg shadow-emerald-200/50 dark:shadow-emerald-900/30">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">{activeCount}</p>
              <p className="text-[11px] text-muted-foreground">هدايا مفعّلة</p>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Add Gift Button */}
      <Dialog open={addOpen} onOpenChange={(v) => { if (!v) resetForm(); setAddOpen(v); }}>
        <DialogTrigger asChild>
          <Button className="w-full gap-2 h-11 rounded-xl bg-gradient-to-l from-pink-500 to-rose-500 hover:from-pink-600 hover:to-rose-600 text-white border-0 shadow-md shadow-pink-200/40">
            <Plus className="w-4 h-4" />
            إضافة هدية جديدة
          </Button>
        </DialogTrigger>
        <DialogContent className="max-w-md rounded-2xl" dir="rtl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Gift className="w-5 h-5 text-pink-500" />
              {editGift ? "تعديل الهدية" : "إضافة هدية"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            {/* Image */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">صورة الهدية</Label>
              <div className="flex items-center gap-3">
                {form.image_url ? (
                  <div className="w-20 h-20 rounded-xl border border-border overflow-hidden bg-muted">
                    <img src={form.image_url} alt="" className="w-full h-full object-contain" />
                  </div>
                ) : (
                  <div className="w-20 h-20 rounded-xl border-2 border-dashed border-border flex items-center justify-center bg-muted/30">
                    <ImageIcon className="w-6 h-6 text-muted-foreground/50" />
                  </div>
                )}
                <div className="flex-1 space-y-2">
                  <label className="cursor-pointer inline-flex items-center gap-1.5 text-xs bg-muted hover:bg-muted/80 px-3 py-2 rounded-lg transition-colors">
                    <ImageIcon className="w-3.5 h-3.5" />
                    رفع صورة
                    <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
                  </label>
                  <Input
                    value={form.image_url}
                    onChange={(e) => setForm(prev => ({ ...prev, image_url: e.target.value }))}
                    placeholder="أو الصق رابط الصورة..."
                    className="h-9 text-xs rounded-lg"
                    dir="ltr"
                  />
                </div>
              </div>
            </div>

            {/* Name */}
            <div className="space-y-1.5">
              <Label className="text-sm font-medium">اسم الهدية</Label>
              <Input
                value={form.name}
                onChange={(e) => setForm(prev => ({ ...prev, name: e.target.value }))}
                placeholder="مثال: كريم العناية بالبشرة"
                className="h-10 rounded-xl"
              />
            </div>

            {/* SKU */}
            <div className="space-y-1.5">
              <Label className="text-sm font-medium">رمز المنتج (SKU)</Label>
              <Input
                value={form.sku}
                onChange={(e) => setForm(prev => ({ ...prev, sku: e.target.value.toUpperCase() }))}
                placeholder="مثال: GIFT001"
                className="h-10 rounded-xl font-mono"
                dir="ltr"
              />
            </div>

            {/* Linked Products */}
            <div className="space-y-1.5">
              <Label className="text-sm font-medium flex items-center gap-1.5">
                <Link2 className="w-3.5 h-3.5" />
                ربط بمنتجات محددة
              </Label>
              <p className="text-[11px] text-muted-foreground">اتركه فارغاً لعرض الهدية مع كل المنتجات</p>
              <Select
                value="__placeholder__"
                onValueChange={(v) => {
                  if (v === "__placeholder__") return;
                  if (!form.product_ids.includes(v)) {
                    setForm(prev => ({ ...prev, product_ids: [...prev.product_ids, v] }));
                  }
                }}
              >
                <SelectTrigger className="h-10 rounded-xl text-xs">
                  <SelectValue placeholder="اختر منتج لربطه..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__placeholder__" disabled>اختر منتج...</SelectItem>
                  {products
                    .filter(p => !form.product_ids.includes(p.id))
                    .map(p => (
                      <SelectItem key={p.id} value={p.id}>{p.name_ar}</SelectItem>
                    ))}
                </SelectContent>
              </Select>
              {form.product_ids.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {form.product_ids.map(id => {
                    const product = products.find(p => p.id === id);
                    return (
                      <Badge
                        key={id}
                        variant="secondary"
                        className="gap-1 text-[11px] cursor-pointer hover:bg-destructive/10 hover:text-destructive transition-colors"
                        onClick={() => setForm(prev => ({
                          ...prev,
                          product_ids: prev.product_ids.filter(pid => pid !== id),
                        }))}
                      >
                        {product?.name_ar || id}
                        <span className="text-[9px]">✕</span>
                      </Badge>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Active toggle */}
            <div className="flex items-center justify-between py-1">
              <Label className="text-sm font-medium">مفعّلة</Label>
              <Switch
                checked={form.is_active}
                onCheckedChange={(v) => setForm(prev => ({ ...prev, is_active: v }))}
              />
            </div>

            <Button
              onClick={handleSubmit}
              disabled={upsertMutation.isPending}
              className="w-full h-11 rounded-xl gap-2 bg-gradient-to-l from-pink-500 to-rose-500 hover:from-pink-600 hover:to-rose-600 text-white"
            >
              {upsertMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Gift className="w-4 h-4" />}
              {editGift ? "تحديث الهدية" : "إضافة الهدية"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Gift Cards */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
        </div>
      ) : gifts.length === 0 ? (
        <div className="text-center py-16 space-y-3">
          <div className="w-16 h-16 rounded-2xl bg-pink-50 dark:bg-pink-950/30 flex items-center justify-center mx-auto">
            <Gift className="w-8 h-8 text-pink-400" />
          </div>
          <p className="text-sm text-muted-foreground">لا توجد هدايا بعد</p>
        </div>
      ) : (
        <div className="space-y-3">
          <AnimatePresence>
            {gifts.map((gift: any, idx: number) => (
              <motion.div
                key={gift.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ delay: idx * 0.03 }}
                className={`rounded-2xl border overflow-hidden transition-all ${
                  gift.is_active
                    ? "border-border/60 bg-card shadow-sm"
                    : "border-border/30 bg-muted/20 opacity-60"
                }`}
              >
                <div className="flex items-stretch">
                  {/* Image */}
                  <div className="w-24 h-24 flex-shrink-0 bg-muted overflow-hidden">
                    {gift.image_url ? (
                      <img src={gift.image_url} alt={gift.name} className="w-full h-full object-contain" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Gift className="w-8 h-8 text-pink-300" />
                      </div>
                    )}
                  </div>

                  {/* Info */}
                  <div className="flex-1 p-3 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <h3 className="font-bold text-sm text-foreground truncate">{gift.name}</h3>
                        <p className="text-[11px] text-muted-foreground font-mono mt-0.5">SKU: {gift.sku}</p>
                      </div>
                      <Switch
                        checked={gift.is_active}
                        onCheckedChange={(v) => toggleMutation.mutate({ id: gift.id, is_active: v })}
                        className="flex-shrink-0"
                      />
                    </div>

                    <div className="flex items-center gap-1.5 mt-2">
                      <Link2 className="w-3 h-3 text-muted-foreground" />
                      <span className="text-[10px] text-muted-foreground truncate">
                        {getLinkedProducts(gift.product_ids)}
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5 mt-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 px-2 text-xs gap-1"
                        onClick={() => openEdit(gift)}
                      >
                        <Pencil className="w-3 h-3" />
                        تعديل
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 px-2 text-xs gap-1 text-destructive hover:text-destructive"
                        onClick={() => setDeleteId(gift.id)}
                      >
                        <Trash2 className="w-3 h-3" />
                        حذف
                      </Button>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}

      <ConfirmDeleteDialog
        open={!!deleteId}
        onOpenChange={() => setDeleteId(null)}
        onConfirm={() => { if (deleteId) deleteMutation.mutate(deleteId); setDeleteId(null); }}
        title="حذف الهدية"
        description="هل أنت متأكد من حذف هذه الهدية؟"
      />
    </div>
  );
}
