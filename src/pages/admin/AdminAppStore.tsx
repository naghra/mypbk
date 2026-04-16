import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  Search,
  Download,
  Settings,
  Trash2,
  Check,
  Loader2,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

// ─── Brand SVG Logos ────────────────────────────────────────────────
const FacebookLogo = () => (
  <svg viewBox="0 0 24 24" width="22" height="22" fill="#fff">
    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
  </svg>
);

const TikTokLogo = () => (
  <svg viewBox="0 0 24 24" width="20" height="20" fill="#fff">
    <path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-2.88 2.5 2.89 2.89 0 01-2.89-2.89 2.89 2.89 0 012.89-2.89c.28 0 .54.04.79.1v-3.5a6.37 6.37 0 00-.79-.05A6.34 6.34 0 003.15 15.2a6.34 6.34 0 006.34 6.34 6.34 6.34 0 006.34-6.34V9.13a8.16 8.16 0 004.76 1.52v-3.4a4.85 4.85 0 01-1-.56z"/>
  </svg>
);

const SnapchatLogo = () => (
  <svg viewBox="0 0 24 24" width="22" height="22" fill="#000">
    <path d="M12.206.793c.99 0 4.347.276 5.93 3.821.529 1.193.403 3.219.299 4.847l-.003.06c-.012.18-.022.345-.03.51.075.045.203.09.401.09.3-.016.659-.12.922-.214.04-.012.06-.012.08-.012.16 0 .292.03.398.09.18.074.27.21.27.39 0 .27-.21.45-.48.54l-.03.014c-.18.075-.39.15-.63.21-.12.03-.21.06-.27.09-.18.06-.27.21-.3.36 0 .03 0 .06.03.12.21.45.48.84.78 1.17.42.48.93.87 1.47 1.11.12.06.24.12.33.18.21.12.33.27.36.48.03.27-.15.54-.48.72-.42.24-.96.36-1.62.42-.06.03-.09.12-.12.27-.03.15-.06.27-.06.33-.06.15-.18.24-.39.24a2.15 2.15 0 01-.42-.06c-.39-.06-.84-.15-1.41-.15-.18 0-.36 0-.54.03-.48.06-.87.3-1.29.57a6.79 6.79 0 01-3.21 1.38c-.06 0-.12.015-.18.015h-.06c-.06 0-.12-.015-.18-.015a6.79 6.79 0 01-3.21-1.38c-.42-.27-.81-.51-1.29-.57-.18-.03-.36-.03-.54-.03-.57 0-1.02.09-1.41.15-.12.03-.27.06-.42.06-.21 0-.33-.09-.39-.24 0-.06-.03-.18-.06-.33-.03-.15-.06-.24-.12-.27-.66-.06-1.2-.18-1.62-.42-.33-.18-.51-.45-.48-.72.03-.21.15-.36.36-.48.09-.06.21-.12.33-.18.54-.24 1.05-.63 1.47-1.11.3-.33.57-.72.78-1.17.03-.06.03-.09.03-.12-.03-.15-.12-.3-.3-.36-.06-.03-.15-.06-.27-.09a5.1 5.1 0 01-.63-.21l-.03-.014c-.27-.09-.48-.27-.48-.54 0-.18.09-.316.27-.39.106-.06.238-.09.398-.09.02 0 .04 0 .08.012.263.094.622.198.922.214.198 0 .326-.045.401-.09a9.34 9.34 0 01-.03-.51l-.003-.06c-.104-1.628-.23-3.654.3-4.847C7.653 1.069 11.016.793 12.006.793h.2z"/>
  </svg>
);

const GoogleLogo = () => (
  <svg viewBox="0 0 24 24" width="20" height="20">
    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"/>
    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
  </svg>
);

const GoogleTagLogo = () => (
  <svg viewBox="0 0 24 24" width="20" height="20">
    <path fill="#8AB4F8" d="M12 2L2 19.5h20L12 2zm0 4l7 13.5H5L12 6z"/>
    <circle fill="#4285F4" cx="12" cy="17" r="2.5"/>
  </svg>
);

const MicrosoftLogo = () => (
  <svg viewBox="0 0 24 24" width="18" height="18">
    <rect fill="#F25022" x="1" y="1" width="10" height="10"/>
    <rect fill="#7FBA00" x="13" y="1" width="10" height="10"/>
    <rect fill="#00A4EF" x="1" y="13" width="10" height="10"/>
    <rect fill="#FFB900" x="13" y="13" width="10" height="10"/>
  </svg>
);

const HotjarLogo = () => (
  <svg viewBox="0 0 24 24" width="20" height="20" fill="#FF3C00">
    <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm2.4 7.2c0 1.1-.3 2.1-.9 3l-3.6 5.4c-.3.5-.5 1-.5 1.6v.6c0 .7.4 1.2 1 1.2h1.2c.6 0 1-.5 1-1.2v-.4h2.4v.4c0 2-1.5 3.6-3.4 3.6h-1.2c-1.9 0-3.4-1.6-3.4-3.6v-.6c0-1.1.3-2.1.9-3l3.6-5.4c.3-.5.5-1 .5-1.6v-.4c0-.7-.4-1.2-1-1.2H9.8c-.6 0-1 .5-1 1.2V7H6.4v-.4C6.4 4.6 7.9 3 9.8 3h1.2c1.9 0 3.4 1.6 3.4 3.6v.6z"/>
  </svg>
);

const CodNetworkLogo = () => (
  <img src="https://static-content-dropify.com/dropify_static_assets/img/apps/new_apps/codnetwork.svg" alt="COD Network" width="48" height="48" className="rounded" />
);

const WhatsAppLogo = () => (
  <svg viewBox="0 0 24 24" width="20" height="20" fill="#fff">
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
  </svg>
);

const PushoverLogo = () => (
  <svg viewBox="0 0 24 24" width="20" height="20" fill="#fff">
    <path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9zM13.73 21a2 2 0 01-3.46 0"/>
  </svg>
);

const GoogleSheetsLogo = () => (
  <svg viewBox="0 0 24 24" width="20" height="20">
    <path fill="#0F9D58" d="M14.5 1H6a2 2 0 00-2 2v18a2 2 0 002 2h12a2 2 0 002-2V6.5L14.5 1z"/>
    <path fill="#87CEAC" d="M14.5 1v5.5H20L14.5 1z"/>
    <rect fill="#fff" x="7" y="11" width="10" height="8" rx="0.5"/>
    <line x1="7" y1="14" x2="17" y2="14" stroke="#0F9D58" strokeWidth="0.7"/>
    <line x1="7" y1="16.5" x2="17" y2="16.5" stroke="#0F9D58" strokeWidth="0.7"/>
    <line x1="11" y1="11" x2="11" y2="19" stroke="#0F9D58" strokeWidth="0.7"/>
  </svg>
);

const CodFormLogo = () => (
  <svg viewBox="0 0 24 24" width="20" height="20" fill="#fff">
    <path d="M13 10V3L4 14h7v7l9-11h-7z"/>
  </svg>
);

const CreditCardIcon = () => (
  <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="1" y="4" width="22" height="16" rx="2" ry="2"/>
    <line x1="1" y1="10" x2="23" y2="10"/>
  </svg>
);

const GiftIcon = () => (
  <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="20 12 20 22 4 22 4 12"/>
    <rect x="2" y="7" width="20" height="5"/>
    <line x1="12" y1="22" x2="12" y2="7"/>
    <path d="M12 7H7.5a2.5 2.5 0 010-5C11 2 12 7 12 7z"/>
    <path d="M12 7h4.5a2.5 2.5 0 000-5C13 2 12 7 12 7z"/>
  </svg>
);

const TimerIcon = () => (
  <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="13" r="8"/>
    <path d="M12 9v4l2 2"/>
    <path d="M5 3L2 6"/>
    <path d="M22 6l-3-3"/>
    <path d="M12 2v2"/>
  </svg>
);

const CloakingIcon = () => (
  <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
    <path d="M9 12l2 2 4-4"/>
  </svg>
);

const StarIcon = () => (
  <svg viewBox="0 0 24 24" width="20" height="20" fill="#fff">
    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
  </svg>
);

const ShoppingBagIcon = () => (
  <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z"/>
    <line x1="3" y1="6" x2="21" y2="6"/>
    <path d="M16 10a4 4 0 01-8 0"/>
  </svg>
);

const MegaphoneIcon = () => (
  <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/>
  </svg>
);

// ─── App Definition ─────────────────────────────────────────────────
interface AppDef {
  id: string;
  name: string;
  description: string;
  logo: React.FC;
  iconBg: string;
  category: string;
  provider: string;
  defaultInstalled: boolean;
  badge?: string;
  route?: string;
}

const appDefs: AppDef[] = [
  // التتبع والتحليلات
  { id: "facebook-pixel", name: "Facebook Browser Pixel", description: "أداة تتبع تراقب نشاط المستخدمين على موقعك لتحسين حملاتك الإعلانية على فيسبوك.", logo: FacebookLogo, iconBg: "#1877F2", category: "التتبع والتحليلات", provider: "Facebook", defaultInstalled: true },
  { id: "facebook-api", name: "Facebook API Conversion", description: "إرسال بيانات التحويلات مباشرة من السيرفر إلى فيسبوك لتتبع أدق وأكثر أماناً.", logo: FacebookLogo, iconBg: "#1877F2", category: "التتبع والتحليلات", provider: "Facebook", defaultInstalled: false },
  { id: "tiktok-pixel", name: "TikTok Browser Pixel", description: "تتبع نشاط المستخدمين بعد تفاعلهم مع إعلانات تيك توك لتحسين حملاتك الإعلانية.", logo: TikTokLogo, iconBg: "#010101", category: "التتبع والتحليلات", provider: "TikTok Inc.", defaultInstalled: true },
  { id: "tiktok-api", name: "TikTok API Conversion", description: "إرسال أحداث التحويل من السيرفر مباشرة إلى تيك توك لتتبع دقيق خارج المتصفح.", logo: TikTokLogo, iconBg: "#010101", category: "التتبع والتحليلات", provider: "TikTok Inc.", defaultInstalled: false },
  { id: "snapchat-pixel", name: "Snapchat Browser Pixel", description: "تتبع تفاعل المستخدمين القادمين من إعلانات سنابشات لتحسين أداء حملاتك.", logo: SnapchatLogo, iconBg: "#FFFC00", category: "التتبع والتحليلات", provider: "Snap Inc.", defaultInstalled: true },
  { id: "google-ads", name: "Google Ads Conversions", description: "تتبع التحويلات وإضافات السلة لتحسين حملات Google Ads الخاصة بك.", logo: GoogleLogo, iconBg: "#fff", category: "التتبع والتحليلات", provider: "Google", defaultInstalled: false },
  { id: "google-tag", name: "Google Tag Manager", description: "إدارة وإضافة أكواد التتبع والتحليل على موقعك بدون تعديل الكود مباشرة.", logo: GoogleTagLogo, iconBg: "#F1F3F4", category: "التتبع والتحليلات", provider: "Google", defaultInstalled: false },
  { id: "microsoft-clarity", name: "Microsoft Clarity", description: "خرائط حرارية وتسجيلات فيديو للجلسات لفهم سلوك المستخدمين وتحسين تجربتهم.", logo: MicrosoftLogo, iconBg: "#fff", category: "التتبع والتحليلات", provider: "Microsoft", defaultInstalled: false },
  { id: "hotjar", name: "Hotjar", description: "خرائط حرارية وتسجيلات جلسات وتحليلات مفصلة لفهم سلوك العملاء.", logo: HotjarLogo, iconBg: "#FFF3ED", category: "التتبع والتحليلات", provider: "Hotjar", defaultInstalled: false },

  // الشحن والتوصيل
  { id: "cod-network", name: "COD Network", description: "ربط متجرك مع شبكة COD Network لإدارة الشحن والتوصيل والدفع عند الاستلام.", logo: CodNetworkLogo, iconBg: "#10B981", category: "الشحن والتوصيل", provider: "COD Network", defaultInstalled: true, route: "/admin/cod-network" },

  // المراسلة والتواصل
  { id: "whatsapp", name: "WhatsApp Business", description: "إرسال رسائل تأكيد الطلبات وتحديثات الشحن تلقائياً عبر واتساب.", logo: WhatsAppLogo, iconBg: "#25D366", category: "المراسلة والتواصل", provider: "Meta", defaultInstalled: true, route: "/admin/whatsapp" },
  { id: "pushover", name: "Pushover Notifications", description: "تنبيهات فورية على هاتفك عند استلام طلبات جديدة.", logo: PushoverLogo, iconBg: "#2196F3", category: "المراسلة والتواصل", provider: "Pushover", defaultInstalled: true },

  // التكاملات
  { id: "google-sheets", name: "Google Sheets", description: "تصدير الطلبات تلقائياً إلى جداول بيانات Google لسهولة التقارير والمتابعة.", logo: GoogleSheetsLogo, iconBg: "#E8F5E9", category: "التكاملات", provider: "Google", defaultInstalled: true, route: "/admin/google-sheets" },

  // الدفع
  { id: "cod-payment", name: "الدفع عند الاستلام", description: "تمكين خيار الدفع عند الاستلام (COD) لعملائك بسهولة.", logo: CreditCardIcon, iconBg: "#F59E0B", category: "الدفع", provider: "CodForm", defaultInstalled: true, badge: "مفعل" },
  { id: "bank-transfer", name: "التحويل البنكي", description: "قبول المدفوعات عبر التحويل البنكي المباشر.", logo: CreditCardIcon, iconBg: "#6366F1", category: "الدفع", provider: "CodForm", defaultInstalled: true, badge: "مفعل" },

  // التسويق
  { id: "codform-pro", name: "CodForm PRO", description: "نموذج طلب متقدم مع خيارات الكمية والمتغيرات وتحسينات لزيادة معدل التحويل.", logo: CodFormLogo, iconBg: "#8B5CF6", category: "التسويق", provider: "CodForm", defaultInstalled: true, badge: "PRO", route: "/admin/cod-form" },
  { id: "gift-system", name: "نظام الهدايا", description: "أضف هدايا مجانية للطلبات لزيادة معدل إتمام الشراء وقيمة السلة.", logo: GiftIcon, iconBg: "#EC4899", category: "التسويق", provider: "CodForm", defaultInstalled: true, route: "/admin/app-store/gift-system" },
  { id: "urgency-timer", name: "مؤقت العرض", description: "عداد تنازلي يخلق إحساس بالاستعجال لدى العملاء لتسريع قرار الشراء.", logo: TimerIcon, iconBg: "#EF4444", category: "التسويق", provider: "CodForm", defaultInstalled: false },
  { id: "reviews", name: "التقييمات والمراجعات", description: "عرض تقييمات ومراجعات العملاء على صفحة المنتج لزيادة الثقة.", logo: StarIcon, iconBg: "#F59E0B", category: "التسويق", provider: "CodForm", defaultInstalled: true, route: "/admin/app-store/reviews" },
  { id: "upsell", name: "Upsell & Cross-sell", description: "عرض منتجات إضافية ومكملة لزيادة قيمة السلة ومتوسط الطلب.", logo: ShoppingBagIcon, iconBg: "#14B8A6", category: "التسويق", provider: "CodForm", defaultInstalled: false },
  { id: "abandoned-cart", name: "استرجاع السلات المتروكة", description: "إرسال رسائل تذكيرية للعملاء الذين لم يكملوا الشراء لاسترجاعهم.", logo: MegaphoneIcon, iconBg: "#F97316", category: "التسويق", provider: "CodForm", defaultInstalled: false, badge: "قريباً" },

  // الحماية والأمان
  { id: "cloaking", name: "Cloaking Protection", description: "حماية صفحات المنتجات من البوتات عبر نظام اختيار الدولة وجلب الوصف من سيرفر خارجي.", logo: CloakingIcon, iconBg: "#7C3AED", category: "الحماية والأمان", provider: "External Supabase", defaultInstalled: false, route: "/admin/app-store/cloaking" },
];

const categories = [...new Set(appDefs.map((a) => a.category))];

const SETTINGS_KEY = "installed_apps";

export default function AdminAppStore() {
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [installedIds, setInstalledIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [uninstallTarget, setUninstallTarget] = useState<string | null>(null);
  const { toast } = useToast();
  const navigate = useNavigate();

  // Load installed apps from store_settings
  useEffect(() => {
    const load = async () => {
      const { data } = await supabase
        .from("store_settings")
        .select("value")
        .eq("key", SETTINGS_KEY)
        .maybeSingle();
      if (data?.value && Array.isArray(data.value)) {
        setInstalledIds(data.value as string[]);
      } else {
        // Default: use defaultInstalled
        const defaults = appDefs.filter((a) => a.defaultInstalled).map((a) => a.id);
        setInstalledIds(defaults);
        // Save defaults
        await supabase.from("store_settings").upsert(
          { key: SETTINGS_KEY, value: defaults as any },
          { onConflict: "key" }
        );
      }
      setLoading(false);
    };
    load();
  }, []);

  const saveInstalled = async (ids: string[]) => {
    await supabase.from("store_settings").upsert(
      { key: SETTINGS_KEY, value: ids as any },
      { onConflict: "key" }
    );
  };

  const handleInstall = async (appId: string) => {
    setActionLoading(appId);
    const newIds = [...installedIds, appId];
    setInstalledIds(newIds);
    await saveInstalled(newIds);
    const app = appDefs.find((a) => a.id === appId);
    toast({ title: `تم تثبيت ${app?.name}`, description: "يمكنك الآن استخدام التطبيق" });
    setActionLoading(null);
  };

  const handleUninstall = async (appId: string) => {
    setActionLoading(appId);
    const newIds = installedIds.filter((id) => id !== appId);
    setInstalledIds(newIds);
    await saveInstalled(newIds);
    const app = appDefs.find((a) => a.id === appId);
    toast({ title: `تم إلغاء تثبيت ${app?.name}` });
    setActionLoading(null);
    setUninstallTarget(null);
  };

  const handleSettings = (app: AppDef) => {
    if (app.route) {
      navigate(app.route);
    } else {
      navigate(`/admin/app-store/${app.id}`);
    }
  };

  const filtered = appDefs.filter((app) => {
    const matchesSearch =
      !search ||
      app.name.toLowerCase().includes(search.toLowerCase()) ||
      app.description.includes(search);
    const matchesCategory = !selectedCategory || app.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const grouped = categories
    .filter((cat) => filtered.some((a) => a.category === cat))
    .map((cat) => ({
      category: cat,
      apps: filtered.filter((a) => a.category === cat),
    }));

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-foreground">متجر التطبيقات</h1>
        <p className="text-muted-foreground text-sm mt-1">
          استكشف التطبيقات التي تساعدك على البيع أكثر والنمو بشكل أسرع
        </p>
      </div>

      {/* Search & Filter */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="ابحث عن تطبيق..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pr-10 h-11 rounded-xl bg-background border-border/60"
          />
        </div>
        <div className="flex gap-2 flex-wrap">
          <button
            onClick={() => setSelectedCategory(null)}
            className={`px-3.5 py-2 rounded-xl text-xs font-semibold transition-all ${
              !selectedCategory
                ? "bg-primary text-primary-foreground shadow-sm"
                : "bg-muted text-muted-foreground hover:bg-muted/80"
            }`}
          >
            الكل
          </button>
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat === selectedCategory ? null : cat)}
              className={`px-3.5 py-2 rounded-xl text-xs font-semibold transition-all whitespace-nowrap ${
                selectedCategory === cat
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "bg-muted text-muted-foreground hover:bg-muted/80"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* App Categories */}
      {grouped.map(({ category, apps: catApps }) => (
        <div key={category} className="space-y-3">
          <div className="flex items-center gap-2">
            <div className="w-1 h-5 rounded-full bg-primary" />
            <h2 className="text-base font-bold text-foreground">{category}</h2>
            <span className="text-xs text-muted-foreground">({catApps.length})</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {catApps.map((app, i) => {
              const isInstalled = installedIds.includes(app.id);
              return (
                <AppCard
                  key={app.id}
                  app={app}
                  index={i}
                  installed={isInstalled}
                  loading={actionLoading === app.id}
                  onInstall={() => handleInstall(app.id)}
                  onUninstall={() => setUninstallTarget(app.id)}
                  onSettings={() => handleSettings(app)}
                />
              );
            })}
          </div>
        </div>
      ))}

      {filtered.length === 0 && (
        <div className="text-center py-16">
          <Search className="w-12 h-12 text-muted-foreground/40 mx-auto mb-3" />
          <p className="text-muted-foreground">لا توجد تطبيقات مطابقة للبحث</p>
        </div>
      )}

      {/* Uninstall confirmation */}
      <AlertDialog open={!!uninstallTarget} onOpenChange={() => setUninstallTarget(null)}>
        <AlertDialogContent dir="rtl">
          <AlertDialogHeader>
            <AlertDialogTitle>إلغاء تثبيت التطبيق</AlertDialogTitle>
            <AlertDialogDescription>
              هل أنت متأكد من إلغاء تثبيت {appDefs.find((a) => a.id === uninstallTarget)?.name}؟ يمكنك إعادة تثبيته لاحقاً.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex-row-reverse gap-2">
            <AlertDialogCancel>إلغاء</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => uninstallTarget && handleUninstall(uninstallTarget)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              إلغاء التثبيت
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function AppCard({
  app,
  index,
  installed,
  loading,
  onInstall,
  onUninstall,
  onSettings,
}: {
  app: AppDef;
  index: number;
  installed: boolean;
  loading: boolean;
  onInstall: () => void;
  onUninstall: () => void;
  onSettings: () => void;
}) {
  const Logo = app.logo;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.04, duration: 0.3 }}
      className={`group relative rounded-2xl border p-5 transition-all duration-200 hover:shadow-lg ${
        installed
          ? "bg-primary/[0.03] border-primary/20 hover:border-primary/40"
          : "bg-card border-border/60 hover:border-border"
      }`}
    >
      {/* Top row */}
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex items-center gap-3 min-w-0">
          <div
            className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0 shadow-sm"
            style={{ backgroundColor: app.iconBg }}
          >
            <Logo />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h3 className="font-semibold text-sm text-foreground truncate">{app.name}</h3>
              {app.badge && (
                <span
                  className={`text-[10px] font-bold px-1.5 py-0.5 rounded-md shrink-0 ${
                    app.badge === "PRO"
                      ? "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300"
                      : app.badge === "قريباً"
                      ? "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300"
                      : "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300"
                  }`}
                >
                  {app.badge}
                </span>
              )}
            </div>
            <p className="text-[11px] text-emerald-600 font-medium">مجاني</p>
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex items-center gap-1.5 shrink-0">
          {loading ? (
            <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
          ) : installed ? (
            <>
              <button
                onClick={onUninstall}
                className="p-1.5 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                title="إلغاء التثبيت"
              >
                <Trash2 className="w-4 h-4" />
              </button>
              <button
                onClick={onSettings}
                className="p-1.5 rounded-lg text-primary hover:bg-primary/10 transition-colors"
                title="الإعدادات"
              >
                <Settings className="w-4 h-4" />
              </button>
            </>
          ) : app.badge === "قريباً" ? (
            <span className="text-[11px] text-muted-foreground font-medium px-2">قريباً</span>
          ) : (
            <button
              onClick={onInstall}
              className="p-1.5 rounded-lg text-primary hover:bg-primary/10 transition-colors"
              title="تثبيت"
            >
              <Download className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Description */}
      <p className="text-xs text-muted-foreground leading-relaxed line-clamp-3 mb-3">
        {app.description}
      </p>

      {/* Footer */}
      <div className="flex items-center justify-between">
        <p className="text-[11px] text-muted-foreground/70">بواسطة {app.provider}</p>
        {installed && (
          <div className="flex items-center gap-1 text-[11px] text-emerald-600 font-medium">
            <Check className="w-3 h-3" />
            مُثبت
          </div>
        )}
      </div>
    </motion.div>
  );
}
