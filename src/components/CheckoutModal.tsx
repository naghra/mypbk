import React, { useState, useRef, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { X, ChevronDown } from "lucide-react";
import avatarMale from "@/assets/avatar_male.png";
import saqrixLogo from "@/assets/saqrix-logo.png";
import codIcon from "@/assets/cod-icon.png";
import paymentMethodIcon from "@/assets/payment-method-icon.png";
import shippingIcon from "@/assets/shipping-icon.svg";
import locationIcon from "@/assets/location-icon.svg";

interface CheckoutModalProps {
  open: boolean;
  onClose: () => void;
  totalAmount?: number;
  productId?: string;
  productName?: string;
  quantity?: number;
}

const CheckoutModal: React.FC<CheckoutModalProps> = ({ open, onClose, totalAmount = 222, productId, productName = "باقة المسك", quantity = 1 }) => {
  const navigate = useNavigate();
  const [shippingAddress, setShippingAddress] = useState("");
  const [errors, setErrors] = useState<{ address?: string }>({});
  const [submitting, setSubmitting] = useState(false);
  const [orderComplete, setOrderComplete] = useState(false);

  const firstName = localStorage.getItem("customer_first_name") || "";
  const lastName = localStorage.getItem("customer_last_name") || "";

  const sheetRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
      document.body.style.position = "fixed";
      document.body.style.width = "100%";
      document.body.style.top = `-${window.scrollY}px`;
      setErrors({});
      setOrderComplete(false);
    } else {
      const scrollY = document.body.style.top;
      document.body.style.overflow = "";
      document.body.style.position = "";
      document.body.style.width = "";
      document.body.style.top = "";
      window.scrollTo(0, parseInt(scrollY || "0") * -1);
    }
    return () => {
      document.body.style.overflow = "";
      document.body.style.position = "";
      document.body.style.width = "";
      document.body.style.top = "";
    };
  }, [open]);

  // Visual Viewport handler for keyboard
  useEffect(() => {
    if (!open) return;
    const vv = window.visualViewport;
    if (!vv) return;

    const update = () => {
      document.documentElement.style.setProperty("--vvh", `${vv.height}px`);
      if (sheetRef.current) {
        sheetRef.current.style.bottom = `${window.innerHeight - vv.height - vv.offsetTop}px`;
      }
    };

    const reset = () => {
      document.documentElement.style.setProperty("--vvh", "90dvh");
      if (sheetRef.current) {
        sheetRef.current.style.bottom = "0px";
      }
    };

    vv.addEventListener("resize", update);
    vv.addEventListener("scroll", update);
    return () => {
      vv.removeEventListener("resize", update);
      vv.removeEventListener("scroll", update);
      reset();
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const handleEsc = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", handleEsc);
    return () => window.removeEventListener("keydown", handleEsc);
  }, [open, onClose]);

  const handleSubmit = useCallback(async () => {
    const errs: typeof errors = {};
    if (!shippingAddress || shippingAddress.trim().length < 2) errs.address = "يرجى كتابة اسم المدينة (حرفين على الأقل)";
    setErrors(errs);
    if (Object.keys(errs).length > 0) return;
    if (submitting) return;
    setSubmitting(true);

    try {
      const email = localStorage.getItem("customer_email") || "";
      const phone = localStorage.getItem("customer_phone") || "";
      const customerName = `${firstName} ${lastName}`.trim() || "عميل";

      const { data: session } = await supabase.auth.getSession();
      const userId = session?.session?.user?.id || null;

      const unitPrice = totalAmount / quantity;

      const { data, error } = await supabase.functions.invoke("create-order", {
        body: {
          customer_name: customerName,
          customer_phone: phone,
          customer_email: email || null,
          city: shippingAddress.trim(),
          address: shippingAddress.trim(),
          payment_method: "cod",
          shipping_method: "standard",
          subtotal: totalAmount,
          shipping_cost: 0,
          total: totalAmount,
          user_id: userId,
          items: [{
            product_id: productId || null,
            product_name: productName,
            quantity,
            unit_price: unitPrice,
            total_price: totalAmount,
          }],
        },
      });

      if (error) throw error;
      if (!data?.success) throw new Error(data?.error || "Order creation failed");

      const orderId = data.order_id;

      onClose();
      const params = new URLSearchParams();
      params.set("order", orderId);
      if (email) params.set("email", encodeURIComponent(email));
      params.set("total", String(totalAmount));
      navigate(`/thank-you?${params.toString()}`);
    } catch (err) {
      console.error("Order creation failed:", err);
      setErrors({ address: "حدث خطأ أثناء إنشاء الطلب، حاول مرة أخرى" });
    } finally {
      setSubmitting(false);
    }
  }, [shippingAddress, totalAmount, firstName, lastName, onClose, navigate, submitting, productId, productName, quantity]);

  if (!open) return null;

  const customerName = `${firstName} ${lastName}`.trim() || "عميل";

  return (
    <div className="fixed inset-0 z-[100]" dir="rtl">
      {/* Overlay */}
      <div className="absolute inset-0 bg-black/60" onClick={onClose} />

      {/* Sheet */}
      <div
        ref={sheetRef}
        role="dialog"
        aria-modal="true"
        className="checkout-modal-sheet"
        style={{ animation: "checkout-slide-up 300ms ease-out forwards" }}
      >
        {/* ── Header ── */}
        <div className="px-5 pt-5 pb-4 border-b border-border flex-shrink-0" dir="rtl">
          <div className="flex items-center justify-between">
            {/* Right side: Avatar + Name */}
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-full overflow-hidden border-2 border-border flex-shrink-0">
                <img src={avatarMale} alt="الصورة الشخصية" className="w-full h-full object-cover" />
              </div>
              <div className="text-right">
                <p className="text-base font-bold text-foreground leading-relaxed">
                  مرحبًا، {customerName}
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">إتمام الدفع</p>
              </div>
            </div>

            {/* Left side: Close button */}
            <button
              onClick={onClose}
              className="text-muted-foreground hover:text-foreground transition-colors"
              aria-label="إغلاق"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* ── Scrollable Content ── */}
        <div className="flex-1 overflow-y-auto">
          {orderComplete ? (
            /* ── Success State ── */
            <div className="px-6 py-12 text-center space-y-4">
              <div className="w-16 h-16 rounded-full bg-accent/20 flex items-center justify-center mx-auto">
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="hsl(var(--primary))" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-foreground">تم تأكيد طلبك بنجاح!</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">سيتم التواصل معك لتأكيد موعد التوصيل</p>
              <p className="text-sm text-muted-foreground">طريقة الدفع: الدفع عند الاستلام</p>
              <button
                onClick={onClose}
                className="w-full h-12 bg-foreground text-background rounded-xl font-medium text-sm mt-4 hover:opacity-90 transition-opacity"
              >
                إغلاق
              </button>
            </div>
          ) : (
            <div className="px-5 pt-5 pb-28 space-y-6">
              {/* ── Total Summary ── */}
              <div className="bg-muted/40 rounded-xl p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-bold text-foreground">الإجمالي</p>
                  <p className="text-xl font-bold text-foreground" dir="rtl">
                    {totalAmount} ريال
                  </p>
                </div>
                <p className="text-xs text-primary cursor-pointer hover:underline text-start">لديك كوبون تخفيض؟</p>
                <button className="flex items-center justify-center gap-1.5 text-xs text-muted-foreground w-full pt-1">
                  <span>تفاصيل الفاتورة</span>
                  <ChevronDown className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* ── Shipping Address – City ── */}
              <div className="space-y-3">
                <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
                  <img src={locationIcon} alt="" className="w-5 h-5" />
                  <span>عنوان الشحن</span>
                </h3>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-foreground">المدينة</label>
                  <input
                    type="text"
                    value={shippingAddress}
                    onChange={(e) => { setShippingAddress(e.target.value); setErrors((er) => ({ ...er, address: undefined })); }}
                    placeholder="اكتب اسم المدينة"
                    autoComplete="off"
                    autoCorrect="off"
                    autoCapitalize="words"
                    spellCheck={false}
                    className="w-full h-12 rounded-xl border border-input bg-background px-4 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring/30 transition-shadow"
                  />
                  <p className="text-[11px] text-muted-foreground leading-relaxed">اكتب اسم المدينة يدويًا بدون اختيار من قائمة</p>
                  {errors.address && <p className="text-destructive text-xs font-medium">{errors.address}</p>}
                </div>
              </div>

              {/* ── Shipping Company – Saqrix Only ── */}
              <div className="space-y-3">
                <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
                  <img src={shippingIcon} alt="" className="w-5 h-5" />
                  <span>شركة الشحن</span>
                </h3>
                <div className="border-2 border-foreground rounded-xl px-4 py-3.5 flex items-center gap-3">
                  <div className="w-5 h-5 rounded-full border-2 border-foreground flex items-center justify-center flex-shrink-0">
                    <div className="w-2.5 h-2.5 rounded-full bg-foreground" />
                  </div>
                  <span className="text-sm font-medium text-foreground flex-1">شحن Saqrix (عادي)</span>
                  <img src={saqrixLogo} alt="Saqrix" className="w-7 h-7 object-contain flex-shrink-0" />
                </div>
              </div>

              {/* ── Payment Method – COD Only ── */}
              <div className="space-y-3">
                <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
                  <img src={paymentMethodIcon} alt="" className="w-5 h-5 object-contain" />
                  <span>طريقة الدفع</span>
                </h3>
                <div className="border-2 border-foreground rounded-xl px-4 py-3.5 flex items-center gap-3">
                  <div className="w-5 h-5 rounded-full border-2 border-foreground flex items-center justify-center flex-shrink-0">
                    <div className="w-2.5 h-2.5 rounded-full bg-foreground" />
                  </div>
                  <span className="text-sm font-medium text-foreground flex-1">الدفع عند الاستلام</span>
                  <img src={codIcon} alt="الدفع عند الاستلام" className="w-7 h-7 object-contain opacity-70 flex-shrink-0" />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* ── Sticky CTA ── */}
        {!orderComplete && (
          <div className="absolute bottom-0 inset-x-0 bg-background border-t border-border px-5 py-4 flex-shrink-0">
            <button
              onClick={handleSubmit}
              disabled={submitting}
              className="w-full h-12 bg-foreground text-background rounded-xl font-bold text-sm hover:opacity-90 transition-opacity disabled:opacity-50"
            >
              {submitting ? "جارٍ إنشاء الطلب..." : "إتمام الطلب"}
            </button>
          </div>
        )}
      </div>

      <style>{`
        @keyframes checkout-slide-up {
          from { transform: translateY(100%); }
          to { transform: translateY(0); }
        }
        .checkout-modal-sheet {
          position: fixed;
          left: 0;
          right: 0;
          bottom: 0;
          background: hsl(var(--background));
          border-top-left-radius: 1rem;
          border-top-right-radius: 1rem;
          max-height: var(--vvh, 90dvh);
          display: flex;
          flex-direction: column;
          box-shadow: 0 -10px 40px rgba(0,0,0,0.15);
          will-change: transform;
          padding-bottom: env(safe-area-inset-bottom);
        }
        .checkout-modal-sheet input,
        .checkout-modal-sheet textarea,
        .checkout-modal-sheet select {
          font-size: 16px !important;
        }
      `}</style>
    </div>
  );
};

export default CheckoutModal;
