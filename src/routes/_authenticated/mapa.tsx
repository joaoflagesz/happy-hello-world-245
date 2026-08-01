import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Link } from "@tanstack/react-router";
import { MapPin, Navigation, Search, ExternalLink } from "lucide-react";
import { PageHeader, EmptyState, SectionCard, ListSkeleton, StatCard } from "@/components/ui-kit";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useLeads } from "@/features/leads/api";
import { STAGE_LABEL } from "@/features/leads/constants";
import { cn } from "@/lib/utils";

const DESC =
  "Mapa geral da prospecção: veja todos os leads geolocalizados, filtre por cidade e trace rotas de visita.";

export const Route = createFileRoute("/_authenticated/mapa")({
  head: () => ({
    meta: [
      { title: "Mapa de leads — Prospecta CRM" },
      { name: "description", content: DESC },
      { property: "og:title", content: "Mapa de leads — Prospecta CRM" },
      { property: "og:description", content: DESC },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: MapPage,
});

function MapPage() {
  const { data: leads = [], isLoading } = useLeads();
  const [search, setSearch] = useState("");
  const [city, setCity] = useState("all");
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const geo = useMemo(
    () => leads.filter((l) => typeof l.latitude === "number" && typeof l.longitude === "number"),
    [leads],
  );

  const cities = useMemo(
    () => Array.from(new Set(geo.map((l) => l.city).filter(Boolean) as string[])).sort(),
    [geo],
  );

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    return geo.filter((l) => {
      if (city !== "all" && l.city !== city) return false;
      if (!term) return true;
      return [l.company_name, l.category, l.city, l.address]
        .filter(Boolean)
        .some((v) => String(v).toLowerCase().includes(term));
    });
  }, [geo, search, city]);

  const selected = filtered.find((l) => l.id === selectedId) ?? filtered[0] ?? null;

  const bbox = selected
    ? [
        (selected.longitude as number) - 0.012,
        (selected.latitude as number) - 0.008,
        (selected.longitude as number) + 0.012,
        (selected.latitude as number) + 0.008,
      ].join("%2C")
    : null;

  return (
    <div>
      <PageHeader
        title="Mapa de leads"
        description="Visualize a prospecção no território e planeje rotas de visita."
        icon={MapPin}
      />

      <div className="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Leads no mapa" value={geo.length} icon={MapPin} index={0} />
        <StatCard label="Cidades cobertas" value={cities.length} icon={Navigation} index={1} />
        <StatCard
          label="Sem site (oportunidade)"
          value={filtered.filter((l) => l.site_status === "sem_site").length}
          icon={Search}
          index={2}
        />
        <StatCard
          label="Score médio"
          value={
            filtered.length
              ? Math.round(filtered.reduce((acc, l) => acc + (l.score ?? 0), 0) / filtered.length)
              : 0
          }
          icon={Navigation}
          index={3}
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-[360px_1fr]">
        <SectionCard title="Leads geolocalizados" description={`${filtered.length} resultado(s)`}>
          <div className="mb-3 space-y-2">
            <Input
              placeholder="Buscar empresa, categoria ou endereço"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            <Select value={city} onValueChange={setCity}>
              <SelectTrigger>
                <SelectValue placeholder="Cidade" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas as cidades</SelectItem>
                {cities.map((c) => (
                  <SelectItem key={c} value={c}>
                    {c}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {isLoading ? (
            <ListSkeleton rows={6} />
          ) : filtered.length === 0 ? (
            <EmptyState
              icon={MapPin}
              title="Nenhum lead geolocalizado"
              description="Importe leads do Google Maps (Apify) para preencher latitude e longitude automaticamente."
            />
          ) : (
            <ul className="max-h-[520px] space-y-2 overflow-y-auto pr-1">
              {filtered.map((lead) => (
                <li key={lead.id}>
                  <button
                    onClick={() => setSelectedId(lead.id)}
                    className={cn(
                      "w-full rounded-lg border border-border p-3 text-left transition-colors hover:bg-accent",
                      selected?.id === lead.id && "border-primary bg-primary/5",
                    )}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="truncate text-sm font-medium">{lead.company_name}</span>
                      <Badge variant="secondary">{lead.score ?? 0}</Badge>
                    </div>
                    <p className="mt-0.5 truncate text-xs text-muted-foreground">
                      {[lead.city, lead.category].filter(Boolean).join(" • ") || "Sem categoria"}
                    </p>
                    <Badge variant="outline" className="mt-2 text-[10px]">
                      {STAGE_LABEL[lead.stage]}
                    </Badge>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </SectionCard>

        <SectionCard
          title={selected ? selected.company_name : "Mapa"}
          description={selected?.address ?? "Selecione um lead para visualizar no mapa"}
          actions={
            selected ? (
              <div className="flex gap-2">
                <Button variant="outline" size="sm" asChild>
                  <a
                    href={
                      selected.google_maps_url ??
                      `https://www.google.com/maps/dir/?api=1&destination=${selected.latitude},${selected.longitude}`
                    }
                    target="_blank"
                    rel="noreferrer"
                  >
                    <Navigation className="mr-2 size-4" />
                    Traçar rota
                  </a>
                </Button>
                <Button size="sm" asChild>
                  <Link to="/leads/$id" params={{ id: selected.id }}>
                    <ExternalLink className="mr-2 size-4" />
                    Abrir lead
                  </Link>
                </Button>
              </div>
            ) : null
          }
        >
          {selected && bbox ? (
            <iframe
              title={`Mapa de ${selected.company_name}`}
              className="h-[520px] w-full rounded-xl border border-border"
              loading="lazy"
              src={`https://www.openstreetmap.org/export/embed.html?bbox=${bbox}&layer=mapnik&marker=${selected.latitude}%2C${selected.longitude}`}
            />
          ) : (
            <EmptyState
              icon={MapPin}
              title="Nada para exibir"
              description="Selecione um lead com coordenadas na lista ao lado."
            />
          )}
        </SectionCard>
      </div>
    </div>
  );
}
