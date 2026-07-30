import { motion } from "motion/react";
import { useEffect, useMemo, useState } from "react";
import { final } from "@/content/story";

export function FinalSurprise() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const hearts = useMemo(
    () =>
      Array.from({ length: 18 }, (_, i) => ({
        left: (i * 53) % 100,
        size: 10 + Math.random() * 22,
        duration: 12 + Math.random() * 14,
        delay: -Math.random() * 20,
        opacity: 0.2 + Math.random() * 0.5,
      })),
    [],
  );

  return (
    <section
      id="surpresa"
      className="relative flex min-h-[100svh] items-center justify-center overflow-hidden px-6"
      style={{
        background:
          "radial-gradient(120% 90% at 50% 110%, oklch(0.42 0.12 350), oklch(0.227 0.041 346.9) 60%, oklch(0.18 0.035 320))",
      }}
    >
      <div
        aria-hidden
        className="animate-shimmer absolute left-1/2 top-1/2 h-[70vmin] w-[70vmin] -translate-x-1/2 -translate-y-1/2 rounded-full blur-3xl"
        style={{
          background:
            "radial-gradient(circle, color-mix(in oklab, var(--color-primary) 55%, transparent), transparent 70%)",
        }}
      />

      {mounted && (
        <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
          {hearts.map((h, i) => (
            <svg
              key={i}
              viewBox="0 0 24 24"
              className="animate-rise absolute bottom-[-12vh] fill-secondary"
              style={{
                left: `${h.left}%`,
                width: h.size,
                height: h.size,
                opacity: h.opacity,
                animationDuration: `${h.duration}s`,
                animationDelay: `${h.delay}s`,
              }}
            >
              <path d="M12 21s-7.5-4.6-9.6-9A5.4 5.4 0 0 1 12 6.5 5.4 5.4 0 0 1 21.6 12c-2.1 4.4-9.6 9-9.6 9Z" />
            </svg>
          ))}
          {Array.from({ length: 26 }).map((_, i) => (
            <span
              key={`s-${i}`}
              className="animate-shimmer absolute h-[3px] w-[3px] rounded-full bg-gold"
              style={{
                left: `${(i * 37) % 100}%`,
                top: `${(i * 61) % 100}%`,
                animationDelay: `${i * 0.28}s`,
              }}
            />
          ))}
        </div>
      )}

      <motion.div
        initial={{ opacity: 0, y: 60, filter: "blur(20px)" }}
        whileInView={{ opacity: 1, y: 0, filter: "blur(0px)" }}
        viewport={{ once: true, margin: "-20%" }}
        transition={{ duration: 1.4, ease: [0.22, 1, 0.36, 1] }}
        className="relative z-10 max-w-3xl text-center"
      >
        <h2 className="font-display text-balance text-[clamp(2.2rem,6.5vw,4.5rem)] font-light leading-[1.08] text-secondary">
          {final.titulo}
        </h2>
        <motion.p
          initial={{ opacity: 0, scale: 0.94 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ delay: 0.8, duration: 1.2, type: "spring", stiffness: 70 }}
          className="font-display mt-8 text-[clamp(1.5rem,4vw,2.6rem)] font-medium text-primary"
          style={{ textShadow: "0 0 40px color-mix(in oklab, var(--primary) 60%, transparent)" }}
        >
          {final.subtitulo}
        </motion.p>
      </motion.div>
    </section>
  );
}
