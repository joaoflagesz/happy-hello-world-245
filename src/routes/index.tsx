import { createFileRoute, Link } from "@tanstack/react-router";
import { motion } from "motion/react";
import {
  ArrowRight,
  BarChart3,
  Database,
  KanbanSquare,
  MapPin,
  MessageCircle,
  Sparkles,
  Target,
} from "lucide-react";
import { Button } from "@/components/ui/button";

const title = "Prospecta CRM — Prospecção de clientes com dados do Google Maps";
const description =
  "Importe leads do Google Maps, descubra quem não tem site, pontue oportunidades e feche mais contratos com um funil de vendas completo e integração com WhatsApp.";

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
  component: LandingPage,
});

const features = [
  {
    icon: Database,
    title: "Importação inteligente",
    text: "CSV, Excel ou export do Apify (Google Maps). Reconhecimento automático de colunas.",
  },
  {
    icon: Target,
    title: "Score de oportunidade",
    text: "Pontuação automática por avaliações, nota, contato e ausência de site.",
  },
  {
    icon: KanbanSquare,
    title: "Funil visual",
    text: "Pipeline arrastável com histórico completo de cada movimentação.",
  },
  {
    icon: MessageCircle,
    title: "WhatsApp em 1 clique",
    text: "Mensagem personalizada gerada com os dados da empresa, pronta para enviar.",
  },
  {
    icon: BarChart3,
    title: "Métricas de verdade",
    text: "Conversão, receita, ciclo de vendas e desempenho por vendedor.",
  },
  {
    icon: MapPin,
    title: "Dados geográficos",
    text: "Cidade, estado, categoria e localização para segmentar sua prospecção.",
  },
];

function LandingPage() {
  return (
    <main className="min-h-screen bg-background bg-surface-glow text-foreground">
      <header className="mx-auto flex w-full max-w-6xl items-center justify-between px-6 py-6">
        <div className="flex items-center gap-2">
          <div className="flex size-9 items-center justify-center rounded-xl bg-brand-gradient text-primary-foreground">
            <Sparkles className="size-5" />
          </div>
          <span className="text-lg font-semibold tracking-tight">Prospecta</span>
        </div>
        <div className="flex items-center gap-2">
          <Button asChild variant="ghost">
            <Link to="/auth">Entrar</Link>
          </Button>
          <Button asChild>
            <Link to="/auth" search={{ mode: "signup" }}>
              Criar conta
            </Link>
          </Button>
        </div>
      </header>

      <section className="mx-auto w-full max-w-6xl px-6 pb-24 pt-16 md:pt-24">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          className="max-w-3xl"
        >
          <span className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-3 py-1 text-xs font-medium text-muted-foreground">
            <span className="size-1.5 rounded-full bg-primary" />
            CRM de prospecção para agências de sites
          </span>
          <h1 className="mt-6 text-4xl font-semibold leading-[1.05] tracking-tight md:text-6xl">
            Encontre empresas <span className="text-gradient">sem site</span> e transforme em
            contratos.
          </h1>
          <p className="mt-6 max-w-2xl text-lg text-muted-foreground">{description}</p>
          <div className="mt-8 flex flex-wrap items-center gap-3">
            <Button asChild size="lg" className="group">
              <Link to="/auth" search={{ mode: "signup" }}>
                Começar agora
                <ArrowRight className="ml-1 size-4 transition-transform group-hover:translate-x-0.5" />
              </Link>
            </Button>
            <Button asChild size="lg" variant="outline">
              <Link to="/auth">Já tenho conta</Link>
            </Button>
          </div>
        </motion.div>

        <div className="mt-20 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((feature, index) => (
            <motion.article
              key={feature.title}
              initial={{ opacity: 0, y: 14 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-60px" }}
              transition={{ duration: 0.45, delay: index * 0.05, ease: [0.22, 1, 0.36, 1] }}
              className="surface-card hover-lift rounded-2xl p-6"
            >
              <div className="flex size-10 items-center justify-center rounded-xl bg-accent text-accent-foreground">
                <feature.icon className="size-5" />
              </div>
              <h2 className="mt-4 text-base font-semibold">{feature.title}</h2>
              <p className="mt-2 text-sm text-muted-foreground">{feature.text}</p>
            </motion.article>
          ))}
        </div>
      </section>

      <footer className="border-t border-border">
        <div className="mx-auto w-full max-w-6xl px-6 py-8 text-sm text-muted-foreground">
          Prospecta CRM — prospecção, funil e vendas em um só lugar.
        </div>
      </footer>
    </main>
  );
}
