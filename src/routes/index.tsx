import { createFileRoute } from "@tanstack/react-router";
import { useCallback, useRef } from "react";
import { Hero } from "@/components/love/Hero";
import { MusicPlayer } from "@/components/love/MusicPlayer";
import { Timeline } from "@/components/love/Timeline";
import { Gallery } from "@/components/love/Gallery";
import { Letter } from "@/components/love/Letter";
import { Counter } from "@/components/love/Counter";
import { Moments } from "@/components/love/Moments";
import { Quote } from "@/components/love/Quote";
import { FinalSurprise } from "@/components/love/FinalSurprise";
import { Footer } from "@/components/love/Footer";
import { CursorGlow } from "@/components/love/CursorGlow";
import { frases, site } from "@/content/story";

const title = `Para ${site.nomeDela} — Nossa história`;
const description =
  "Um presente digital feito com amor: nossa linha do tempo, nossas fotos, uma carta e o contador do nosso tempo juntos.";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title },
      { name: "description", content: description },
      { property: "og:title", content: title },
      { property: "og:description", content: description },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Index,
});

function Index() {
  const storyRef = useRef<HTMLDivElement>(null);

  const scrollToStory = useCallback(() => {
    storyRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, []);

  return (
    <main className="relative overflow-x-hidden bg-background text-foreground">
      <CursorGlow />
      <MusicPlayer />

      <Hero onStart={scrollToStory} />

      <div ref={storyRef}>
        <Timeline />
      </div>

      <Quote text={frases[0]} index={0} />
      <Counter />
      <Gallery />
      <Quote text={frases[1]} index={1} />
      <Moments />
      <Letter />
      <Quote text={frases[2]} index={2} />
      <FinalSurprise />
      <Footer />
    </main>
  );
}
