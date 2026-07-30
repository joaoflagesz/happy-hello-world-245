import { useMemo, useState } from "react";
import { Link, createFileRoute } from "@tanstack/react-router";
import {
  flexRender,
  getCoreRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
  type ColumnDef,
  type SortingState,
} from "@tanstack/react-table";
import {
  ChevronLeft,
  ChevronRight,
  Download,
  MessageCircle,
  Plus,
  Search,
  Trash2,
  Upload,
} from "lucide-react";
import { toast } from "sonner";
import * as XLSX from "xlsx";
import { useDeleteLead, useLeads, useUpdateLead, type LeadFilters } from "@/features/leads/api";
import {
  SITE_STATUSES,
  SITE_STATUS_LABEL,
  STAGES,
  STAGE_LABEL,
  TEMPERATURES,
  formatPhone,
  toWhatsappNumber,
  type Lead,
} from "@/features/leads/constants";
import { ImportLeadsDialog } from "@/features/leads/import-dialog";
import { WhatsappDialog } from "@/features/leads/whatsapp-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const title = "Leads — Prospecta CRM";
const description =
  "Lista completa de leads importados do Google Maps com score, status de site e ações de contato.";

export const Route = createFileRoute("/_authenticated/leads/")({
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
  component: LeadsPage,
});

const ALL = "todos";

function LeadsPage() {
  const [filters, setFilters] = useState<LeadFilters>({});
  const [search, setSearch] = useState("");
  const [importOpen, setImportOpen] = useState(false);
  const [whatsappLead, setWhatsappLead] = useState<Lead | null>(null);
  const [sorting, setSorting] = useState<SortingState>([{ id: "score", desc: true }]);

  const { data: leads, isLoading } = useLeads(filters);
  const updateLead = useUpdateLead();
  const deleteLead = useDeleteLead();

  const columns = useMemo<ColumnDef<Lead>[]>(
    () => [
      {
        accessorKey: "company_name",
        header: "Empresa",
        cell: ({ row }) => (
          <div className="min-w-[180px]">
            <Link
              to="/leads/$id"
              params={{ id: row.original.id }}
              className="font-medium underline-offset-4 hover:underline"
            >
              {row.original.company_name}
            </Link>
            <p className="text-xs text-muted-foreground">
              {row.original.category ?? "Sem categoria"}
            </p>
          </div>
        ),
      },
      {
        accessorKey: "city",
        header: "Cidade",
        cell: ({ row }) => (
          <span className="text-sm">
            {row.original.city ?? "—"}
            {row.original.state ? `/${row.original.state}` : ""}
          </span>
        ),
      },
      {
        accessorKey: "phone",
        header: "Telefone",
        cell: ({ row }) => <span className="text-sm">{formatPhone(row.original.phone)}</span>,
      },
      {
        accessorKey: "site_status",
        header: "Site",
        cell: ({ row }) => {
          const hasSite = row.original.site_status !== "sem_site";
          return (
            <div className="flex items-center gap-2">
              <span
                className={`size-2 rounded-full ${hasSite ? "bg-emerald-500" : "bg-destructive"}`}
              />
              {row.original.website ? (
                <a
                  href={row.original.website}
                  target="_blank"
                  rel="noreferrer noopener"
                  className="text-sm underline-offset-4 hover:underline"
                >
                  {SITE_STATUS_LABEL[row.original.site_status]}
                </a>
              ) : (
                <span className="text-sm">{SITE_STATUS_LABEL[row.original.site_status]}</span>
              )}
            </div>
          );
        },
      },
      {
        accessorKey: "score",
        header: "Score",
        cell: ({ row }) => {
          const temp = row.original.temperature;
          const tone =
            temp === "quente"
              ? "bg-destructive/10 text-destructive"
              : temp === "morno"
                ? "bg-amber-500/10 text-amber-600 dark:text-amber-400"
                : "bg-sky-500/10 text-sky-600 dark:text-sky-400";
          return (
            <span className={`rounded-lg px-2 py-1 text-xs font-semibold ${tone}`}>
              {row.original.score} · {temp}
            </span>
          );
        },
      },
      {
        accessorKey: "stage",
        header: "Etapa",
        cell: ({ row }) => (
          <Select
            value={row.original.stage}
            onValueChange={(value) =>
              updateLead.mutate({ id: row.original.id, values: { stage: value as Lead["stage"] } })
            }
          >
            <SelectTrigger className="h-8 w-[170px] text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {STAGES.map((stage) => (
                <SelectItem key={stage.value} value={stage.value} className="text-xs">
                  {stage.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        ),
      },
      {
        accessorKey: "last_contact_at",
        header: "Último contato",
        cell: ({ row }) =>
          row.original.last_contact_at ? (
            <span className="text-xs text-muted-foreground">
              {new Date(row.original.last_contact_at).toLocaleDateString("pt-BR")}
            </span>
          ) : (
            <Badge variant="outline" className="text-xs">
              Não contatado
            </Badge>
          ),
      },
      {
        id: "actions",
        header: "",
        cell: ({ row }) => (
          <div className="flex justify-end gap-1">
            <Button
              size="sm"
              variant="ghost"
              className="text-emerald-600 hover:text-emerald-600 dark:text-emerald-400"
              onClick={() => {
                if (!toWhatsappNumber(row.original.whatsapp ?? row.original.phone)) {
                  toast.error("Este lead não possui telefone válido.");
                  return;
                }
                setWhatsappLead(row.original);
              }}
            >
              <MessageCircle className="size-4" />
            </Button>
            <Button
              size="sm"
              variant="ghost"
              className="text-muted-foreground hover:text-destructive"
              onClick={() => {
                if (!confirm(`Excluir o lead ${row.original.company_name}?`)) return;
                deleteLead.mutate(row.original.id, {
                  onSuccess: () => toast.success("Lead excluído."),
                });
              }}
            >
              <Trash2 className="size-4" />
            </Button>
          </div>
        ),
      },
    ],
    [deleteLead, updateLead],
  );

  const table = useReactTable({
    data: leads ?? [],
    columns,
    state: { sorting },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    initialState: { pagination: { pageSize: 25 } },
  });

  function exportXlsx() {
    if (!leads?.length) {
      toast.error("Nada para exportar.");
      return;
    }
    const sheet = XLSX.utils.json_to_sheet(
      leads.map((lead) => ({
        Empresa: lead.company_name,
        Telefone: lead.phone,
        WhatsApp: lead.whatsapp,
        Site: lead.website,
        "Status do site": SITE_STATUS_LABEL[lead.site_status],
        Categoria: lead.category,
        Cidade: lead.city,
        Estado: lead.state,
        Avaliações: lead.reviews_count,
        Nota: lead.rating,
        Score: lead.score,
        Temperatura: lead.temperature,
        Etapa: STAGE_LABEL[lead.stage],
      })),
    );
    const book = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(book, sheet, "Leads");
    XLSX.writeFile(book, `leads-${new Date().toISOString().slice(0, 10)}.xlsx`);
  }

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Leads</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {leads?.length ?? 0} leads na sua base.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" onClick={exportXlsx}>
            <Download className="mr-2 size-4" />
            Exportar
          </Button>
          <Button onClick={() => setImportOpen(true)}>
            <Upload className="mr-2 size-4" />
            Importar leads
          </Button>
        </div>
      </header>

      <div className="surface-card flex flex-wrap items-center gap-3 rounded-2xl p-4">
        <form
          className="relative min-w-[220px] flex-1"
          onSubmit={(event) => {
            event.preventDefault();
            setFilters((prev) => ({ ...prev, search: search.trim() || undefined }));
          }}
        >
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Buscar por empresa, telefone, cidade ou categoria"
            className="pl-9"
          />
        </form>

        <FilterSelect
          placeholder="Etapa"
          value={filters.stage}
          options={STAGES}
          onChange={(value) => setFilters((prev) => ({ ...prev, stage: value }))}
        />
        <FilterSelect
          placeholder="Status do site"
          value={filters.siteStatus}
          options={SITE_STATUSES}
          onChange={(value) => setFilters((prev) => ({ ...prev, siteStatus: value }))}
        />
        <FilterSelect
          placeholder="Temperatura"
          value={filters.temperature}
          options={TEMPERATURES}
          onChange={(value) => setFilters((prev) => ({ ...prev, temperature: value }))}
        />
      </div>

      <div className="surface-card overflow-hidden rounded-2xl">
        {isLoading ? (
          <div className="space-y-3 p-5">
            {Array.from({ length: 8 }).map((_, i) => (
              <Skeleton key={i} className="h-10 w-full rounded-lg" />
            ))}
          </div>
        ) : table.getRowModel().rows.length === 0 ? (
          <div className="flex flex-col items-center gap-3 p-16 text-center">
            <Upload className="size-8 text-muted-foreground" />
            <div>
              <p className="font-medium">Nenhum lead encontrado</p>
              <p className="mt-1 text-sm text-muted-foreground">
                Importe um arquivo do Google Maps (Apify), CSV ou Excel para começar.
              </p>
            </div>
            <Button onClick={() => setImportOpen(true)}>
              <Plus className="mr-2 size-4" />
              Importar agora
            </Button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-border bg-muted/40">
                {table.getHeaderGroups().map((headerGroup) => (
                  <tr key={headerGroup.id}>
                    {headerGroup.headers.map((header) => (
                      <th
                        key={header.id}
                        onClick={header.column.getToggleSortingHandler()}
                        className="cursor-pointer whitespace-nowrap px-4 py-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground"
                      >
                        {flexRender(header.column.columnDef.header, header.getContext())}
                      </th>
                    ))}
                  </tr>
                ))}
              </thead>
              <tbody>
                {table.getRowModel().rows.map((row) => (
                  <tr
                    key={row.id}
                    className="border-b border-border/60 transition-colors last:border-0 hover:bg-muted/40"
                  >
                    {row.getVisibleCells().map((cell) => (
                      <td key={cell.id} className="px-4 py-3 align-middle">
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {table.getPageCount() > 1 ? (
          <div className="flex items-center justify-between border-t border-border px-4 py-3 text-sm">
            <span className="text-muted-foreground">
              Página {table.getState().pagination.pageIndex + 1} de {table.getPageCount()}
            </span>
            <div className="flex gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={() => table.previousPage()}
                disabled={!table.getCanPreviousPage()}
              >
                <ChevronLeft className="size-4" />
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => table.nextPage()}
                disabled={!table.getCanNextPage()}
              >
                <ChevronRight className="size-4" />
              </Button>
            </div>
          </div>
        ) : null}
      </div>

      <ImportLeadsDialog open={importOpen} onOpenChange={setImportOpen} />
      <WhatsappDialog lead={whatsappLead} onOpenChange={(open) => !open && setWhatsappLead(null)} />
    </div>
  );
}

function FilterSelect({
  placeholder,
  value,
  options,
  onChange,
}: {
  placeholder: string;
  value?: string;
  options: { value: string; label: string }[];
  onChange: (value: string | undefined) => void;
}) {
  return (
    <Select
      value={value ?? ALL}
      onValueChange={(next) => onChange(next === ALL ? undefined : next)}
    >
      <SelectTrigger className="w-[170px]">
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value={ALL}>{placeholder}: todos</SelectItem>
        {options.map((option) => (
          <SelectItem key={option.value} value={option.value}>
            {option.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
