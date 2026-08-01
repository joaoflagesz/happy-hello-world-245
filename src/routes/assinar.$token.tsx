import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { CheckCircle2, FileSignature, Loader2, ShieldCheck, XCircle } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";

const DESCRIPTION = "Leia o contrato e confirme seu aceite online de forma rápida e segura.";

export const Route = createFileRoute("/assinar/$token")({
  head: () => ({
    meta: [
      { title: "Assinar contrato — Prospecta" },
      { name: "description", content: DESCRIPTION },
      { property: "og:title", content: "Assinar contrato — Prospecta" },
      { property: "og:description", content: DESCRIPTION },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: SignPage,
  errorComponent: () => (
    <Shell>
      <p className="text-sm text-muted-foreground">Não foi possível carregar o contrato.</p>
    </Shell>
  ),
  notFoundComponent: () => (
    <Shell>
      <p className="text-sm text-muted-foreground">Contrato não encontrado.</p>
    </Shell>
  ),
});

type Doc = {
  id: string;
  title: string;
  content: string;
  signer_name: string;
  status: string;
  signed_name: string | null;
  signed_at: string | null;
  expires_at: string | null;
};

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <main className="flex min-h-screen items-center justify-center bg-muted/30 p-4">
      <Card className="w-full max-w-3xl p-6 sm:p-8">{children}</Card>
    </main>
  );
}

function SignPage() {
  const { token } = Route.useParams();
  const [doc, setDoc] = useState<Doc | null>(null);
  const [loading, setLoading] = useState(true);
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);

  async function load() {
    const { data, error } = await supabase.rpc("get_signature_by_token", { _token: token });
    setLoading(false);
    if (error) return;
    const row = Array.isArray(data) ? data[0] : data;
    setDoc((row as Doc) ?? null);
  }

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  async function act(kind: "sign" | "decline") {
    if (kind === "sign" && name.trim().length < 3) {
      toast.error("Digite seu nome completo para assinar");
      return;
    }
    setBusy(true);
    const agent = navigator.userAgent;
    const { data, error } =
      kind === "sign"
        ? await supabase.rpc("sign_document", {
            _token: token,
            _signed_name: name.trim(),
            _ip: null,
            _user_agent: agent,
          })
        : await supabase.rpc("decline_document", {
            _token: token,
            _reason: "Recusado pelo signatário",
            _ip: null,
            _user_agent: agent,
          });
    setBusy(false);
    if (error || data === false) {
      toast.error("Não foi possível concluir. O contrato pode ter expirado.");
      return;
    }
    toast.success(kind === "sign" ? "Contrato assinado com sucesso!" : "Contrato recusado");
    void load();
  }

  if (loading) {
    return (
      <Shell>
        <div className="flex items-center justify-center gap-2 py-10 text-sm text-muted-foreground">
          <Loader2 className="size-4 animate-spin" /> Carregando contrato…
        </div>
      </Shell>
    );
  }

  if (!doc) {
    return (
      <Shell>
        <div className="py-10 text-center">
          <XCircle className="mx-auto mb-3 size-8 text-destructive" />
          <h1 className="text-lg font-semibold">Contrato indisponível</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            O link pode ter expirado ou o contrato ainda não foi liberado.
          </p>
        </div>
      </Shell>
    );
  }

  const expired = doc.expires_at ? new Date(doc.expires_at) < new Date() : false;
  const closed = doc.status !== "enviado" || expired;

  return (
    <Shell>
      <header className="mb-6 flex items-start gap-3 border-b border-border pb-5">
        <div className="flex size-11 items-center justify-center rounded-xl bg-primary text-primary-foreground">
          <FileSignature className="size-5" />
        </div>
        <div>
          <h1 className="text-xl font-semibold tracking-tight">{doc.title}</h1>
          <p className="text-sm text-muted-foreground">Signatário: {doc.signer_name}</p>
        </div>
      </header>

      <article className="max-h-[45vh] overflow-y-auto whitespace-pre-wrap rounded-xl border border-border bg-muted/30 p-5 text-sm leading-relaxed">
        {doc.content}
      </article>

      {doc.status === "assinado" ? (
        <div className="mt-6 rounded-xl border border-emerald-500/30 bg-emerald-500/5 p-5 text-center">
          <CheckCircle2 className="mx-auto mb-2 size-7 text-emerald-500" />
          <p className="font-medium">Assinado por {doc.signed_name}</p>
          <p className="text-xs text-muted-foreground">
            {doc.signed_at ? new Date(doc.signed_at).toLocaleString("pt-BR") : ""}
          </p>
          <Button className="mt-4" variant="outline" onClick={() => window.print()}>
            Baixar / imprimir contrato
          </Button>
        </div>
      ) : closed ? (
        <div className="mt-6 rounded-xl border border-border p-5 text-center text-sm text-muted-foreground">
          Este contrato não está mais disponível para assinatura.
        </div>
      ) : (
        <div className="mt-6 space-y-4">
          <div>
            <Label>Digite seu nome completo para assinar</Label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Nome completo"
              className="mt-1"
            />
          </div>
          <p className="flex items-start gap-2 text-xs text-muted-foreground">
            <ShieldCheck className="mt-0.5 size-4 shrink-0" />
            Ao assinar, você declara que leu e concorda com o conteúdo acima. Registramos data, hora e
            dispositivo utilizado para fins de comprovação.
          </p>
          <div className="flex flex-col gap-2 sm:flex-row">
            <Button className="flex-1" disabled={busy} onClick={() => void act("sign")}>
              {busy ? <Loader2 className="mr-2 size-4 animate-spin" /> : <CheckCircle2 className="mr-2 size-4" />}
              Assinar contrato
            </Button>
            <Button variant="outline" disabled={busy} onClick={() => void act("decline")}>
              Recusar
            </Button>
          </div>
        </div>
      )}
    </Shell>
  );
}
