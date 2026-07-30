import { ImageIcon } from "lucide-react";
import { momentos } from "@/content/story";
import { SectionTitle } from "./SectionTitle";
import { Reveal } from "./Reveal";

export function Moments() {
  return (
    <section id="momentos" className="relative px-6 py-28 sm:py-36">
      <SectionTitle
        overline="Guardados para sempre"
        title="Momentos especiais"
        subtitle="Pequenas cenas que eu repito na cabeça sempre que sinto sua falta."
      />

      <div className="mx-auto mt-16 grid max-w-5xl gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {momentos.map((m, i) => (
          <Reveal key={m.titulo} delay={i * 0.1} y={44} scale>
            <article className="glass group h-full overflow-hidden rounded-[1.8rem] transition-transform duration-500 hover:-translate-y-2">
              <div className="relative aspect-[16/10] w-full overflow-hidden bg-secondary/25">
                {m.src ? (
                  <img
                    src={m.src}
                    alt={m.titulo}
                    loading="lazy"
                    decoding="async"
                    className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-110"
                  />
                ) : (
                  <span className="flex h-full w-full items-center justify-center">
                    <ImageIcon className="h-6 w-6 text-primary/50" />
                  </span>
                )}
              </div>
              <div className="p-6">
                <p className="text-[11px] uppercase tracking-[0.22em] text-primary">
                  {m.data}
                </p>
                <h3 className="font-display mt-2 text-2xl font-medium text-foreground">
                  {m.titulo}
                </h3>
                <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                  {m.descricao}
                </p>
              </div>
            </article>
          </Reveal>
        ))}
      </div>
    </section>
  );
}
