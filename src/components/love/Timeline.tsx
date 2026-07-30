import { motion, useScroll, useTransform } from "motion/react";
import { useRef } from "react";
import { Reveal } from "./Reveal";
import { SectionTitle } from "./SectionTitle";
import { timeline } from "@/content/story";

export function Timeline() {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start 70%", "end 60%"],
  });
  const lineScale = useTransform(scrollYProgress, [0, 1], [0, 1]);

  return (
    <section id="nossa-historia" className="relative px-6 py-28 sm:py-36">
      <SectionTitle overline="Linha do tempo" title="Nossa história" />

      <div ref={ref} className="relative mx-auto mt-16 max-w-3xl">
        <div className="absolute left-[15px] top-0 h-full w-px bg-border sm:left-1/2" />
        <motion.div
          style={{ scaleY: lineScale }}
          className="absolute left-[15px] top-0 h-full w-px origin-top sm:left-1/2"
          aria-hidden
        >
          <div
            className="h-full w-full"
            style={{ backgroundImage: "var(--gradient-romance)" }}
          />
        </motion.div>

        <ol className="space-y-12">
          {timeline.map((item, i) => (
            <li
              key={item.titulo}
              className={`relative pl-12 sm:w-1/2 sm:pl-0 ${
                i % 2 === 0 ? "sm:pr-12 sm:text-right" : "sm:ml-auto sm:pl-12"
              }`}
            >
              <Reveal
                delay={0.05}
                y={40}
                scale
                className=""
              >
                <span
                  aria-hidden
                  className={`absolute left-0 top-6 grid h-8 w-8 place-items-center rounded-full glass sm:top-7 ${
                    i % 2 === 0 ? "sm:-right-4 sm:left-auto" : "sm:-left-4"
                  }`}
                >
                  <span
                    className="h-2.5 w-2.5 rounded-full"
                    style={{ backgroundImage: "var(--gradient-romance)" }}
                  />
                </span>

                <article className="glass rounded-3xl p-6 transition-transform duration-500 hover:-translate-y-1 sm:p-7">
                  <p className="text-[11px] uppercase tracking-[0.22em] text-primary">
                    {item.data}
                  </p>
                  <h3 className="font-display mt-2 text-2xl font-medium text-foreground">
                    {item.titulo}
                  </h3>
                  <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                    {item.texto}
                  </p>
                </article>
              </Reveal>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
