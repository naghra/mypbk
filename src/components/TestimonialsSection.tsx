import { useState, useEffect, useRef, useCallback } from "react";
import { Star, Quote } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import avatar1 from "@/assets/testimonial-1.jpg";
import avatar2 from "@/assets/testimonial-2.jpg";
import avatar3 from "@/assets/testimonial-3.jpg";
import avatar4 from "@/assets/testimonial-4.jpg";
import avatar5 from "@/assets/testimonial-5.jpg";

const testimonials = [
  {
    name: "علي الخرمي",
    text: "منتجات رائعة وجودة عالية، التوصيل كان سريع جداً والتغليف ممتاز. أنصح الجميع بالتجربة!",
    rating: 5,
    avatar: avatar1,
  },
  {
    name: "سارة المالكي",
    text: "تجربة شراء مميزة من البداية للنهاية. المنتج طابق الوصف تماماً وخدمة العملاء ممتازة.",
    rating: 5,
    avatar: avatar2,
  },
  {
    name: "محمد العتيبي",
    text: "أفضل متجر تعاملت معه، الأسعار مناسبة والمنتجات أصلية. راح أكرر الطلب بإذن الله.",
    rating: 4,
    avatar: avatar3,
  },
  {
    name: "نورة الشمري",
    text: "طلبت كهدية وكانت التجربة رائعة، التغليف فاخر والمنتج وصل بحالة ممتازة.",
    rating: 5,
    avatar: avatar4,
  },
  {
    name: "خالد الدوسري",
    text: "سرعة في التوصيل وجودة ممتازة. المنتج فاق توقعاتي بصراحة!",
    rating: 5,
    avatar: avatar5,
  },
];

function TestimonialCard({ t }: { t: typeof testimonials[0] }) {
  return (
    <div className="relative bg-card border border-border rounded-2xl p-6 md:p-8 shadow-sm">
      <Quote className="w-8 h-8 text-muted-foreground/15 absolute top-5 right-5" />
      <Quote className="w-8 h-8 text-muted-foreground/15 absolute top-5 left-5 scale-x-[-1]" />
      <p className="text-sm md:text-base text-foreground/80 leading-7 mt-6 mb-8 min-h-[60px]">
        {t.text}
      </p>
      <div className="flex items-center gap-3 justify-end">
        <div className="text-right">
          <p className="font-bold text-foreground text-sm">{t.name}</p>
          <div className="flex gap-0.5 mt-1 justify-end">
            {[...Array(5)].map((_, i) => (
              <Star
                key={i}
                className={`w-4 h-4 ${
                  i < t.rating ? "fill-amber-400 text-amber-400" : "text-muted-foreground/20"
                }`}
              />
            ))}
          </div>
        </div>
        <img
          src={t.avatar}
          alt={t.name}
          className="w-12 h-12 rounded-full object-cover border-2 border-border"
        />
      </div>
    </div>
  );
}

export default function TestimonialsSection() {
  const [current, setCurrent] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval>>();

  const next = useCallback(() => {
    setCurrent((prev) => (prev + 1) % testimonials.length);
  }, []);

  useEffect(() => {
    timerRef.current = setInterval(next, 4000);
    return () => clearInterval(timerRef.current);
  }, [next]);

  return (
    <section className="py-12 md:py-20">
      <div className="text-center mb-10">
        <h2 className="text-2xl md:text-4xl font-black text-foreground mb-4">آراء العملاء</h2>
        <div className="flex items-center justify-center gap-3">
          <div className="h-[2px] w-16 md:w-24 bg-foreground/20" />
          <div className="w-3 h-3 rounded-full border-2 border-foreground/30" />
          <div className="h-[2px] w-16 md:w-24 bg-foreground/20" />
        </div>
      </div>

      <div className="container overflow-hidden">
        <div className="md:hidden relative">
          <AnimatePresence mode="wait">
            <motion.div
              key={current}
              initial={{ opacity: 0, x: -60 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 60 }}
              transition={{ duration: 0.4 }}
            >
              <TestimonialCard t={testimonials[current]} />
            </motion.div>
          </AnimatePresence>
          <div className="flex justify-center gap-2 mt-6">
            {testimonials.map((_, i) => (
              <button
                key={i}
                onClick={() => setCurrent(i)}
                className={`w-2 h-2 rounded-full transition-all duration-300 ${
                  i === current ? "bg-foreground w-5" : "bg-foreground/20"
                }`}
              />
            ))}
          </div>
        </div>

        <div className="hidden md:block relative">
          <AnimatePresence mode="wait">
            <motion.div
              key={current}
              initial={{ opacity: 0, x: -40 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 40 }}
              transition={{ duration: 0.4 }}
              className="grid grid-cols-3 gap-6"
            >
              {[0, 1, 2].map((offset) => {
                const idx = (current + offset) % testimonials.length;
                return <TestimonialCard key={idx} t={testimonials[idx]} />;
              })}
            </motion.div>
          </AnimatePresence>
          <div className="flex justify-center gap-2 mt-8">
            {testimonials.map((_, i) => (
              <button
                key={i}
                onClick={() => setCurrent(i)}
                className={`w-2 h-2 rounded-full transition-all duration-300 ${
                  i === current ? "bg-foreground w-5" : "bg-foreground/20"
                }`}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
