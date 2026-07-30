import { motion, useScroll, useTransform } from "motion/react";
import { ChevronDown, Heart } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { ParticleField } from "./ParticleField";
import { site } from "@/content/story";

export function Hero({ onStart }: { onStart: () => void }) {
  const ref = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end start"] });
  const y = useTransform(scrollYProgress, [0, 1], [0, 140]);
  const opacity = useTransform(scrollYProgress, [0, 0.8], [1, 0]);
  const scale = useTransform(scrollYProgress, [0, 1], [1, 1.08]);

  const [pointer, setPointer] = useState({ x: 0, y: 0 });
  useEffect(() => {
    const onMove = (e: PointerEvent) => {
      setPointer({
        x: (e.clientX / window.innerWidth - 0.5) * 2,
        y: (e.clientY / window.innerHeight - 0.5) * 2,
      });
    };
    window.addEventListener("pointermove", onMove);
    return () => window.removeEventListener("pointermove", onMove);
  }, []);

  return (
    <section
      ref={ref}
      className="relative flex min-h-[100svh] items-center justify-center overflow-hidden px-6"
    >
      <motion.div
        aria-hidden
        style={{ scale }}
        className="animate-gradient-pan absolute inset-0"
      >
        <div
          className="absolute inset-0"
          style={{ background: "var(--gradient-dawn)" }}
        />
        <motion.div
          className="absolute -left-24 top-[-10%] h-[70vmin] w-[70vmin] rounded-full blur-3xl"
          style={{
            background:
              "radial-gradient(circle, color-mix(in oklab, var(--color-primary) 40%, transparent), transparent 70%)",
            x: pointer.x * -30,
            y: pointer.y * -30,
          }}
        />
        <motion.div
          className="absolute -right-32 bottom-[-15%] h-[80vmin] w-[80vmin] rounded-full blur-3xl"
          style={{
            background:
              "radial-gradient(circle, color-mix(in oklab, var(--color-lavender) 45%, transparent), transparent 70%)",
            x: pointer.x * 40,
            y: pointer.y * 40,
          }}
        />
        <motion.div
          className="absolute left-1/2 top-1/3 h-[45vmin] w-[45vmin] -translate-x-1/2 rounded-full blur-3xl"
          style={{
            background:
              "radial-gradient(circle, color-mix(in oklab, var(--color-gold) 22%, transparent), transparent 70%)",
            x: pointer.x * 18,
            y: pointer.y * 18,
          }}
        />
      </motion.div>

      <ParticleField count={26} />

      <motion.div style={{ y, opacity }} className="relative z-10 max-w-3xl text-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 1, ease: "easeOut" }}
          className="mx-auto mb-8 inline-flex items-center gap-2 rounded-full px-4 py-2 text-xs tracking-[0.28em] uppercase glass-soft text-muted-foreground"
        >
          <Heart className="h-3.5 w-3.5 fill-primary text-primary" />
          Feito com amor
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 40, filter: "blur(18px)" }}
          animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
          transition={{ duration: 1.3, delay: 0.15, ease: [0.22, 1, 0.36, 1] }}
          className="font-display text-balance text-[clamp(2.4rem,7vw,5rem)] leading-[1.05] font-light text-foreground"
        >
          {site.heroTitulo}{" "}
          <span className="text-gradient font-medium">❤</span>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, delay: 0.5 }}
          className="mx-auto mt-7 max-w-xl text-pretty text-base leading-relaxed text-muted-foreground sm:text-lg"
        >
          {site.heroSubtitulo}
        </motion.p>

        <motion.button
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.8 }}
          whileHover={{ scale: 1.04 }}
          whileTap={{ scale: 0.97 }}
          onClick={onStart}
          className="group relative mt-11 inline-flex items-center gap-3 rounded-full px-9 py-4 text-sm font-medium tracking-wide text-primary-foreground"
          style={{
            backgroundImage: "var(--gradient-romance)",
            boxShadow: "var(--shadow-glow)",
          }}
        >
          {site.heroBotao}
          <ChevronDown className="h-4 w-4 transition-transform duration-300 group-hover:translate-y-1" />
        </motion.button>
      </motion.div>

      <motion.div
        aria-hidden
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.6 }}
        className="absolute bottom-8 left-1/2 z-10 -translate-x-1/2"
      >
        <div className="animate-floaty h-10 w-6 rounded-full border border-primary/30 p-1.5">
          <div className="h-2 w-full rounded-full bg-primary/60" />
        </div>
      </motion.div>
    </section>
  );
}
