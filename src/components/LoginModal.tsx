import React, { useState, useRef, useEffect, useCallback } from "react";
import { X, ChevronDown } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

/* ─── Constants ─── */
const MAX_RESENDS = 3;
const RESEND_WINDOW_MS = 15 * 60 * 1000; // 15 minutes
const OTP_DIGITS = 8;

/* ─── Resend Rate-Limiter (client-side) ─── */
function getResendState(email: string) {
  const key = `otp_resend_${email}`;
  try {
    const raw = sessionStorage.getItem(key);
    if (!raw) return { attempts: 0, windowStart: Date.now() };
    const state = JSON.parse(raw);
    if (Date.now() - state.windowStart > RESEND_WINDOW_MS) {
      return { attempts: 0, windowStart: Date.now() };
    }
    return state;
  } catch {
    return { attempts: 0, windowStart: Date.now() };
  }
}

function recordResend(email: string) {
  const state = getResendState(email);
  state.attempts += 1;
  if (state.attempts === 1) state.windowStart = Date.now();
  sessionStorage.setItem(`otp_resend_${email}`, JSON.stringify(state));
}

function canResend(email: string): boolean {
  return getResendState(email).attempts < MAX_RESENDS;
}

/* ─── Email Step ─── */
interface EmailStepProps {
  onSubmit: (email: string) => void;
  loading: boolean;
  error: string;
}

const EmailStep: React.FC<EmailStepProps> = ({ onSubmit, loading, error: externalError }) => {
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setTimeout(() => inputRef.current?.focus(), 350);
  }, []);

  const displayError = externalError || error;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = email.trim();
    if (!trimmed) {
      setError("يرجى إدخال البريد الإلكتروني");
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) {
      setError("يرجى إدخال بريد إلكتروني صحيح");
      return;
    }
    setError("");
    onSubmit(trimmed);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <label className="block text-sm font-medium text-foreground text-right">
        البريد الإلكتروني
      </label>
      <input
        ref={inputRef}
        type="email"
        dir="ltr"
        placeholder="your@email.com"
        value={email}
        onChange={(e) => { setEmail(e.target.value); if (error) setError(""); }}
        className="w-full h-11 rounded-lg border border-gray-300 px-3 text-sm text-left placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-foreground/20 focus:border-foreground/40 transition bg-white"
      />
      {displayError && <p className="text-red-500 text-xs text-right">{displayError}</p>}
      <button
        type="submit"
        disabled={loading}
        className="w-full h-11 bg-foreground text-background rounded-lg font-medium text-sm hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {loading ? "جاري الإرسال..." : "دخول"}
      </button>
    </form>
  );
};

/* ─── OTP Step ─── */
interface OtpStepProps {
  email: string;
  onVerified: () => void;
  onBack: () => void;
}

const OtpStep: React.FC<OtpStepProps> = ({ email, onVerified, onBack }) => {
  const [otp, setOtp] = useState<string[]>(Array(OTP_DIGITS).fill(""));
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [countdown, setCountdown] = useState(60);
  const [resendDisabled, setResendDisabled] = useState(false);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    setTimeout(() => inputRefs.current[0]?.focus(), 100);
  }, []);

  useEffect(() => {
    if (countdown <= 0) return;
    const timer = setInterval(() => setCountdown((c) => c - 1), 1000);
    return () => clearInterval(timer);
  }, [countdown]);

  const handleChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return;
    const next = [...otp];
    if (value.length > 1) {
      const digits = value.replace(/\D/g, "").slice(0, OTP_DIGITS).split("");
      digits.forEach((d, i) => { if (i < OTP_DIGITS) next[i] = d; });
      setOtp(next);
      const focusIdx = Math.min(digits.length, OTP_DIGITS - 1);
      inputRefs.current[focusIdx]?.focus();
    } else {
      next[index] = value;
      setOtp(next);
      if (value && index < OTP_DIGITS - 1) inputRefs.current[index + 1]?.focus();
    }
    if (error) setError("");
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, OTP_DIGITS);
    if (pasted) {
      const next = [...otp];
      pasted.split("").forEach((d, i) => { if (i < OTP_DIGITS) next[i] = d; });
      setOtp(next);
      inputRefs.current[Math.min(pasted.length, OTP_DIGITS - 1)]?.focus();
    }
  };

  const isFilled = otp.every((d) => d !== "");

  const handleVerify = async () => {
    if (!isFilled) {
      setError("أدخل رمز التحقق بالكامل");
      return;
    }
    setLoading(true);
    setError("");
    const code = otp.join("");

    try {
      const { error: verifyError } = await supabase.auth.verifyOtp({
        email,
        token: code,
        type: "email",
      });

      if (verifyError) {
        if (verifyError.message.includes("expired")) {
          setError("انتهت صلاحية رمز التحقق. يرجى طلب رمز جديد.");
        } else {
          setError("رمز التحقق غير صحيح");
        }
        setOtp(Array(OTP_DIGITS).fill(""));
        inputRefs.current[0]?.focus();
      } else {
        onVerified();
      }
    } catch {
      setError("حدث خطأ. يرجى المحاولة مرة أخرى.");
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (countdown > 0 || resendDisabled) return;

    if (!canResend(email)) {
      setError("لقد تجاوزت الحد الأقصى لمحاولات الإرسال. يرجى المحاولة لاحقاً.");
      setResendDisabled(true);
      return;
    }

    try {
      const { error: sendError } = await supabase.auth.signInWithOtp({ email });
      if (sendError) {
        setError("فشل إعادة إرسال الرمز. يرجى المحاولة لاحقاً.");
      } else {
        recordResend(email);
        setCountdown(60);
        setOtp(Array(OTP_DIGITS).fill(""));
        inputRefs.current[0]?.focus();
      }
    } catch {
      setError("حدث خطأ. يرجى المحاولة لاحقاً.");
    }
  };

  const formatTime = (s: number) => {
    const mins = Math.floor(s / 60).toString().padStart(2, "0");
    const secs = (s % 60).toString().padStart(2, "0");
    return `${mins} : ${secs}`;
  };

  const resendState = getResendState(email);
  const remainingAttempts = MAX_RESENDS - resendState.attempts;

  return (
    <div className="space-y-5">
      <button
        onClick={onBack}
        className="absolute top-4 right-4 w-10 h-10 rounded-full border border-gray-300 flex items-center justify-center hover:bg-gray-50 transition"
        aria-label="رجوع"
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M9 18l6-6-6-6" />
        </svg>
      </button>

      <p className="text-sm text-gray-500 text-center leading-relaxed">
        رقم التحقق مطلوب لإكمال العملية
        <br />
        لقد تم إرسال رمز التحقق إلى بريدك الإلكتروني
      </p>
      <p className="text-sm font-bold text-foreground text-center" dir="ltr">{email}</p>

      <div className="flex justify-center gap-2" dir="ltr" onPaste={handlePaste}>
        {otp.map((digit, i) => (
          <input
            key={i}
            ref={(el) => { inputRefs.current[i] = el; }}
            type="text"
            inputMode="numeric"
            maxLength={OTP_DIGITS}
            value={digit}
            onChange={(e) => handleChange(i, e.target.value)}
            onKeyDown={(e) => handleKeyDown(i, e)}
            aria-label={`رقم ${i + 1} من ${OTP_DIGITS}`}
            className="w-12 h-14 text-center text-xl font-semibold border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-foreground/30 focus:border-foreground/50 transition bg-white"
          />
        ))}
      </div>
      {error && <p className="text-red-500 text-xs text-center">{error}</p>}

      <p className="text-xs text-gray-400 text-center">
        ⚠️ ينتهي الرمز خلال 10 دقائق ويمكن استخدامه لمرة واحدة فقط
      </p>

      <button
        onClick={handleVerify}
        disabled={!isFilled || loading}
        className="w-full h-12 bg-foreground text-background rounded-lg font-medium text-sm hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {loading ? "جاري التحقق..." : "تحقق"}
      </button>

      <p className="text-sm text-gray-500 text-center">
        {countdown > 0 ? (
          <>يمكنك إعادة الإرسال بعد {formatTime(countdown)}</>
        ) : resendDisabled ? (
          <span className="text-red-400 text-xs">تم تجاوز الحد الأقصى للمحاولات</span>
        ) : (
          <button onClick={handleResend} className="text-foreground font-medium underline">
            إعادة الإرسال {remainingAttempts < MAX_RESENDS && `(${remainingAttempts} محاولات متبقية)`}
          </button>
        )}
      </p>
    </div>
  );
};

/* ─── Registration Step ─── */
const COUNTRY_CODES = [
  { code: "+966", label: "🇸🇦 +966" },
  { code: "+971", label: "🇦🇪 +971" },
  { code: "+973", label: "🇧🇭 +973" },
  { code: "+965", label: "🇰🇼 +965" },
  { code: "+968", label: "🇴🇲 +968" },
  { code: "+974", label: "🇶🇦 +974" },
  { code: "+962", label: "🇯🇴 +962" },
  { code: "+20", label: "🇪🇬 +20" },
];

interface RegistrationStepProps {
  email: string;
  onComplete: (data: { firstName: string; lastName: string; phone: string; countryCode: string }) => void;
}

const RegistrationStep: React.FC<RegistrationStepProps> = ({ email, onComplete }) => {
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [phone, setPhone] = useState("");
  const [countryCode, setCountryCode] = useState("+966");
  const [showCodes, setShowCodes] = useState(false);
  const [errors, setErrors] = useState<{ firstName?: string; lastName?: string; phone?: string }>({});
  const [touched, setTouched] = useState<{ firstName?: boolean; lastName?: boolean; phone?: boolean }>({});
  const [saving, setSaving] = useState(false);
  const firstNameRef = useRef<HTMLInputElement>(null);
  const codeRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setTimeout(() => firstNameRef.current?.focus(), 100);
  }, []);

  useEffect(() => {
    if (!showCodes) return;
    const handler = (e: MouseEvent) => {
      if (codeRef.current && !codeRef.current.contains(e.target as Node)) {
        setShowCodes(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [showCodes]);

  const validate = useCallback(() => {
    const e: typeof errors = {};
    if (!firstName.trim()) e.firstName = "يرجى إدخال الاسم الأول";
    if (!lastName.trim()) e.lastName = "يرجى إدخال الاسم الأخير";
    const digits = phone.replace(/\D/g, "");
    if (!digits) {
      e.phone = "يرجى إدخال رقم الجوال";
    } else if (digits.length < 9) {
      e.phone = "رقم الجوال يجب أن يكون 9 أرقام على الأقل";
    }
    return e;
  }, [firstName, lastName, phone]);

  const currentErrors = validate();
  const isValid = Object.keys(currentErrors).length === 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setTouched({ firstName: true, lastName: true, phone: true });
    const errs = validate();
    setErrors(errs);
    if (Object.keys(errs).length > 0) return;

    const cleanPhone = phone.replace(/\D/g, "");
    setSaving(true);

    try {
      // Save profile to Supabase
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        await supabase.from("profiles").update({
          first_name: firstName.trim(),
          last_name: lastName.trim(),
          phone: cleanPhone,
          country_code: countryCode,
        }).eq("user_id", user.id);
      }

      // Also keep in localStorage for checkout flow
      localStorage.setItem("customer_first_name", firstName.trim());
      localStorage.setItem("customer_last_name", lastName.trim());
      localStorage.setItem("customer_phone", cleanPhone);
      localStorage.setItem("customer_country_code", countryCode);

      onComplete({ firstName: firstName.trim(), lastName: lastName.trim(), phone: cleanPhone, countryCode });
    } catch {
      // Fallback to localStorage only
      localStorage.setItem("customer_first_name", firstName.trim());
      localStorage.setItem("customer_last_name", lastName.trim());
      localStorage.setItem("customer_phone", cleanPhone);
      localStorage.setItem("customer_country_code", countryCode);
      onComplete({ firstName: firstName.trim(), lastName: lastName.trim(), phone: cleanPhone, countryCode });
    } finally {
      setSaving(false);
    }
  };

  const handleBlur = (field: keyof typeof touched) => {
    setTouched((t) => ({ ...t, [field]: true }));
    setErrors(validate());
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* First Name */}
      <div>
        <label className="block text-sm font-medium text-foreground text-right mb-1.5">اسمك الكريم</label>
        <input
          ref={firstNameRef}
          type="text"
          placeholder="الاسم الأول"
          value={firstName}
          onChange={(e) => { setFirstName(e.target.value); if (errors.firstName) setErrors((er) => ({ ...er, firstName: undefined })); }}
          onBlur={() => handleBlur("firstName")}
          className="w-full h-11 rounded-lg border border-gray-300 px-3 text-sm text-right placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-foreground/20 focus:border-foreground/40 transition bg-white"
        />
        {touched.firstName && currentErrors.firstName && (
          <p className="text-red-500 text-xs text-right mt-1">{currentErrors.firstName}</p>
        )}
      </div>

      {/* Last Name */}
      <div>
        <label className="block text-sm font-medium text-foreground text-right mb-1.5">الاسم الأخير</label>
        <input
          type="text"
          placeholder="الاسم الأخير"
          value={lastName}
          onChange={(e) => { setLastName(e.target.value); if (errors.lastName) setErrors((er) => ({ ...er, lastName: undefined })); }}
          onBlur={() => handleBlur("lastName")}
          className="w-full h-11 rounded-lg border border-gray-300 px-3 text-sm text-right placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-foreground/20 focus:border-foreground/40 transition bg-white"
        />
        {touched.lastName && currentErrors.lastName && (
          <p className="text-red-500 text-xs text-right mt-1">{currentErrors.lastName}</p>
        )}
      </div>

      {/* Phone */}
      <div>
        <label className="block text-sm font-medium text-foreground text-right mb-1.5">رقم الجوال</label>
        <div className="flex gap-0 rounded-lg border border-gray-300 overflow-hidden bg-white">
          <input
            type="tel"
            dir="ltr"
            inputMode="numeric"
            placeholder="051 234 5678"
            value={phone}
            onChange={(e) => {
              const val = e.target.value.replace(/[^\d\s]/g, "");
              setPhone(val);
              if (errors.phone) setErrors((er) => ({ ...er, phone: undefined }));
            }}
            onBlur={() => handleBlur("phone")}
            className="flex-1 h-11 px-3 text-sm text-left placeholder:text-gray-400 focus:outline-none bg-transparent border-none"
          />
          <div ref={codeRef} className="relative">
            <button
              type="button"
              onClick={() => setShowCodes(!showCodes)}
              className="h-11 px-3 flex items-center gap-1 text-sm font-medium text-foreground border-l border-gray-300 hover:bg-gray-50 transition whitespace-nowrap"
            >
              <ChevronDown className="w-3.5 h-3.5 text-gray-400" />
              <span>{countryCode}</span>
            </button>
            {showCodes && (
              <div className="absolute bottom-full right-0 mb-1 w-36 bg-white border border-gray-200 rounded-lg shadow-lg z-10 max-h-48 overflow-y-auto">
                {COUNTRY_CODES.map((cc) => (
                  <button
                    key={cc.code}
                    type="button"
                    onClick={() => { setCountryCode(cc.code); setShowCodes(false); }}
                    className={`w-full text-left px-3 py-2 text-sm hover:bg-gray-100 transition ${countryCode === cc.code ? "bg-gray-50 font-medium" : ""}`}
                  >
                    {cc.label}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
        {touched.phone && currentErrors.phone && (
          <p className="text-red-500 text-xs text-right mt-1">{currentErrors.phone}</p>
        )}
      </div>

      {/* Submit */}
      <button
        type="submit"
        disabled={!isValid || saving}
        className="w-full h-12 bg-foreground text-background rounded-lg font-medium text-sm hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {saving ? "جاري الحفظ..." : "التسجيل"}
      </button>
    </form>
  );
};

/* ─── Helper ─── */
async function hasProfile(): Promise<boolean> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return false;
    const { data } = await supabase.from("profiles").select("first_name, last_name, phone").eq("user_id", user.id).single();
    return !!(data?.first_name && data?.last_name && data?.phone);
  } catch {
    // Fallback to localStorage
    return !!(
      localStorage.getItem("customer_first_name") &&
      localStorage.getItem("customer_last_name") &&
      localStorage.getItem("customer_phone")
    );
  }
}

/* ─── Login Modal Shell ─── */
interface LoginModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess: (email: string) => void;
}

type Step = "email" | "otp" | "register";

const LoginModal: React.FC<LoginModalProps> = ({ open, onClose, onSuccess }) => {
  const [step, setStep] = useState<Step>("email");
  const [email, setEmail] = useState("");
  const [emailLoading, setEmailLoading] = useState(false);
  const [emailError, setEmailError] = useState("");
  const sheetRef = useRef<HTMLDivElement>(null);

  // Lock body scroll & setup visual viewport tracking
  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
      document.body.style.position = "fixed";
      document.body.style.width = "100%";
      document.body.style.top = `-${window.scrollY}px`;
      setStep("email");
      setEmail("");
      setEmailLoading(false);
      setEmailError("");
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
      const kb = Math.max(0, window.innerHeight - vv.height - vv.offsetTop);
      document.documentElement.style.setProperty("--kb", `${kb}px`);
      document.documentElement.style.setProperty("--vvh", `${vv.height}px`);
    };

    const reset = () => {
      document.documentElement.style.setProperty("--kb", "0px");
      document.documentElement.style.setProperty("--vvh", "90dvh");
    };

    vv.addEventListener("resize", update);
    vv.addEventListener("scroll", update);
    return () => {
      vv.removeEventListener("resize", update);
      vv.removeEventListener("scroll", update);
      reset();
    };
  }, [open]);

  // Scroll focused input into view when keyboard opens
  useEffect(() => {
    if (!open) return;
    const handleFocusIn = (e: FocusEvent) => {
      const target = e.target as HTMLElement;
      if (target?.tagName && ["INPUT", "TEXTAREA", "SELECT"].includes(target.tagName)) {
        setTimeout(() => {
          target.scrollIntoView({ block: "center", behavior: "smooth" });
        }, 300);
      }
    };
    document.addEventListener("focusin", handleFocusIn);
    return () => document.removeEventListener("focusin", handleFocusIn);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const handleEsc = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", handleEsc);
    return () => window.removeEventListener("keydown", handleEsc);
  }, [open, onClose]);

  const handleEmailSubmit = useCallback(async (submittedEmail: string) => {
    setEmailLoading(true);
    setEmailError("");

    try {
      const { error } = await supabase.auth.signInWithOtp({
        email: submittedEmail,
      });

      if (error) {
        if (error.message.includes("rate") || error.message.includes("limit")) {
          setEmailError("تم تجاوز عدد المحاولات. يرجى الانتظار قليلاً.");
        } else {
          setEmailError("حدث خطأ في إرسال رمز التحقق. يرجى المحاولة لاحقاً.");
        }
        return;
      }

      setEmail(submittedEmail);
      localStorage.setItem("customer_email", submittedEmail);
      recordResend(submittedEmail);
      setStep("otp");
    } catch {
      setEmailError("حدث خطأ غير متوقع. يرجى المحاولة لاحقاً.");
    } finally {
      setEmailLoading(false);
    }
  }, []);

  const handleOtpVerified = useCallback(async () => {
    // Check if profile exists in DB
    const profileExists = await hasProfile();
    if (profileExists) {
      // Load profile data to localStorage for checkout
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          const { data } = await supabase.from("profiles").select("*").eq("user_id", user.id).single();
          if (data?.first_name) {
            localStorage.setItem("customer_first_name", data.first_name);
            localStorage.setItem("customer_last_name", data.last_name || "");
            localStorage.setItem("customer_phone", data.phone || "");
            localStorage.setItem("customer_country_code", data.country_code || "+966");
          }
        }
      } catch { /* continue */ }
      onSuccess(email);
    } else {
      setStep("register");
    }
  }, [email, onSuccess]);

  const handleRegistrationComplete = useCallback((_data: { firstName: string; lastName: string; phone: string; countryCode: string }) => {
    onSuccess(email);
  }, [email, onSuccess]);

  const handleBack = useCallback(() => {
    if (step === "otp") setStep("email");
    else if (step === "register") setStep("otp");
  }, [step]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[100]" dir="rtl">
      <div className="absolute inset-0 bg-black/60" onClick={onClose} />
      <div
        ref={sheetRef}
        role="dialog"
        aria-modal="true"
        className="login-modal-sheet"
        style={{ animation: "login-slide-up 300ms ease-out forwards" }}
      >
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 left-4 text-red-500 hover:text-red-600 transition-colors"
          aria-label="إغلاق"
        >
          <X className="w-6 h-6" />
        </button>

        {/* Back button (OTP & Register steps) */}
        {(step === "otp" || step === "register") && (
          <button
            onClick={handleBack}
            className="absolute top-4 right-4 w-10 h-10 rounded-full border border-gray-300 flex items-center justify-center hover:bg-gray-50 transition"
            aria-label="رجوع"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 18l6-6-6-6" />
            </svg>
          </button>
        )}

        {/* User icon */}
        <div className="flex justify-center mb-4">
          <div className="w-16 h-16 rounded-full bg-white border-2 border-gray-300 flex items-center justify-center">
            <svg width="28" height="28" viewBox="0 0 32 32" fill="#9ca3af" xmlns="http://www.w3.org/2000/svg">
              <path d="M16 16c4.412 0 8-3.588 8-8s-3.588-8-8-8-8 3.588-8 8 3.588 8 8 8zM16 2.667c2.941 0 5.333 2.392 5.333 5.333s-2.392 5.333-5.333 5.333-5.333-2.392-5.333-5.333 2.392-5.333 5.333-5.333zM16 18.667c-7.476 0-13.333 3.66-13.333 8.333v3.667c0 0.736 0.597 1.333 1.333 1.333s1.333-0.597 1.333-1.333v-3.667c0-3.019 4.984-5.667 10.667-5.667s10.667 2.648 10.667 5.667v3.667c0 0.736 0.597 1.333 1.333 1.333s1.333-0.597 1.333-1.333v-3.667c0-4.673-5.857-8.333-13.333-8.333z"/>
            </svg>
          </div>
        </div>

        {/* Title */}
        <h2 className="text-center text-lg font-bold text-foreground mb-5">تسجيل الدخول</h2>

        {step === "email" && <EmailStep onSubmit={handleEmailSubmit} loading={emailLoading} error={emailError} />}
        {step === "otp" && <OtpStep email={email} onVerified={handleOtpVerified} onBack={handleBack} />}
        {step === "register" && <RegistrationStep email={email} onComplete={handleRegistrationComplete} />}
      </div>

      <style>{`
        @keyframes login-slide-up {
          from { transform: translateY(100%); }
          to { transform: translateY(0); }
        }
        .login-modal-sheet {
          position: fixed;
          left: 0;
          right: 0;
          bottom: var(--kb, 0px);
          background: white;
          border-top-left-radius: 1rem;
          border-top-right-radius: 1rem;
          padding: 1.25rem 1.5rem 2rem;
          max-height: calc(var(--vvh, 90dvh));
          overflow-y: auto;
          -webkit-overflow-scrolling: touch;
          padding-bottom: calc(2rem + env(safe-area-inset-bottom) + var(--kb, 0px));
          will-change: transform, bottom;
          transition: bottom 0.15s ease-out;
        }
        .login-modal-sheet input,
        .login-modal-sheet textarea,
        .login-modal-sheet select {
          font-size: 16px !important;
        }
      `}</style>
    </div>
  );
};

export default LoginModal;
