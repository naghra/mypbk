import { useEffect, useState } from "react";
import CodFormLogo from "@/components/CodFormLogo";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { motion, AnimatePresence } from "framer-motion";
import {
  Save, Eye, FileText, Sparkles, Shield, Type, Palette, BarChart3, Facebook,
  User, Phone, MapPin, GripVertical, Rocket, Zap, Smartphone, Monitor,
  Loader2, CheckCircle, Settings2, Wand2, Crown, Flame, Star,
  Plus, Trash2, Tag, Package,
} from "lucide-react";

// ─── Types ───
export interface OfferItem {
  id: string;
  title: string;
  quantity: number;
  price: number;
  old_price: number | null;
  label: string;
  is_best: boolean;
  product_id?: string | null;
}

interface ProductOption {
  id: string;
  name_ar: string;
}

interface CodFormSettings {
  form_title: string;
  form_subtitle: string;
  button_text: string;
  button_color: string;
  show_city_field: boolean;
  city_field_required: boolean;
  show_urgency_text: boolean;
  urgency_text: string;
  show_trust_badges: boolean;
  trust_badge_1: string;
  trust_badge_2: string;
  trust_badge_3: string;
  success_message: string;
  name_placeholder: string;
  phone_placeholder: string;
  city_placeholder: string;
  show_offers: boolean;
  offers: OfferItem[];
}

interface PixelConfig {
  facebook_pixel_id: string;
  facebook_enabled: boolean;
  snapchat_pixel_id: string;
  snapchat_enabled: boolean;
  tiktok_pixel_id: string;
  tiktok_enabled: boolean;
  google_ads_id: string;
  google_ads_enabled: boolean;
}

const defaultPixels: PixelConfig = {
  facebook_pixel_id: "",
  facebook_enabled: false,
  snapchat_pixel_id: "",
  snapchat_enabled: false,
  tiktok_pixel_id: "",
  tiktok_enabled: false,
  google_ads_id: "",
  google_ads_enabled: false,
};

const DEFAULT_OFFERS: OfferItem[] = [
  { id: "1", title: "عرض 1", quantity: 1, price: 99, old_price: null, label: "", is_best: false, product_id: null },
  { id: "2", title: "عرض 2", quantity: 2, price: 180, old_price: 198, label: "الأكثر طلباً 🔥", is_best: true, product_id: null },
  { id: "3", title: "عرض 3", quantity: 3, price: 250, old_price: 297, label: "وفّر أكثر 💰", is_best: false, product_id: null },
];

const DEFAULT_SETTINGS: CodFormSettings = {
  form_title: "للطلب ادخل معلوماتك في الخانات اسفله",
  form_subtitle: "الدفع عند الاستلام - توصيل سريع",
  button_text: "اضغط لتأكيد الطلب",
  button_color: "destructive",
  show_city_field: false,
  city_field_required: false,
  show_urgency_text: true,
  urgency_text: "⚡ بقيت كميات محدودة!",
  show_trust_badges: true,
  trust_badge_1: "الدفع عند الاستلام",
  trust_badge_2: "توصيل سريع",
  trust_badge_3: "ضمان الجودة",
  success_message: "تم تأكيد طلبك بنجاح!",
  name_placeholder: "ادخل اسمك هنا",
  phone_placeholder: "ادخل رقم هاتفك هنا",
  city_placeholder: "المدينة / العنوان",
  show_offers: false,
  offers: DEFAULT_OFFERS,
};

type ActivePanel = "fields" | "conversion" | "design" | "pixels" | "messages";

// ─── Field Card ───
function FieldCard({ icon: Icon, name, desc, required, enabled, onToggle, requiredToggle, onRequiredToggle }: {
  icon: any; name: string; desc: string; required?: boolean; enabled?: boolean;
  onToggle?: (v: boolean) => void; requiredToggle?: boolean; onRequiredToggle?: (v: boolean) => void;
}) {
  return (
    <motion.div
      layout
      whileHover={{ scale: 1.01, y: -2 }}
      className="group relative rounded-xl border border-border/60 bg-card/80 backdrop-blur-sm p-4 transition-all duration-200 hover:shadow-lg hover:shadow-primary/5 hover:border-primary/30"
    >
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0 group-hover:bg-primary/20 transition-colors">
          <Icon className="w-4.5 h-4.5 text-primary" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-foreground">{name}</p>
          <p className="text-[11px] text-muted-foreground">{desc}</p>
        </div>
        <div className="flex items-center gap-2">
          {required && !onToggle && (
            <span className="text-[10px] bg-primary/10 text-primary px-2.5 py-1 rounded-full font-bold tracking-wide">مطلوب</span>
          )}
          {onToggle && (
            <Switch checked={enabled} onCheckedChange={onToggle} />
          )}
        </div>
      </div>
      {enabled && onRequiredToggle && (
        <motion.div
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: "auto", opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          className="mt-3 pt-3 border-t border-border/40 flex items-center justify-between"
        >
          <span className="text-xs text-muted-foreground">حقل مطلوب؟</span>
          <Switch checked={requiredToggle} onCheckedChange={onRequiredToggle} />
        </motion.div>
      )}
    </motion.div>
  );
}

// ─── Offer Card (Builder) ───
function OfferBuilderCard({ offer, onChange, onDelete, products }: {
  offer: OfferItem;
  onChange: (updated: OfferItem) => void;
  onDelete: () => void;
  products: ProductOption[];
}) {
  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className={`rounded-xl border p-4 space-y-3 transition-all ${
        offer.is_best ? "border-primary/50 bg-primary/5" : "border-border/50 bg-card/80"
      }`}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Tag className="w-4 h-4 text-primary" />
          <span className="text-sm font-bold text-foreground">{offer.title || "عرض"}</span>
          {offer.is_best && (
            <span className="text-[10px] bg-primary/20 text-primary px-2 py-0.5 rounded-full font-bold">الأفضل</span>
          )}
        </div>
        <button onClick={onDelete} className="p-1.5 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors">
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <div>
          <Label className="text-[11px] text-muted-foreground">العنوان</Label>
          <Input value={offer.title} onChange={(e) => onChange({ ...offer, title: e.target.value })} className="mt-0.5 rounded-lg h-9 text-sm" />
        </div>
        <div>
          <Label className="text-[11px] text-muted-foreground">الكمية</Label>
          <Input type="number" min={1} value={offer.quantity} onChange={(e) => onChange({ ...offer, quantity: parseInt(e.target.value) || 1 })} className="mt-0.5 rounded-lg h-9 text-sm" />
        </div>
        <div>
          <Label className="text-[11px] text-muted-foreground">السعر</Label>
          <Input type="number" min={0} value={offer.price} onChange={(e) => onChange({ ...offer, price: parseFloat(e.target.value) || 0 })} className="mt-0.5 rounded-lg h-9 text-sm" />
        </div>
        <div>
          <Label className="text-[11px] text-muted-foreground">السعر القديم</Label>
          <Input type="number" min={0} value={offer.old_price || ""} onChange={(e) => onChange({ ...offer, old_price: parseFloat(e.target.value) || null })} className="mt-0.5 rounded-lg h-9 text-sm" placeholder="اختياري" />
        </div>
      </div>

      {/* Product selector */}
      <div>
        <Label className="text-[11px] text-muted-foreground flex items-center gap-1">
          <Package className="w-3 h-3" />
          المنتج المستهدف
        </Label>
        <Select
          value={offer.product_id || "all"}
          onValueChange={(v) => onChange({ ...offer, product_id: v === "all" ? null : v })}
        >
          <SelectTrigger className="mt-0.5 rounded-lg h-9 text-sm">
            <SelectValue placeholder="جميع المنتجات" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">جميع المنتجات</SelectItem>
            {products.map((p) => (
              <SelectItem key={p.id} value={p.id}>{p.name_ar}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="grid grid-cols-2 gap-2 items-end">
        <div>
          <Label className="text-[11px] text-muted-foreground">الشارة</Label>
          <Input value={offer.label} onChange={(e) => onChange({ ...offer, label: e.target.value })} className="mt-0.5 rounded-lg h-9 text-sm" placeholder="مثال: الأكثر طلباً 🔥" />
        </div>
        <div className="flex items-center gap-2 pb-1">
          <Switch checked={offer.is_best} onCheckedChange={(v) => onChange({ ...offer, is_best: v })} />
          <span className="text-xs text-muted-foreground">العرض الأفضل</span>
        </div>
      </div>
    </motion.div>
  );
}

// ─── Live Preview ───
function LivePreview({ settings, mobileView }: { settings: CodFormSettings; mobileView: boolean }) {
  const [selectedOffer, setSelectedOffer] = useState<string | null>(
    settings.offers?.find(o => o.is_best)?.id || settings.offers?.[0]?.id || null
  );

  const btnColor =
    settings.button_color === "primary" ? "bg-primary" :
    settings.button_color === "green" ? "bg-emerald-600" : "bg-destructive";

  return (
    <div className={`mx-auto transition-all duration-500 ${mobileView ? "max-w-[320px]" : "max-w-[380px]"}`}>
      <div className="rounded-2xl border-2 border-border/50 overflow-hidden bg-card shadow-2xl shadow-black/5">
        {/* Header */}
        <div className="bg-gradient-to-l from-foreground to-foreground/90 px-5 py-5 text-center space-y-1.5">
          <motion.h3
            key={settings.form_title}
            initial={{ opacity: 0.5 }}
            animate={{ opacity: 1 }}
            className="text-base font-bold text-primary-foreground leading-relaxed"
          >
            {settings.form_title}
          </motion.h3>
          {settings.form_subtitle && (
            <p className="text-primary-foreground/60 text-xs">{settings.form_subtitle}</p>
          )}
        </div>

        {/* Form body */}
        <div className="px-5 py-5 space-y-3">
          {/* Offers */}
          {settings.show_offers && settings.offers?.length > 0 && (
            <div className="space-y-2">
              <p className="text-xs font-bold text-foreground text-center">اختر العرض المناسب</p>
              {settings.offers.map((offer) => (
                <motion.div
                  key={offer.id}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setSelectedOffer(offer.id)}
                  className={`relative rounded-xl border-2 p-3 cursor-pointer transition-all duration-200 ${
                    selectedOffer === offer.id
                      ? "border-destructive bg-destructive/5 shadow-md shadow-destructive/10"
                      : "border-border/50 hover:border-destructive/30"
                  }`}
                >
                  {offer.label && (
                    <span className={`absolute -top-2.5 right-3 text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      offer.is_best ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
                    }`}>
                      {offer.label}
                    </span>
                  )}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                        selectedOffer === offer.id ? "border-destructive" : "border-muted-foreground/30"
                      }`}>
                        {selectedOffer === offer.id && <div className="w-2 h-2 rounded-full bg-destructive" />}
                      </div>
                      <span className="text-sm font-semibold text-foreground">{offer.title || `${offer.quantity} قطعة`}</span>
                    </div>
                    <div className="flex items-baseline gap-1.5">
                      {offer.old_price && (
                        <span className="text-xs text-muted-foreground line-through">{offer.old_price}</span>
                      )}
                      <span className="text-sm font-bold text-foreground">{offer.price}</span>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}

          {/* Name */}
          <div className="relative">
            <User className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/50" />
            <div className="h-11 rounded-xl border border-input bg-background flex items-center pr-10 px-4">
              <span className="text-sm text-muted-foreground/60">{settings.name_placeholder}</span>
            </div>
          </div>

          {/* Phone */}
          <div className="relative">
            <Phone className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/50" />
            <div className="h-11 rounded-xl border border-input bg-background flex items-center pr-10 px-4">
              <span className="text-sm text-muted-foreground/60">{settings.phone_placeholder}</span>
            </div>
          </div>

          {/* City */}
          <AnimatePresence>
            {settings.show_city_field && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="relative overflow-hidden"
              >
                <div className="relative">
                  <MapPin className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/50" />
                  <div className="h-11 rounded-xl border border-input bg-background flex items-center pr-10 px-4">
                    <span className="text-sm text-muted-foreground/60">{settings.city_placeholder}</span>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Urgency */}
          <AnimatePresence>
            {settings.show_urgency_text && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="bg-destructive/10 rounded-xl px-4 py-2.5 text-center"
              >
                <p className="text-destructive text-xs font-bold animate-pulse">{settings.urgency_text}</p>
              </motion.div>
            )}
          </AnimatePresence>

          {/* CTA */}
          <motion.div
            key={settings.button_text + settings.button_color}
            initial={{ scale: 0.97 }}
            animate={{ scale: 1 }}
            className={`h-12 rounded-xl flex items-center justify-center font-bold text-sm text-white ${btnColor} shadow-lg`}
          >
            {settings.button_text}
          </motion.div>

          {/* Trust */}
          <AnimatePresence>
            {settings.show_trust_badges && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex justify-center gap-4 text-[10px] text-muted-foreground pt-1"
              >
                <span>✓ {settings.trust_badge_1}</span>
                <span>✓ {settings.trust_badge_2}</span>
                <span>✓ {settings.trust_badge_3}</span>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}

// ─── MAIN ───
export default function AdminCodForm() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [settings, setSettings] = useState<CodFormSettings>(DEFAULT_SETTINGS);
  const [pixels, setPixels] = useState<PixelConfig>(defaultPixels);
  const [activePanel, setActivePanel] = useState<ActivePanel>("fields");
  const [mobilePreview, setMobilePreview] = useState(false);
  const [products, setProducts] = useState<ProductOption[]>([]);

  useEffect(() => {
    (async () => {
      const [settingsRes, productsRes] = await Promise.all([
        supabase.from("store_settings").select("*").in("key", ["cod_form", "tracking"]),
        supabase.from("products").select("id, name_ar").order("created_at", { ascending: false }),
      ]);
      if (productsRes.data) setProducts(productsRes.data);
      if (settingsRes.data) {
        for (const row of settingsRes.data) {
          const v = row.value as any;
          if (row.key === "cod_form") {
            setSettings({ ...DEFAULT_SETTINGS, ...v, offers: v.offers || DEFAULT_OFFERS });
          } else if (row.key === "tracking") {
            setPixels({
              facebook_pixel_id: v.facebook_pixel_id || "",
              facebook_enabled: v.facebook_enabled ?? v.pixel_enabled ?? false,
              snapchat_pixel_id: v.snapchat_pixel_id || "",
              snapchat_enabled: v.snapchat_enabled ?? false,
              tiktok_pixel_id: v.tiktok_pixel_id || "",
              tiktok_enabled: v.tiktok_enabled ?? false,
              google_ads_id: v.google_ads_id || "",
              google_ads_enabled: v.google_ads_enabled ?? false,
            });
          }
        }
      }
      setLoading(false);
    })();
  }, []);

  const update = (key: keyof CodFormSettings, value: any) => setSettings((prev) => ({ ...prev, [key]: value }));
  const updatePixel = (key: keyof PixelConfig, value: string | boolean) => setPixels((prev) => ({ ...prev, [key]: value }));

  const addOffer = () => {
    const newOffer: OfferItem = {
      id: String(Date.now()),
      title: `عرض ${(settings.offers?.length || 0) + 1}`,
      quantity: 1,
      price: 0,
      old_price: null,
      label: "",
      is_best: false,
    };
    update("offers", [...(settings.offers || []), newOffer]);
  };

  const updateOffer = (id: string, updated: OfferItem) => {
    update("offers", settings.offers.map((o) => (o.id === id ? updated : o)));
  };

  const deleteOffer = (id: string) => {
    update("offers", settings.offers.filter((o) => o.id !== id));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const { data: existing } = await supabase.from("store_settings").select("id").eq("key", "cod_form").maybeSingle();
      if (existing) {
        await supabase.from("store_settings").update({ value: settings as any }).eq("key", "cod_form");
      } else {
        await supabase.from("store_settings").insert({ key: "cod_form", value: settings as any });
      }
      await supabase.from("store_settings").upsert({ key: "tracking", value: pixels as any }, { onConflict: "key" });
      toast({ title: "✅ تم حفظ الإعدادات بنجاح" });
    } catch {
      toast({ title: "خطأ", description: "فشل حفظ الإعدادات", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  const panels: { id: ActivePanel; label: string; icon: any }[] = [
    { id: "fields", label: "الحقول", icon: FileText },
    { id: "conversion", label: "التحويلات", icon: Rocket },
    { id: "design", label: "التصميم", icon: Palette },
    { id: "pixels", label: "البيكسلات", icon: BarChart3 },
    { id: "messages", label: "الرسائل", icon: Type },
  ];

  const pixelSections = [
    { title: "فيسبوك بيكسل", icon: <Facebook className="w-5 h-5 text-[#1877F2]" />, enabledKey: "facebook_enabled" as const, idKey: "facebook_pixel_id" as const, placeholder: "123456789012345" },
    { title: "سناب شات بيكسل", icon: <svg className="w-5 h-5" viewBox="0 0 24 24" fill="#FFFC00"><path d="M12.206.793c.99 0 4.347.276 5.93 3.821.529 1.193.403 3.219.299 4.847l-.003.06c-.012.18-.022.345-.03.51.075.045.203.09.401.09.3-.016.659-.12 1.033-.301a.603.603 0 0 1 .272-.067c.12 0 .24.03.34.09.18.09.3.27.3.48a.602.602 0 0 1-.36.54c-.12.06-.63.27-1.35.42-.06.016-.12.03-.18.045-.012.002-.024.006-.036.008l-.012.003c-.006 0-.12.03-.18.045a.376.376 0 0 0-.27.315c-.006.06 0 .12.015.18.39.9.9 1.74 1.53 2.43.81.87 1.83 1.47 2.97 1.71a.588.588 0 0 1 .48.57.6.6 0 0 1-.12.36c-.39.54-1.14.93-2.25 1.17-.06.012-.09.045-.12.09l-.015.06c-.03.12-.06.27-.105.39a.583.583 0 0 1-.57.39c-.12 0-.24-.015-.36-.06-.27-.075-.57-.105-.87-.105-.18 0-.36.015-.54.045-.36.06-.69.195-1.05.345-.51.21-1.08.45-1.86.45h-.06c-.78 0-1.35-.24-1.86-.45-.36-.15-.69-.285-1.05-.345a3.34 3.34 0 0 0-.54-.045c-.3 0-.6.03-.87.105a1.2 1.2 0 0 1-.36.06.59.59 0 0 1-.57-.39c-.045-.12-.075-.27-.105-.39l-.015-.06c-.03-.045-.06-.075-.12-.09-1.11-.24-1.86-.63-2.25-1.17a.59.59 0 0 1-.12-.36.588.588 0 0 1 .48-.57c1.14-.24 2.16-.84 2.97-1.71.63-.69 1.14-1.53 1.53-2.43a.394.394 0 0 0 .015-.18.376.376 0 0 0-.27-.315c-.06-.015-.174-.045-.18-.045l-.012-.003a1.478 1.478 0 0 1-.036-.008c-.06-.015-.12-.03-.18-.045-.72-.15-1.23-.36-1.35-.42a.602.602 0 0 1-.36-.54c0-.21.12-.39.3-.48a.58.58 0 0 1 .34-.09c.09 0 .18.015.27.067.374.18.733.317 1.033.301.198 0 .326-.045.401-.09a9.3 9.3 0 0 1-.03-.51l-.003-.06c-.105-1.628-.23-3.654.3-4.847C7.86 1.069 11.216.793 12.206.793Z"/></svg>, enabledKey: "snapchat_enabled" as const, idKey: "snapchat_pixel_id" as const, placeholder: "abc123-def456" },
    { title: "تيك توك بيكسل", icon: <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor"><path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-2.88 2.5 2.89 2.89 0 0 1-2.89-2.89 2.89 2.89 0 0 1 2.89-2.89c.28 0 .54.04.79.1v-3.5a6.37 6.37 0 0 0-.79-.05A6.34 6.34 0 0 0 3.15 15.2a6.34 6.34 0 0 0 6.34 6.34 6.34 6.34 0 0 0 6.34-6.34V8.73a8.19 8.19 0 0 0 4.76 1.52v-3.4a4.85 4.85 0 0 1-1-.16Z"/></svg>, enabledKey: "tiktok_enabled" as const, idKey: "tiktok_pixel_id" as const, placeholder: "C1234567890" },
    { title: "Google Ads", icon: <BarChart3 className="w-5 h-5 text-[#4285F4]" />, enabledKey: "google_ads_enabled" as const, idKey: "google_ads_id" as const, placeholder: "AW-123456789" },
  ];

  return (
    <div className="space-y-5">
      {/* ─── Header ─── */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between"
      >
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl flex items-center justify-center shadow-lg"
            style={{ background: "linear-gradient(135deg, hsl(250 80% 65%), hsl(340 75% 55%))" }}>
            <Zap className="w-5 h-5 text-white" />
          </div>
          <div>
            <CodFormLogo size="lg" />
            <p className="text-xs text-muted-foreground">نظام نماذج الطلب الاحترافي</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="hidden md:flex items-center gap-1 bg-muted/60 rounded-lg p-1">
            <button
              onClick={() => setMobilePreview(false)}
              className={`p-1.5 rounded-md transition-all ${!mobilePreview ? "bg-card shadow-sm text-foreground" : "text-muted-foreground"}`}
            >
              <Monitor className="w-4 h-4" />
            </button>
            <button
              onClick={() => setMobilePreview(true)}
              className={`p-1.5 rounded-md transition-all ${mobilePreview ? "bg-card shadow-sm text-foreground" : "text-muted-foreground"}`}
            >
              <Smartphone className="w-4 h-4" />
            </button>
          </div>

          <Button
            onClick={handleSave}
            disabled={saving}
            className="rounded-xl bg-gradient-to-l from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 text-primary-foreground shadow-lg shadow-primary/20 gap-2 px-5"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            {saving ? "جاري الحفظ..." : "حفظ التغييرات"}
          </Button>
        </div>
      </motion.div>

      {/* ─── Panel Navigation ─── */}
      <div className="flex gap-1 bg-muted/50 backdrop-blur-sm p-1 rounded-xl border border-border/30">
        {panels.map((p) => (
          <button
            key={p.id}
            onClick={() => setActivePanel(p.id)}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-lg text-xs font-medium transition-all duration-200 ${
              activePanel === p.id
                ? "bg-card text-foreground shadow-sm border border-border/50"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <p.icon className="w-3.5 h-3.5" />
            {p.label}
          </button>
        ))}
      </div>

      {/* ─── Main Layout ─── */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-5">
        {/* LEFT */}
        <div className="lg:col-span-3 space-y-5">
          <AnimatePresence mode="wait">
            {/* ═══ Fields Panel ═══ */}
            {activePanel === "fields" && (
              <motion.div key="fields" initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 10 }} className="space-y-5">
                <div className="rounded-2xl border border-border/50 bg-card/80 backdrop-blur-sm p-5 space-y-3">
                  <div className="flex items-center gap-2 mb-1">
                    <FileText className="w-4 h-4 text-primary" />
                    <h3 className="text-sm font-bold text-foreground">حقول النموذج</h3>
                  </div>
                  <FieldCard icon={User} name="الاسم الكامل" desc="حقل أساسي لا يمكن إزالته" required />
                  <FieldCard icon={Phone} name="رقم الهاتف" desc="حقل أساسي لا يمكن إزالته" required />
                  <FieldCard
                    icon={MapPin}
                    name="المدينة / العنوان"
                    desc="حقل إضافي يمكن تفعيله أو إيقافه"
                    enabled={settings.show_city_field}
                    onToggle={(v) => update("show_city_field", v)}
                    requiredToggle={settings.city_field_required}
                    onRequiredToggle={(v) => update("city_field_required", v)}
                  />
                </div>

                <div className="rounded-2xl border border-border/50 bg-card/80 backdrop-blur-sm p-5 space-y-4">
                  <div className="flex items-center gap-2">
                    <Type className="w-4 h-4 text-primary" />
                    <h3 className="text-sm font-bold text-foreground">نصوص الحقول</h3>
                  </div>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <div>
                      <Label className="text-xs text-muted-foreground">نص حقل الاسم</Label>
                      <Input value={settings.name_placeholder} onChange={(e) => update("name_placeholder", e.target.value)} className="mt-1 rounded-xl" />
                    </div>
                    <div>
                      <Label className="text-xs text-muted-foreground">نص حقل الهاتف</Label>
                      <Input value={settings.phone_placeholder} onChange={(e) => update("phone_placeholder", e.target.value)} className="mt-1 rounded-xl" />
                    </div>
                    {settings.show_city_field && (
                      <div className="sm:col-span-2">
                        <Label className="text-xs text-muted-foreground">نص حقل المدينة</Label>
                        <Input value={settings.city_placeholder} onChange={(e) => update("city_placeholder", e.target.value)} className="mt-1 rounded-xl" />
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>
            )}

            {/* ═══ Conversion Panel ═══ */}
            {activePanel === "conversion" && (
              <motion.div key="conversion" initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 10 }} className="space-y-5">
                {/* Offers Section */}
                <div className="rounded-2xl border border-primary/20 bg-gradient-to-br from-primary/5 to-transparent backdrop-blur-sm p-5 space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Rocket className="w-4 h-4 text-primary" />
                      <h3 className="text-sm font-bold text-foreground">العروض الخاصة 🚀</h3>
                    </div>
                    <Switch checked={settings.show_offers} onCheckedChange={(v) => update("show_offers", v)} />
                  </div>
                  <p className="text-[11px] text-muted-foreground">أضف عروض كمية لزيادة متوسط قيمة الطلب</p>

                  <AnimatePresence>
                    {settings.show_offers && (
                      <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="space-y-3">
                        <AnimatePresence>
                          {settings.offers?.map((offer) => (
                            <OfferBuilderCard
                              key={offer.id}
                              offer={offer}
                              onChange={(updated) => updateOffer(offer.id, updated)}
                              onDelete={() => deleteOffer(offer.id)}
                              products={products}
                            />
                          ))}
                        </AnimatePresence>
                        <Button
                          variant="outline"
                          onClick={addOffer}
                          className="w-full rounded-xl border-dashed border-primary/30 text-primary hover:bg-primary/5 gap-2"
                        >
                          <Plus className="w-4 h-4" />
                          إضافة عرض جديد
                        </Button>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                <div className="rounded-2xl border border-border/50 bg-card/80 backdrop-blur-sm p-5 space-y-5">
                  <div className="flex items-center gap-2">
                    <Flame className="w-4 h-4 text-primary" />
                    <h3 className="text-sm font-bold text-foreground">تعزيز التحويلات</h3>
                  </div>

                  {/* Urgency */}
                  <div className="rounded-xl border border-border/40 p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Flame className="w-4 h-4 text-destructive" />
                        <span className="text-sm font-semibold text-foreground">نص الاستعجال</span>
                      </div>
                      <Switch checked={settings.show_urgency_text} onCheckedChange={(v) => update("show_urgency_text", v)} />
                    </div>
                    <AnimatePresence>
                      {settings.show_urgency_text && (
                        <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }}>
                          <Input value={settings.urgency_text} onChange={(e) => update("urgency_text", e.target.value)} className="rounded-xl" />
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>

                  {/* Trust Badges */}
                  <div className="rounded-xl border border-border/40 p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Shield className="w-4 h-4 text-emerald-500" />
                        <span className="text-sm font-semibold text-foreground">شارات الثقة</span>
                      </div>
                      <Switch checked={settings.show_trust_badges} onCheckedChange={(v) => update("show_trust_badges", v)} />
                    </div>
                    <AnimatePresence>
                      {settings.show_trust_badges && (
                        <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="space-y-2">
                          <Input value={settings.trust_badge_1} onChange={(e) => update("trust_badge_1", e.target.value)} className="rounded-xl" placeholder="شارة 1" />
                          <Input value={settings.trust_badge_2} onChange={(e) => update("trust_badge_2", e.target.value)} className="rounded-xl" placeholder="شارة 2" />
                          <Input value={settings.trust_badge_3} onChange={(e) => update("trust_badge_3", e.target.value)} className="rounded-xl" placeholder="شارة 3" />
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </div>
              </motion.div>
            )}

            {/* ═══ Design Panel ═══ */}
            {activePanel === "design" && (
              <motion.div key="design" initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 10 }} className="space-y-5">
                <div className="rounded-2xl border border-border/50 bg-card/80 backdrop-blur-sm p-5 space-y-4">
                  <div className="flex items-center gap-2">
                    <Palette className="w-4 h-4 text-primary" />
                    <h3 className="text-sm font-bold text-foreground">عنوان النموذج</h3>
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground">العنوان الرئيسي</Label>
                    <Input value={settings.form_title} onChange={(e) => update("form_title", e.target.value)} className="mt-1 rounded-xl" />
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground">العنوان الفرعي</Label>
                    <Input value={settings.form_subtitle} onChange={(e) => update("form_subtitle", e.target.value)} className="mt-1 rounded-xl" />
                  </div>
                </div>

                <div className="rounded-2xl border border-border/50 bg-card/80 backdrop-blur-sm p-5 space-y-4">
                  <div className="flex items-center gap-2">
                    <Zap className="w-4 h-4 text-primary" />
                    <h3 className="text-sm font-bold text-foreground">زر التأكيد</h3>
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground">نص الزر</Label>
                    <Input value={settings.button_text} onChange={(e) => update("button_text", e.target.value)} className="mt-1 rounded-xl" />
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground">لون الزر</Label>
                    <div className="flex gap-3 mt-2">
                      {[
                        { id: "destructive", label: "أحمر", className: "bg-destructive" },
                        { id: "primary", label: "أساسي", className: "bg-primary" },
                        { id: "green", label: "أخضر", className: "bg-emerald-600" },
                      ].map((c) => (
                        <button
                          key={c.id}
                          onClick={() => update("button_color", c.id)}
                          className={`w-10 h-10 rounded-xl ${c.className} border-2 transition-all duration-200 ${
                            settings.button_color === c.id ? "border-foreground scale-110 shadow-lg" : "border-transparent hover:scale-105"
                          }`}
                          title={c.label}
                        />
                      ))}
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {/* ═══ Pixels Panel ═══ */}
            {activePanel === "pixels" && (
              <motion.div key="pixels" initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 10 }} className="space-y-5">
                <div className="rounded-2xl border border-border/50 bg-card/80 backdrop-blur-sm p-5 space-y-5">
                  <div className="flex items-center gap-2">
                    <BarChart3 className="w-4 h-4 text-primary" />
                    <h3 className="text-sm font-bold text-foreground">أكواد التتبع (Pixels)</h3>
                  </div>
                  <p className="text-xs text-muted-foreground">أضف معرفات البيكسل لتتبع التحويلات</p>

                  {pixelSections.map((section) => (
                    <div key={section.idKey} className="rounded-xl border border-border/40 p-4 space-y-3 hover:border-primary/20 transition-colors">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          {section.icon}
                          <span className="font-medium text-sm text-foreground">{section.title}</span>
                        </div>
                        <Switch checked={pixels[section.enabledKey] as boolean} onCheckedChange={(v) => updatePixel(section.enabledKey, v)} />
                      </div>
                      <div>
                        <Label className="text-xs text-muted-foreground">معرف البيكسل</Label>
                        <Input
                          value={pixels[section.idKey] as string}
                          onChange={(e) => updatePixel(section.idKey, e.target.value)}
                          placeholder={section.placeholder}
                          dir="ltr"
                          className="mt-1 rounded-xl font-mono text-sm"
                        />
                      </div>
                      {pixels[section.idKey] && pixels[section.enabledKey] && (
                        <div className="flex items-center gap-2 text-xs text-emerald-600 bg-emerald-500/10 rounded-lg p-2">
                          <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                          مفعل ونشط
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </motion.div>
            )}

            {/* ═══ Messages Panel ═══ */}
            {activePanel === "messages" && (
              <motion.div key="messages" initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 10 }} className="space-y-5">
                <div className="rounded-2xl border border-border/50 bg-card/80 backdrop-blur-sm p-5 space-y-4">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-primary" />
                    <h3 className="text-sm font-bold text-foreground">رسائل النموذج</h3>
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground">رسالة النجاح بعد الطلب</Label>
                    <Textarea
                      value={settings.success_message}
                      onChange={(e) => update("success_message", e.target.value)}
                      className="mt-1 rounded-xl min-h-[100px]"
                      rows={3}
                    />
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* RIGHT: Live Preview */}
        <div className="lg:col-span-2">
          <div className="lg:sticky lg:top-4">
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 }}
              className="rounded-2xl border border-border/50 bg-card/60 backdrop-blur-sm p-5"
            >
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Eye className="w-4 h-4 text-primary" />
                  <h3 className="text-sm font-bold text-foreground">معاينة مباشرة</h3>
                </div>
                <div className="flex items-center gap-1 text-[10px] text-emerald-600 bg-emerald-500/10 px-2 py-1 rounded-full">
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  تحديث فوري
                </div>
              </div>

              <div dir="rtl">
                <LivePreview settings={settings} mobileView={mobilePreview} />
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
}
