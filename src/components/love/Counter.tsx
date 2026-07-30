import { useEffect, useState } from "react";
import { inicioDoNamoro } from "@/content/story";
import { SectionTitle } from "./SectionTitle";
import { Reveal } from "./Reveal";

function diff(from: Date) {
  const ms = Math.max(0, Date.now() - from.getTime());
  const s = Math.floor(ms / 1000);
  return {
    dias: Math.floor(s / 86400),
    horas: Math.floor((s % 86400) / 3600),
    minutos: Math.floor((s % 3600) / 60),
    segundos: s % 60,
  };
}

export function Counter() {
  const start = new Date(inicioDoNamoro);
  const [t, setT] = useState<ReturnType<typeof diff> | null>(null);

  useEffect(() => {
    setT(diff(start));
    const id = setInterval(() => setT(diff(start)), 1000);
    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [inicioDoNamoro]);

  const items = [
    { label: "Dias", value: t?.dias },
    { label: "Horas", value: t?.horas },
    { label: "Minutos", value: t?.minutos },
    { label: "Segundos", value: t?.segundos },
  ];

  return (
    <section id="contador" className="relative px-6 py-28 sm:py-36">
      <SectionTitle
        overline="Desde o primeiro dia"
        title="Nosso tempo juntos"
        subtitle="E cada segundo continua contando."
      />

      <div className="mx-auto mt-14 grid max-w-3xl grid-cols-2 gap-4 sm:grid-cols-4">
        {items.map((item, i) => (
          <Reveal key={item.label} delay={i * 0.08} scale>
            <div className="neu rounded-3xl px-4 py-7 text-center">
              <p className="font-display text-[clamp(1.9rem,5vw,3rem)] font-medium leading-none text-gradient tabular-nums">
                {item.value === undefined
                  ? "—"
                  : String(item.value).padStart(2, "0")}
              </p>
              <p className="mt-3 text-[11px] uppercase tracking-[0.24em] text-muted-foreground">
                {item.label}
              </p>
            </div>
          </Reveal>
        ))}
      </div>
    </section>
  );
}
