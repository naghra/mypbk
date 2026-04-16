import StoreHeader from "@/components/StoreHeader";
import StoreFooter from "@/components/StoreFooter";
import { usePageContent } from "@/hooks/usePageContent";
import { DEFAULT_RETURN_POLICY } from "@/lib/default-pages";
import { Loader2 } from "lucide-react";

const ReturnPolicy = () => {
  const { content, loading } = usePageContent();
  const html = content?.return_policy || DEFAULT_RETURN_POLICY;

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
          <h1 className="text-2xl md:text-3xl font-bold text-store-primary mb-8 text-center">سياسة الاستبدال والاسترجاع والتوصيل</h1>
          <article
            className="space-y-4 text-store-primary leading-8 text-base [&>h3]:text-lg [&>h3]:font-bold [&>h3]:mt-6 [&>h3]:mb-2 [&>h2]:text-xl [&>h2]:font-bold [&>h2]:text-center [&>h2]:mt-8 [&>hr]:border-border [&>hr]:my-6"
            dangerouslySetInnerHTML={{ __html: html.replace(/\n/g, "<br/>") }}
          />
        </div>
      </main>
      <StoreFooter />
    </div>
  );
};

export default ReturnPolicy;
