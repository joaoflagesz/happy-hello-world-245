import { useCallback, useState } from "react";
import { useDropzone } from "react-dropzone";
import Papa from "papaparse";
import * as XLSX from "xlsx";
import { FileSpreadsheet, Loader2, UploadCloud } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { calculateScore, temperatureFromScore } from "./constants";
import type { TablesInsert } from "@/integrations/supabase/types";

type RawRow = Record<string, unknown>;

/** Aliases das colunas exportadas pelo Apify (Google Maps), CSV e Excel. */
const FIELD_ALIASES: Record<string, string[]> = {
  company_name: ["title", "name", "empresa", "nome", "company", "companyname", "placename"],
  contact_name: ["contactname", "responsavel", "contato", "ownername"],
  phone: ["phone", "telefone", "phoneunformatted", "telephone", "phonenumber"],
  whatsapp: ["whatsapp", "whatsappnumber", "zap"],
  website: ["website", "site", "url", "webpage", "domain"],
  instagram: ["instagram", "instagramurl", "instagrams"],
  facebook: ["facebook", "facebookurl", "facebooks"],
  category: ["categoryname", "category", "categoria", "type", "maincategory"],
  city: ["city", "cidade", "locality"],
  state: ["state", "estado", "region", "uf"],
  postal_code: ["postalcode", "cep", "zip", "zipcode"],
  address: ["address", "endereco", "street", "fulladdress"],
  reviews_count: ["reviewscount", "reviews", "avaliacoes", "usertotalratings", "totalreviews"],
  rating: ["totalscore", "rating", "nota", "score", "stars", "averagerating"],
  latitude: ["latitude", "lat"],
  longitude: ["longitude", "lng", "lon"],
  description: ["description", "descricao", "about"],
  opening_hours: ["openinghours", "horario", "hours", "workinghours"],
  google_maps_url: ["url", "googlemapsurl", "mapsurl", "placeurl", "searchpageurl"],
};

const normalizeKey = (key: string) => key.toLowerCase().replace(/[^a-z0-9]/g, "");

function pick(row: RawRow, field: string): unknown {
  const aliases = FIELD_ALIASES[field] ?? [];
  for (const [key, value] of Object.entries(row)) {
    if (aliases.includes(normalizeKey(key)) && value !== "" && value != null) return value;
  }
  return null;
}

const asText = (value: unknown) => {
  if (value == null) return null;
  const text = String(value).trim();
  return text.length ? text.slice(0, 2000) : null;
};

const asNumber = (value: unknown) => {
  if (value == null || value === "") return null;
  const parsed = Number(String(value).replace(",", "."));
  return Number.isFinite(parsed) ? parsed : null;
};

export function mapRow(row: RawRow, ownerId: string): TablesInsert<"leads"> | null {
  const companyName = asText(pick(row, "company_name"));
  if (!companyName) return null;

  const website = asText(pick(row, "website"));
  const phone = asText(pick(row, "phone"));
  const base = {
    company_name: companyName,
    contact_name: asText(pick(row, "contact_name")),
    phone,
    whatsapp: asText(pick(row, "whatsapp")) ?? phone,
    website,
    instagram: asText(pick(row, "instagram")),
    facebook: asText(pick(row, "facebook")),
    category: asText(pick(row, "category")),
    city: asText(pick(row, "city")),
    state: asText(pick(row, "state")),
    postal_code: asText(pick(row, "postal_code")),
    address: asText(pick(row, "address")),
    reviews_count: Math.trunc(asNumber(pick(row, "reviews_count")) ?? 0),
    rating: asNumber(pick(row, "rating")),
    latitude: asNumber(pick(row, "latitude")),
    longitude: asNumber(pick(row, "longitude")),
    description: asText(pick(row, "description")),
    opening_hours: asText(pick(row, "opening_hours")),
    google_maps_url: asText(pick(row, "google_maps_url")),
  };

  const score = calculateScore(base);

  return {
    ...base,
    owner_id: ownerId,
    source: "import",
    score,
    temperature: temperatureFromScore(score),
    site_status: website ? "possui_site" : "sem_site",
  };
}

async function parseFile(file: File): Promise<RawRow[]> {
  if (file.name.toLowerCase().endsWith(".csv")) {
    return new Promise((resolve, reject) => {
      Papa.parse<RawRow>(file, {
        header: true,
        skipEmptyLines: true,
        complete: (result) => resolve(result.data),
        error: reject,
      });
    });
  }
  if (file.name.toLowerCase().endsWith(".json")) {
    const parsed = JSON.parse(await file.text());
    return Array.isArray(parsed) ? (parsed as RawRow[]) : [];
  }
  const workbook = XLSX.read(await file.arrayBuffer(), { type: "array" });
  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  return XLSX.utils.sheet_to_json<RawRow>(sheet, { defval: null });
}

export function ImportLeadsDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const [busy, setBusy] = useState(false);
  const [summary, setSummary] = useState<{ imported: number; skipped: number } | null>(null);
  const queryClient = useQueryClient();

  const onDrop = useCallback(
    async (files: File[]) => {
      const file = files[0];
      if (!file) return;
      setBusy(true);
      setSummary(null);
      try {
        const { data: userData } = await supabase.auth.getUser();
        const ownerId = userData.user?.id;
        if (!ownerId) throw new Error("Sessão expirada");

        const rows = await parseFile(file);
        const mapped = rows
          .map((row) => mapRow(row, ownerId))
          .filter((row): row is TablesInsert<"leads"> => row !== null);

        if (!mapped.length) {
          toast.error("Nenhum lead válido encontrado no arquivo.");
          return;
        }

        let imported = 0;
        for (let i = 0; i < mapped.length; i += 200) {
          const chunk = mapped.slice(i, i + 200);
          const { data, error } = await supabase.from("leads").insert(chunk).select("id");
          if (error) throw error;
          imported += data?.length ?? 0;
        }

        setSummary({ imported, skipped: rows.length - imported });
        toast.success(`${imported} leads importados com sucesso.`);
        void queryClient.invalidateQueries({ queryKey: ["leads"] });
      } catch (error) {
        console.error(error);
        toast.error("Falha na importação. Verifique o arquivo e tente novamente.");
      } finally {
        setBusy(false);
      }
    },
    [queryClient],
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    multiple: false,
    disabled: busy,
    accept: {
      "text/csv": [".csv"],
      "application/json": [".json"],
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": [".xlsx"],
      "application/vnd.ms-excel": [".xls"],
    },
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Importar leads</DialogTitle>
          <DialogDescription>
            Aceita CSV, Excel (.xlsx/.xls) e JSON exportado do Apify — Google Maps. As colunas são
            reconhecidas automaticamente.
          </DialogDescription>
        </DialogHeader>

        <div
          {...getRootProps()}
          className={`flex cursor-pointer flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed p-10 text-center transition-colors ${
            isDragActive ? "border-primary bg-primary/5" : "border-border hover:border-primary/60"
          }`}
        >
          <input {...getInputProps()} />
          {busy ? (
            <Loader2 className="size-8 animate-spin text-primary" />
          ) : (
            <UploadCloud className="size-8 text-muted-foreground" />
          )}
          <div>
            <p className="text-sm font-medium">
              {busy ? "Importando…" : "Arraste o arquivo ou clique para selecionar"}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">CSV · XLSX · XLS · JSON (Apify)</p>
          </div>
        </div>

        {summary ? (
          <div className="flex items-center gap-3 rounded-xl bg-muted p-4 text-sm">
            <FileSpreadsheet className="size-4 text-primary" />
            <span>
              <strong>{summary.imported}</strong> importados
              {summary.skipped > 0 ? ` · ${summary.skipped} ignorados (sem nome da empresa)` : ""}
            </span>
          </div>
        ) : null}

        <div className="flex justify-end">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={busy}>
            Fechar
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
