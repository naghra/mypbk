import StoreHeader from "@/components/StoreHeader";
import StoreFooter from "@/components/StoreFooter";
import { usePageContent } from "@/hooks/usePageContent";
import { DEFAULT_CONTACT_EMAIL, DEFAULT_CONTACT_PHONE, DEFAULT_CONTACT_TEXT } from "@/lib/default-pages";
import { Mail, Clock, Loader2 } from "lucide-react";

const Contact = () => {
  const { content, loading } = usePageContent();

  const email = content?.contact_email || DEFAULT_CONTACT_EMAIL;
  const phone = content?.contact_phone || DEFAULT_CONTACT_PHONE;
  const text = content?.contact_text || DEFAULT_CONTACT_TEXT;

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
          <h1 className="text-2xl md:text-3xl font-bold text-store-primary mb-8 text-center">اتصل بنا</h1>
          <article className="space-y-8 text-store-primary leading-8 text-base">
            <p>{text}</p>

            {email && (
              <div className="flex items-start gap-3">
                <Mail className="w-5 h-5 mt-1 text-accent shrink-0" />
                <div>
                  <h2 className="font-bold mb-1">البريد الإلكتروني</h2>
                  <a href={`mailto:${email}`} className="text-accent hover:underline" dir="ltr">{email}</a>
                </div>
              </div>
            )}

            {phone && (
              <div className="flex items-start gap-3">
                <Mail className="w-5 h-5 mt-1 text-accent shrink-0" />
                <div>
                  <h2 className="font-bold mb-1">الهاتف</h2>
                  <a href={`tel:${phone}`} className="text-accent hover:underline" dir="ltr">{phone}</a>
                </div>
              </div>
            )}

            <div className="flex items-start gap-3">
              <Clock className="w-5 h-5 mt-1 text-accent shrink-0" />
              <div>
                <h2 className="font-bold mb-1">أوقات العمل</h2>
                <p>من الأحد إلى الخميس</p>
                <p>من الساعة 9:00 صباحًا حتى 6:00 مساءً</p>
              </div>
            </div>

            <p className="text-muted-foreground">نسعى للرد على جميع الرسائل خلال 24 ساعة عمل.</p>
            <p className="text-accent font-bold text-lg mt-8">Saqrix — حضور يتكلم عنك.</p>
          </article>
        </div>
      </main>
      <StoreFooter />
    </div>
  );
};

export default Contact;
