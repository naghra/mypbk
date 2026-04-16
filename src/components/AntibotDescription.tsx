import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

const DEFAULT_API_URL = "https://foubanzluqitdntcnzbi.supabase.co/functions/v1/get-product-description";
const CACHE_TTL_MS = 6 * 60 * 60 * 1000;

const VALID_COUNTRIES = ["السعودية", "الإمارات", "قطر"];

const countries = [
  { label: "🇸🇦 السعودية", value: "السعودية" },
  { label: "🇦🇪 الإمارات", value: "الإمارات" },
  { label: "🇶🇦 قطر", value: "قطر" },
];

function getCacheKey(handle: string, country: string) {
  return `desc_cache:${handle}:${country}`;
}

function getCached(handle: string, country: string): string | null {
  try {
    const raw = localStorage.getItem(getCacheKey(handle, country));
    if (!raw) return null;
    const { description, ts } = JSON.parse(raw);
    if (Date.now() - ts > CACHE_TTL_MS) {
      localStorage.removeItem(getCacheKey(handle, country));
      return null;
    }
    return description;
  } catch {
    return null;
  }
}

function setCache(handle: string, country: string, description: string) {
  localStorage.setItem(getCacheKey(handle, country), JSON.stringify({ description, ts: Date.now() }));
}

interface Props {
  productHandle: string;
  defaultDescription?: React.ReactNode;
}

const AntibotDescription = ({ productHandle, defaultDescription }: Props) => {
  const [showPopup, setShowPopup] = useState(false);
  const [descriptionHtml, setDescriptionHtml] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);
  const [initialized, setInitialized] = useState(false);
  const [countrySelected, setCountrySelected] = useState(false);
  const [cloakingEnabled, setCloakingEnabled] = useState<boolean | null>(null);
  const [apiUrl, setApiUrl] = useState(DEFAULT_API_URL);
  const [anonKey, setAnonKey] = useState<string | null>(null);

  // Load cloaking settings from store_settings
  useEffect(() => {
    const loadSettings = async () => {
      try {
        const { data } = await supabase
          .from("store_settings")
          .select("value")
          .eq("key", "app_config_cloaking")
          .maybeSingle();

        if (data?.value && typeof data.value === "object") {
          const settings = data.value as Record<string, any>;
          const enabled = settings.cloaking_enabled === true;
          setCloakingEnabled(enabled);
          if (settings.api_url) {
            setApiUrl(settings.api_url);
          }
          if (settings.supabase_anon_key) {
            setAnonKey(settings.supabase_anon_key);
          }
        } else {
          setCloakingEnabled(false);
        }
      } catch {
        setCloakingEnabled(false);
      }
    };
    loadSettings();
  }, []);

  const fetchDescription = useCallback(async (country: string) => {
    const cached = getCached(productHandle, country);
    if (cached) {
      setDescriptionHtml(cached);
      return;
    }

    setLoading(true);
    setError(false);
    try {
      const headers: Record<string, string> = { "Content-Type": "application/json" };
      if (anonKey) {
        headers["apikey"] = anonKey;
        headers["Authorization"] = `Bearer ${anonKey}`;
      }
      const res = await fetch(apiUrl, {
        method: "POST",
        headers,
        body: JSON.stringify({ product_handle: productHandle, country }),
      });

      const contentType = res.headers.get("content-type") || "";
      if (!contentType.includes("application/json")) {
        const text = await res.text();
        console.error("API returned non-JSON:", text.substring(0, 200));
        throw new Error("Non-JSON response");
      }

      const data = await res.json();
      if (res.ok && data.success && data.description) {
        setDescriptionHtml(data.description);
        setCache(productHandle, country, data.description);
      } else {
        throw new Error(data?.error || "No description");
      }
    } catch (err) {
      console.error("Error fetching description:", err);
      setError(true);
      setDescriptionHtml(null);
    } finally {
      setLoading(false);
    }
  }, [productHandle, apiUrl, anonKey]);

  // On mount: check localStorage for saved country (only if cloaking is enabled)
  useEffect(() => {
    if (cloakingEnabled === null) return; // still loading settings
    if (!cloakingEnabled) {
      setInitialized(true);
      return;
    }

    const saved = localStorage.getItem("selected_country");
    if (saved && VALID_COUNTRIES.includes(saved)) {
      setCountrySelected(true);
      fetchDescription(saved);
    } else {
      localStorage.removeItem("selected_country");
      setShowPopup(true);
    }
    setInitialized(true);
  }, [cloakingEnabled, fetchDescription]);

  const handleCountrySelect = useCallback((countryName: string) => {
    localStorage.setItem("selected_country", countryName);
    setShowPopup(false);
    setCountrySelected(true);
    fetchDescription(countryName);
  }, [fetchDescription]);

  const handleRetry = useCallback(() => {
    const saved = localStorage.getItem("selected_country");
    if (saved) {
      fetchDescription(saved);
    } else {
      setShowPopup(true);
    }
  }, [fetchDescription]);

  // If cloaking is disabled, show default description
  if (cloakingEnabled === false) {
    return <>{defaultDescription || null}</>;
  }

  if (!initialized) return null;

  return (
    <>
      {/* Country Selection Popup */}
      {showPopup && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm" dir="rtl">
          <div className="bg-background rounded-2xl p-8 max-w-sm w-[90%] text-center shadow-2xl animate-in fade-in zoom-in-95 duration-300">
            <h3 className="text-xl font-bold text-foreground mb-2">اختر دولتك</h3>
            <p className="text-sm text-muted-foreground mb-6">يرجى اختيار دولتك للمتابعة</p>
            <div className="space-y-3">
              {countries.map((c) => (
                <button
                  key={c.value}
                  onClick={() => handleCountrySelect(c.value)}
                  className="w-full py-3 px-4 text-base font-medium border border-border rounded-xl bg-background hover:border-foreground/40 hover:bg-secondary transition-all"
                >
                  {c.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Description Area */}
      <div id="protected-description">
        {!countrySelected ? (
          null
        ) : loading ? (
          <div className="flex items-center justify-center py-8">
            <div className="w-6 h-6 border-2 border-border border-t-foreground rounded-full animate-spin" />
            <span className="mr-3 text-sm text-muted-foreground">جاري تحميل الوصف...</span>
          </div>
        ) : error ? (
          <div className="text-center py-6">
            <p className="text-sm text-muted-foreground mb-3">تعذر تحميل الوصف الآن، حاول مرة أخرى.</p>
            <button
              onClick={handleRetry}
              className="px-4 py-2 text-sm font-medium border border-border rounded-lg hover:bg-secondary transition-colors"
            >
              إعادة المحاولة
            </button>
          </div>
        ) : descriptionHtml ? (
          <div
            dangerouslySetInnerHTML={{ __html: descriptionHtml }}
            className="prose prose-sm max-w-none"
            dir="rtl"
          />
        ) : (
          defaultDescription || null
        )}
      </div>
    </>
  );
};

export default AntibotDescription;
