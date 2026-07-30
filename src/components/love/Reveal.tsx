import { motion, useInView, type Variants } from "motion/react";
import { useRef, type ReactNode } from "react";

type Props = {
  children: ReactNode;
  delay?: number;
  y?: number;
  blur?: boolean;
  scale?: boolean;
  className?: string;
  once?: boolean;
};

export function Reveal({
  children,
  delay = 0,
  y = 32,
  blur = true,
  scale = false,
  className,
  once = true,
}: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once, margin: "-12% 0px -12% 0px" });

  const variants: Variants = {
    hidden: {
      opacity: 0,
      y,
      scale: scale ? 0.94 : 1,
      filter: blur ? "blur(14px)" : "blur(0px)",
    },
    show: {
      opacity: 1,
      y: 0,
      scale: 1,
      filter: "blur(0px)",
      transition: {
        type: "spring",
        stiffness: 90,
        damping: 20,
        mass: 0.8,
        delay,
      },
    },
  };

  return (
    <motion.div
      ref={ref}
      variants={variants}
      initial="hidden"
      animate={inView ? "show" : "hidden"}
      className={className}
    >
      {children}
    </motion.div>
  );
}
