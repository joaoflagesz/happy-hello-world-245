import { Reveal } from "./Reveal";

export function SectionTitle({
  overline,
  title,
  subtitle,
}: {
  overline?: string;
  title: string;
  subtitle?: string;
}) {
  return (
    <Reveal className="mx-auto max-w-2xl text-center">
      {overline ? (
        <p className="text-[11px] uppercase tracking-[0.34em] text-primary">{overline}</p>
      ) : null}
      <h2 className="font-display mt-3 text-[clamp(2rem,5vw,3.2rem)] font-light leading-tight text-foreground">
        {title}
      </h2>
      {subtitle ? (
        <p className="mt-4 text-sm leading-relaxed text-muted-foreground sm:text-base">
          {subtitle}
        </p>
      ) : null}
      <span
        aria-hidden
        className="mx-auto mt-6 block h-px w-24 rounded-full"
        style={{ backgroundImage: "var(--gradient-romance)" }}
      />
    </Reveal>
  );
}
