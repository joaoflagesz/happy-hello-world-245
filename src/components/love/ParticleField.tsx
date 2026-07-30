import { useEffect, useMemo, useState } from "react";

type Particle = {
  left: number;
  size: number;
  duration: number;
  delay: number;
  opacity: number;
  heart: boolean;
};

export function ParticleField({
  count = 22,
  hearts = true,
}: {
  count?: number;
  hearts?: boolean;
}) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const particles = useMemo<Particle[]>(
    () =>
      Array.from({ length: count }, (_, i) => ({
        left: (i * 97) % 100,
        size: 4 + Math.random() * 10,
        duration: 16 + Math.random() * 20,
        delay: -Math.random() * 30,
        opacity: 0.15 + Math.random() * 0.35,
        heart: hearts && i % 5 === 0,
      })),
    [count, hearts],
  );

  if (!mounted) return null;

  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
      {particles.map((p, i) => (
        <span
          key={i}
          className="animate-rise absolute bottom-[-10vh]"
          style={{
            left: `${p.left}%`,
            width: p.size,
            height: p.size,
            opacity: p.opacity,
            animationDuration: `${p.duration}s`,
            animationDelay: `${p.delay}s`,
          }}
        >
          {p.heart ? (
            <svg viewBox="0 0 24 24" className="h-full w-full fill-primary">
              <path d="M12 21s-7.5-4.6-9.6-9A5.4 5.4 0 0 1 12 6.5 5.4 5.4 0 0 1 21.6 12c-2.1 4.4-9.6 9-9.6 9Z" />
            </svg>
          ) : (
            <span
              className="block h-full w-full rounded-full"
              style={{
                background:
                  "radial-gradient(circle at 30% 30%, var(--color-primary), transparent 70%)",
              }}
            />
          )}
        </span>
      ))}
    </div>
  );
}
