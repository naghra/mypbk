import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { motion } from "framer-motion";
import { Save, Loader2, Link2, Copy, Check, Table2, CheckCircle2, ArrowLeft } from "lucide-react";

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number) => ({
    opacity: 1, y: 0,
    transition: { delay: i * 0.1, duration: 0.5, ease: "easeOut" as const },
  }),
};

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

export default function AdminGoogleSheets() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [webhookUrl, setWebhookUrl] = useState("");
  const [codeCopied, setCodeCopied] = useState(false);

  useEffect(() => {
    (async () => {
      const { data } = await supabase.from("store_settings").select("*").eq("key", "integrations").maybeSingle();
      if (data) {
        const v = data.value as any;
        setWebhookUrl(v.google_sheets_webhook || "");
      }
      setLoading(false);
    })();
  }, []);

  const handleCopyCode = () => {
    navigator.clipboard.writeText(appsScriptCode);
    setCodeCopied(true);
    setTimeout(() => setCodeCopied(false), 2000);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await supabase.from("store_settings").upsert({
        key: "integrations",
        value: { google_sheets_webhook: webhookUrl.trim() } as any,
      }, { onConflict: "key" });
      toast({ title: "✅ تم حفظ إعدادات Google Sheets" });
    } catch {
      toast({ title: "خطأ", description: "فشل الحفظ", variant: "destructive" });
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

  const isConnected = webhookUrl.trim().length > 0;

  return (
    <div className="space-y-5 max-w-3xl mx-auto">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl flex items-center justify-center shadow-lg" style={{ background: "linear-gradient(135deg, hsl(142 70% 45%), hsl(160 60% 40%))" }}>
            <Table2 className="w-5 h-5 text-white" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
              Google Sheets
            </h2>
            <p className="text-xs text-muted-foreground">إرسال الطلبات تلقائياً إلى جدول بيانات Google</p>
          </div>
        </div>
        <div className={`flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full font-medium ${isConnected ? "bg-emerald-500/10 text-emerald-600" : "bg-muted text-muted-foreground"}`}>
          {isConnected ? <CheckCircle2 className="w-3.5 h-3.5" /> : <div className="w-2 h-2 rounded-full bg-muted-foreground/40" />}
          {isConnected ? "متصل" : "غير متصل"}
        </div>
      </motion.div>

      {/* Webhook URL */}
      <motion.div className="admin-card" variants={fadeUp} initial="hidden" animate="visible" custom={1}>
        <div className="flex items-start gap-4 mb-6">
          <div className="admin-icon-box"><Link2 className="w-5 h-5" /></div>
          <div>
            <h3 className="font-semibold text-foreground">رابط Webhook</h3>
            <p className="text-xs text-muted-foreground mt-0.5">الصق رابط Google Apps Script الخاص بك</p>
          </div>
        </div>
        <div>
          <Label className="text-xs font-medium text-muted-foreground mb-1.5 block">رابط Webhook (Google Apps Script)</Label>
          <div className="relative">
            <Link2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/50" />
            <Input
              value={webhookUrl}
              onChange={(e) => setWebhookUrl(e.target.value)}
              dir="ltr"
              className="admin-input text-left pr-10 text-xs"
              placeholder="https://script.google.com/macros/s/..."
            />
          </div>
        </div>
      </motion.div>

      {/* Setup Instructions */}
      <motion.div className="admin-card" variants={fadeUp} initial="hidden" animate="visible" custom={2}>
        <div className="flex items-start gap-4 mb-6">
          <div className="admin-icon-box"><Table2 className="w-5 h-5" /></div>
          <div>
            <h3 className="font-semibold text-foreground">📋 طريقة الإعداد</h3>
            <p className="text-xs text-muted-foreground mt-0.5">اتبع الخطوات التالية لربط جدول البيانات</p>
          </div>
        </div>

        <div className="space-y-4">
          <ol className="list-decimal list-inside space-y-2 text-sm text-muted-foreground text-right">
            <li>افتح <span className="font-medium text-foreground">Google Sheets</span> وأنشئ جدول جديد</li>
            <li>اذهب إلى <span className="font-medium text-foreground">Extensions → Apps Script</span></li>
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
            <pre dir="ltr" className="bg-background border border-border rounded-lg p-3 pt-9 text-[11px] leading-relaxed overflow-x-auto text-left font-mono text-foreground whitespace-pre">
              {appsScriptCode}
            </pre>
          </div>

          <ol className="list-decimal list-inside space-y-2 text-sm text-muted-foreground text-right" start={4}>
            <li>انشر كـ <span className="font-medium text-foreground">Web App</span>: Deploy → New deployment → Web App</li>
            <li>اختر <span className="font-medium text-foreground">Execute as: Me</span> و <span className="font-medium text-foreground">Access: Anyone</span></li>
            <li>انسخ الرابط والصقه في الحقل أعلاه</li>
          </ol>
        </div>
      </motion.div>

      {/* Data Preview */}
      <motion.div className="admin-card" variants={fadeUp} initial="hidden" animate="visible" custom={3}>
        <div className="flex items-start gap-4 mb-4">
          <div className="admin-icon-box"><ArrowLeft className="w-5 h-5" /></div>
          <div>
            <h3 className="font-semibold text-foreground">البيانات المرسلة</h3>
            <p className="text-xs text-muted-foreground mt-0.5">هذه الأعمدة يتم إرسالها تلقائياً مع كل طلب</p>
          </div>
        </div>
        <div className="grid grid-cols-4 gap-2">
          {["#", "الاسم", "الهاتف", "المدينة", "المنتج", "SKU", "الكمية", "العرض", "السعر", "التاريخ", "الوقت", "الحالة"].map((col) => (
            <div key={col} className="flex items-center gap-1.5 text-xs text-muted-foreground bg-muted/50 rounded-lg px-3 py-2">
              <CheckCircle2 className="w-3 h-3 text-emerald-500 flex-shrink-0" />
              {col}
            </div>
          ))}
        </div>
      </motion.div>

      {/* Save Button */}
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
