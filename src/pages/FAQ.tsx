import StoreHeader from "@/components/StoreHeader";
import StoreFooter from "@/components/StoreFooter";
import { usePageContent } from "@/hooks/usePageContent";
import { DEFAULT_FAQ } from "@/lib/default-pages";
import { useState } from "react";
import { ChevronDown, Loader2 } from "lucide-react";

const FAQ = () => {
  const { content, loading } = usePageContent();
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  let faqs: { q: string; a: string }[] = [];
  try {
    const raw = content?.faq || DEFAULT_FAQ;
    faqs = JSON.parse(raw);
  } catch {
    faqs = [];
  }

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <StoreHeader />
        <div className="flex-1 flex items-center justify-center"><Loader2 className="w-6 h-6 animate-spin text-muted-foreground" /></div>
        <StoreFooter />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <StoreHeader />
      <main className="flex-1">
        <div className="container max-w-3xl py-12 px-4">
          <h1 className="text-2xl md:text-3xl font-bold text-store-primary mb-8 text-center">الأسئلة الشائعة</h1>
          <div className="space-y-3">
            {faqs.map((faq, i) => (
              <div key={i} className="border border-border rounded-lg overflow-hidden">
                <button
                  onClick={() => setOpenIndex(openIndex === i ? null : i)}
                  className="w-full flex items-center justify-between px-5 py-4 text-start text-store-primary font-medium text-sm hover:bg-secondary/50 transition-colors"
                >
                  <span>{faq.q}</span>
                  <ChevronDown className={`w-4 h-4 shrink-0 transition-transform ${openIndex === i ? "rotate-180" : ""}`} />
                </button>
                {openIndex === i && (
                  <div className="px-5 pb-4 text-sm text-muted-foreground leading-7">
                    {faq.a}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </main>
      <StoreFooter />
    </div>
  );
};

export default FAQ;
