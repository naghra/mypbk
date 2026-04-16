import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

interface PagesContent {
  about: string;
  privacy: string;
  return_policy: string;
  terms: string;
  faq: string;
  contact_email: string;
  contact_phone: string;
  contact_text: string;
}

export function usePageContent() {
  const [content, setContent] = useState<PagesContent | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from("store_settings")
        .select("value")
        .eq("key", "pages_content")
        .maybeSingle();
      if (data?.value) {
        setContent(data.value as any);
      }
      setLoading(false);
    })();
  }, []);

  return { content, loading };
}
