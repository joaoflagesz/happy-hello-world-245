import { useEffect, useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const title = "Nova senha — Prospecta CRM";
const description = "Defina uma nova senha para acessar sua conta do Prospecta CRM.";

export const Route = createFileRoute("/reset-password")({
  ssr: false,
  head: () => ({
    meta: [
      { title },
      { name: "description", content: description },
      { property: "og:title", content: title },
      { property: "og:description", content: description },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: ResetPasswordPage,
});

const schema = z
  .object({
    password: z.string().min(8, "Mínimo de 8 caracteres").max(72),
    confirm: z.string(),
  })
  .refine((values) => values.password === values.confirm, {
    message: "As senhas não coincidem",
    path: ["confirm"],
  });

function ResetPasswordPage() {
  const navigate = useNavigate();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const { data } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY" || event === "SIGNED_IN") setReady(true);
    });
    void supabase.auth.getSession().then(({ data: result }) => {
      if (result.session) setReady(true);
    });
    return () => data.subscription.unsubscribe();
  }, []);

  const form = useForm<z.infer<typeof schema>>({
    resolver: zodResolver(schema),
    defaultValues: { password: "", confirm: "" },
  });

  async function onSubmit(values: z.infer<typeof schema>) {
    const { error } = await supabase.auth.updateUser({ password: values.password });
    if (error) {
      toast.error("Não foi possível atualizar a senha. Solicite um novo link.");
      return;
    }
    toast.success("Senha atualizada com sucesso.");
    navigate({ to: "/dashboard" });
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-background bg-surface-glow px-5">
      <div className="w-full max-w-md surface-card rounded-2xl p-8">
        <h1 className="text-2xl font-semibold tracking-tight">Definir nova senha</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          {ready
            ? "Escolha uma senha forte para proteger sua conta."
            : "Abra esta página pelo link enviado ao seu e-mail para continuar."}
        </p>

        <form onSubmit={form.handleSubmit(onSubmit)} className="mt-6 space-y-4">
          <div className="space-y-2">
            <Label>Nova senha</Label>
            <Input type="password" autoComplete="new-password" {...form.register("password")} />
            {form.formState.errors.password ? (
              <p className="text-xs text-destructive">{form.formState.errors.password.message}</p>
            ) : null}
          </div>
          <div className="space-y-2">
            <Label>Confirmar senha</Label>
            <Input type="password" autoComplete="new-password" {...form.register("confirm")} />
            {form.formState.errors.confirm ? (
              <p className="text-xs text-destructive">{form.formState.errors.confirm.message}</p>
            ) : null}
          </div>
          <Button type="submit" className="w-full" disabled={!ready || form.formState.isSubmitting}>
            {form.formState.isSubmitting ? <Loader2 className="mr-2 size-4 animate-spin" /> : null}
            Salvar nova senha
          </Button>
        </form>
      </div>
    </main>
  );
}
