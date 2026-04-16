import React, { useEffect, useState, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { motion } from "framer-motion";
import { Save, Truck, CreditCard, Loader2, ImageIcon, Upload, X, Mail, Phone, Type, Coins, Link2, Copy, Check } from "lucide-react";
import { CURRENCIES, invalidateCurrencyCache } from "@/hooks/useCurrency";

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.1, duration: 0.5, ease: "easeOut" as const },
  }),
};

export default function AdminSettings() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [storeName, setStoreName] = useState("");
  const [storeDescription, setStoreDescription] = useState("");
  const [supportEmail, setSupportEmail] = useState("");
  const [supportPhone, setSupportPhone] = useState("");
  const [logoUrl, setLogoUrl] = useState("");
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const logoInputRef = useRef<HTMLInputElement>(null);

  const [currency, setCurrency] = useState("SAR");

  const [fixedRate, setFixedRate] = useState("30");
  const [freeThreshold, setFreeThreshold] = useState("200");
  const [codEnabled, setCodEnabled] = useState(true);
  const [googleSheetsUrl, setGoogleSheetsUrl] = useState("");
  const [codeCopied, setCodeCopied] = useState(false);

  const appsScriptCode = `function doPost(e) {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
  if (sheet.getLastRow() === 0) {
    sheet.appendRow([
      "#", "الاسم", "الهاتف", "المدينة", "المنتج",
      "SKU", "الكمية", "العرض", "السعر", "التاريخ",
      "الوقت", "الحالة"
    ]);
  }
  var data = JSON.parse(e.postData.contents);
  var orderId = sheet.getLastRow();
  sheet.appendRow([
    orderId,
    data.name || "",
    data.phone || "",
    data.city || "غير محدد",
    data.product || "",
    data.sku || "",
    data.quantity || 1,
    data.offer || "",
    data.price || 0,
    data.date || "",
    data.time || "",
    data.status || "جديد"
  ]);
  return ContentService.createTextOutput("OK");
}`;

  const handleCopyCode = () => {
    navigator.clipboard.writeText(appsScriptCode);
    setCodeCopied(true);
    setTimeout(() => setCodeCopied(false), 2000);
  };

  useEffect(() => {
    (async () => {
      const { data } = await supabase.from("store_settings").select("*");
      if (data) {
        for (const row of data) {
          const v = row.value as any;
          if (row.key === "store_info") {
            setStoreName(v.name || "");
            setStoreDescription(v.description || "");
            setSupportEmail(v.support_email || "");
            setSupportPhone(v.support_phone || "");
            setLogoUrl(v.logo_url || "");
            setCurrency(v.currency || "SAR");
          } else if (row.key === "shipping") {
            setFixedRate(String(v.fixed_rate ?? 30));
            setFreeThreshold(String(v.free_shipping_threshold ?? 200));
          } else if (row.key === "payment") {
            setCodEnabled(v.cod_enabled ?? true);
          } else if (row.key === "integrations") {
            setGoogleSheetsUrl(v.google_sheets_webhook || "");
          }
        }
      }
      setLoading(false);
    })();
  }, []);

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingLogo(true);
    try {
      const ext = file.name.split(".").pop();
      const path = `store/logo-${Date.now()}.${ext}`;
      const { error: uploadError } = await supabase.storage
        .from("product-images")
        .upload(path, file, { upsert: true });
      if (uploadError) throw uploadError;
      const { data: urlData } = supabase.storage.from("product-images").getPublicUrl(path);
      setLogoUrl(urlData.publicUrl);
      toast({ title: "✅ تم رفع الشعار بنجاح" });
    } catch {
      toast({ title: "خطأ", description: "فشل رفع الشعار", variant: "destructive" });
    } finally {
      setUploadingLogo(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await supabase.from("store_settings").upsert({
        key: "store_info",
        value: { name: storeName, description: storeDescription, support_email: supportEmail, support_phone: supportPhone, logo_url: logoUrl, currency } as any,
      }, { onConflict: "key" });

      invalidateCurrencyCache();

      await supabase.from("store_settings").upsert({
        key: "shipping",
        value: { fixed_rate: parseFloat(fixedRate) || 0, free_shipping_threshold: parseFloat(freeThreshold) || 0 } as any,
      }, { onConflict: "key" });

      await supabase.from("store_settings").upsert({
        key: "payment",
        value: { cod_enabled: codEnabled } as any,
      }, { onConflict: "key" });

      await supabase.from("store_settings").upsert({
        key: "integrations",
        value: { google_sheets_webhook: googleSheetsUrl.trim() } as any,
      }, { onConflict: "key" });

      toast({ title: "✅ تم حفظ الإعدادات بنجاح" });
    } catch {
      toast({ title: "خطأ", description: "فشل حفظ الإعدادات", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-8 pb-28">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
        <h2 className="text-2xl font-bold text-foreground">الإعدادات</h2>
        <p className="text-sm text-muted-foreground mt-1">إدارة إعدادات متجرك وتخصيصه</p>
      </motion.div>

      {/* Store Branding */}
      <motion.div className="admin-card" variants={fadeUp} initial="hidden" animate="visible" custom={0}>
        <div className="flex items-start gap-4 mb-6">
          <div className="admin-icon-box"><ImageIcon className="w-5 h-5" /></div>
          <div>
            <h3 className="font-semibold text-foreground">هوية المتجر</h3>
            <p className="text-xs text-muted-foreground mt-0.5">الشعار والوصف والاسم</p>
          </div>
        </div>
        <div className="space-y-5">
          {/* Logo */}
          <div>
            <Label className="text-xs font-medium text-muted-foreground mb-2 block">شعار المتجر</Label>
            <div className="flex items-center gap-4">
              {logoUrl ? (
                <div className="relative group">
                  <div className="w-20 h-20 rounded-xl border-2 border-border overflow-hidden bg-muted/30 flex items-center justify-center">
                    <img src={logoUrl} alt="شعار المتجر" className="w-full h-full object-contain p-1" />
                  </div>
                  <button onClick={() => setLogoUrl("")} className="absolute -top-2 -left-2 w-5 h-5 bg-destructive text-destructive-foreground rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ) : (
                <div onClick={() => logoInputRef.current?.click()} className="w-20 h-20 rounded-xl border-2 border-dashed border-border hover:border-primary/50 bg-muted/20 flex flex-col items-center justify-center cursor-pointer transition-colors">
                  {uploadingLogo ? <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" /> : (
                    <>
                      <Upload className="w-5 h-5 text-muted-foreground mb-1" />
                      <span className="text-[10px] text-muted-foreground">رفع شعار</span>
                    </>
                  )}
                </div>
              )}
              {logoUrl && (
                <button onClick={() => logoInputRef.current?.click()} className="text-xs text-primary hover:underline">
                  {uploadingLogo ? "جاري الرفع..." : "تغيير الشعار"}
                </button>
              )}
              <input ref={logoInputRef} type="file" accept="image/*" className="hidden" onChange={handleLogoUpload} />
            </div>
          </div>

          <div>
            <Label className="text-xs font-medium text-muted-foreground mb-1.5 block">اسم المتجر</Label>
            <div className="relative">
              <Type className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/50" />
              <Input value={storeName} onChange={(e) => setStoreName(e.target.value)} className="admin-input pr-10" placeholder="اسم متجرك" />
            </div>
          </div>

          <div>
            <Label className="text-xs font-medium text-muted-foreground mb-1.5 block">وصف المتجر</Label>
            <Textarea value={storeDescription} onChange={(e) => setStoreDescription(e.target.value)} className="admin-input min-h-[80px] resize-none" placeholder="وصف قصير يظهر في الفوتر وصفحة من نحن" />
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <Label className="text-xs font-medium text-muted-foreground mb-1.5 block">بريد الدعم</Label>
              <div className="relative">
                <Mail className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/50" />
                <Input value={supportEmail} onChange={(e) => setSupportEmail(e.target.value)} dir="ltr" className="admin-input text-left pr-10" placeholder="support@store.com" />
              </div>
            </div>
            <div>
              <Label className="text-xs font-medium text-muted-foreground mb-1.5 block">هاتف الدعم</Label>
              <div className="relative">
                <Phone className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/50" />
                <Input value={supportPhone} onChange={(e) => setSupportPhone(e.target.value)} dir="ltr" className="admin-input text-left pr-10" placeholder="+966 5XX XXX XXXX" />
              </div>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Currency */}
      <motion.div className="admin-card" variants={fadeUp} initial="hidden" animate="visible" custom={1}>
        <div className="flex items-start gap-4 mb-6">
          <div className="admin-icon-box"><Coins className="w-5 h-5" /></div>
          <div>
            <h3 className="font-semibold text-foreground">عملة المتجر</h3>
            <p className="text-xs text-muted-foreground mt-0.5">العملة المستخدمة في عرض الأسعار</p>
          </div>
        </div>
        <div>
          <Label className="text-xs font-medium text-muted-foreground mb-1.5 block">اختر العملة</Label>
          <Select value={currency} onValueChange={setCurrency}>
            <SelectTrigger className="admin-input">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {CURRENCIES.map((c) => (
                <SelectItem key={c.code} value={c.code}>
                  <span className="flex items-center gap-2">
                    <span className="font-bold">{c.symbol}</span>
                    <span>{c.name_ar}</span>
                    <span className="text-muted-foreground text-xs">({c.code})</span>
                  </span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <div className="mt-3 p-3 rounded-xl bg-muted/50 text-xs text-muted-foreground">
            💡 العملة الحالية: <span className="font-bold text-foreground">{CURRENCIES.find(c => c.code === currency)?.name_ar} ({CURRENCIES.find(c => c.code === currency)?.symbol})</span>
          </div>
        </div>
      </motion.div>

      {/* Shipping */}
      <motion.div className="admin-card" variants={fadeUp} initial="hidden" animate="visible" custom={2}>
        <div className="flex items-start gap-4 mb-6">
          <div className="admin-icon-box"><Truck className="w-5 h-5" /></div>
          <div>
            <h3 className="font-semibold text-foreground">إعدادات الشحن</h3>
            <p className="text-xs text-muted-foreground mt-0.5">تكاليف وخيارات التوصيل</p>
          </div>
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <Label className="text-xs font-medium text-muted-foreground mb-1.5 block">سعر الشحن الثابت ({CURRENCIES.find(c => c.code === currency)?.symbol})</Label>
            <Input type="number" value={fixedRate} onChange={(e) => setFixedRate(e.target.value)} dir="ltr" className="admin-input text-left" />
          </div>
          <div>
            <Label className="text-xs font-medium text-muted-foreground mb-1.5 block">حد الشحن المجاني ({CURRENCIES.find(c => c.code === currency)?.symbol})</Label>
            <Input type="number" value={freeThreshold} onChange={(e) => setFreeThreshold(e.target.value)} dir="ltr" className="admin-input text-left" />
          </div>
        </div>
        <div className="mt-4 p-3 rounded-xl bg-muted/50 text-xs text-muted-foreground">
          💡 الطلبات فوق <span className="font-bold text-foreground">{freeThreshold} {CURRENCIES.find(c => c.code === currency)?.symbol}</span> ستحصل على شحن مجاني
        </div>
      </motion.div>

      {/* Payment */}
      <motion.div className="admin-card" variants={fadeUp} initial="hidden" animate="visible" custom={2}>
        <div className="flex items-start gap-4 mb-6">
          <div className="admin-icon-box"><CreditCard className="w-5 h-5" /></div>
          <div>
            <h3 className="font-semibold text-foreground">إعدادات الدفع</h3>
            <p className="text-xs text-muted-foreground mt-0.5">طرق الدفع المتاحة في متجرك</p>
          </div>
        </div>
        <div className="flex items-center justify-between p-4 rounded-xl bg-muted/40 border border-border">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-emerald-100 flex items-center justify-center">
              <span className="text-base">💵</span>
            </div>
            <div>
              <p className="text-sm font-medium text-foreground">الدفع عند الاستلام</p>
              <p className="text-xs text-muted-foreground">يدفع العميل عند استلام الطلب</p>
            </div>
          </div>
          <Switch checked={codEnabled} onCheckedChange={setCodEnabled} />
        </div>
      </motion.div>

      {/* Google Sheets Integration */}
      <motion.div className="admin-card" variants={fadeUp} initial="hidden" animate="visible" custom={4}>
        <div className="flex items-start gap-4 mb-6">
          <div className="admin-icon-box"><Link2 className="w-5 h-5" /></div>
          <div>
            <h3 className="font-semibold text-foreground">ربط Google Sheets</h3>
            <p className="text-xs text-muted-foreground mt-0.5">إرسال الطلبات تلقائياً إلى جدول بيانات Google</p>
          </div>
        </div>
        <div className="space-y-4">
          <div>
            <Label className="text-xs font-medium text-muted-foreground mb-1.5 block">رابط Webhook (Google Apps Script)</Label>
            <div className="relative">
              <Link2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/50" />
              <Input value={googleSheetsUrl} onChange={(e) => setGoogleSheetsUrl(e.target.value)} dir="ltr" className="admin-input text-left pr-10 text-xs" placeholder="https://script.google.com/macros/s/..." />
            </div>
          </div>
          <div className="p-3 rounded-xl bg-muted/50 text-xs text-muted-foreground space-y-3">
            <p className="font-bold text-foreground">📋 طريقة الإعداد:</p>
            <ol className="list-decimal list-inside space-y-1 text-right">
              <li>افتح Google Sheets وأنشئ جدول جديد</li>
              <li>اذهب إلى Extensions → Apps Script</li>
              <li>الصق الكود التالي:</li>
            </ol>
            <div className="relative">
              <button
                onClick={handleCopyCode}
                className="absolute top-2 left-2 z-10 flex items-center gap-1 text-[10px] px-2 py-1 rounded-md bg-background border border-border hover:bg-muted transition-colors"
              >
                {codeCopied ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3" />}
                {codeCopied ? "تم النسخ!" : "نسخ"}
              </button>
              <pre dir="ltr" className="bg-background border border-border rounded-lg p-3 pt-9 text-[11px] leading-relaxed overflow-x-auto text-left font-mono text-foreground whitespace-pre">{appsScriptCode}</pre>
            </div>
            <ol className="list-decimal list-inside space-y-1 text-right" start={4}>
              <li>انشر كـ Web App: Deploy → New deployment → Web App</li>
              <li>اختر Execute as: Me و Access: Anyone</li>
              <li>انسخ الرابط والصقه في الحقل أعلاه</li>
            </ol>
          </div>
        </div>
      </motion.div>

      {/* Sticky Save */}
      <motion.div className="fixed bottom-0 left-0 right-0 lg:right-auto lg:left-0 z-30 p-4" style={{ maxWidth: "calc(100% - 16rem)" }} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
        <div className="max-w-3xl mx-auto">
          <button onClick={handleSave} disabled={saving} className="admin-gradient-btn w-full flex items-center justify-center gap-2 disabled:opacity-60">
            {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
            {saving ? "جاري الحفظ..." : "حفظ الإعدادات"}
          </button>
        </div>
      </motion.div>
    </div>
  );
}
