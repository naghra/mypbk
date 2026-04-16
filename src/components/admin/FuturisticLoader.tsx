import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Skeleton } from "@/components/ui/skeleton";

const LOADING_MESSAGES = [
  "جارٍ تهيئة النظام...",
  "تحميل البيانات...",
  "تحليل الإحصائيات...",
  "شبه جاهز...",
];

// --- Orbital Ring ---
function OrbitalRing({ size, duration, delay, color }: { size: number; duration: number; delay: number; color: string }) {
  return (
    <motion.div
      className="absolute rounded-full border"
      style={{
        width: size,
        height: size,
        borderColor: "transparent",
        borderTopColor: color,
        borderRightColor: color,
      }}
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{
        opacity: [0, 0.6, 0.3, 0.6],
        scale: 1,
        rotate: 360,
      }}
      transition={{
        rotate: { duration, repeat: Infinity, ease: "linear", delay },
        opacity: { duration: 2, repeat: Infinity, ease: "easeInOut", delay },
        scale: { duration: 0.6, delay },
      }}
    />
  );
}

// --- Particle ---
function Particle({ index }: { index: number }) {
  const angle = (index / 12) * 360;
  const radius = 90 + Math.random() * 30;
  const size = 2 + Math.random() * 2;
  const duration = 2 + Math.random() * 2;

  return (
    <motion.div
      className="absolute rounded-full"
      style={{
        width: size,
        height: size,
        background: `hsl(${220 + index * 10} 80% 70%)`,
        boxShadow: `0 0 ${size * 3}px hsl(${220 + index * 10} 80% 60%)`,
      }}
      initial={{ opacity: 0 }}
      animate={{
        opacity: [0, 1, 0],
        x: [0, Math.cos((angle * Math.PI) / 180) * radius],
        y: [0, Math.sin((angle * Math.PI) / 180) * radius],
      }}
      transition={{
        duration,
        repeat: Infinity,
        delay: index * 0.15,
        ease: "easeOut",
      }}
    />
  );
}

// --- Core Symbol ---
function CoreSymbol() {
  return (
    <motion.div className="relative w-20 h-20 flex items-center justify-center">
      {/* Outer glow */}
      <motion.div
        className="absolute inset-0 rounded-full"
        style={{
          background: "radial-gradient(circle, hsla(230,80%,65%,0.3) 0%, transparent 70%)",
        }}
        animate={{ scale: [1, 1.4, 1], opacity: [0.5, 0.2, 0.5] }}
        transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
      />
      {/* Inner core */}
      <motion.div
        className="relative w-12 h-12 rounded-xl flex items-center justify-center"
        style={{
          background: "linear-gradient(135deg, hsl(230 80% 55%), hsl(270 70% 60%))",
          boxShadow: "0 0 30px hsla(230,80%,55%,0.5), 0 0 60px hsla(270,70%,60%,0.2)",
        }}
        animate={{ rotate: [0, 90, 180, 270, 360] }}
        transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
      >
        <motion.div
          className="w-5 h-5 rounded-md"
          style={{ background: "linear-gradient(135deg, hsl(200 90% 70%), hsl(240 80% 80%))" }}
          animate={{ scale: [1, 0.7, 1], rotate: [0, -180, -360] }}
          transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
        />
      </motion.div>
    </motion.div>
  );
}

// --- Scanning Line ---
function ScanLine() {
  return (
    <motion.div
      className="absolute left-0 right-0 h-px"
      style={{
        background: "linear-gradient(90deg, transparent, hsl(230 80% 65%), transparent)",
        boxShadow: "0 0 10px hsl(230 80% 65%), 0 0 20px hsla(230,80%,65%,0.3)",
      }}
      initial={{ top: "0%" }}
      animate={{ top: ["0%", "100%", "0%"] }}
      transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
    />
  );
}

// --- Circular Progress ---
function CircularProgress({ progress }: { progress: number }) {
  const radius = 52;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (progress / 100) * circumference;

  return (
    <svg width="120" height="120" className="absolute">
      {/* Track */}
      <circle
        cx="60" cy="60" r={radius}
        fill="none" strokeWidth="1.5"
        stroke="hsla(230,40%,30%,0.3)"
      />
      {/* Progress */}
      <motion.circle
        cx="60" cy="60" r={radius}
        fill="none" strokeWidth="2"
        stroke="url(#progressGrad)"
        strokeLinecap="round"
        strokeDasharray={circumference}
        strokeDashoffset={offset}
        transform="rotate(-90 60 60)"
        style={{ filter: "drop-shadow(0 0 6px hsla(230,80%,65%,0.6))" }}
      />
      <defs>
        <linearGradient id="progressGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="hsl(230 80% 65%)" />
          <stop offset="100%" stopColor="hsl(280 70% 60%)" />
        </linearGradient>
      </defs>
    </svg>
  );
}

// --- Full-screen Futuristic Loader ---
export function FuturisticFullLoader({ onComplete }: { onComplete: () => void }) {
  const [progress, setProgress] = useState(0);
  const [msgIndex, setMsgIndex] = useState(0);
  const [exiting, setExiting] = useState(false);

  useEffect(() => {
    const iv = setInterval(() => {
      setProgress((p) => {
        if (p >= 100) {
          clearInterval(iv);
          return 100;
        }
        // Accelerating progress curve
        const increment = p < 30 ? 4 : p < 70 ? 3 : p < 90 ? 2 : 1;
        return Math.min(p + increment, 100);
      });
    }, 50);
    return () => clearInterval(iv);
  }, []);

  useEffect(() => {
    if (progress < 25) setMsgIndex(0);
    else if (progress < 55) setMsgIndex(1);
    else if (progress < 85) setMsgIndex(2);
    else setMsgIndex(3);
  }, [progress]);

  useEffect(() => {
    if (progress >= 100 && !exiting) {
      const t = setTimeout(() => setExiting(true), 300);
      return () => clearTimeout(t);
    }
  }, [progress, exiting]);

  useEffect(() => {
    if (exiting) {
      const t = setTimeout(onComplete, 600);
      return () => clearTimeout(t);
    }
  }, [exiting, onComplete]);

  return (
    <motion.div
      className="fixed inset-0 z-[9999] flex items-center justify-center overflow-hidden"
      style={{ background: "linear-gradient(135deg, hsl(230 15% 6%), hsl(250 20% 10%), hsl(220 15% 8%))" }}
      animate={exiting ? { opacity: 0, scale: 1.05 } : { opacity: 1, scale: 1 }}
      transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
    >
      {/* Background mesh gradient */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <motion.div
          className="absolute w-[600px] h-[600px] rounded-full"
          style={{
            background: "radial-gradient(circle, hsla(230,60%,40%,0.08) 0%, transparent 70%)",
            top: "20%", left: "10%",
          }}
          animate={{ x: [0, 40, 0], y: [0, -30, 0] }}
          transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div
          className="absolute w-[500px] h-[500px] rounded-full"
          style={{
            background: "radial-gradient(circle, hsla(270,50%,40%,0.06) 0%, transparent 70%)",
            bottom: "10%", right: "10%",
          }}
          animate={{ x: [0, -30, 0], y: [0, 20, 0] }}
          transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
        />
      </div>

      {/* Scanning line */}
      <ScanLine />

      {/* Center content */}
      <div className="relative flex flex-col items-center gap-6">
        {/* Orbital system */}
        <div className="relative w-[120px] h-[120px] flex items-center justify-center">
          <CircularProgress progress={progress} />
          <OrbitalRing size={140} duration={6} delay={0} color="hsla(230,70%,60%,0.25)" />
          <OrbitalRing size={170} duration={8} delay={0.3} color="hsla(270,60%,55%,0.15)" />

          {/* Particles */}
          {Array.from({ length: 12 }).map((_, i) => (
            <Particle key={i} index={i} />
          ))}

          <CoreSymbol />
        </div>

        {/* Progress text */}
        <motion.div
          className="text-center"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <motion.p
            className="text-2xl font-bold mb-2"
            style={{
              background: "linear-gradient(135deg, hsl(220 80% 75%), hsl(260 70% 75%))",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
            }}
          >
            {progress}%
          </motion.p>

          <AnimatePresence mode="wait">
            <motion.p
              key={msgIndex}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.3 }}
              className="text-sm"
              style={{ color: "hsla(220,30%,70%,0.7)" }}
            >
              {LOADING_MESSAGES[msgIndex]}
            </motion.p>
          </AnimatePresence>
        </motion.div>
      </div>

      {/* Bottom line accent */}
      <motion.div
        className="absolute bottom-0 left-0 right-0 h-px"
        style={{
          background: "linear-gradient(90deg, transparent, hsl(230 80% 55%), hsl(270 70% 55%), transparent)",
        }}
        animate={{ opacity: [0.3, 0.7, 0.3] }}
        transition={{ duration: 2, repeat: Infinity }}
      />
    </motion.div>
  );
}

// --- Futuristic Skeleton Cards ---
export function FuturisticSkeleton() {
  return (
    <motion.div
      className="space-y-6 max-w-6xl mx-auto"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      {/* Header skeleton */}
      <div className="space-y-2">
        <Skeleton className="h-8 w-48 bg-muted/60" />
        <Skeleton className="h-4 w-64 bg-muted/40" />
      </div>

      {/* Stat cards skeleton with shimmer */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[0, 1, 2, 3].map((i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1, duration: 0.4 }}
            className="relative overflow-hidden rounded-2xl border border-border/30 bg-card/60 backdrop-blur-sm p-5 h-32"
          >
            <div className="space-y-3">
              <Skeleton className="h-11 w-11 rounded-xl bg-muted/50" />
              <Skeleton className="h-3 w-20 bg-muted/40" />
              <Skeleton className="h-6 w-28 bg-muted/50" />
            </div>
            {/* Shimmer overlay */}
            <motion.div
              className="absolute inset-0 pointer-events-none"
              style={{
                background: "linear-gradient(90deg, transparent 0%, hsla(230,40%,80%,0.04) 50%, transparent 100%)",
              }}
              animate={{ x: ["-100%", "200%"] }}
              transition={{ duration: 1.8, repeat: Infinity, delay: i * 0.15, ease: "easeInOut" }}
            />
          </motion.div>
        ))}
      </div>

      {/* Chart skeletons */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {[0, 1].map((i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 + i * 0.1, duration: 0.4 }}
            className={`relative overflow-hidden rounded-2xl border border-border/30 bg-card/60 backdrop-blur-sm p-5 h-40 ${i === 1 ? "lg:col-span-2" : ""}`}
          >
            <Skeleton className="h-4 w-32 mb-4 bg-muted/40" />
            <Skeleton className="h-24 w-full bg-muted/30 rounded-xl" />
            <motion.div
              className="absolute inset-0 pointer-events-none"
              style={{
                background: "linear-gradient(90deg, transparent 0%, hsla(230,40%,80%,0.04) 50%, transparent 100%)",
              }}
              animate={{ x: ["-100%", "200%"] }}
              transition={{ duration: 2, repeat: Infinity, delay: 0.6 + i * 0.15, ease: "easeInOut" }}
            />
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
}
