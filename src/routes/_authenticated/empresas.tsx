import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Building2, MapPin, Plus, Search, Trash2, Users } from "lucide-react";
import { toast } from "sonner";
import {
  useCompanies,
  useContacts,
  useDeleteCompany,
  useDeleteContact,
  useSaveCompany,
  useSaveContact,
  type Company,
} from "@/features/platform/api";
import { EmptyState, ListSkeleton, PageHeader, SectionCard, StatCard } from "@/components/ui-kit";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export const Route = createFileRoute("/_authenticated/empresas")({
  head: () => ({
    meta: [
      { title: "Empresas e contatos — Prospecta CRM" },
      {
        name: "description",
        content: "Cadastro completo de empresas, sócios e contatos com segmento, endereço, tags e histórico.",
      },
      { property: "og:title", content: "Empresas e contatos — Prospecta CRM" },
      {
        property: "og:description",
        content: "Cadastro completo de empresas, sócios e contatos com segmento, endereço, tags e histórico.",
      },
    ],
  }),
  component: CompaniesPage,
});

type CompanyDraft = {
  id?: string;
  name: string;
  legal_name: string;
  document: string;
  industry: string;
  size: string;
  website: string;
  phone: string;
  email: string;
  city: string;
  state: string;
  address: string;
  postal_code: string;
  notes: string;
  tags: string;
};

const emptyCompany: CompanyDraft = {
  name: "",
  legal_name: "",
  document: "",
  industry: "",
  size: "",
  website: "",
  phone: "",
  email: "",
  city: "",
  state: "",
  address: "",
  postal_code: "",
  notes: "",
  tags: "",
};

type ContactDraft = {
  id?: string;
  full_name: string;
  role_title: string;
  email: string;
  phone: string;
  whatsapp: string;
  linkedin: string;
  instagram: string;
  birthday: string;
  notes: string;
  is_decision_maker: boolean;
  is_partner: boolean;
};

const emptyContact: ContactDraft = {
  full_name: "",
  role_title: "",
  email: "",
  phone: "",
  whatsapp: "",
  linkedin: "",
  instagram: "",
  birthday: "",
  notes: "",
  is_decision_maker: false,
  is_partner: false,
};

function CompaniesPage() {
  const [search, setSearch] = useState("");
  const { data: companies, isLoading } = useCompanies(search.trim() || undefined);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const selected = useMemo(
    () => (companies ?? []).find((c) => c.id === selectedId) ?? null,
    [companies, selectedId],
  );
  const { data: contacts } = useContacts(selected?.id);
  const saveCompany = useSaveCompany();
  const removeCompany = useDeleteCompany();
  const saveContact = useSaveContact();
  const removeContact = useDeleteContact();
  const [companyDraft, setCompanyDraft] = useState<CompanyDraft | null>(null);
  const [contactDraft, setContactDraft] = useState<ContactDraft | null>(null);

  const list = companies ?? [];

  function openCompany(company?: Company) {
    if (!company) {
      setCompanyDraft({ ...emptyCompany });
      return;
    }
    setCompanyDraft({
      id: company.id,
      name: company.name,
      legal_name: company.legal_name ?? "",
      document: company.document ?? "",
      industry: company.industry ?? "",
      size: company.size ?? "",
      website: company.website ?? "",
      phone: company.phone ?? "",
      email: company.email ?? "",
      city: company.city ?? "",
      state: company.state ?? "",
      address: company.address ?? "",
      postal_code: company.postal_code ?? "",
      notes: company.notes ?? "",
      tags: (company.tags ?? []).join(", "),
    });
  }

  function submitCompany() {
    if (!companyDraft) return;
    if (!companyDraft.name.trim()) {
      toast.error("Informe o nome da empresa.");
      return;
    }
    const { id, tags, ...rest } = companyDraft;
    saveCompany.mutate(
      {
        id,
        values: {
          ...Object.fromEntries(
            Object.entries(rest).map(([key, value]) => [key, String(value).trim() || null]),
          ),
          name: companyDraft.name.trim(),
          tags: tags
            .split(",")
            .map((t) => t.trim())
            .filter(Boolean),
        } as Parameters<typeof saveCompany.mutate>[0]["values"],
      },
      {
        onSuccess: () => {
          toast.success(id ? "Empresa atualizada." : "Empresa criada.");
          setCompanyDraft(null);
        },
        onError: (error) => toast.error(error.message),
      },
    );
  }

  function submitContact() {
    if (!contactDraft || !selected) return;
    if (!contactDraft.full_name.trim()) {
      toast.error("Informe o nome do contato.");
      return;
    }
    saveContact.mutate(
      {
        id: contactDraft.id,
        values: {
          company_id: selected.id,
          full_name: contactDraft.full_name.trim(),
          role_title: contactDraft.role_title.trim() || null,
          email: contactDraft.email.trim() || null,
          phone: contactDraft.phone.trim() || null,
          whatsapp: contactDraft.whatsapp.trim() || null,
          linkedin: contactDraft.linkedin.trim() || null,
          instagram: contactDraft.instagram.trim() || null,
          birthday: contactDraft.birthday || null,
          notes: contactDraft.notes.trim() || null,
          is_decision_maker: contactDraft.is_decision_maker,
          is_partner: contactDraft.is_partner,
        },
      },
      {
        onSuccess: () => {
          toast.success("Contato salvo.");
          setContactDraft(null);
        },
        onError: (error) => toast.error(error.message),
      },
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Empresas e contatos"
        description="Cadastro corporativo com sócios, decisores e canais de contato."
        icon={Building2}
        actions={
          <Button onClick={() => openCompany()}>
            <Plus className="mr-2 size-4" />
            Nova empresa
          </Button>
        }
      />

      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard label="Empresas" value={list.length} icon={Building2} index={0} />
        <StatCard
          label="Contatos da empresa"
          value={selected ? (contacts ?? []).length : "—"}
          icon={Users}
          accent="info"
          index={1}
        />
        <StatCard
          label="Cidades"
          value={new Set(list.map((c) => c.city).filter(Boolean)).size}
          icon={MapPin}
          accent="success"
          index={2}
        />
      </div>

      <div className="relative max-w-md">
        <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          className="pl-9"
          placeholder="Buscar empresa pelo nome…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {isLoading ? (
        <ListSkeleton rows={4} />
      ) : list.length === 0 ? (
        <EmptyState
          icon={Building2}
          title="Nenhuma empresa cadastrada"
          description="Cadastre empresas para agrupar contatos, negócios e histórico em um só lugar."
          action={<Button onClick={() => openCompany()}>Cadastrar empresa</Button>}
        />
      ) : (
        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)]">
          <SectionCard title="Carteira" description="Selecione uma empresa para ver os contatos">
            <div className="space-y-2">
              {list.map((company) => (
                <button
                  key={company.id}
                  onClick={() => setSelectedId(company.id)}
                  className={`hover-lift w-full rounded-lg border p-3 text-left transition-colors ${
                    selectedId === company.id ? "border-primary bg-primary/5" : "border-border"
                  }`}
                >
                  <p className="truncate text-sm font-semibold">{company.name}</p>
                  <p className="truncate text-xs text-muted-foreground">
                    {[company.industry, company.city, company.state].filter(Boolean).join(" · ") || "Sem detalhes"}
                  </p>
                  {(company.tags ?? []).length ? (
                    <div className="mt-2 flex flex-wrap gap-1">
                      {(company.tags ?? []).slice(0, 4).map((tag) => (
                        <Badge key={tag} variant="secondary" className="text-[10px]">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  ) : null}
                </button>
              ))}
            </div>
          </SectionCard>

          <div className="space-y-6">
            {selected ? (
              <>
                <SectionCard
                  title={selected.name}
                  description={selected.legal_name ?? undefined}
                  actions={
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" onClick={() => openCompany(selected)}>
                        Editar
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        aria-label="Excluir empresa"
                        onClick={() => {
                          removeCompany.mutate(selected.id);
                          setSelectedId(null);
                        }}
                      >
                        <Trash2 className="size-4 text-destructive" />
                      </Button>
                    </div>
                  }
                >
                  <dl className="grid gap-3 sm:grid-cols-2">
                    <Field label="CNPJ" value={selected.document} />
                    <Field label="Segmento" value={selected.industry} />
                    <Field label="Porte" value={selected.size} />
                    <Field label="Telefone" value={selected.phone} />
                    <Field label="E-mail" value={selected.email} />
                    <Field label="Site" value={selected.website} />
                    <Field
                      label="Endereço"
                      value={[selected.address, selected.city, selected.state, selected.postal_code]
                        .filter(Boolean)
                        .join(", ")}
                    />
                  </dl>
                  {selected.notes ? (
                    <p className="mt-4 rounded-lg bg-muted/50 p-3 text-sm">{selected.notes}</p>
                  ) : null}
                  {selected.city ? (
                    <a
                      className="mt-4 inline-flex items-center gap-1 text-sm text-primary hover:underline"
                      href={`https://www.google.com/maps/search/${encodeURIComponent(
                        `${selected.name} ${selected.city} ${selected.state ?? ""}`,
                      )}`}
                      target="_blank"
                      rel="noreferrer"
                    >
                      <MapPin className="size-4" />
                      Ver no mapa
                    </a>
                  ) : null}
                </SectionCard>

                <SectionCard
                  title="Contatos"
                  description="Proprietário, gerente, financeiro, comprador, marketing, TI"
                  actions={
                    <Button size="sm" onClick={() => setContactDraft({ ...emptyContact })}>
                      <Plus className="mr-1 size-4" />
                      Contato
                    </Button>
                  }
                >
                  {(contacts ?? []).length === 0 ? (
                    <p className="py-6 text-center text-sm text-muted-foreground">
                      Nenhum contato cadastrado nesta empresa.
                    </p>
                  ) : (
                    <div className="divide-y divide-border">
                      {(contacts ?? []).map((contact) => (
                        <div key={contact.id} className="flex flex-wrap items-center gap-2 py-3">
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-sm font-medium">
                              {contact.full_name}
                              {contact.is_decision_maker ? (
                                <Badge className="ml-2 text-[10px]">Decisor</Badge>
                              ) : null}
                              {contact.is_partner ? (
                                <Badge variant="secondary" className="ml-2 text-[10px]">
                                  Sócio
                                </Badge>
                              ) : null}
                            </p>
                            <p className="truncate text-xs text-muted-foreground">
                              {[contact.role_title, contact.email, contact.phone].filter(Boolean).join(" · ")}
                            </p>
                          </div>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() =>
                              setContactDraft({
                                id: contact.id,
                                full_name: contact.full_name,
                                role_title: contact.role_title ?? "",
                                email: contact.email ?? "",
                                phone: contact.phone ?? "",
                                whatsapp: contact.whatsapp ?? "",
                                linkedin: contact.linkedin ?? "",
                                instagram: contact.instagram ?? "",
                                birthday: contact.birthday ?? "",
                                notes: contact.notes ?? "",
                                is_decision_maker: contact.is_decision_maker,
                                is_partner: contact.is_partner,
                              })
                            }
                          >
                            Editar
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            aria-label="Excluir contato"
                            onClick={() => removeContact.mutate(contact.id)}
                          >
                            <Trash2 className="size-4 text-destructive" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </SectionCard>
              </>
            ) : (
              <EmptyState
                icon={Users}
                title="Selecione uma empresa"
                description="Escolha uma empresa na lista para ver detalhes, contatos e ações."
              />
            )}
          </div>
        </div>
      )}

      <Dialog open={Boolean(companyDraft)} onOpenChange={(open) => !open && setCompanyDraft(null)}>
        <DialogContent className="max-h-[85vh] max-w-2xl overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{companyDraft?.id ? "Editar empresa" : "Nova empresa"}</DialogTitle>
          </DialogHeader>
          {companyDraft ? (
            <div className="grid gap-4 sm:grid-cols-2">
              <TextField label="Nome fantasia" value={companyDraft.name} onChange={(v) => setCompanyDraft({ ...companyDraft, name: v })} />
              <TextField label="Razão social" value={companyDraft.legal_name} onChange={(v) => setCompanyDraft({ ...companyDraft, legal_name: v })} />
              <TextField label="CNPJ" value={companyDraft.document} onChange={(v) => setCompanyDraft({ ...companyDraft, document: v })} />
              <TextField label="Segmento" value={companyDraft.industry} onChange={(v) => setCompanyDraft({ ...companyDraft, industry: v })} />
              <TextField label="Porte / funcionários" value={companyDraft.size} onChange={(v) => setCompanyDraft({ ...companyDraft, size: v })} />
              <TextField label="Site" value={companyDraft.website} onChange={(v) => setCompanyDraft({ ...companyDraft, website: v })} />
              <TextField label="Telefone" value={companyDraft.phone} onChange={(v) => setCompanyDraft({ ...companyDraft, phone: v })} />
              <TextField label="E-mail" value={companyDraft.email} onChange={(v) => setCompanyDraft({ ...companyDraft, email: v })} />
              <TextField label="Cidade" value={companyDraft.city} onChange={(v) => setCompanyDraft({ ...companyDraft, city: v })} />
              <TextField label="Estado" value={companyDraft.state} onChange={(v) => setCompanyDraft({ ...companyDraft, state: v })} />
              <TextField label="CEP" value={companyDraft.postal_code} onChange={(v) => setCompanyDraft({ ...companyDraft, postal_code: v })} />
              <TextField label="Endereço" value={companyDraft.address} onChange={(v) => setCompanyDraft({ ...companyDraft, address: v })} />
              <TextField
                label="Tags (separadas por vírgula)"
                value={companyDraft.tags}
                onChange={(v) => setCompanyDraft({ ...companyDraft, tags: v })}
              />
              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="company-notes">Anotações</Label>
                <Textarea
                  id="company-notes"
                  rows={3}
                  maxLength={4000}
                  value={companyDraft.notes}
                  onChange={(e) => setCompanyDraft({ ...companyDraft, notes: e.target.value })}
                />
              </div>
            </div>
          ) : null}
          <DialogFooter>
            <Button onClick={submitCompany} disabled={saveCompany.isPending}>
              Salvar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={Boolean(contactDraft)} onOpenChange={(open) => !open && setContactDraft(null)}>
        <DialogContent className="max-h-[85vh] max-w-2xl overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{contactDraft?.id ? "Editar contato" : "Novo contato"}</DialogTitle>
          </DialogHeader>
          {contactDraft ? (
            <div className="grid gap-4 sm:grid-cols-2">
              <TextField label="Nome" value={contactDraft.full_name} onChange={(v) => setContactDraft({ ...contactDraft, full_name: v })} />
              <TextField label="Cargo" value={contactDraft.role_title} onChange={(v) => setContactDraft({ ...contactDraft, role_title: v })} />
              <TextField label="E-mail" value={contactDraft.email} onChange={(v) => setContactDraft({ ...contactDraft, email: v })} />
              <TextField label="Telefone" value={contactDraft.phone} onChange={(v) => setContactDraft({ ...contactDraft, phone: v })} />
              <TextField label="WhatsApp" value={contactDraft.whatsapp} onChange={(v) => setContactDraft({ ...contactDraft, whatsapp: v })} />
              <TextField label="LinkedIn" value={contactDraft.linkedin} onChange={(v) => setContactDraft({ ...contactDraft, linkedin: v })} />
              <TextField label="Instagram" value={contactDraft.instagram} onChange={(v) => setContactDraft({ ...contactDraft, instagram: v })} />
              <div className="space-y-2">
                <Label htmlFor="contact-birthday">Aniversário</Label>
                <Input
                  id="contact-birthday"
                  type="date"
                  value={contactDraft.birthday}
                  onChange={(e) => setContactDraft({ ...contactDraft, birthday: e.target.value })}
                />
              </div>
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={contactDraft.is_decision_maker}
                  onChange={(e) => setContactDraft({ ...contactDraft, is_decision_maker: e.target.checked })}
                />
                É decisor
              </label>
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={contactDraft.is_partner}
                  onChange={(e) => setContactDraft({ ...contactDraft, is_partner: e.target.checked })}
                />
                É sócio
              </label>
              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="contact-notes">Observações e preferências</Label>
                <Textarea
                  id="contact-notes"
                  rows={3}
                  maxLength={2000}
                  value={contactDraft.notes}
                  onChange={(e) => setContactDraft({ ...contactDraft, notes: e.target.value })}
                />
              </div>
            </div>
          ) : null}
          <DialogFooter>
            <Button onClick={submitContact} disabled={saveContact.isPending}>
              Salvar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function Field({ label, value }: { label: string; value?: string | null }) {
  return (
    <div className="min-w-0">
      <dt className="text-[11px] uppercase tracking-wide text-muted-foreground">{label}</dt>
      <dd className="truncate text-sm">{value || "—"}</dd>
    </div>
  );
}

function TextField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  const id = label.toLowerCase().replace(/[^a-z]+/g, "-");
  return (
    <div className="space-y-2">
      <Label htmlFor={id}>{label}</Label>
      <Input id={id} value={value} maxLength={200} onChange={(e) => onChange(e.target.value)} />
    </div>
  );
}
