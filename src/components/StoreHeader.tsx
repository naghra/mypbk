import { useState, useEffect, useRef } from "react";
import { Search, User, ShoppingCart, Menu, X, ChevronDown, Globe, Package } from "lucide-react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { AnimatePresence, motion } from "framer-motion";
import logo from "@/assets/logo.png";

type SearchProduct = {
  id: string;
  slug: string | null;
  name_ar: string;
  price: number;
  images: { url: string; is_main: boolean }[];
};

interface FooterLink {
  id: string;
  label: string;
  href: string;
  enabled: boolean;
}

const defaultLinks: FooterLink[] = [
  { id: "1", label: "من نحن", href: "/about", enabled: true },
  { id: "2", label: "سياسة الخصوصية", href: "/privacy", enabled: true },
  { id: "3", label: "سياسة الاستبدال والاسترجاع و التوصيل", href: "/return-policy", enabled: true },
  { id: "4", label: "البنود والقوانين", href: "/terms", enabled: true },
  { id: "5", label: "الاسئلة الشائعه", href: "/faq", enabled: true },
  { id: "6", label: "اتصل بنا", href: "/contact", enabled: true },
];

const StoreHeader = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [openSubmenu, setOpenSubmenu] = useState<string | null>(null);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<SearchProduct[]>([]);
  const [searching, setSearching] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const [menuItems, setMenuItems] = useState<{ label: string; href: string }[]>([]);

  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from("store_settings")
        .select("value")
        .eq("key", "footer_links")
        .maybeSingle();
      if (data?.value) {
        const v = data.value as any;
        if (Array.isArray(v.links)) {
          setMenuItems(v.links.filter((l: FooterLink) => l.enabled && l.label).map((l: FooterLink) => ({ label: l.label, href: l.href })));
        } else {
          setMenuItems(defaultLinks.filter(l => l.enabled).map(l => ({ label: l.label, href: l.href })));
        }
      } else {
        setMenuItems(defaultLinks.filter(l => l.enabled).map(l => ({ label: l.label, href: l.href })));
      }
    })();
  }, []);

  useEffect(() => {
    if (searchOpen) {
      setTimeout(() => searchInputRef.current?.focus(), 100);
    } else {
      setSearchQuery("");
      setSearchResults([]);
    }
  }, [searchOpen]);

  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      return;
    }
    const timeout = setTimeout(async () => {
      setSearching(true);
      const { data } = await supabase
        .from("products")
        .select("id, slug, name_ar, price, product_images(url, is_main)")
        .eq("status", "active")
        .ilike("name_ar", `%${searchQuery}%`)
        .limit(8);
      if (data) {
        setSearchResults(data.map((p: any) => ({ ...p, images: p.product_images || [] })));
      }
      setSearching(false);
    }, 300);
    return () => clearTimeout(timeout);
  }, [searchQuery]);

  return (
    <header className="bg-background sticky top-0 z-50 shadow-sm">
      {/* Top navbar */}
      <div className="border-b border-border">
        <div className="container flex justify-between items-center py-2 text-sm">
          <button className="flex items-center gap-1 text-store-secondary hover:text-store-primary transition-colors">
            <Globe className="w-4 h-4" />
            <span>العربية</span>
            <ChevronDown className="w-3 h-3" />
          </button>
          <Link to="/contact" className="text-store-secondary text-xs hover:text-store-primary transition-colors">
            تواصل معنا
          </Link>
        </div>
      </div>

      {/* Main nav - Mobile */}
      <div className="lg:hidden">
        <div className="container flex items-center justify-between py-3">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="text-store-primary"
              aria-label="القائمة"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
            <button className="text-store-primary" aria-label="تسجيل الدخول">
              <User className="w-5 h-5" />
            </button>
          </div>
          <a href="/" className="flex items-center justify-center">
            <img src={logo} alt="ساكريكس | SAQRIX" className="h-12" />
          </a>
          <div className="flex items-center gap-3">
            <button className="text-store-primary" aria-label="بحث" onClick={() => setSearchOpen(true)}>
              <Search className="w-5 h-5" />
            </button>
            <button className="text-store-primary relative" aria-label="سلة التسوق">
              <ShoppingCart className="w-5 h-5" />
              <span className="absolute -top-1.5 -left-1.5 bg-primary text-primary-foreground text-[10px] w-4 h-4 rounded-full flex items-center justify-center">0</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main nav - Desktop */}
      <div className="hidden lg:block">
        <div className="container flex items-center justify-between py-3">
          <div className="flex items-center gap-6">
            <a href="/" className="shrink-0">
              <img src={logo} alt="ساكريكس | SAQRIX" className="h-12" />
            </a>
            <nav>
              <ul className="flex items-center gap-5 text-sm">
                {menuItems.map((item) => (
                  <li key={item.label}>
                    <Link
                      to={item.href}
                      className="text-store-primary hover:text-accent transition-colors py-4 inline-flex items-center"
                    >
                      {item.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
          </div>
          <div className="flex items-center gap-4">
            <button className="text-store-primary hover:text-accent transition-colors" aria-label="بحث" onClick={() => setSearchOpen(true)}>
              <Search className="w-5 h-5" />
            </button>
            <button className="text-store-primary hover:text-accent transition-colors" aria-label="تسجيل الدخول">
              <User className="w-5 h-5" />
            </button>
            <button className="text-store-primary relative hover:text-accent transition-colors" aria-label="سلة التسوق">
              <ShoppingCart className="w-5 h-5" />
              <span className="absolute -top-1.5 -left-1.5 bg-primary text-primary-foreground text-[10px] w-4 h-4 rounded-full flex items-center justify-center">0</span>
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="lg:hidden fixed inset-0 top-[110px] bg-background z-40 overflow-y-auto">
          <ul className="container py-4">
            {menuItems.map((item) => (
              <li key={item.label} className="border-b border-border">
                <Link to={item.href} onClick={() => setMobileMenuOpen(false)} className="block py-3 text-sm font-bold text-store-primary">
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Search Overlay */}
      <AnimatePresence>
        {searchOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-[100] bg-foreground/50 backdrop-blur-sm"
            onClick={() => setSearchOpen(false)}
          >
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.25 }}
              className="bg-background w-full max-w-2xl mx-auto mt-20 rounded-2xl shadow-2xl overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center gap-3 px-5 py-4 border-b border-border">
                <Search className="w-5 h-5 text-muted-foreground shrink-0" />
                <input
                  ref={searchInputRef}
                  type="text"
                  placeholder="ابحث عن منتج..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="flex-1 bg-transparent text-foreground text-base outline-none placeholder:text-muted-foreground"
                  dir="rtl"
                />
                <button onClick={() => setSearchOpen(false)} className="text-muted-foreground hover:text-foreground">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="max-h-[60vh] overflow-y-auto">
                {searching && (
                  <div className="py-8 text-center text-muted-foreground text-sm">جاري البحث...</div>
                )}
                {!searching && searchQuery.trim() && searchResults.length === 0 && (
                  <div className="py-8 text-center text-muted-foreground text-sm flex flex-col items-center gap-2">
                    <Package className="w-10 h-10 text-muted-foreground/30" />
                    لا توجد نتائج
                  </div>
                )}
                {searchResults.map((product) => {
                  const thumb = product.images.find(i => i.is_main)?.url || product.images[0]?.url;
                  const link = `/product/${product.slug || product.id}`;
                  return (
                    <Link
                      key={product.id}
                      to={link}
                      onClick={() => setSearchOpen(false)}
                      className="flex items-center gap-4 px-5 py-3 hover:bg-muted/50 transition-colors"
                    >
                      <div className="w-14 h-14 rounded-xl bg-muted/30 overflow-hidden shrink-0">
                        {thumb ? (
                          <img src={thumb} alt={product.name_ar} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <Package className="w-6 h-6 text-muted-foreground/30" />
                          </div>
                        )}
                      </div>
                      <div className="flex-1 text-right">
                        <p className="text-sm font-bold text-foreground">{product.name_ar}</p>
                        <p className="text-sm text-muted-foreground">{product.price.toLocaleString("en-US")} ر.س</p>
                      </div>
                    </Link>
                  );
                })}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
};

export default StoreHeader;
