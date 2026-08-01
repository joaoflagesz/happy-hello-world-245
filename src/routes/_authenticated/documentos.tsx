import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useRef, useState } from "react";
import {
  Download,
  File as FileIcon,
  FolderPlus,
  Folder,
  HardDrive,
  Layers,
  Share2,
  Trash2,
  Upload,
} from "lucide-react";
import { toast } from "sonner";
import { PageHeader, EmptyState, SectionCard, StatCard, StaggerItem, StaggerList } from "@/components/ui-kit";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  docSignedUrl,
  formatBytes,
  useDeleteDocFile,
  useDeleteDocFolder,
  useDocFiles,
  useDocFolders,
  useSaveDocFolder,
  useUpdateDocFile,
  useUploadDocs,
  type DocFile,
} from "@/features/office/api";

const DESCRIPTION =
  "Drive interno do Prospecta: organize contratos, propostas e materiais em pastas, com versões e compartilhamento.";

export const Route = createFileRoute("/_authenticated/documentos")({
  head: () => ({
    meta: [
      { title: "Documentos — Prospecta CRM" },
      { name: "description", content: DESCRIPTION },
      { property: "og:title", content: "Documentos — Prospecta CRM" },
      { property: "og:description", content: DESCRIPTION },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: DocumentsPage,
});

const FOLDER_COLORS = ["#3b82f6", "#8b5cf6", "#ec4899", "#f59e0b", "#10b981", "#64748b"];

function DocumentsPage() {
  const { data: folders } = useDocFolders();
  const [activeFolder, setActiveFolder] = useState<string | null>(null);
  const { data: files, isLoading } = useDocFiles(activeFolder);

  const saveFolder = useSaveDocFolder();
  const deleteFolder = useDeleteDocFolder();
  const upload = useUploadDocs();
  const updateFile = useUpdateDocFile();
  const deleteFile = useDeleteDocFile();

  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  const [folderOpen, setFolderOpen] = useState(false);
  const [folderForm, setFolderForm] = useState({ name: "", color: FOLDER_COLORS[0] });

  const totals = useMemo(() => {
    const rows = files ?? [];
    return {
      count: rows.length,
      size: rows.reduce((acc, f) => acc + Number(f.size_bytes ?? 0), 0),
      shared: rows.filter((f) => f.is_shared).length,
      versions: rows.filter((f) => f.version > 1).length,
    };
  }, [files]);

  async function handleFiles(selected: FileList | null) {
    if (!selected || selected.length === 0) return;
    try {
      await upload.mutateAsync({ files: Array.from(selected), folderId: activeFolder });
      toast.success(`${selected.length} arquivo(s) enviado(s)`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Falha no envio");
    }
  }

  async function openFile(file: DocFile) {
    try {
      const url = await docSignedUrl(file.file_path);
      window.open(url, "_blank");
    } catch {
      toast.error("Não foi possível abrir o arquivo");
    }
  }

  async function createFolder() {
    if (!folderForm.name.trim()) {
      toast.error("Informe o nome da pasta");
      return;
    }
    try {
      await saveFolder.mutateAsync({ name: folderForm.name.trim(), color: folderForm.color });
      setFolderOpen(false);
      setFolderForm({ name: "", color: FOLDER_COLORS[0] });
      toast.success("Pasta criada");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Erro ao criar pasta");
    }
  }

  return (
    <div className="mx-auto w-full max-w-7xl">
      <PageHeader
        title="Documentos"
        description={DESCRIPTION}
        icon={HardDrive}
        actions={
          <>
            <Button variant="outline" onClick={() => setFolderOpen(true)}>
              <FolderPlus className="mr-2 size-4" /> Nova pasta
            </Button>
            <Button onClick={() => inputRef.current?.click()} disabled={upload.isPending}>
              <Upload className="mr-2 size-4" />
              {upload.isPending ? "Enviando…" : "Enviar arquivos"}
            </Button>
          </>
        }
      />

      <input
        ref={inputRef}
        type="file"
        multiple
        className="hidden"
        onChange={(e) => {
          void handleFiles(e.target.files);
          e.target.value = "";
        }}
      />

      <div className="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Arquivos" value={totals.count} icon={FileIcon} index={0} />
        <StatCard label="Armazenamento" value={formatBytes(totals.size)} icon={HardDrive} index={1} />
        <StatCard label="Compartilhados" value={totals.shared} icon={Share2} accent="success" index={2} />
        <StatCard label="Com versões" value={totals.versions} icon={Layers} accent="warning" index={3} />
      </div>

      <div className="grid gap-4 lg:grid-cols-[260px_1fr]">
        <SectionCard title="Pastas">
          <div className="space-y-1">
            <button
              onClick={() => setActiveFolder(null)}
              className={cn(
                "flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm transition-colors",
                activeFolder === null ? "bg-accent text-accent-foreground" : "hover:bg-muted",
              )}
            >
              <Folder className="size-4" /> Todos os arquivos
            </button>
            {(folders ?? []).map((folder) => (
              <div key={folder.id} className="group flex items-center gap-1">
                <button
                  onClick={() => setActiveFolder(folder.id)}
                  className={cn(
                    "flex flex-1 items-center gap-2 rounded-lg px-3 py-2 text-left text-sm transition-colors",
                    activeFolder === folder.id ? "bg-accent text-accent-foreground" : "hover:bg-muted",
                  )}
                >
                  <Folder className="size-4" style={{ color: folder.color }} />
                  <span className="truncate">{folder.name}</span>
                </button>
                <Button
                  size="icon"
                  variant="ghost"
                  className="size-8 opacity-0 transition-opacity group-hover:opacity-100"
                  onClick={() => {
                    deleteFolder.mutate(folder.id);
                    if (activeFolder === folder.id) setActiveFolder(null);
                  }}
                >
                  <Trash2 className="size-3.5 text-destructive" />
                </Button>
              </div>
            ))}
          </div>
        </SectionCard>

        <SectionCard title="Arquivos" description="Arraste e solte para enviar">
          <div
            onDragOver={(e) => {
              e.preventDefault();
              setDragging(true);
            }}
            onDragLeave={() => setDragging(false)}
            onDrop={(e) => {
              e.preventDefault();
              setDragging(false);
              void handleFiles(e.dataTransfer.files);
            }}
            className={cn(
              "mb-4 rounded-xl border-2 border-dashed p-6 text-center text-sm transition-colors",
              dragging ? "border-primary bg-primary/5" : "border-border text-muted-foreground",
            )}
          >
            <Upload className="mx-auto mb-2 size-5" />
            Solte os arquivos aqui ou clique em “Enviar arquivos”.
          </div>

          {isLoading ? (
            <p className="py-8 text-center text-sm text-muted-foreground">Carregando…</p>
          ) : (files ?? []).length === 0 ? (
            <EmptyState
              icon={FileIcon}
              title="Nenhum arquivo nesta pasta"
              description="Envie contratos, propostas, imagens e planilhas com controle de versão."
            />
          ) : (
            <StaggerList className="divide-y divide-border">
              {(files ?? []).map((file) => (
                <StaggerItem key={file.id}>
                  <div className="flex flex-col gap-2 py-3 sm:flex-row sm:items-center sm:justify-between">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <FileIcon className="size-4 shrink-0 text-muted-foreground" />
                        <p className="truncate text-sm font-medium">{file.name}</p>
                        {file.version > 1 ? <Badge variant="secondary">v{file.version}</Badge> : null}
                        {file.is_shared ? <Badge>Compartilhado</Badge> : null}
                      </div>
                      <p className="mt-0.5 text-xs text-muted-foreground">
                        {formatBytes(Number(file.size_bytes ?? 0))} ·{" "}
                        {new Date(file.created_at).toLocaleString("pt-BR")}
                      </p>
                    </div>
                    <div className="flex shrink-0 items-center gap-1">
                      <Button size="sm" variant="ghost" onClick={() => void openFile(file)}>
                        <Download className="mr-2 size-4" /> Abrir
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={async () => {
                          updateFile.mutate({ id: file.id, is_shared: !file.is_shared });
                          if (!file.is_shared) {
                            try {
                              const url = await docSignedUrl(file.file_path);
                              await navigator.clipboard.writeText(url);
                              toast.success("Link temporário copiado (10 min)");
                            } catch {
                              toast.message("Arquivo marcado como compartilhado");
                            }
                          }
                        }}
                      >
                        <Share2 className="size-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="text-destructive"
                        onClick={() => deleteFile.mutate(file)}
                      >
                        <Trash2 className="size-4" />
                      </Button>
                    </div>
                  </div>
                </StaggerItem>
              ))}
            </StaggerList>
          )}
        </SectionCard>
      </div>

      <Dialog open={folderOpen} onOpenChange={setFolderOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Nova pasta</DialogTitle>
            <DialogDescription>Organize seus documentos por cliente, tipo ou período.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-3">
            <div>
              <Label>Nome</Label>
              <Input
                value={folderForm.name}
                onChange={(e) => setFolderForm({ ...folderForm, name: e.target.value })}
                placeholder="Contratos 2026"
              />
            </div>
            <div>
              <Label>Cor</Label>
              <div className="mt-1 flex gap-2">
                {FOLDER_COLORS.map((color) => (
                  <button
                    key={color}
                    type="button"
                    onClick={() => setFolderForm({ ...folderForm, color })}
                    className={cn(
                      "size-8 rounded-full border-2 transition-transform hover:scale-110",
                      folderForm.color === color ? "border-foreground" : "border-transparent",
                    )}
                    style={{ backgroundColor: color }}
                    aria-label={`Cor ${color}`}
                  />
                ))}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button onClick={createFolder}>Criar pasta</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
