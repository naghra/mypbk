import StoreHeader from "@/components/StoreHeader";
import StoreFooter from "@/components/StoreFooter";
import { usePageContent } from "@/hooks/usePageContent";
import { DEFAULT_ABOUT } from "@/lib/default-pages";
import logo from "@/assets/logo.png";
import { Loader2 } from "lucide-react";

const AboutUs = () => {
  const { content, loading } = usePageContent();
  const html = content?.about || DEFAULT_ABOUT;

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
          <div className="flex flex-col items-center text-center mb-10">
            <img src={logo} alt="ساكريكس | SAQRIX" className="h-20 mb-6" />
            <h1 className="text-2xl md:text-3xl font-bold text-store-primary mb-2">من نحن</h1>
          </div>
          <article
            className="space-y-6 text-store-primary leading-8 text-base md:text-lg [&>h3]:text-lg [&>h3]:font-bold [&>h3]:mt-6 [&>h3]:mb-3 [&>em]:text-accent [&>em]:font-bold [&>em]:text-lg [&>em]:block [&>em]:mt-8"
            dangerouslySetInnerHTML={{ __html: html.replace(/\n/g, "<br/>") }}
          />
        </div>
      </main>
      <StoreFooter />
    </div>
  );
};

export default AboutUs;
