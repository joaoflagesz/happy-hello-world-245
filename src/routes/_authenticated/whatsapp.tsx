import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { MessageCircle, Plus, Search, Send, Clock, Tag } from "lucide-react";
import { toast } from "sonner";
import {
  useCreateConversation,
  useSendWaMessage,
  useWaConversations,
  useWaMessages,
} from "@/features/platform/api";
import { EmptyState, ListSkeleton, PageHeader, SectionCard, StatCard } from "@/components/ui-kit";
import { toWhatsappNumber } from "@/features/leads/constants";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export const Route = createFileRoute("/_authenticated/whatsapp")({
  head: () => ({
    meta: [
      { title: "WhatsApp — Prospecta CRM" },
      {
        name: "description",
        content: "Central de atendimento WhatsApp com conversas, etiquetas, mensagens agendadas e indicadores.",
      },
      { property: "og:title", content: "WhatsApp — Prospecta CRM" },
      {
        property: "og:description",
        content: "Central de atendimento WhatsApp com conversas, etiquetas, mensagens agendadas e indicadores.",
      },
    ],
  }),
  component: WhatsappPage,
});

const QUICK_REPLIES = [
  "Olá! Tudo bem? Sou da equipe comercial e queria entender melhor a sua necessidade.",
  "Consegue me dizer qual o melhor horário para conversarmos hoje?",
  "Acabei de enviar a proposta. Qualquer dúvida estou por aqui!",
  "Passando para fazer um follow-up rápido — conseguiu avaliar nossa proposta?",
];

function WhatsappPage() {
  const { data: conversations, isLoading } = useWaConversations();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [body, setBody] = useState("");
  const [scheduledFor, setScheduledFor] = useState("");
  const [newOpen, setNewOpen] = useState(false);
  const [newContact, setNewContact] = useState({ name: "", phone: "" });

  const { data: messages } = useWaMessages(selectedId);
  const createConversation = useCreateConversation();
  const send = useSendWaMessage();

  const list = conversations ?? [];
  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return list;
    return list.filter(
      (c) =>
        (c.contact_name ?? "").toLowerCase().includes(term) ||
        c.contact_phone.toLowerCase().includes(term) ||
        (c.last_message ?? "").toLowerCase().includes(term),
    );
  }, [list, search]);

  const selected = list.find((c) => c.id === selectedId) ?? null;
  const unread = list.reduce((acc, c) => acc + (c.unread_count ?? 0), 0);
  const scheduled = (messages ?? []).filter((m) => m.status === "pendente").length;

  function handleSend() {
    if (!selected || !body.trim()) return;
    send.mutate(
      {
        conversationId: selected.id,
        body: body.trim(),
        phone: selected.contact_phone,
        scheduledFor: scheduledFor ? new Date(scheduledFor).toISOString() : null,
      },
      {
        onSuccess: () => {
          toast.success(scheduledFor ? "Mensagem agendada." : "Mensagem registrada.");
          if (!scheduledFor) {
            const number = toWhatsappNumber(selected.contact_phone);
            if (number) {
              window.open(`https://wa.me/${number}?text=${encodeURIComponent(body.trim())}`, "_blank", "noopener");
            }
          }
          setBody("");
          setScheduledFor("");
        },
        onError: (error) => toast.error(error.message),
      },
    );
  }

  function handleCreate() {
    if (!newContact.phone.trim()) {
      toast.error("Informe o número do contato.");
      return;
    }
    createConversation.mutate(
      {
        contact_name: newContact.name.trim() || null,
        contact_phone: newContact.phone.trim(),
        labels: [],
        unread_count: 0,
      },
      {
        onSuccess: (data) => {
          toast.success("Conversa criada.");
          setSelectedId(data.id);
          setNewOpen(false);
          setNewContact({ name: "", phone: "" });
        },
        onError: (error) => toast.error(error.message),
      },
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="WhatsApp"
        description="Painel de atendimento com histórico, etiquetas, agendamentos e respostas rápidas."
        icon={MessageCircle}
        actions={
          <Button onClick={() => setNewOpen(true)}>
            <Plus className="mr-2 size-4" />
            Nova conversa
          </Button>
        }
      />

      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard label="Conversas" value={list.length} icon={MessageCircle} index={0} />
        <StatCard label="Não lidas" value={unread} icon={Tag} accent="warning" index={1} />
        <StatCard label="Agendadas na conversa" value={scheduled} icon={Clock} accent="info" index={2} />
      </div>

      {isLoading ? (
        <ListSkeleton rows={4} />
      ) : list.length === 0 ? (
        <EmptyState
          icon={MessageCircle}
          title="Nenhuma conversa ainda"
          description="Crie uma conversa para centralizar o histórico de atendimento com o cliente."
          action={<Button onClick={() => setNewOpen(true)}>Iniciar conversa</Button>}
        />
      ) : (
        <div className="grid gap-6 lg:grid-cols-[minmax(0,340px)_minmax(0,1fr)]">
          <SectionCard title="Conversas">
            <div className="relative mb-3">
              <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                className="pl-9"
                placeholder="Buscar contato ou mensagem…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <ScrollArea className="h-[480px] pr-2">
              <div className="space-y-2">
                {filtered.map((conversation) => (
                  <button
                    key={conversation.id}
                    onClick={() => setSelectedId(conversation.id)}
                    className={`hover-lift w-full rounded-lg border p-3 text-left ${
                      selectedId === conversation.id ? "border-primary bg-primary/5" : "border-border"
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <p className="truncate text-sm font-semibold">
                        {conversation.contact_name || conversation.contact_phone}
                      </p>
                      {conversation.unread_count ? (
                        <Badge className="text-[10px]">{conversation.unread_count}</Badge>
                      ) : null}
                    </div>
                    <p className="truncate text-xs text-muted-foreground">
                      {conversation.last_message ?? "Sem mensagens"}
                    </p>
                    {(conversation.labels ?? []).length ? (
                      <div className="mt-1 flex flex-wrap gap-1">
                        {(conversation.labels ?? []).map((label) => (
                          <Badge key={label} variant="secondary" className="text-[10px]">
                            {label}
                          </Badge>
                        ))}
                      </div>
                    ) : null}
                  </button>
                ))}
              </div>
            </ScrollArea>
          </SectionCard>

          <SectionCard
            title={selected ? selected.contact_name || selected.contact_phone : "Selecione uma conversa"}
            description={selected?.contact_phone}
          >
            {selected ? (
              <div className="flex h-[520px] flex-col">
                <ScrollArea className="flex-1 pr-2">
                  <div className="space-y-2">
                    {(messages ?? []).map((message) => (
                      <div
                        key={message.id}
                        className={`max-w-[80%] rounded-xl px-3 py-2 text-sm ${
                          message.direction === "saida"
                            ? "ml-auto bg-primary text-primary-foreground"
                            : "bg-muted"
                        }`}
                      >
                        <p className="whitespace-pre-wrap">{message.body}</p>
                        <p className="mt-1 text-[10px] opacity-70">
                          {new Date(message.created_at).toLocaleString("pt-BR")} · {message.status}
                        </p>
                      </div>
                    ))}
                    {(messages ?? []).length === 0 ? (
                      <p className="py-10 text-center text-sm text-muted-foreground">
                        Nenhuma mensagem registrada nesta conversa.
                      </p>
                    ) : null}
                  </div>
                </ScrollArea>

                <div className="mt-3 space-y-2 border-t border-border pt-3">
                  <div className="flex flex-wrap gap-2">
                    {QUICK_REPLIES.map((reply) => (
                      <Button key={reply} variant="outline" size="sm" onClick={() => setBody(reply)}>
                        {reply.slice(0, 28)}…
                      </Button>
                    ))}
                  </div>
                  <Textarea
                    rows={3}
                    maxLength={4000}
                    placeholder="Escreva a mensagem…"
                    value={body}
                    onChange={(e) => setBody(e.target.value)}
                  />
                  <div className="flex flex-wrap items-center gap-2">
                    <Input
                      type="datetime-local"
                      className="w-56"
                      value={scheduledFor}
                      onChange={(e) => setScheduledFor(e.target.value)}
                    />
                    <Button onClick={handleSend} disabled={send.isPending || !body.trim()}>
                      <Send className="mr-2 size-4" />
                      {scheduledFor ? "Agendar" : "Enviar"}
                    </Button>
                  </div>
                </div>
              </div>
            ) : (
              <EmptyState
                icon={MessageCircle}
                title="Nenhuma conversa selecionada"
                description="Escolha um contato na lista para ver o histórico completo."
              />
            )}
          </SectionCard>
        </div>
      )}

      <Dialog open={newOpen} onOpenChange={setNewOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Nova conversa</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="wa-name">Nome do contato</Label>
              <Input
                id="wa-name"
                value={newContact.name}
                maxLength={120}
                onChange={(e) => setNewContact({ ...newContact, name: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="wa-phone">Telefone</Label>
              <Input
                id="wa-phone"
                value={newContact.phone}
                maxLength={30}
                placeholder="(11) 99999-9999"
                onChange={(e) => setNewContact({ ...newContact, phone: e.target.value })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button onClick={handleCreate} disabled={createConversation.isPending}>
              Criar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
