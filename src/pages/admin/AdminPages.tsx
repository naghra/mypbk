import React, { useEffect, useState } from "react";
import { ConfirmDeleteDialog } from "@/components/ConfirmDeleteDialog";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { motion, AnimatePresence } from "framer-motion";
import {
  Save, Loader2, FileText, Link2, Plus, Trash2, GripVertical,
  Info, Shield, RotateCcw, BookOpen, HelpCircle, Phone as PhoneIcon, ChevronDown
} from "lucide-react";
import {
  DEFAULT_ABOUT, DEFAULT_PRIVACY, DEFAULT_RETURN_POLICY,
  DEFAULT_TERMS, DEFAULT_FAQ, DEFAULT_CONTACT_EMAIL,
  DEFAULT_CONTACT_PHONE, DEFAULT_CONTACT_TEXT,
} from "@/lib/default-pages";

interface FooterLink {
  id: string;
  label: string;
  href: string;
  enabled: boolean;
}

interface PageContent {
  about: string;
  privacy: string;
  return_policy: string;
  terms: string;
  faq: string;
  contact_email: string;
  contact_phone: string;
  contact_text: string;
}

const DEFAULT_FOOTER_LINKS: FooterLink[] = [
  { id: "1", label: "من نحن", href: "/about", enabled: true },
  { id: "2", label: "سياسة الخصوصية", href: "/privacy", enabled: true },
  { id: "3", label: "سياسة الاستبدال والاسترجاع و التوصيل", href: "/return-policy", enabled: true },
  { id: "4", label: "البنود والقوانين", href: "/terms", enabled: true },
  { id: "5", label: "الاسئلة الشائعه", href: "/faq", enabled: true },
  { id: "6", label: "اتصل بنا", href: "/contact", enabled: true },
];

const DEFAULT_PAGES: PageContent = {
  about: DEFAULT_ABOUT,
  privacy: DEFAULT_PRIVACY,
  return_policy: DEFAULT_RETURN_POLICY,
  terms: DEFAULT_TERMS,
  faq: DEFAULT_FAQ,
  contact_email: DEFAULT_CONTACT_EMAIL,
  contact_phone: DEFAULT_CONTACT_PHONE,
  contact_text: DEFAULT_CONTACT_TEXT,
};

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.1, duration: 0.5, ease: "easeOut" as const },
  }),
};

const PAGE_SECTIONS = [
  { key: "about" as const, label: "من نحن", icon: Info, placeholder: "نبذة عن متجرك وقصته..." },
  { key: "privacy" as const, label: "سياسة الخصوصية", icon: Shield, placeholder: "سياسة الخصوصية الخاصة بمتجرك..." },
  { key: "return_policy" as const, label: "سياسة الاستبدال والاسترجاع", icon: RotateCcw, placeholder: "سياسة الاستبدال والاسترجاع..." },
  { key: "terms" as const, label: "البنود والقوانين", icon: BookOpen, placeholder: "شروط وأحكام استخدام المتجر..." },
  { key: "faq" as const, label: "الأسئلة الشائعة", icon: HelpCircle, placeholder: "الأسئلة الشائعة وإجاباتها..." },
];

export default function AdminPages() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [footerLinks, setFooterLinks] = useState<FooterLink[]>(DEFAULT_FOOTER_LINKS);
  const [pages, setPages] = useState<PageContent>(DEFAULT_PAGES);
  const [expandedPage, setExpandedPage] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from("store_settings")
        .select("*")
        .in("key", ["footer_links", "pages_content"]);
      if (data) {
        for (const row of data) {
          const v = row.value as any;
          if (row.key === "footer_links" && Array.isArray(v.links)) {
            setFooterLinks(v.links);
          } else if (row.key === "pages_content") {
            setPages({ ...DEFAULT_PAGES, ...v });
          }
        }
      }
      setLoading(false);
    })();
  }, []);

  const updatePage = (key: keyof PageContent, value: string) =>
    setPages((prev) => ({ ...prev, [key]: value }));

  const addLink = () => {
    setFooterLinks((prev) => [
      ...prev,
      { id: String(Date.now()), label: "", href: "/", enabled: true },
    ]);
  };

  const [deleteLinkTarget, setDeleteLinkTarget] = useState<string | null>(null);

  const removeLink = (id: string) => {
    setFooterLinks((prev) => prev.filter((l) => l.id !== id));
    setDeleteLinkTarget(null);
  };

  const updateLink = (id: string, field: keyof FooterLink, value: any) => {
    setFooterLinks((prev) =>
      prev.map((l) => (l.id === id ? { ...l, [field]: value } : l))
    );
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await supabase.from("store_settings").upsert(
        { key: "footer_links", value: { links: footerLinks } as any },
        { onConflict: "key" }
      );
      await supabase.from("store_settings").upsert(
        { key: "pages_content", value: pages as any },
        { onConflict: "key" }
      );
      toast({ title: "✅ تم حفظ التعديلات بنجاح" });
    } catch {
      toast({ title: "خطأ", description: "فشل حفظ التعديلات", variant: "destructive" });
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
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <h2 className="text-2xl font-bold text-foreground">الصفحات والروابط</h2>
        <p className="text-sm text-muted-foreground mt-1">تعديل محتوى صفحات المتجر وروابط الفوتر</p>
      </motion.div>

      {/* ═══ Footer Links ═══ */}
      <motion.div
        className="admin-card"
        variants={fadeUp}
        initial="hidden"
        animate="visible"
        custom={0}
      >
        <div className="flex items-start gap-4 mb-6">
          <div className="admin-icon-box">
            <Link2 className="w-5 h-5" />
          </div>
          <div className="flex-1">
            <h3 className="font-semibold text-foreground">روابط الفوتر</h3>
            <p className="text-xs text-muted-foreground mt-0.5">إدارة الروابط التي تظهر أسفل المتجر</p>
          </div>
          <button
            onClick={addLink}
            className="flex items-center gap-1.5 text-xs font-medium text-primary hover:text-primary/80 bg-primary/10 hover:bg-primary/15 px-3 py-1.5 rounded-lg transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            إضافة رابط
          </button>
        </div>

        <div className="space-y-3">
          <AnimatePresence>
            {footerLinks.map((link) => (
              <motion.div
                key={link.id}
                layout
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, x: -50 }}
                className="group flex items-center gap-3 p-3 rounded-xl bg-muted/30 border border-border/50 hover:border-border transition-colors"
              >
                <GripVertical className="w-4 h-4 text-muted-foreground/40 shrink-0 cursor-grab" />

                <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-2">
                  <Input
                    value={link.label}
                    onChange={(e) => updateLink(link.id, "label", e.target.value)}
                    placeholder="اسم الرابط"
                    className="admin-input h-9 text-sm"
                  />
                  <Input
                    value={link.href}
                    onChange={(e) => updateLink(link.id, "href", e.target.value)}
                    placeholder="/page-path"
                    dir="ltr"
                    className="admin-input h-9 text-sm text-left"
                  />
                </div>

                <Switch
                  checked={link.enabled}
                  onCheckedChange={(v) => updateLink(link.id, "enabled", v)}
                />

                <button
                  onClick={() => setDeleteLinkTarget(link.id)}
                  className="p-1.5 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors opacity-0 group-hover:opacity-100"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </motion.div>
            ))}
          </AnimatePresence>

          {footerLinks.length === 0 && (
            <div className="text-center py-8 text-muted-foreground text-sm">
              لا توجد روابط. اضغط "إضافة رابط" لإنشاء رابط جديد.
            </div>
          )}
        </div>
      </motion.div>

      {/* ═══ Pages Content ═══ */}
      <motion.div
        className="admin-card"
        variants={fadeUp}
        initial="hidden"
        animate="visible"
        custom={1}
      >
        <div className="flex items-start gap-4 mb-6">
          <div className="admin-icon-box">
            <FileText className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-semibold text-foreground">محتوى الصفحات</h3>
            <p className="text-xs text-muted-foreground mt-0.5">تعديل نصوص صفحات المتجر</p>
          </div>
        </div>

        <div className="space-y-3">
          {PAGE_SECTIONS.map((section) => {
            const isExpanded = expandedPage === section.key;
            return (
              <div key={section.key} className="rounded-xl border border-border/50 overflow-hidden">
                <button
                  onClick={() => setExpandedPage(isExpanded ? null : section.key)}
                  className="w-full flex items-center gap-3 p-4 hover:bg-muted/30 transition-colors"
                >
                  <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                    <section.icon className="w-4 h-4 text-primary" />
                  </div>
                  <span className="flex-1 text-sm font-medium text-foreground text-right">{section.label}</span>
                  {pages[section.key] && (
                    <span className="text-[10px] bg-emerald-500/10 text-emerald-600 px-2 py-0.5 rounded-full font-medium">محدّث</span>
                  )}
                  <ChevronDown className={`w-4 h-4 text-muted-foreground transition-transform duration-200 ${isExpanded ? "rotate-180" : ""}`} />
                </button>

                <AnimatePresence>
                  {isExpanded && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      className="overflow-hidden"
                    >
                      <div className="px-4 pb-4">
                        <Textarea
                          value={pages[section.key]}
                          onChange={(e) => updatePage(section.key, e.target.value)}
                          className="admin-input min-h-[150px] resize-y text-sm leading-7"
                          placeholder={section.placeholder}
                          dir="rtl"
                        />
                        <p className="text-[10px] text-muted-foreground mt-2">
                          💡 اترك الحقل فارغاً لاستخدام المحتوى الافتراضي
                        </p>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </div>
      </motion.div>

      {/* ═══ Contact Page ═══ */}
      <motion.div
        className="admin-card"
        variants={fadeUp}
        initial="hidden"
        animate="visible"
        custom={2}
      >
        <div className="flex items-start gap-4 mb-6">
          <div className="admin-icon-box">
            <PhoneIcon className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-semibold text-foreground">صفحة اتصل بنا</h3>
            <p className="text-xs text-muted-foreground mt-0.5">بيانات التواصل التي تظهر للعملاء</p>
          </div>
        </div>

        <div className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <Label className="text-xs font-medium text-muted-foreground mb-1.5 block">إيميل التواصل</Label>
              <Input
                value={pages.contact_email}
                onChange={(e) => updatePage("contact_email", e.target.value)}
                dir="ltr"
                className="admin-input text-left"
                placeholder="contact@store.com"
              />
            </div>
            <div>
              <Label className="text-xs font-medium text-muted-foreground mb-1.5 block">هاتف التواصل</Label>
              <Input
                value={pages.contact_phone}
                onChange={(e) => updatePage("contact_phone", e.target.value)}
                dir="ltr"
                className="admin-input text-left"
                placeholder="+966 5XX XXX XXXX"
              />
            </div>
          </div>
          <div>
            <Label className="text-xs font-medium text-muted-foreground mb-1.5 block">نص ترحيبي</Label>
            <Textarea
              value={pages.contact_text}
              onChange={(e) => updatePage("contact_text", e.target.value)}
              className="admin-input min-h-[80px] resize-none text-sm"
              placeholder="يسعدنا تواصلكم معنا..."
            />
          </div>
        </div>
      </motion.div>

      {/* Sticky Save Button */}
      <motion.div
        className="fixed bottom-0 left-0 right-0 lg:right-auto lg:left-0 z-30 p-4"
        style={{ maxWidth: "calc(100% - 16rem)" }}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
      >
        <div className="max-w-3xl mx-auto">
          <button
            onClick={handleSave}
            disabled={saving}
            className="admin-gradient-btn w-full flex items-center justify-center gap-2 disabled:opacity-60"
          >
            {saving ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <Save className="w-5 h-5" />
            )}
            {saving ? "جاري الحفظ..." : "حفظ التعديلات"}
          </button>
        </div>
      </motion.div>

      <ConfirmDeleteDialog
        open={!!deleteLinkTarget}
        onOpenChange={(open) => !open && setDeleteLinkTarget(null)}
        onConfirm={() => deleteLinkTarget && removeLink(deleteLinkTarget)}
        title="حذف الرابط"
        description="هل أنت متأكد أنك تريد حذف هذا الرابط؟"
      />
    </div>
  );
}
