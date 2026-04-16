import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface CurrencyConfig {
  code: string;
  symbol: string;
  name_ar: string;
}

export const CURRENCIES: CurrencyConfig[] = [
  { code: "SAR", symbol: "ريال سعودي", name_ar: "ريال سعودي" },
  { code: "AED", symbol: "درهم إماراتي", name_ar: "درهم إماراتي" },
  { code: "KWD", symbol: "دينار كويتي", name_ar: "دينار كويتي" },
  { code: "BHD", symbol: "دينار بحريني", name_ar: "دينار بحريني" },
  { code: "QAR", symbol: "ريال قطري", name_ar: "ريال قطري" },
  { code: "OMR", symbol: "ريال عماني", name_ar: "ريال عماني" },
  { code: "EGP", symbol: "جنيه مصري", name_ar: "جنيه مصري" },
  { code: "USD", symbol: "دولار أمريكي", name_ar: "دولار أمريكي" },
  { code: "EUR", symbol: "يورو", name_ar: "يورو" },
  { code: "GBP", symbol: "جنيه إسترليني", name_ar: "جنيه إسترليني" },
  { code: "MAD", symbol: "درهم مغربي", name_ar: "درهم مغربي" },
  { code: "TRY", symbol: "ليرة تركية", name_ar: "ليرة تركية" },
  { code: "MRU", symbol: "أوقية موريتانية", name_ar: "أوقية موريتانية" },
];

const DEFAULT_CURRENCY: CurrencyConfig = CURRENCIES[0]; // SAR

let cachedCurrency: CurrencyConfig | null = null;
let fetchPromise: Promise<CurrencyConfig> | null = null;

function fetchCurrency(): Promise<CurrencyConfig> {
  if (cachedCurrency) return Promise.resolve(cachedCurrency);
  if (fetchPromise) return fetchPromise;

  fetchPromise = (async () => {
    try {
      const { data } = await supabase
        .from("store_settings")
        .select("value")
        .eq("key", "store_info")
        .maybeSingle();
      const code = (data?.value as any)?.currency || "SAR";
      const found = CURRENCIES.find((c) => c.code === code) || DEFAULT_CURRENCY;
      cachedCurrency = found;
      return found;
    } catch {
      return DEFAULT_CURRENCY;
    }
  })();

  return fetchPromise;
}

/** Clear cache when currency is updated in settings */
export function invalidateCurrencyCache() {
  cachedCurrency = null;
  fetchPromise = null;
}

export function useCurrency() {
  const [currency, setCurrency] = useState<CurrencyConfig>(cachedCurrency || DEFAULT_CURRENCY);
  const [loading, setLoading] = useState(!cachedCurrency);

  useEffect(() => {
    fetchCurrency().then((c) => {
      setCurrency(c);
      setLoading(false);
    });
  }, []);

  return { currency, loading };
}
