import { useInView } from "motion/react";
import { useEffect, useRef, useState } from "react";
import { carta } from "@/content/story";
import { SectionTitle } from "./SectionTitle";
import { Reveal } from "./Reveal";

function useTypewriter(text: string, active: boolean, speed = 22) {
  const [out, setOut] = useState("");
  useEffect(() => {
    if (!active) return;
    let i = 0;
    const id = setInterval(() => {
      i += 1;
      setOut(text.slice(0, i));
      if (i >= text.length) clearInterval(id);
    }, speed);
    return () => clearInterval(id);
  }, [text, active, speed]);
  return out;
}

export function Letter() {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-20% 0px" });
  const typed = useTypewriter(carta.texto, inView);
  const done = typed.length >= carta.texto.length;

  return (
    <section id="carta" className="relative px-6 py-28 sm:py-36">
      <SectionTitle overline="Escrito à mão" title={carta.titulo} />

      <Reveal className="mx-auto mt-14 max-w-2xl">
        <article
          ref={ref}
          className="glass relative overflow-hidden rounded-[2.2rem] px-7 py-10 sm:px-12 sm:py-14"
        >
          <span
            aria-hidden
            className="absolute inset-x-0 top-0 h-px"
            style={{ backgroundImage: "var(--gradient-romance)" }}
          />
          <p className="font-display text-2xl text-primary">{carta.saudacao}</p>

          <div className="mt-6 min-h-[14rem]">
            <p className="font-display whitespace-pre-line text-lg leading-[1.9] text-foreground/90 sm:text-xl">
              {typed}
              {!done && <span className="ml-0.5 inline-block animate-shimmer">|</span>}
            </p>
          </div>

          <p className="mt-10 text-sm text-muted-foreground">{carta.assinatura}</p>
          <p className="font-display mt-1 text-2xl text-gradient">Sempre seu ❤</p>
        </article>
      </Reveal>
    </section>
  );
}
