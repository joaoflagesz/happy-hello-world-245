import { Music, Pause, Play } from "lucide-react";
import { motion } from "motion/react";
import { useEffect, useRef, useState } from "react";
import { musica } from "@/content/story";

export function MusicPlayer() {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [playing, setPlaying] = useState(false);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    const el = audioRef.current;
    if (!el) return;
    el.volume = 0.55;
  }, []);

  const toggle = async () => {
    const el = audioRef.current;
    if (!el) return;
    try {
      if (playing) {
        el.pause();
        setPlaying(false);
      } else {
        await el.play();
        setPlaying(true);
      }
    } catch {
      setFailed(true);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: -14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 1.2, duration: 0.8 }}
      className="fixed right-4 top-4 z-50 sm:right-6 sm:top-6"
    >
      <audio
        ref={audioRef}
        src={musica.src}
        loop
        preload="none"
        onEnded={() => setPlaying(false)}
        onError={() => setFailed(true)}
      />
      <button
        onClick={toggle}
        aria-label={playing ? "Pausar nossa música" : "Tocar nossa música"}
        className="glass group flex items-center gap-3 rounded-full py-2 pl-2 pr-4 transition-transform duration-300 hover:scale-[1.03] active:scale-95"
      >
        <span
          className="grid h-9 w-9 shrink-0 place-items-center rounded-full text-primary-foreground"
          style={{ backgroundImage: "var(--gradient-romance)" }}
        >
          {playing ? <Pause className="h-4 w-4" /> : <Play className="ml-0.5 h-4 w-4" />}
        </span>

        <span className="flex min-w-0 items-center gap-2">
          {playing ? (
            <span className="flex h-4 items-end gap-[3px]">
              {[0, 1, 2, 3, 4].map((i) => (
                <motion.span
                  key={i}
                  className="w-[3px] rounded-full bg-primary"
                  animate={{ height: ["30%", "100%", "45%", "85%", "30%"] }}
                  transition={{
                    duration: 1.1 + i * 0.15,
                    repeat: Infinity,
                    ease: "easeInOut",
                  }}
                  style={{ height: "40%" }}
                />
              ))}
            </span>
          ) : (
            <Music className="h-4 w-4 text-primary" />
          )}
          <span className="truncate text-xs font-medium tracking-wide text-foreground">
            {failed ? "Adicione a música" : playing ? musica.titulo : "Tocar nossa música"}
          </span>
        </span>
      </button>
    </motion.div>
  );
}
