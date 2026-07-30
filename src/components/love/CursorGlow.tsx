import { useEffect, useState } from "react";

export function CursorGlow() {
  const [pos, setPos] = useState<{ x: number; y: number } | null>(null);

  useEffect(() => {
    if (window.matchMedia("(pointer: coarse)").matches) return;
    const onMove = (e: PointerEvent) => setPos({ x: e.clientX, y: e.clientY });
    window.addEventListener("pointermove", onMove);
    return () => window.removeEventListener("pointermove", onMove);
  }, []);

  if (!pos) return null;

  return (
    <div
      aria-hidden
      className="pointer-events-none fixed z-[70] hidden h-64 w-64 -translate-x-1/2 -translate-y-1/2 rounded-full blur-3xl transition-transform duration-200 ease-out md:block"
      style={{
        left: pos.x,
        top: pos.y,
        background:
          "radial-gradient(circle, color-mix(in oklab, var(--color-primary) 14%, transparent), transparent 70%)",
      }}
    />
  );
}
