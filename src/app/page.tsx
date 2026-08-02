"use client";

import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";
import { SiteHeader } from "@/components/layout/site-header";
import { Button } from "@/components/ui/button";
import { useI18n } from "@/components/providers/locale-provider";

const fade = {
  hidden: { opacity: 0, y: 18 },
  show: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: 0.12 * i, duration: 0.55, ease: [0.22, 1, 0.36, 1] as const },
  }),
};

export default function LandingPage() {
  const { t } = useI18n();

  return (
    <main>
      <SiteHeader />
      <section className="relative min-h-[100svh] overflow-hidden pattern-mesh">
        <div className="absolute inset-0">
          <Image
            src="https://images.unsplash.com/photo-1519817650392-5c07365fc6b2?auto=format&fit=crop&w=2000&q=80"
            alt=""
            fill
            priority
            className="object-cover"
            sizes="100vw"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-slate-950/75 via-slate-950/45 to-emerald-950/20" />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950/50 via-transparent to-slate-950/30" />
        </div>

        <div className="relative mx-auto flex min-h-[100svh] max-w-6xl flex-col justify-end px-4 pb-24 pt-28 sm:justify-center sm:px-6">
          <motion.p
            custom={0}
            variants={fade}
            initial="hidden"
            animate="show"
            className="font-display text-5xl font-semibold tracking-tight text-emerald-300 sm:text-7xl"
          >
            {t("brand")}
          </motion.p>
          <motion.h1
            custom={1}
            variants={fade}
            initial="hidden"
            animate="show"
            className="mt-4 max-w-2xl font-display text-3xl font-medium leading-tight text-white sm:text-5xl"
          >
            {t("landing.headline")}
          </motion.h1>
          <motion.p
            custom={2}
            variants={fade}
            initial="hidden"
            animate="show"
            className="mt-4 max-w-xl text-base leading-relaxed text-white/85 sm:text-lg"
          >
            {t("landing.sub")}
          </motion.p>
          <motion.div
            custom={3}
            variants={fade}
            initial="hidden"
            animate="show"
            className="mt-8 flex flex-wrap gap-3"
          >
            <Button asChild size="lg">
              <Link href="/register">{t("landing.cta")}</Link>
            </Button>
            <Button asChild size="lg" variant="soft">
              <Link href="/login">{t("landing.ctaSecondary")}</Link>
            </Button>
          </motion.div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-20 sm:px-6">
        <motion.h2
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="font-display text-3xl font-semibold text-emerald-800 dark:text-emerald-200 sm:text-4xl"
        >
          {t("landing.valuesTitle")}
        </motion.h2>
        <div className="mt-10 grid gap-10 md:grid-cols-3">
          {[
            ["value1Title", "value1Body"],
            ["value2Title", "value2Body"],
            ["value3Title", "value3Body"],
          ].map(([title, body], i) => (
            <motion.div
              key={title}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
            >
              <h3 className="font-display text-2xl font-semibold">{t(`landing.${title}`)}</h3>
              <p className="mt-3 text-sm leading-relaxed text-slate-600 dark:text-slate-300">
                {t(`landing.${body}`)}
              </p>
            </motion.div>
          ))}
        </div>
      </section>
    </main>
  );
}
