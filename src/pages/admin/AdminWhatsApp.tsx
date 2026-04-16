import React, { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import { ConfirmDeleteDialog } from "@/components/ConfirmDeleteDialog";
import { motion, AnimatePresence } from "framer-motion";
import {
  MessageCircle, Settings, FileText, Plus, Pencil, Trash2,
  CheckCircle, XCircle, Clock, Send, Loader2, History, AlertTriangle,
  Wifi, WifiOff, Zap, Shield, Bell, Globe, Key, Hash,
  ArrowUpRight, Sparkles, Phone,
} from "lucide-react";

type WhatsAppSettings = {
  enabled: boolean;
  instance_id: string;
  token: string;
  events: string[];
};

type Template = {
  id: string;
  name: string;
  event: string;
  body: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

type MessageLog = {
  id: string;
  order_id: string | null;
  template_id: string | null;
  phone: string;
  message_body: string;
  status: string;
  error_message: string | null;
  created_at: string;
};

const EVENT_MAP: Record<string, { label: string; icon: React.ReactNode; color: string }> = {
  new_order: { label: "عند إنشاء طلب جديد", icon: <Sparkles className="w-4 h-4" />, color: "text-blue-500" },
  confirmed: { label: "عند تأكيد الطلب", icon: <CheckCircle className="w-4 h-4" />, color: "text-emerald-500" },
  shipped: { label: "عند خروج الطلب للتوصيل", icon: <Send className="w-4 h-4" />, color: "text-violet-500" },
  delivered: { label: "عند التسليم", icon: <Shield className="w-4 h-4" />, color: "text-amber-500" },
};

const STATUS_CONFIG: Record<string, { icon: React.ReactNode; label: string; classes: string }> = {
  sent: { icon: <CheckCircle className="w-3.5 h-3.5" />, label: "تم الإرسال", classes: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20" },
  failed: { icon: <XCircle className="w-3.5 h-3.5" />, label: "فشل", classes: "bg-red-500/10 text-red-600 border-red-500/20" },
  pending: { icon: <Clock className="w-3.5 h-3.5" />, label: "قيد الانتظار", classes: "bg-amber-500/10 text-amber-600 border-amber-500/20" },
};

const cardVariants = {
  hidden: { opacity: 0, y: 16, scale: 0.98 },
  visible: (i: number) => ({
    opacity: 1, y: 0, scale: 1,
    transition: { delay: i * 0.08, duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] as const },
  }),
} as const;

export default function AdminWhatsApp() {
  const { toast } = useToast();
  const [tab, setTab] = useState<"settings" | "templates" | "logs">("settings");
  const [loading, setLoading] = useState(true);

  const [settings, setSettings] = useState<WhatsAppSettings>({
    enabled: false, instance_id: "", token: "", events: ["shipped"],
  });
  const [savingSettings, setSavingSettings] = useState(false);
  const [testingConnection, setTestingConnection] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<"unknown" | "connected" | "disconnected">("unknown");

  const [templates, setTemplates] = useState<Template[]>([]);
  const [templateDialog, setTemplateDialog] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<Template | null>(null);
  const [templateForm, setTemplateForm] = useState({ name: "", event: "shipped", body: "", is_active: true });
  const [savingTemplate, setSavingTemplate] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);

  const [logs, setLogs] = useState<MessageLog[]>([]);
  const [logsLoading, setLogsLoading] = useState(false);

  useEffect(() => { loadSettings(); loadTemplates(); }, []);

  const loadSettings = async () => {
    const { data } = await supabase.from("store_settings").select("value").eq("key", "whatsapp_settings").maybeSingle();
    if (data?.value) setSettings(data.value as any);
    setLoading(false);
  };

  const saveSettings = async () => {
    setSavingSettings(true);
    const { data: existing } = await supabase.from("store_settings").select("id").eq("key", "whatsapp_settings").maybeSingle();
    if (existing) {
      await supabase.from("store_settings").update({ value: settings as any }).eq("key", "whatsapp_settings");
    } else {
      await supabase.from("store_settings").insert({ key: "whatsapp_settings", value: settings as any });
    }
    toast({ title: "تم حفظ الإعدادات ✅" });
    setSavingSettings(false);
  };

  const testConnection = async () => {
    if (!settings.instance_id || !settings.token) {
      toast({ title: "أدخل Instance ID و Token أولاً", variant: "destructive" });
      return;
    }
    setTestingConnection(true);
    try {
      const res = await fetch(`https://api.ultramsg.com/${settings.instance_id}/instance/status?token=${settings.token}`);
      const data = await res.json();
      if (data?.status?.accountStatus?.status === "authenticated") {
        setConnectionStatus("connected");
        toast({ title: "متصل بنجاح ✅" });
      } else {
        setConnectionStatus("disconnected");
        toast({ title: "غير متصل ❌", description: "تأكد من بيانات Ultramsg", variant: "destructive" });
      }
    } catch {
      setConnectionStatus("disconnected");
      toast({ title: "فشل الاتصال", variant: "destructive" });
    }
    setTestingConnection(false);
  };

  const loadTemplates = async () => {
    const { data } = await supabase.from("whatsapp_templates").select("*").order("created_at", { ascending: false });
    if (data) setTemplates(data);
  };

  const openNewTemplate = () => {
    setEditingTemplate(null);
    setTemplateForm({ name: "", event: "shipped", body: "", is_active: true });
    setTemplateDialog(true);
  };

  const openEditTemplate = (t: Template) => {
    setEditingTemplate(t);
    setTemplateForm({ name: t.name, event: t.event, body: t.body, is_active: t.is_active });
    setTemplateDialog(true);
  };

  const saveTemplate = async () => {
    if (!templateForm.name.trim() || !templateForm.body.trim()) {
      toast({ title: "أكمل جميع الحقول", variant: "destructive" });
      return;
    }
    setSavingTemplate(true);
    if (editingTemplate) {
      await supabase.from("whatsapp_templates").update({
        name: templateForm.name, event: templateForm.event, body: templateForm.body, is_active: templateForm.is_active,
      }).eq("id", editingTemplate.id);
    } else {
      await supabase.from("whatsapp_templates").insert({
        name: templateForm.name, event: templateForm.event, body: templateForm.body, is_active: templateForm.is_active,
      });
    }
    toast({ title: editingTemplate ? "تم التعديل" : "تم الإضافة" });
    setTemplateDialog(false);
    loadTemplates();
    setSavingTemplate(false);
  };

  const confirmDeleteTemplate = async () => {
    if (!deleteTarget) return;
    await supabase.from("whatsapp_templates").delete().eq("id", deleteTarget);
    toast({ title: "تم الحذف" });
    setDeleteTarget(null);
    loadTemplates();
  };

  const loadLogs = async () => {
    setLogsLoading(true);
    const { data } = await supabase.from("whatsapp_message_logs").select("*").order("created_at", { ascending: false }).limit(100);
    if (data) setLogs(data);
    setLogsLoading(false);
  };

  useEffect(() => { if (tab === "logs") loadLogs(); }, [tab]);

  const toggleEvent = (event: string) => {
    setSettings(prev => ({
      ...prev,
      events: prev.events.includes(event) ? prev.events.filter(e => e !== event) : [...prev.events, event],
    }));
  };

  const sentCount = logs.filter(l => l.status === "sent").length;
  const failedCount = logs.filter(l => l.status === "failed").length;

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="relative">
          <div className="w-16 h-16 rounded-full border-4 border-emerald-500/20 border-t-emerald-500 animate-spin" />
          <MessageCircle className="w-6 h-6 text-emerald-500 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Hero Header */}
      <motion.div
        initial={{ opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="relative overflow-hidden rounded-3xl p-8 bg-gradient-to-br from-emerald-600 via-emerald-500 to-teal-400"
      >
        {/* Decorative circles */}
        <div className="absolute -top-10 -left-10 w-40 h-40 bg-white/10 rounded-full blur-2xl" />
        <div className="absolute -bottom-10 -right-10 w-56 h-56 bg-white/5 rounded-full blur-3xl" />
        <div className="absolute top-6 left-8 w-3 h-3 bg-white/30 rounded-full animate-pulse" />
        <div className="absolute bottom-12 left-1/3 w-2 h-2 bg-white/20 rounded-full animate-pulse" style={{ animationDelay: "1s" }} />

        <div className="relative z-10 flex items-start justify-between">
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <div className="w-14 h-14 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center shadow-lg">
                <MessageCircle className="w-7 h-7 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-white">واتساب</h1>
                <p className="text-emerald-100 text-sm">إرسال رسائل تلقائية عبر Ultramsg</p>
              </div>
            </div>

            {/* Stats row */}
            <div className="flex items-center gap-4 mt-4">
              <div className="flex items-center gap-2 bg-white/15 backdrop-blur-sm rounded-xl px-4 py-2">
                <div className={`w-2.5 h-2.5 rounded-full ${settings.enabled ? "bg-white animate-pulse" : "bg-white/40"}`} />
                <span className="text-white text-sm font-medium">{settings.enabled ? "مفعّل" : "معطّل"}</span>
              </div>
              {connectionStatus !== "unknown" && (
                <div className={`flex items-center gap-2 backdrop-blur-sm rounded-xl px-4 py-2 ${
                  connectionStatus === "connected" ? "bg-white/15" : "bg-red-400/20"
                }`}>
                  {connectionStatus === "connected" ? <Wifi className="w-4 h-4 text-white" /> : <WifiOff className="w-4 h-4 text-red-200" />}
                  <span className="text-white text-sm font-medium">{connectionStatus === "connected" ? "متصل" : "غير متصل"}</span>
                </div>
              )}
              <div className="flex items-center gap-2 bg-white/15 backdrop-blur-sm rounded-xl px-4 py-2">
                <FileText className="w-4 h-4 text-white" />
                <span className="text-white text-sm font-medium">{templates.length} قوالب</span>
              </div>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Tab Navigation */}
      <div className="flex gap-2 p-1.5 rounded-2xl bg-muted/50 backdrop-blur-sm border border-border/30 w-fit">
        {[
          { key: "settings" as const, label: "الإعدادات", icon: Settings, count: null },
          { key: "templates" as const, label: "القوالب", icon: FileText, count: templates.length },
          { key: "logs" as const, label: "سجل الإرسال", icon: History, count: logs.length || null },
        ].map(({ key, label, icon: Icon, count }) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={`relative flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium transition-all duration-300 ${
              tab === key
                ? "bg-card shadow-md shadow-emerald-500/5 text-foreground"
                : "text-muted-foreground hover:text-foreground hover:bg-card/50"
            }`}
          >
            <Icon className={`w-4 h-4 ${tab === key ? "text-emerald-500" : ""}`} />
            {label}
            {count !== null && count > 0 && (
              <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${
                tab === key ? "bg-emerald-500/10 text-emerald-600" : "bg-muted text-muted-foreground"
              }`}>
                {count}
              </span>
            )}
            {tab === key && (
              <motion.div
                layoutId="activeTab"
                className="absolute inset-0 rounded-xl bg-card shadow-md shadow-emerald-500/5"
                style={{ zIndex: -1 }}
                transition={{ type: "spring", bounce: 0.2, duration: 0.5 }}
              />
            )}
          </button>
        ))}
      </div>

      {/* ═══════════════ SETTINGS TAB ═══════════════ */}
      <AnimatePresence mode="wait">
        {tab === "settings" && (
          <motion.div
            key="settings"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.35 }}
            className="space-y-6"
          >
            {/* Master Toggle Card */}
            <motion.div custom={0} variants={cardVariants} initial="hidden" animate="visible"
              className="group relative rounded-2xl border border-border/40 bg-card p-6 hover:shadow-lg hover:shadow-emerald-500/5 transition-all duration-500"
            >
              <div className="absolute top-0 right-0 left-0 h-1 rounded-t-2xl bg-gradient-to-l from-emerald-500 to-teal-400 opacity-60" />
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-500/15 to-teal-400/10 flex items-center justify-center">
                    <Zap className={`w-6 h-6 ${settings.enabled ? "text-emerald-500" : "text-muted-foreground"}`} />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold">تفعيل نظام واتساب</h3>
                    <p className="text-sm text-muted-foreground">إرسال رسائل تلقائية للعملاء عند تغيير حالة الطلب</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className={`text-xs font-semibold px-2 py-1 rounded-full transition-colors ${
                    settings.enabled ? "bg-emerald-500/10 text-emerald-600" : "bg-muted text-muted-foreground"
                  }`}>
                    {settings.enabled ? "مفعّل ✅" : "معطّل ❌"}
                  </span>
                  <Switch
                    checked={settings.enabled}
                    onCheckedChange={(checked) => setSettings(prev => ({ ...prev, enabled: checked }))}
                    className="data-[state=checked]:bg-emerald-500"
                  />
                </div>
              </div>
            </motion.div>

            {/* API Credentials Card */}
            <motion.div custom={1} variants={cardVariants} initial="hidden" animate="visible"
              className="relative rounded-2xl border border-border/40 bg-card p-6 space-y-5 hover:shadow-lg hover:shadow-emerald-500/5 transition-all duration-500"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500/15 to-purple-400/10 flex items-center justify-center">
                  <Key className="w-5 h-5 text-violet-500" />
                </div>
                <div>
                  <h3 className="font-bold">بيانات Ultramsg</h3>
                  <p className="text-xs text-muted-foreground">
                    احصل على البيانات من{" "}
                    <a href="https://ultramsg.com" target="_blank" rel="noopener noreferrer"
                      className="text-emerald-600 hover:text-emerald-500 inline-flex items-center gap-0.5 font-medium transition-colors">
                      ultramsg.com <ArrowUpRight className="w-3 h-3" />
                    </a>
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-muted-foreground flex items-center gap-1.5">
                    <Hash className="w-3.5 h-3.5" /> Instance ID
                  </label>
                  <Input
                    value={settings.instance_id}
                    onChange={(e) => setSettings(prev => ({ ...prev, instance_id: e.target.value }))}
                    placeholder="instance12345"
                    dir="ltr"
                    className="font-mono text-sm h-11 rounded-xl border-border/50 focus:border-emerald-500/50 focus:ring-emerald-500/20"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-muted-foreground flex items-center gap-1.5">
                    <Key className="w-3.5 h-3.5" /> Token
                  </label>
                  <Input
                    value={settings.token}
                    onChange={(e) => setSettings(prev => ({ ...prev, token: e.target.value }))}
                    placeholder="your-token-here"
                    type="password"
                    dir="ltr"
                    className="font-mono text-sm h-11 rounded-xl border-border/50 focus:border-emerald-500/50 focus:ring-emerald-500/20"
                  />
                </div>
              </div>

              <div className="flex items-center gap-3">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={testConnection}
                  disabled={testingConnection}
                  className="rounded-xl border-emerald-500/30 text-emerald-600 hover:bg-emerald-500/5 hover:border-emerald-500/50"
                >
                  {testingConnection ? <Loader2 className="w-4 h-4 animate-spin ml-1.5" /> : <Wifi className="w-4 h-4 ml-1.5" />}
                  اختبار الاتصال
                </Button>
              </div>

              {/* Connection Status */}
              <AnimatePresence>
                {connectionStatus !== "unknown" && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    className="overflow-hidden"
                  >
                    <div className={`rounded-xl border p-4 grid grid-cols-2 sm:grid-cols-4 gap-4 ${
                      connectionStatus === "connected"
                        ? "bg-emerald-500/5 border-emerald-500/20"
                        : "bg-red-500/5 border-red-500/20"
                    }`}>
                      <div className="space-y-1">
                        <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Auth Status</span>
                        <div className="flex items-center gap-1.5">
                          {connectionStatus === "connected"
                            ? <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                            : <div className="w-2 h-2 rounded-full bg-red-500" />
                          }
                          <span className={`text-sm font-bold ${connectionStatus === "connected" ? "text-emerald-600" : "text-red-600"}`}>
                            {connectionStatus === "connected" ? "Authenticated" : "Disconnected"}
                          </span>
                        </div>
                      </div>
                      <div className="space-y-1">
                        <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">API URL</span>
                        <code className="text-xs bg-card/80 px-2 py-1 rounded-lg border border-border/30 block truncate select-all" dir="ltr">
                          api.ultramsg.com/{settings.instance_id}
                        </code>
                      </div>
                      <div className="space-y-1">
                        <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Instance ID</span>
                        <code className="text-xs bg-card/80 px-2 py-1 rounded-lg border border-border/30 block truncate select-all" dir="ltr">
                          {settings.instance_id || "—"}
                        </code>
                      </div>
                      <div className="space-y-1">
                        <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Token</span>
                        <code className="text-xs bg-card/80 px-2 py-1 rounded-lg border border-border/30 block truncate select-all" dir="ltr">
                          {settings.token ? settings.token.substring(0, 10) + "…" : "—"}
                        </code>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>

            {/* Events Card */}
            <motion.div custom={2} variants={cardVariants} initial="hidden" animate="visible"
              className="relative rounded-2xl border border-border/40 bg-card p-6 space-y-5 hover:shadow-lg hover:shadow-emerald-500/5 transition-all duration-500"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500/15 to-orange-400/10 flex items-center justify-center">
                  <Bell className="w-5 h-5 text-amber-500" />
                </div>
                <div>
                  <h3 className="font-bold">أحداث الإرسال التلقائي</h3>
                  <p className="text-xs text-muted-foreground">اختر متى يتم إرسال رسالة واتساب للعميل</p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {Object.entries(EVENT_MAP).map(([key, { label, icon, color }]) => {
                  const isActive = settings.events.includes(key);
                  return (
                    <button
                      key={key}
                      onClick={() => toggleEvent(key)}
                      className={`flex items-center gap-3 p-4 rounded-xl border transition-all duration-300 text-right ${
                        isActive
                          ? "bg-emerald-500/5 border-emerald-500/30 shadow-sm"
                          : "bg-muted/20 border-border/30 hover:border-border/60"
                      }`}
                    >
                      <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${
                        isActive ? "bg-emerald-500/10" : "bg-muted/50"
                      }`}>
                        <span className={isActive ? color : "text-muted-foreground"}>{icon}</span>
                      </div>
                      <span className={`text-sm font-medium flex-1 ${isActive ? "text-foreground" : "text-muted-foreground"}`}>
                        {label}
                      </span>
                      <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${
                        isActive ? "border-emerald-500 bg-emerald-500" : "border-border/60"
                      }`}>
                        {isActive && <CheckCircle className="w-3 h-3 text-white" />}
                      </div>
                    </button>
                  );
                })}
              </div>
            </motion.div>

            {/* Save Button */}
            <motion.div custom={3} variants={cardVariants} initial="hidden" animate="visible" className="flex justify-end">
              <Button
                onClick={saveSettings}
                disabled={savingSettings}
                className="rounded-xl px-8 py-3 h-12 bg-gradient-to-l from-emerald-600 to-teal-500 hover:from-emerald-500 hover:to-teal-400 text-white font-bold shadow-lg shadow-emerald-500/25 hover:shadow-emerald-500/35 transition-all duration-300 hover:-translate-y-0.5"
              >
                {savingSettings ? <Loader2 className="w-4 h-4 animate-spin ml-2" /> : <CheckCircle className="w-4 h-4 ml-2" />}
                حفظ الإعدادات
              </Button>
            </motion.div>
          </motion.div>
        )}

        {/* ═══════════════ TEMPLATES TAB ═══════════════ */}
        {tab === "templates" && (
          <motion.div
            key="templates"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.35 }}
            className="space-y-5"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500/15 to-indigo-400/10 flex items-center justify-center">
                  <FileText className="w-5 h-5 text-blue-500" />
                </div>
                <div>
                  <h3 className="font-bold text-lg">قوالب الرسائل</h3>
                  <p className="text-xs text-muted-foreground">{templates.length} قوالب مسجلة</p>
                </div>
              </div>
              <Button
                size="sm"
                onClick={openNewTemplate}
                className="rounded-xl bg-gradient-to-l from-emerald-600 to-teal-500 hover:from-emerald-500 hover:to-teal-400 text-white shadow-md shadow-emerald-500/20"
              >
                <Plus className="w-4 h-4 ml-1.5" />
                قالب جديد
              </Button>
            </div>

            {/* Template Cards */}
            {templates.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-border/50 bg-muted/20 p-12 text-center">
                <div className="w-16 h-16 rounded-2xl bg-muted/50 flex items-center justify-center mx-auto mb-4">
                  <FileText className="w-8 h-8 text-muted-foreground" />
                </div>
                <p className="text-muted-foreground font-medium">لا توجد قوالب</p>
                <p className="text-xs text-muted-foreground mt-1">أضف أول قالب رسالة لبدء الإرسال التلقائي</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-3">
                {templates.map((t, i) => {
                  const eventConf = EVENT_MAP[t.event];
                  return (
                    <motion.div
                      key={t.id}
                      custom={i}
                      variants={cardVariants}
                      initial="hidden"
                      animate="visible"
                      className="group relative rounded-2xl border border-border/40 bg-card p-5 hover:shadow-lg hover:shadow-emerald-500/5 transition-all duration-300"
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex items-start gap-3 flex-1 min-w-0">
                          <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                            t.is_active ? "bg-emerald-500/10" : "bg-muted/50"
                          }`}>
                            <span className={t.is_active ? (eventConf?.color || "text-emerald-500") : "text-muted-foreground"}>
                              {eventConf?.icon || <FileText className="w-5 h-5" />}
                            </span>
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <h4 className="font-bold text-sm">{t.name}</h4>
                              {t.is_active ? (
                                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600">مفعّل</span>
                              ) : (
                                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-muted text-muted-foreground">معطّل</span>
                              )}
                            </div>
                            <p className="text-xs text-muted-foreground mb-2">{eventConf?.label || t.event}</p>
                            <p className="text-xs text-muted-foreground/80 line-clamp-2 bg-muted/30 rounded-lg p-2.5 border border-border/20 font-mono leading-relaxed" dir="rtl">
                              {t.body}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg hover:bg-blue-500/10 hover:text-blue-500" onClick={() => openEditTemplate(t)}>
                            <Pencil className="w-3.5 h-3.5" />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg hover:bg-red-500/10 hover:text-red-500" onClick={() => setDeleteTarget(t.id)}>
                            <Trash2 className="w-3.5 h-3.5" />
                          </Button>
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            )}

            {/* Variables Reference */}
            <div className="rounded-2xl bg-gradient-to-br from-amber-500/5 to-orange-400/5 border border-amber-500/15 p-5 space-y-3">
              <h4 className="text-sm font-bold flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-amber-500/10 flex items-center justify-center">
                  <Sparkles className="w-4 h-4 text-amber-500" />
                </div>
                المتغيرات المتاحة
              </h4>
              <div className="flex flex-wrap gap-2">
                {[
                  { var: "{{name}}", desc: "اسم العميل", icon: "👤" },
                  { var: "{{product}}", desc: "اسم المنتج", icon: "📦" },
                  { var: "{{phone}}", desc: "رقم العميل", icon: "📞" },
                ].map(({ var: v, desc, icon }) => (
                  <span key={v} className="inline-flex items-center gap-2 text-xs bg-card px-3 py-2 rounded-xl border border-border/30 shadow-sm">
                    <span>{icon}</span>
                    <code className="font-mono font-bold text-emerald-600">{v}</code>
                    <span className="text-muted-foreground">= {desc}</span>
                  </span>
                ))}
              </div>
            </div>
          </motion.div>
        )}

        {/* ═══════════════ LOGS TAB ═══════════════ */}
        {tab === "logs" && (
          <motion.div
            key="logs"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.35 }}
            className="space-y-5"
          >
            {/* Stats Bar */}
            <div className="grid grid-cols-3 gap-3">
              {[
                { label: "إجمالي الرسائل", value: logs.length, icon: <MessageCircle className="w-5 h-5" />, gradient: "from-blue-500/15 to-indigo-400/10", textColor: "text-blue-500" },
                { label: "تم إرسالها", value: sentCount, icon: <CheckCircle className="w-5 h-5" />, gradient: "from-emerald-500/15 to-teal-400/10", textColor: "text-emerald-500" },
                { label: "فاشلة", value: failedCount, icon: <XCircle className="w-5 h-5" />, gradient: "from-red-500/15 to-rose-400/10", textColor: "text-red-500" },
              ].map((stat, i) => (
                <motion.div
                  key={stat.label}
                  custom={i}
                  variants={cardVariants}
                  initial="hidden"
                  animate="visible"
                  className="rounded-2xl border border-border/40 bg-card p-4 flex items-center gap-3"
                >
                  <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${stat.gradient} flex items-center justify-center`}>
                    <span className={stat.textColor}>{stat.icon}</span>
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{stat.value}</p>
                    <p className="text-[10px] text-muted-foreground font-medium">{stat.label}</p>
                  </div>
                </motion.div>
              ))}
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500/15 to-purple-400/10 flex items-center justify-center">
                  <History className="w-5 h-5 text-violet-500" />
                </div>
                <h3 className="font-bold text-lg">سجل الرسائل</h3>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={loadLogs}
                disabled={logsLoading}
                className="rounded-xl"
              >
                {logsLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <History className="w-4 h-4 ml-1.5" />}
                تحديث
              </Button>
            </div>

            <div className="rounded-2xl border border-border/40 bg-card overflow-hidden">
              {logs.length === 0 ? (
                <div className="p-12 text-center">
                  <div className="w-16 h-16 rounded-2xl bg-muted/50 flex items-center justify-center mx-auto mb-4">
                    <History className="w-8 h-8 text-muted-foreground" />
                  </div>
                  <p className="text-muted-foreground font-medium">لا توجد رسائل مسجلة</p>
                  <p className="text-xs text-muted-foreground mt-1">ستظهر الرسائل هنا عند إرسالها تلقائياً</p>
                </div>
              ) : (
                <div className="divide-y divide-border/30">
                  {logs.map((log, i) => {
                    const statusConf = STATUS_CONFIG[log.status] || STATUS_CONFIG.pending;
                    return (
                      <motion.div
                        key={log.id}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: i * 0.03 }}
                        className="flex items-center gap-4 p-4 hover:bg-muted/20 transition-colors"
                      >
                        <div className={`w-9 h-9 rounded-xl flex items-center justify-center border ${statusConf.classes}`}>
                          {statusConf.icon}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-0.5">
                            <span className="font-mono text-sm font-medium" dir="ltr">{log.phone}</span>
                            <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full border ${statusConf.classes}`}>
                              {statusConf.label}
                            </span>
                          </div>
                          <p className="text-xs text-muted-foreground truncate max-w-md hidden sm:block">{log.message_body}</p>
                          {log.error_message && (
                            <p className="text-[10px] text-red-500 mt-0.5 truncate max-w-xs">{log.error_message}</p>
                          )}
                        </div>
                        <span className="text-[11px] text-muted-foreground whitespace-nowrap shrink-0">
                          {new Date(log.created_at).toLocaleDateString("en-US", {
                            month: "short", day: "numeric", hour: "2-digit", minute: "2-digit",
                          })}
                        </span>
                      </motion.div>
                    );
                  })}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Template Dialog */}
      <Dialog open={templateDialog} onOpenChange={setTemplateDialog}>
        <DialogContent className="sm:max-w-lg rounded-2xl" dir="rtl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-emerald-500/15 to-teal-400/10 flex items-center justify-center">
                <FileText className="w-4 h-4 text-emerald-500" />
              </div>
              {editingTemplate ? "تعديل القالب" : "قالب جديد"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <label className="text-xs font-semibold text-muted-foreground">اسم القالب</label>
              <Input
                value={templateForm.name}
                onChange={(e) => setTemplateForm(prev => ({ ...prev, name: e.target.value }))}
                placeholder="مثال: خرج للتوصيل"
                className="rounded-xl h-11"
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-semibold text-muted-foreground">الحدث</label>
              <select
                value={templateForm.event}
                onChange={(e) => setTemplateForm(prev => ({ ...prev, event: e.target.value }))}
                className="w-full h-11 rounded-xl border border-input bg-background px-3 text-sm focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500/50 transition-all"
              >
                {Object.entries(EVENT_MAP).map(([k, v]) => (
                  <option key={k} value={k}>{v.label}</option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-xs font-semibold text-muted-foreground">نص الرسالة</label>
              <Textarea
                value={templateForm.body}
                onChange={(e) => setTemplateForm(prev => ({ ...prev, body: e.target.value }))}
                placeholder="مرحبًا {{name}}..."
                rows={6}
                className="resize-none rounded-xl font-mono text-sm leading-relaxed"
              />
            </div>
            <label className="flex items-center gap-3 cursor-pointer p-3 rounded-xl bg-muted/30 border border-border/30">
              <Switch
                checked={templateForm.is_active}
                onCheckedChange={(checked) => setTemplateForm(prev => ({ ...prev, is_active: checked }))}
                className="data-[state=checked]:bg-emerald-500"
              />
              <span className="text-sm font-medium">{templateForm.is_active ? "مفعّل ✅" : "معطّل ❌"}</span>
            </label>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setTemplateDialog(false)} className="rounded-xl">إلغاء</Button>
            <Button
              onClick={saveTemplate}
              disabled={savingTemplate}
              className="rounded-xl bg-gradient-to-l from-emerald-600 to-teal-500 hover:from-emerald-500 hover:to-teal-400 text-white"
            >
              {savingTemplate ? <Loader2 className="w-4 h-4 animate-spin ml-1.5" /> : <CheckCircle className="w-4 h-4 ml-1.5" />}
              حفظ
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ConfirmDeleteDialog
        open={!!deleteTarget}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
        onConfirm={confirmDeleteTemplate}
        title="حذف القالب"
        description="هل أنت متأكد من حذف هذا القالب؟"
      />
    </div>
  );
}
