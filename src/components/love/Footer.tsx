import { Heart } from "lucide-react";
import { site } from "@/content/story";

export function Footer() {
  return (
    <footer className="relative overflow-hidden px-6 py-14 text-center">
      <div
        aria-hidden
        className="absolute inset-0"
        style={{ background: "var(--gradient-dawn)" }}
      />
      <div className="relative z-10">
        <p className="font-display text-2xl text-gradient">
          Para {site.nomeDela}
        </p>
        <p className="mt-3 inline-flex items-center gap-2 text-xs tracking-wide text-muted-foreground">
          Feito com <Heart className="h-3.5 w-3.5 fill-primary text-primary" /> só para você
        </p>
      </div>
    </footer>
  );
}
