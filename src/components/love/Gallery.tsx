import { AnimatePresence, motion } from "motion/react";
import { ChevronLeft, ChevronRight, ImageIcon, X, ZoomIn } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { Reveal } from "./Reveal";
import { SectionTitle } from "./SectionTitle";
import { galeria } from "@/content/story";

export function Gallery() {
  const [index, setIndex] = useState<number | null>(null);
  const [zoom, setZoom] = useState(false);

  const close = useCallback(() => {
    setIndex(null);
    setZoom(false);
  }, []);
  const next = useCallback(
    () => setIndex((i) => (i === null ? i : (i + 1) % galeria.length)),
    [],
  );
  const prev = useCallback(
    () => setIndex((i) => (i === null ? i : (i - 1 + galeria.length) % galeria.length)),
    [],
  );

  useEffect(() => {
    if (index === null) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
      if (e.key === "ArrowRight") next();
      if (e.key === "ArrowLeft") prev();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [index, close, next, prev]);

  return (
    <section id="galeria" className="relative px-6 py-28 sm:py-36">
      <SectionTitle
        overline="Galeria"
        title="Momentos em imagens"
        subtitle="Cada foto aqui é um pedaço de nós."
      />

      <div className="mx-auto mt-16 grid max-w-5xl grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
        {galeria.map((foto, i) => (
          <Reveal key={foto.legenda} delay={i * 0.05} scale>
            <button
              onClick={() => setIndex(i)}
              className="group glass relative block aspect-[3/4] w-full overflow-hidden rounded-3xl transition-transform duration-500 hover:-translate-y-1.5"
            >
              {foto.src ? (
                <img
                  src={foto.src}
                  alt={foto.legenda}
                  loading="lazy"
                  decoding="async"
                  className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-110"
                />
              ) : (
                <span className="flex h-full w-full flex-col items-center justify-center gap-2 bg-secondary/25 text-muted-foreground transition-transform duration-700 group-hover:scale-105">
                  <ImageIcon className="h-6 w-6 text-primary/60" />
                  <span className="px-3 text-center text-[11px] tracking-wide">
                    Foto em breve
                  </span>
                </span>
              )}

              <span className="pointer-events-none absolute inset-x-0 bottom-0 flex items-center justify-between gap-2 bg-gradient-to-t from-ink/60 to-transparent p-3 opacity-0 transition-opacity duration-500 group-hover:opacity-100">
                <span className="truncate text-left text-[11px] text-primary-foreground">
                  {foto.legenda}
                </span>
                <ZoomIn className="h-3.5 w-3.5 shrink-0 text-primary-foreground" />
              </span>
            </button>
          </Reveal>
        ))}
      </div>

      <AnimatePresence>
        {index !== null && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[60] flex items-center justify-center p-4"
            style={{ background: "color-mix(in oklab, var(--ink) 78%, transparent)" }}
            onClick={close}
          >
            <button
              onClick={close}
              aria-label="Fechar"
              className="glass absolute right-4 top-4 grid h-10 w-10 place-items-center rounded-full"
            >
              <X className="h-4 w-4 text-foreground" />
            </button>

            <button
              onClick={(e) => {
                e.stopPropagation();
                prev();
              }}
              aria-label="Anterior"
              className="glass absolute left-3 grid h-11 w-11 place-items-center rounded-full sm:left-8"
            >
              <ChevronLeft className="h-5 w-5 text-foreground" />
            </button>

            <motion.figure
              key={index}
              initial={{ opacity: 0, scale: 0.94, filter: "blur(12px)" }}
              animate={{ opacity: 1, scale: 1, filter: "blur(0px)" }}
              exit={{ opacity: 0, scale: 0.96 }}
              transition={{ type: "spring", stiffness: 120, damping: 20 }}
              onClick={(e) => e.stopPropagation()}
              className="glass max-h-[82vh] w-full max-w-2xl overflow-hidden rounded-[2rem] p-3"
            >
              <div
                className="relative aspect-[4/5] w-full overflow-hidden rounded-[1.5rem] bg-secondary/30 sm:aspect-[4/3]"
                onClick={() => setZoom((z) => !z)}
              >
                {galeria[index].src ? (
                  <img
                    src={galeria[index].src}
                    alt={galeria[index].legenda}
                    className={`h-full w-full cursor-zoom-in object-cover transition-transform duration-500 ${
                      zoom ? "scale-150" : "scale-100"
                    }`}
                  />
                ) : (
                  <span className="flex h-full w-full flex-col items-center justify-center gap-3 text-muted-foreground">
                    <ImageIcon className="h-8 w-8 text-primary/60" />
                    <span className="text-xs">Espaço reservado para uma foto nossa</span>
                  </span>
                )}
              </div>
              <figcaption className="px-2 py-3 text-center font-display text-lg text-foreground">
                {galeria[index].legenda}
              </figcaption>
            </motion.figure>

            <button
              onClick={(e) => {
                e.stopPropagation();
                next();
              }}
              aria-label="Próxima"
              className="glass absolute right-3 grid h-11 w-11 place-items-center rounded-full sm:right-8"
            >
              <ChevronRight className="h-5 w-5 text-foreground" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}
