import { motion, useScroll, useTransform } from "motion/react";
import { useRef } from "react";

export function Quote({ text, index = 0 }: { text: string; index?: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start end", "end start"],
  });
  const y = useTransform(scrollYProgress, [0, 1], [60, -60]);
  const opacity = useTransform(scrollYProgress, [0, 0.4, 0.6, 1], [0, 1, 1, 0]);
  const blur = useTransform(scrollYProgress, [0, 0.4, 0.6, 1], [10, 0, 0, 10]);
  const filter = useTransform(blur, (b) => `blur(${b}px)`);

  return (
    <div ref={ref} className="relative px-6 py-16 sm:py-24">
      <motion.blockquote
        style={{ y, opacity, filter }}
        className="mx-auto max-w-2xl text-center"
      >
        <p className="font-display text-balance text-[clamp(1.5rem,3.6vw,2.4rem)] font-light italic leading-snug text-foreground/85">
          “{text}”
        </p>
        <span
          aria-hidden
          className="mx-auto mt-6 block h-1.5 w-1.5 rotate-45 rounded-[2px]"
          style={{
            backgroundImage: "var(--gradient-romance)",
            animationDelay: `${index * 0.3}s`,
          }}
        />
      </motion.blockquote>
    </div>
  );
}
