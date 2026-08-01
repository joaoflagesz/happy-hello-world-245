import { useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { motion } from "motion/react";
import { ArrowLeft, Loader2, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable/index";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const title = "Entrar — Prospecta CRM";
const description = "Acesse sua conta do Prospecta CRM para gerenciar leads, funil de vendas e clientes.";

type Mode = "login" | "signup" | "forgot";

export const Route = createFileRoute("/auth")({
  validateSearch: (search: Record<string, unknown>) => ({
    mode: (search.mode === "signup" ? "signup" : "login") as Mode,
  }),
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
  component: AuthPage,
});

const emailField = z.string().trim().email("E-mail inválido").max(255);
const passwordField = z.string().min(8, "Mínimo de 8 caracteres").max(72);

const loginSchema = z.object({ email: emailField, password: z.string().min(1, "Informe a senha") });
const signupSchema = z.object({
  fullName: z.string().trim().min(2, "Informe seu nome").max(120),
  email: emailField,
  password: passwordField,
});
const forgotSchema = z.object({ email: emailField });

function AuthPage() {
  const { mode } = Route.useSearch();
  const navigate = useNavigate();
  const [forgot, setForgot] = useState(false);

  return (
    <main className="grid min-h-screen bg-background lg:grid-cols-2">
      <section className="relative hidden flex-col justify-between overflow-hidden bg-sidebar p-12 lg:flex">
        <div className="absolute inset-0 bg-surface-glow" />
        <div className="relative flex items-center gap-2">
          <div className="flex size-9 items-center justify-center rounded-xl bg-brand-gradient text-primary-foreground">
            <Sparkles className="size-5" />
          </div>
          <span className="text-lg font-semibold tracking-tight">Prospecta</span>
        </div>
        <div className="relative max-w-md">
          <h2 className="text-3xl font-semibold leading-tight tracking-tight">
            Prospecção que vira <span className="text-gradient">receita previsível</span>.
          </h2>
          <p className="mt-4 text-muted-foreground">
            Importe leads do Google Maps, descubra quem ainda não tem site e trabalhe o funil
            inteiro — do primeiro WhatsApp ao contrato assinado.
          </p>
        </div>
        <p className="relative text-xs text-muted-foreground">
          © {new Date().getFullYear()} Prospecta CRM
        </p>
      </section>

      <section className="flex items-center justify-center px-5 py-12">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
          className="w-full max-w-md"
        >
          <Link
            to="/"
            className="mb-8 inline-flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            <ArrowLeft className="size-4" />
            Voltar ao site
          </Link>

          {forgot ? (
            <ForgotForm onBack={() => setForgot(false)} />
          ) : (
            <>
              <h1 className="text-2xl font-semibold tracking-tight">
                {mode === "signup" ? "Criar sua conta" : "Bem-vindo de volta"}
              </h1>
              <p className="mt-2 text-sm text-muted-foreground">
                {mode === "signup"
                  ? "Comece a organizar sua prospecção em minutos."
                  : "Entre para continuar sua prospecção."}
              </p>

              <Tabs
                value={mode}
                onValueChange={(value) =>
                  navigate({ to: "/auth", search: { mode: value as Mode } })
                }
                className="mt-6"
              >
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="login">Entrar</TabsTrigger>
                  <TabsTrigger value="signup">Cadastrar</TabsTrigger>
                </TabsList>
                <TabsContent value="login" className="mt-6">
                  <LoginForm onForgot={() => setForgot(true)} />
                </TabsContent>
                <TabsContent value="signup" className="mt-6">
                  <SignupForm />
                </TabsContent>
              </Tabs>

              <div className="my-6 flex items-center gap-3 text-xs uppercase tracking-wider text-muted-foreground">
                <span className="h-px flex-1 bg-border" />
                ou
                <span className="h-px flex-1 bg-border" />
              </div>

              <GoogleButton />
            </>
          )}
        </motion.div>
      </section>
    </main>
  );
}

function GoogleButton() {
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  async function handleGoogle() {
    setLoading(true);
    const result = await lovable.auth.signInWithOAuth("google", {
      redirect_uri: window.location.origin,
    });
    if (result.error) {
      setLoading(false);
      toast.error("Não foi possível entrar com o Google.");
      return;
    }
    if (result.redirected) return;
    navigate({ to: "/dashboard" });
  }

  return (
    <Button variant="outline" className="w-full" onClick={handleGoogle} disabled={loading}>
      {loading ? <Loader2 className="mr-2 size-4 animate-spin" /> : <GoogleIcon />}
      Continuar com Google
    </Button>
  );
}

function GoogleIcon() {
  return (
    <svg className="mr-2 size-4" viewBox="0 0 24 24" aria-hidden="true">
      <path
        fill="#4285F4"
        d="M23.5 12.27c0-.85-.07-1.47-.22-2.12H12v3.85h6.6c-.13 1.1-.85 2.76-2.44 3.87l-.02.15 3.54 2.74.25.03c2.25-2.08 3.57-5.15 3.57-8.52Z"
      />
      <path
        fill="#34A853"
        d="M12 24c3.24 0 5.95-1.07 7.93-2.9l-3.78-2.93c-1.01.7-2.37 1.2-4.15 1.2-3.17 0-5.86-2.08-6.82-4.96l-.14.01-3.68 2.85-.05.13C3.28 21.3 7.34 24 12 24Z"
      />
      <path
        fill="#FBBC05"
        d="M5.18 14.41A7.4 7.4 0 0 1 4.77 12c0-.84.15-1.66.4-2.41l-.01-.16-3.72-2.9-.12.06A12 12 0 0 0 0 12c0 1.94.47 3.77 1.32 5.41l3.86-3Z"
      />
      <path
        fill="#EB4335"
        d="M12 4.63c2.25 0 3.76.97 4.63 1.78l3.38-3.3C17.94 1.17 15.24 0 12 0 7.34 0 3.28 2.7 1.32 6.59l3.85 3C6.14 6.71 8.83 4.63 12 4.63Z"
      />
    </svg>
  );
}

function LoginForm({ onForgot }: { onForgot: () => void }) {
  const navigate = useNavigate();
  const form = useForm<z.infer<typeof loginSchema>>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
  });

  async function onSubmit(values: z.infer<typeof loginSchema>) {
    const { error } = await supabase.auth.signInWithPassword(values);
    if (error) {
      toast.error(
        error.message.includes("Invalid login")
          ? "E-mail ou senha incorretos."
          : "Não foi possível entrar. Tente novamente.",
      );
      return;
    }
    navigate({ to: "/dashboard" });
  }

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
      <Field label="E-mail" error={form.formState.errors.email?.message}>
        <Input type="email" autoComplete="email" placeholder="voce@empresa.com" {...form.register("email")} />
      </Field>
      <Field label="Senha" error={form.formState.errors.password?.message}>
        <Input type="password" autoComplete="current-password" placeholder="••••••••" {...form.register("password")} />
      </Field>
      <button
        type="button"
        onClick={onForgot}
        className="text-sm text-muted-foreground underline-offset-4 transition-colors hover:text-foreground hover:underline"
      >
        Esqueci minha senha
      </button>
      <Button type="submit" className="w-full" disabled={form.formState.isSubmitting}>
        {form.formState.isSubmitting ? <Loader2 className="mr-2 size-4 animate-spin" /> : null}
        Entrar
      </Button>
    </form>
  );
}

function SignupForm() {
  const invitedEmail =
    typeof window !== "undefined"
      ? (new URLSearchParams(window.location.search).get("email") ?? "")
      : "";
  const form = useForm<z.infer<typeof signupSchema>>({
    resolver: zodResolver(signupSchema),
    defaultValues: { fullName: "", email: invitedEmail, password: "" },
  });


  async function onSubmit(values: z.infer<typeof signupSchema>) {
    const { error } = await supabase.auth.signUp({
      email: values.email,
      password: values.password,
      options: {
        emailRedirectTo: window.location.origin,
        data: { full_name: values.fullName },
      },
    });
    if (error) {
      toast.error(
        error.message.includes("already registered")
          ? "Este e-mail já possui conta."
          : "Não foi possível criar a conta.",
      );
      return;
    }
    toast.success("Conta criada! Confirme seu e-mail para acessar.");
    form.reset();
  }

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
      <Field label="Nome completo" error={form.formState.errors.fullName?.message}>
        <Input autoComplete="name" placeholder="Seu nome" {...form.register("fullName")} />
      </Field>
      <Field label="E-mail" error={form.formState.errors.email?.message}>
        <Input type="email" autoComplete="email" placeholder="voce@empresa.com" {...form.register("email")} />
      </Field>
      <Field label="Senha" error={form.formState.errors.password?.message}>
        <Input type="password" autoComplete="new-password" placeholder="Mínimo 8 caracteres" {...form.register("password")} />
      </Field>
      <Button type="submit" className="w-full" disabled={form.formState.isSubmitting}>
        {form.formState.isSubmitting ? <Loader2 className="mr-2 size-4 animate-spin" /> : null}
        Criar conta
      </Button>
    </form>
  );
}

function ForgotForm({ onBack }: { onBack: () => void }) {
  const form = useForm<z.infer<typeof forgotSchema>>({
    resolver: zodResolver(forgotSchema),
    defaultValues: { email: "" },
  });

  async function onSubmit(values: z.infer<typeof forgotSchema>) {
    const { error } = await supabase.auth.resetPasswordForEmail(values.email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    if (error) {
      toast.error("Não foi possível enviar o e-mail de recuperação.");
      return;
    }
    toast.success("Enviamos um link de recuperação para o seu e-mail.");
  }

  return (
    <div>
      <h1 className="text-2xl font-semibold tracking-tight">Recuperar senha</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        Informe seu e-mail e enviaremos um link para criar uma nova senha.
      </p>
      <form onSubmit={form.handleSubmit(onSubmit)} className="mt-6 space-y-4">
        <Field label="E-mail" error={form.formState.errors.email?.message}>
          <Input type="email" autoComplete="email" placeholder="voce@empresa.com" {...form.register("email")} />
        </Field>
        <Button type="submit" className="w-full" disabled={form.formState.isSubmitting}>
          {form.formState.isSubmitting ? <Loader2 className="mr-2 size-4 animate-spin" /> : null}
          Enviar link
        </Button>
        <Button type="button" variant="ghost" className="w-full" onClick={onBack}>
          Voltar
        </Button>
      </form>
    </div>
  );
}

function Field({
  label,
  error,
  children,
}: {
  label: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      {children}
      {error ? <p className="text-xs text-destructive">{error}</p> : null}
    </div>
  );
}
