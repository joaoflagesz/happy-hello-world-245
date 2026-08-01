import { createFileRoute } from "@tanstack/react-router";
import { useMemo } from "react";
import { Trophy, Flame, Target, Medal, Zap, Star } from "lucide-react";
import { PageHeader, SectionCard, StatCard, ListSkeleton, EmptyState } from "@/components/ui-kit";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useLeads } from "@/features/leads/api";
import { useVisits } from "@/features/field/api";
import { useTasks, useGoals } from "@/features/platform/api";
import { useProfile, useSession, initialsFrom } from "@/features/auth/use-session";
import { cn } from "@/lib/utils";

const DESC =
  "Gamificação da equipe comercial: pontos, conquistas, sequência de atividade e progresso das metas.";

export const Route = createFileRoute("/_authenticated/ranking")({
  head: () => ({
    meta: [
      { title: "Ranking e conquistas — Prospecta CRM" },
      { name: "description", content: DESC },
      { property: "og:title", content: "Ranking e conquistas — Prospecta CRM" },
      { property: "og:description", content: DESC },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: RankingPage,
});

const LEVELS = [
  { min: 0, name: "Bronze" },
  { min: 500, name: "Prata" },
  { min: 1500, name: "Ouro" },
  { min: 3500, name: "Platina" },
  { min: 7000, name: "Diamante" },
];

function RankingPage() {
  const { user } = useSession();
  const { data: profile } = useProfile(user);
  const { data: leads = [], isLoading } = useLeads();
  const { data: visits = [] } = useVisits();
  const { data: tasks = [] } = useTasks();
  const { data: goals = [] } = useGoals();

  const metrics = useMemo(() => {
    const clients = leads.filter((l) => l.stage === "cliente");
    const contacted = leads.filter((l) => l.last_contact_at);
    const doneTasks = tasks.filter((t) => t.status === "concluida");
    const doneVisits = visits.filter((v) => v.status === "concluida");
    const revenue = clients.reduce((acc, l) => acc + Number(l.deal_value ?? 0), 0);
    const points =
      leads.length * 2 + contacted.length * 5 + doneTasks.length * 8 + doneVisits.length * 15 + clients.length * 50;
    return { clients, contacted, doneTasks, doneVisits, revenue, points };
  }, [leads, tasks, visits]);

  const level = [...LEVELS].reverse().find((l) => metrics.points >= l.min) ?? LEVELS[0];
  const nextLevel = LEVELS.find((l) => l.min > metrics.points);
  const progress = nextLevel
    ? Math.round(((metrics.points - level.min) / (nextLevel.min - level.min)) * 100)
    : 100;

  const achievements = [
    { icon: Zap, name: "Primeiro contato", desc: "Contate 1 lead", done: metrics.contacted.length >= 1 },
    { icon: Flame, name: "Caçador", desc: "50 leads na base", done: leads.length >= 50 },
    { icon: Target, name: "Fechador", desc: "1 cliente conquistado", done: metrics.clients.length >= 1 },
    { icon: Medal, name: "Maratonista", desc: "10 tarefas concluídas", done: metrics.doneTasks.length >= 10 },
    { icon: Star, name: "Homem de campo", desc: "5 visitas concluídas", done: metrics.doneVisits.length >= 5 },
    { icon: Trophy, name: "Elite", desc: "10 clientes conquistados", done: metrics.clients.length >= 10 },
  ];

  const leaderboard = useMemo(() => {
    const byOwner = new Map<string, { leads: number; clients: number; revenue: number }>();
    for (const lead of leads) {
      const cur = byOwner.get(lead.owner_id) ?? { leads: 0, clients: 0, revenue: 0 };
      cur.leads += 1;
      if (lead.stage === "cliente") {
        cur.clients += 1;
        cur.revenue += Number(lead.deal_value ?? 0);
      }
      byOwner.set(lead.owner_id, cur);
    }
    return Array.from(byOwner.entries())
      .map(([ownerId, v]) => ({
        ownerId,
        ...v,
        points: v.leads * 2 + v.clients * 50,
        isMe: ownerId === user?.id,
      }))
      .sort((a, b) => b.points - a.points);
  }, [leads, user?.id]);

  return (
    <div>
      <PageHeader
        title="Ranking e conquistas"
        description="Acompanhe sua performance, desbloqueie conquistas e suba de nível."
        icon={Trophy}
      />

      <div className="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Pontos" value={metrics.points} hint={`Nível ${level.name}`} icon={Trophy} index={0} />
        <StatCard label="Clientes fechados" value={metrics.clients.length} icon={Target} accent="success" index={1} />
        <StatCard label="Visitas concluídas" value={metrics.doneVisits.length} icon={Flame} accent="warning" index={2} />
        <StatCard
          label="Receita conquistada"
          value={metrics.revenue.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
          icon={Medal}
          accent="info"
          index={3}
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <SectionCard title="Seu nível" description="Ganhe pontos criando, contatando e fechando leads.">
          <div className="flex items-center gap-4">
            <Avatar className="size-14">
              <AvatarFallback className="bg-primary/15 text-base font-semibold text-primary">
                {initialsFrom(profile?.full_name, user?.email)}
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <p className="truncate text-sm font-semibold">{profile?.full_name ?? user?.email}</p>
                <Badge>{level.name}</Badge>
              </div>
              <Progress value={progress} className="mt-3" />
              <p className="mt-1 text-xs text-muted-foreground">
                {nextLevel
                  ? `${nextLevel.min - metrics.points} pontos para o nível ${nextLevel.name}`
                  : "Nível máximo alcançado!"}
              </p>
            </div>
          </div>

          <div className="mt-5 grid grid-cols-2 gap-3 text-xs text-muted-foreground sm:grid-cols-4">
            <div className="rounded-lg border border-border p-3">
              <p className="text-lg font-semibold text-foreground">{leads.length}</p>
              Leads (2 pts)
            </div>
            <div className="rounded-lg border border-border p-3">
              <p className="text-lg font-semibold text-foreground">{metrics.contacted.length}</p>
              Contatos (5 pts)
            </div>
            <div className="rounded-lg border border-border p-3">
              <p className="text-lg font-semibold text-foreground">{metrics.doneTasks.length}</p>
              Tarefas (8 pts)
            </div>
            <div className="rounded-lg border border-border p-3">
              <p className="text-lg font-semibold text-foreground">{metrics.doneVisits.length}</p>
              Visitas (15 pts)
            </div>
          </div>
        </SectionCard>

        <SectionCard title="Conquistas" description="Desbloqueie medalhas conforme evolui na prospecção.">
          <div className="grid gap-3 sm:grid-cols-2">
            {achievements.map((a) => (
              <div
                key={a.name}
                className={cn(
                  "flex items-center gap-3 rounded-xl border border-border p-3 transition-colors",
                  a.done ? "border-primary/40 bg-primary/5" : "opacity-60",
                )}
              >
                <div
                  className={cn(
                    "flex size-9 items-center justify-center rounded-lg",
                    a.done ? "bg-primary/15 text-primary" : "bg-muted text-muted-foreground",
                  )}
                >
                  <a.icon className="size-4" />
                </div>
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium">{a.name}</p>
                  <p className="truncate text-xs text-muted-foreground">{a.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </SectionCard>
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <SectionCard title="Placar da equipe" description="Classificação por pontos de prospecção.">
          {isLoading ? (
            <ListSkeleton rows={4} />
          ) : leaderboard.length === 0 ? (
            <EmptyState icon={Trophy} title="Sem dados ainda" description="Cadastre leads para gerar o ranking." />
          ) : (
            <ul className="space-y-2">
              {leaderboard.map((row, i) => (
                <li
                  key={row.ownerId}
                  className={cn(
                    "flex items-center gap-3 rounded-xl border border-border p-3",
                    row.isMe && "border-primary/50 bg-primary/5",
                  )}
                >
                  <span className="flex size-8 items-center justify-center rounded-lg bg-muted text-sm font-semibold">
                    {i + 1}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">
                      {row.isMe ? profile?.full_name ?? "Você" : `Vendedor ${row.ownerId.slice(0, 6)}`}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {row.leads} leads • {row.clients} clientes •{" "}
                      {row.revenue.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
                    </p>
                  </div>
                  <Badge variant="secondary">{row.points} pts</Badge>
                </li>
              ))}
            </ul>
          )}
        </SectionCard>

        <SectionCard title="Metas do período" description="Progresso das metas cadastradas.">
          {goals.length === 0 ? (
            <EmptyState
              icon={Target}
              title="Nenhuma meta definida"
              description="Cadastre metas no painel para acompanhar o progresso aqui."
            />
          ) : (
            <ul className="space-y-4">
              {goals.map((goal) => {
                const achieved =
                  goal.metric === "receita"
                    ? metrics.revenue
                    : goal.metric === "leads"
                      ? leads.length
                      : metrics.clients.length;
                const pct = Math.min(100, Math.round((achieved / Number(goal.target || 1)) * 100));
                return (
                  <li key={goal.id}>
                    <div className="flex items-center justify-between text-sm">
                      <span className="font-medium capitalize">{goal.metric}</span>
                      <span className="text-muted-foreground">{pct}%</span>
                    </div>
                    <Progress value={pct} className="mt-2" />
                    <p className="mt-1 text-xs text-muted-foreground">
                      {achieved.toLocaleString("pt-BR")} de {Number(goal.target).toLocaleString("pt-BR")}
                    </p>
                  </li>
                );
              })}
            </ul>
          )}
        </SectionCard>
      </div>
    </div>
  );
}
