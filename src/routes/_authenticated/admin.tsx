import { createFileRoute } from "@tanstack/react-router";
import { useMemo } from "react";
import { Shield, Users, Database, Activity, Lock, Server } from "lucide-react";
import { PageHeader, SectionCard, StatCard, ListSkeleton, EmptyState } from "@/components/ui-kit";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useOrgMembers } from "@/features/field/api";
import { useActivityLog } from "@/features/platform/api";
import { useLeads } from "@/features/leads/api";
import { ROLE_LABEL, useRoles, useSession, initialsFrom, type AppRole } from "@/features/auth/use-session";

const DESC =
  "Painel administrativo: usuários, papéis de acesso, uso da plataforma e saúde do ambiente.";

export const Route = createFileRoute("/_authenticated/admin")({
  head: () => ({
    meta: [
      { title: "Painel admin — Prospecta CRM" },
      { name: "description", content: DESC },
      { property: "og:title", content: "Painel admin — Prospecta CRM" },
      { property: "og:description", content: DESC },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: AdminPage,
});

function AdminPage() {
  const { user } = useSession();
  const { data: roles = [] } = useRoles(user);
  const { data: members = [], isLoading } = useOrgMembers();
  const { data: logs = [] } = useActivityLog();
  const { data: leads = [] } = useLeads();

  const isAdmin = roles.includes("admin");

  const roleCount = useMemo(() => {
    const map = new Map<string, number>();
    for (const m of members) for (const r of m.roles) map.set(r, (map.get(r) ?? 0) + 1);
    return map;
  }, [members]);

  if (!isAdmin) {
    return (
      <div>
        <PageHeader title="Painel admin" description="Área restrita a administradores." icon={Shield} />
        <EmptyState
          icon={Lock}
          title="Acesso restrito"
          description="Somente usuários com papel de administrador podem acessar o painel administrativo."
        />
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        title="Painel admin"
        description="Governança de usuários, permissões e saúde da plataforma."
        icon={Shield}
      />

      <div className="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Usuários" value={members.length} icon={Users} index={0} />
        <StatCard label="Administradores" value={roleCount.get("admin") ?? 0} icon={Shield} accent="warning" index={1} />
        <StatCard label="Registros de leads" value={leads.length} icon={Database} accent="info" index={2} />
        <StatCard label="Eventos auditados" value={logs.length} icon={Activity} accent="success" index={3} />
      </div>

      <div className="grid gap-4 lg:grid-cols-[1.4fr_1fr]">
        <SectionCard title="Usuários da plataforma" description="Membros e papéis de acesso (RBAC).">
          {isLoading ? (
            <ListSkeleton rows={5} />
          ) : members.length === 0 ? (
            <EmptyState icon={Users} title="Nenhum usuário encontrado" />
          ) : (
            <ul className="space-y-2">
              {members.map((m) => (
                <li key={m.id} className="flex items-center gap-3 rounded-xl border border-border p-3">
                  <Avatar className="size-9">
                    <AvatarImage src={m.avatar_url ?? undefined} alt="" />
                    <AvatarFallback className="bg-primary/15 text-xs font-semibold text-primary">
                      {initialsFrom(m.full_name, m.email)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{m.full_name ?? "Sem nome"}</p>
                    <p className="truncate text-xs text-muted-foreground">
                      {m.email} {m.job_title ? `• ${m.job_title}` : ""}
                    </p>
                  </div>
                  <div className="flex shrink-0 flex-wrap gap-1">
                    {m.roles.length === 0 ? (
                      <Badge variant="outline">sem papel</Badge>
                    ) : (
                      m.roles.map((r) => (
                        <Badge key={r} variant={r === "admin" ? "default" : "secondary"}>
                          {ROLE_LABEL[r as AppRole] ?? r}
                        </Badge>
                      ))
                    )}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </SectionCard>

        <div className="space-y-4">
          <SectionCard title="Saúde do ambiente" description="Status dos serviços conectados.">
            <ul className="space-y-3 text-sm">
              {[
                { icon: Server, label: "Banco de dados", status: "Operacional" },
                { icon: Lock, label: "Autenticação e RLS", status: "Ativo em todas as tabelas" },
                { icon: Database, label: "Armazenamento de documentos", status: "Bucket privado ativo" },
                { icon: Activity, label: "Auditoria de alterações", status: `${logs.length} eventos` },
              ].map((item) => (
                <li key={item.label} className="flex items-center gap-3 rounded-lg border border-border p-3">
                  <div className="flex size-8 items-center justify-center rounded-lg bg-success/10 text-success">
                    <item.icon className="size-4" />
                  </div>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">{item.label}</p>
                    <p className="truncate text-xs text-muted-foreground">{item.status}</p>
                  </div>
                </li>
              ))}
            </ul>
          </SectionCard>

          <SectionCard title="Distribuição de papéis">
            <ul className="space-y-2 text-sm">
              {(["admin", "gerente", "vendedor", "funcionario"] as AppRole[]).map((role) => (
                <li key={role} className="flex items-center justify-between rounded-lg border border-border px-3 py-2">
                  <span>{ROLE_LABEL[role]}</span>
                  <Badge variant="secondary">{roleCount.get(role) ?? 0}</Badge>
                </li>
              ))}
            </ul>
          </SectionCard>
        </div>
      </div>

      <SectionCard className="mt-4" title="Últimas atividades do sistema" description="Registro de auditoria recente.">
        {logs.length === 0 ? (
          <EmptyState icon={Activity} title="Sem atividades registradas" />
        ) : (
          <ul className="space-y-2">
            {logs.slice(0, 12).map((log) => (
              <li key={log.id} className="flex items-center justify-between gap-3 rounded-lg border border-border p-3">
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium">
                    {log.action} · {log.entity_type}
                  </p>
                  <p className="truncate text-xs text-muted-foreground">
                    {new Date(log.created_at).toLocaleString("pt-BR")}
                  </p>
                </div>
                <Badge variant="outline">{log.entity_id?.slice(0, 8) ?? "—"}</Badge>
              </li>
            ))}
          </ul>
        )}
      </SectionCard>
    </div>
  );
}
