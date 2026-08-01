import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import {
  Users,
  UserPlus,
  Shield,
  Lock,
  Copy,
  Trash2,
  Crown,
  Plus,
  Mail,
  Clock,
  Check,
} from "lucide-react";
import { PageHeader, SectionCard, StatCard, ListSkeleton, EmptyState } from "@/components/ui-kit";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useOrgMembers } from "@/features/field/api";
import {
  useTeams,
  useTeamMembers,
  useSaveTeam,
  useDeleteTeam,
  useSetTeamMembership,
  useToggleLeader,
  useInvitations,
  useCreateInvitation,
  useCancelInvitation,
  useDeleteInvitation,
  useSetUserRole,
} from "@/features/team/api";
import {
  ROLE_LABEL,
  useRoles,
  useSession,
  initialsFrom,
  type AppRole,
} from "@/features/auth/use-session";

const DESC =
  "Gerencie sua equipe: convide pessoas por e-mail, crie times, defina líderes e controle os papéis de acesso.";

const ROLES: AppRole[] = ["admin", "gerente", "vendedor", "funcionario"];

export const Route = createFileRoute("/_authenticated/equipe")({
  head: () => ({
    meta: [
      { title: "Equipe e convites — Prospecta CRM" },
      { name: "description", content: DESC },
      { property: "og:title", content: "Equipe e convites — Prospecta CRM" },
      { property: "og:description", content: DESC },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: TeamPage,
});

function TeamPage() {
  const { user } = useSession();
  const { data: roles = [] } = useRoles(user);
  const isAdmin = roles.includes("admin");
  const isManager = isAdmin || roles.includes("gerente");

  const { data: members = [], isLoading } = useOrgMembers();
  const { data: teams = [] } = useTeams();
  const { data: links = [] } = useTeamMembers();
  const { data: invites = [] } = useInvitations();

  const saveTeam = useSaveTeam();
  const deleteTeam = useDeleteTeam();
  const setMembership = useSetTeamMembership();
  const toggleLeader = useToggleLeader();
  const createInvite = useCreateInvitation();
  const cancelInvite = useCancelInvitation();
  const deleteInvite = useDeleteInvitation();
  const setRole = useSetUserRole();

  const [inviteOpen, setInviteOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [inviteRole, setInviteRole] = useState<AppRole>("vendedor");
  const [inviteTeam, setInviteTeam] = useState<string>("none");
  const [message, setMessage] = useState("");

  const [teamOpen, setTeamOpen] = useState(false);
  const [teamName, setTeamName] = useState("");
  const [teamDesc, setTeamDesc] = useState("");

  const linkByUser = useMemo(() => {
    const map = new Map<string, (typeof links)[number]>();
    for (const l of links) map.set(l.user_id, l);
    return map;
  }, [links]);

  const pending = invites.filter((i) => i.status === "pendente");
  const signupUrl =
    typeof window !== "undefined" ? `${window.location.origin}/auth` : "/auth";

  if (!isManager) {
    return (
      <div>
        <PageHeader title="Equipe" description="Área restrita a gestores." icon={Users} />
        <EmptyState
          icon={Lock}
          title="Acesso restrito"
          description="Somente administradores e gerentes podem gerenciar a equipe."
        />
      </div>
    );
  }

  function submitInvite() {
    const clean = email.trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(clean)) {
      toast.error("Informe um e-mail válido.");
      return;
    }
    if (clean.length > 255) {
      toast.error("E-mail muito longo.");
      return;
    }
    createInvite.mutate(
      {
        email: clean,
        role: inviteRole,
        team_id: inviteTeam === "none" ? null : inviteTeam,
        message: message.slice(0, 500),
      },
      {
        onSuccess: () => {
          toast.success("Convite criado. Envie o link de cadastro para a pessoa.");
          setInviteOpen(false);
          setEmail("");
          setMessage("");
        },
        onError: (error) =>
          toast.error(
            error.message.includes("duplicate")
              ? "Já existe um convite pendente para este e-mail."
              : error.message,
          ),
      },
    );
  }

  function submitTeam() {
    if (!teamName.trim()) {
      toast.error("Dê um nome para o time.");
      return;
    }
    saveTeam.mutate(
      { name: teamName.trim(), description: teamDesc.trim() || null },
      {
        onSuccess: () => {
          toast.success("Time criado.");
          setTeamOpen(false);
          setTeamName("");
          setTeamDesc("");
        },
        onError: (error) => toast.error(error.message),
      },
    );
  }

  async function copyInviteLink(inviteEmail: string) {
    const link = `${signupUrl}?email=${encodeURIComponent(inviteEmail)}`;
    try {
      await navigator.clipboard.writeText(link);
      toast.success("Link de cadastro copiado.");
    } catch {
      toast.error("Não foi possível copiar. Link: " + link);
    }
  }

  return (
    <div>
      <PageHeader
        title="Equipe e convites"
        description="Convide pessoas, organize times e defina permissões de acesso."
        icon={Users}
        actions={
          <div className="flex flex-wrap gap-2">
            <Dialog open={teamOpen} onOpenChange={setTeamOpen}>
              <DialogTrigger asChild>
                <Button variant="outline">
                  <Plus className="size-4" /> Novo time
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Criar time</DialogTitle>
                  <DialogDescription>Agrupe vendedores para metas e relatórios.</DialogDescription>
                </DialogHeader>
                <div className="space-y-3">
                  <div className="space-y-1.5">
                    <Label>Nome do time</Label>
                    <Input
                      value={teamName}
                      maxLength={80}
                      onChange={(e) => setTeamName(e.target.value)}
                      placeholder="Ex.: Comercial SP"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Descrição</Label>
                    <Textarea
                      value={teamDesc}
                      maxLength={280}
                      onChange={(e) => setTeamDesc(e.target.value)}
                      placeholder="Opcional"
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button onClick={submitTeam} disabled={saveTeam.isPending}>
                    Criar time
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>

            <Dialog open={inviteOpen} onOpenChange={setInviteOpen}>
              <DialogTrigger asChild>
                <Button>
                  <UserPlus className="size-4" /> Convidar pessoa
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Convidar para a equipe</DialogTitle>
                  <DialogDescription>
                    A pessoa recebe o papel e o time automaticamente ao criar a conta com este e-mail.
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-3">
                  <div className="space-y-1.5">
                    <Label>E-mail</Label>
                    <Input
                      type="email"
                      value={email}
                      maxLength={255}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="pessoa@empresa.com"
                    />
                  </div>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <div className="space-y-1.5">
                      <Label>Papel de acesso</Label>
                      <Select value={inviteRole} onValueChange={(v) => setInviteRole(v as AppRole)}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {ROLES.map((r) => (
                            <SelectItem key={r} value={r} disabled={r === "admin" && !isAdmin}>
                              {ROLE_LABEL[r]}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-1.5">
                      <Label>Time</Label>
                      <Select value={inviteTeam} onValueChange={setInviteTeam}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">Sem time</SelectItem>
                          {teams.map((t) => (
                            <SelectItem key={t.id} value={t.id}>
                              {t.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <Label>Recado (opcional)</Label>
                    <Textarea
                      value={message}
                      maxLength={500}
                      onChange={(e) => setMessage(e.target.value)}
                      placeholder="Boas-vindas ao time!"
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button onClick={submitInvite} disabled={createInvite.isPending}>
                    Criar convite
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        }
      />

      <div className="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Pessoas na plataforma" value={members.length} icon={Users} index={0} />
        <StatCard label="Convites pendentes" value={pending.length} icon={Mail} accent="warning" index={1} />
        <StatCard label="Times ativos" value={teams.length} icon={Shield} accent="info" index={2} />
        <StatCard
          label="Sem time"
          value={members.filter((m) => !linkByUser.get(m.id)).length}
          icon={Clock}
          accent="success"
          index={3}
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-[1.5fr_1fr]">
        <SectionCard
          title="Membros da equipe"
          description="Defina o papel de acesso e o time de cada pessoa."
        >
          {isLoading ? (
            <ListSkeleton rows={5} />
          ) : members.length === 0 ? (
            <EmptyState icon={Users} title="Nenhum membro ainda" />
          ) : (
            <ul className="space-y-2">
              {members.map((m) => {
                const link = linkByUser.get(m.id);
                const current = (m.roles[0] as AppRole) ?? "vendedor";
                return (
                  <li
                    key={m.id}
                    className="flex flex-wrap items-center gap-3 rounded-xl border border-border p-3"
                  >
                    <Avatar className="size-9">
                      <AvatarImage src={m.avatar_url ?? undefined} alt="" />
                      <AvatarFallback className="bg-primary/15 text-xs font-semibold text-primary">
                        {initialsFrom(m.full_name, m.email)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="min-w-0 flex-1">
                      <p className="flex items-center gap-1.5 truncate text-sm font-medium">
                        {m.full_name ?? "Sem nome"}
                        {link?.is_leader ? <Crown className="size-3.5 text-warning" /> : null}
                        {m.id === user?.id ? (
                          <Badge variant="outline" className="text-[10px]">
                            você
                          </Badge>
                        ) : null}
                      </p>
                      <p className="truncate text-xs text-muted-foreground">{m.email}</p>
                    </div>

                    <Select
                      value={current}
                      disabled={!isAdmin || m.id === user?.id}
                      onValueChange={(v) =>
                        setRole.mutate(
                          { userId: m.id, role: v as AppRole },
                          {
                            onSuccess: () => toast.success("Papel atualizado."),
                            onError: (error) => toast.error(error.message),
                          },
                        )
                      }
                    >
                      <SelectTrigger className="w-[150px]">
                        <SelectValue placeholder="Sem papel" />
                      </SelectTrigger>
                      <SelectContent>
                        {ROLES.map((r) => (
                          <SelectItem key={r} value={r}>
                            {ROLE_LABEL[r]}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>

                    <Select
                      value={link?.team_id ?? "none"}
                      onValueChange={(v) =>
                        setMembership.mutate(
                          { userId: m.id, teamId: v === "none" ? null : v },
                          {
                            onSuccess: () => toast.success("Time atualizado."),
                            onError: (error) => toast.error(error.message),
                          },
                        )
                      }
                    >
                      <SelectTrigger className="w-[150px]">
                        <SelectValue placeholder="Sem time" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">Sem time</SelectItem>
                        {teams.map((t) => (
                          <SelectItem key={t.id} value={t.id}>
                            {t.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>

                    {link ? (
                      <Button
                        size="icon"
                        variant={link.is_leader ? "default" : "outline"}
                        title={link.is_leader ? "Remover liderança" : "Tornar líder do time"}
                        onClick={() =>
                          toggleLeader.mutate(
                            { id: link.id, is_leader: !link.is_leader },
                            { onError: (error) => toast.error(error.message) },
                          )
                        }
                      >
                        <Crown className="size-4" />
                      </Button>
                    ) : null}
                  </li>
                );
              })}
            </ul>
          )}
        </SectionCard>

        <div className="space-y-4">
          <SectionCard
            title="Convites"
            description="Compartilhe o link de cadastro com a pessoa convidada."
          >
            {invites.length === 0 ? (
              <EmptyState icon={Mail} title="Nenhum convite" description="Convide alguém para começar." />
            ) : (
              <ul className="space-y-2">
                {invites.map((inv) => (
                  <li key={inv.id} className="rounded-xl border border-border p-3">
                    <div className="flex items-center gap-2">
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium">{inv.email}</p>
                        <p className="truncate text-xs text-muted-foreground">
                          {ROLE_LABEL[inv.role]} ·{" "}
                          {teams.find((t) => t.id === inv.team_id)?.name ?? "sem time"}
                        </p>
                      </div>
                      <Badge
                        variant={
                          inv.status === "aceito"
                            ? "default"
                            : inv.status === "pendente"
                              ? "secondary"
                              : "outline"
                        }
                      >
                        {inv.status}
                      </Badge>
                    </div>
                    <div className="mt-2 flex flex-wrap gap-2">
                      {inv.status === "pendente" ? (
                        <>
                          <Button size="sm" variant="outline" onClick={() => void copyInviteLink(inv.email)}>
                            <Copy className="size-3.5" /> Copiar link
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() =>
                              cancelInvite.mutate(inv.id, {
                                onSuccess: () => toast.success("Convite cancelado."),
                                onError: (error) => toast.error(error.message),
                              })
                            }
                          >
                            Cancelar
                          </Button>
                        </>
                      ) : (
                        <span className="flex items-center gap-1 text-xs text-muted-foreground">
                          <Check className="size-3.5" />
                          {inv.accepted_at
                            ? `Aceito em ${new Date(inv.accepted_at).toLocaleDateString("pt-BR")}`
                            : "Encerrado"}
                        </span>
                      )}
                      <Button
                        size="icon"
                        variant="ghost"
                        className="ml-auto"
                        onClick={() =>
                          deleteInvite.mutate(inv.id, {
                            onError: (error) => toast.error(error.message),
                          })
                        }
                      >
                        <Trash2 className="size-4" />
                      </Button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </SectionCard>

          <SectionCard title="Times" description="Agrupamentos usados em metas e relatórios.">
            {teams.length === 0 ? (
              <EmptyState icon={Shield} title="Nenhum time criado" />
            ) : (
              <ul className="space-y-2">
                {teams.map((t) => {
                  const count = links.filter((l) => l.team_id === t.id).length;
                  return (
                    <li
                      key={t.id}
                      className="flex items-center gap-3 rounded-lg border border-border px-3 py-2"
                    >
                      <span className="size-2.5 rounded-full" style={{ background: t.color }} />
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium">{t.name}</p>
                        <p className="truncate text-xs text-muted-foreground">
                          {count} {count === 1 ? "membro" : "membros"}
                        </p>
                      </div>
                      {isAdmin ? (
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() =>
                            deleteTeam.mutate(t.id, {
                              onSuccess: () => toast.success("Time removido."),
                              onError: (error) => toast.error(error.message),
                            })
                          }
                        >
                          <Trash2 className="size-4" />
                        </Button>
                      ) : null}
                    </li>
                  );
                })}
              </ul>
            )}
          </SectionCard>

          <SectionCard title="Como funciona o convite">
            <ol className="list-decimal space-y-1.5 pl-4 text-sm text-muted-foreground">
              <li>Crie o convite com o e-mail, o papel e o time da pessoa.</li>
              <li>Copie o link e envie por WhatsApp ou e-mail.</li>
              <li>A pessoa cria a conta usando exatamente esse e-mail.</li>
              <li>O papel e o time são aplicados automaticamente no primeiro acesso.</li>
            </ol>
          </SectionCard>
        </div>
      </div>
    </div>
  );
}
