import { useEffect, useState, type ReactNode } from "react";
import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { CommandPalette } from "@/components/app/command-palette";
import { NotificationsMenu } from "@/components/app/notifications-menu";
import {
  BarChart3,
  Bell,
  Bot,
  Briefcase,
  Building2,
  Calendar,
  CheckSquare,
  FileText,
  FileSignature,
  HardDrive,
  Mail,
  Map,
  MapPinned,
  Plug,
  Shield,
  Trophy,
  History,
  Tag as TagIcon,
  KanbanSquare,
  LayoutDashboard,
  LogOut,
  Menu,
  MessageCircle,
  Moon,
  Search,
  Settings,
  Sun,
  Sparkles,
  Users,
  Wallet,
  Workflow,
  X,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";
import { useTheme } from "@/lib/theme";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { initialsFrom, ROLE_LABEL, useProfile, useRoles, useSession } from "@/features/auth/use-session";

type NavItem = {
  to: string;
  label: string;
  icon: typeof LayoutDashboard;
  soon?: boolean;
};

export const NAV: { section: string; items: NavItem[] }[] = [
  {
    section: "Operação",
    items: [
      { to: "/dashboard", label: "Painel", icon: LayoutDashboard },
      { to: "/leads", label: "Leads", icon: Users },
      { to: "/pipeline", label: "Funil", icon: KanbanSquare },
      { to: "/tarefas", label: "Tarefas", icon: CheckSquare },
      { to: "/agenda", label: "Agenda", icon: Calendar },
    ],
  },
  {
    section: "Relacionamento",
    items: [
      { to: "/empresas", label: "Empresas", icon: Building2 },
      { to: "/whatsapp", label: "WhatsApp", icon: MessageCircle },
      { to: "/email", label: "E-mail", icon: Mail },
      { to: "/ia", label: "Inteligência artificial", icon: Bot },
      { to: "/automacoes", label: "Automações", icon: Workflow },
    ],
  },
  {
    section: "Vendas",
    items: [
      { to: "/clientes", label: "Clientes e vendas", icon: Briefcase },
      { to: "/propostas", label: "Propostas", icon: FileText },
      { to: "/assinaturas", label: "Assinatura digital", icon: FileSignature },
      { to: "/documentos", label: "Documentos", icon: HardDrive },
      { to: "/financeiro", label: "Financeiro", icon: Wallet },
      { to: "/relatorios", label: "Relatórios", icon: BarChart3 },
    ],
  },
  {
    section: "Campo e performance",
    items: [
      { to: "/mapa", label: "Mapa de leads", icon: Map },
      { to: "/visitas", label: "Visitas", icon: MapPinned },
      { to: "/ranking", label: "Ranking", icon: Trophy },
    ],
  },
  {
    section: "Sistema",
    items: [
      { to: "/etiquetas", label: "Etiquetas", icon: TagIcon },
      { to: "/auditoria", label: "Auditoria", icon: History },
      { to: "/integracoes", label: "Integrações e API", icon: Plug },
      { to: "/admin", label: "Painel admin", icon: Shield },
      { to: "/configuracoes", label: "Configurações", icon: Settings },
    ],
  },
];


export function AppShell({ children }: { children: ReactNode }) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const pathname = useRouterState({ select: (state) => state.location.pathname });

  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  return (
    <div className="flex min-h-screen w-full bg-background">
      <aside className="sticky top-0 hidden h-screen w-64 shrink-0 flex-col border-r border-sidebar-border bg-sidebar lg:flex">
        <SidebarContent pathname={pathname} />
      </aside>

      {mobileOpen ? (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button
            aria-label="Fechar menu"
            className="absolute inset-0 bg-foreground/40 backdrop-blur-sm"
            onClick={() => setMobileOpen(false)}
          />
          <aside className="animate-fade-up absolute inset-y-0 left-0 flex w-72 flex-col border-r border-sidebar-border bg-sidebar">
            <SidebarContent pathname={pathname} onClose={() => setMobileOpen(false)} />
          </aside>
        </div>
      ) : null}

      <div className="flex min-w-0 flex-1 flex-col">
        <Topbar onOpenMenu={() => setMobileOpen(true)} />
        <main className="mx-auto w-full max-w-[1600px] flex-1 px-4 py-6 md:px-8 md:py-8">
          {children}
        </main>
      </div>
    </div>
  );
}

function SidebarContent({ pathname, onClose }: { pathname: string; onClose?: () => void }) {
  return (
    <>
      <div className="flex h-16 items-center justify-between border-b border-sidebar-border px-4">
        <Link to="/dashboard" className="flex items-center gap-2">
          <div className="flex size-8 items-center justify-center rounded-lg bg-brand-gradient text-primary-foreground">
            <Sparkles className="size-4" />
          </div>
          <span className="text-base font-semibold tracking-tight text-sidebar-foreground">
            Prospecta
          </span>
        </Link>
        {onClose ? (
          <Button variant="ghost" size="icon" onClick={onClose} aria-label="Fechar menu">
            <X className="size-4" />
          </Button>
        ) : null}
      </div>

      <nav className="flex-1 overflow-y-auto px-3 py-4">
        {NAV.map((group) => (
          <div key={group.section} className="mb-6">
            <p className="px-3 pb-2 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
              {group.section}
            </p>
            <ul className="space-y-1">
              {group.items.map((item) => {
                const active = pathname === item.to;
                const content = (
                  <span
                    className={cn(
                      "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                      active
                        ? "bg-sidebar-accent text-sidebar-accent-foreground"
                        : "text-muted-foreground hover:bg-sidebar-accent/60 hover:text-sidebar-foreground",
                      item.soon && "cursor-not-allowed opacity-55 hover:bg-transparent",
                    )}
                  >
                    <item.icon className="size-4 shrink-0" />
                    <span className="flex-1 truncate">{item.label}</span>
                    {item.soon ? (
                      <Badge variant="outline" className="h-5 px-1.5 text-[10px]">
                        em breve
                      </Badge>
                    ) : null}
                  </span>
                );

                return (
                  <li key={item.to}>
                    {item.soon ? (
                      <div aria-disabled>{content}</div>
                    ) : (
                      <Link to={item.to}>{content}</Link>
                    )}
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>
    </>
  );
}

function Topbar({ onOpenMenu }: { onOpenMenu: () => void }) {
  const { theme, toggleTheme } = useTheme();
  const { user } = useSession();
  const { data: profile } = useProfile(user);
  const { data: roles } = useRoles(user);
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const primaryRole = roles?.[0];

  async function handleSignOut() {
    await queryClient.cancelQueries();
    queryClient.clear();
    await supabase.auth.signOut();
    navigate({ to: "/auth", replace: true });
  }

  return (
    <header className="sticky top-0 z-40 flex h-16 items-center gap-3 border-b border-border glass px-4 md:px-8">
      <Button variant="ghost" size="icon" className="lg:hidden" onClick={onOpenMenu} aria-label="Abrir menu">
        <Menu className="size-5" />
      </Button>

      <div className="hidden max-w-sm flex-1 md:block">
        <CommandPalette />
      </div>

      <div className="ml-auto flex items-center gap-2">
        <NotificationsMenu />
        <Button variant="ghost" size="icon" onClick={toggleTheme} aria-label="Alternar tema">
          {theme === "dark" ? <Sun className="size-4" /> : <Moon className="size-4" />}
        </Button>


        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="flex items-center gap-2 rounded-full p-1 pr-2 transition-colors hover:bg-accent">
              <Avatar className="size-8">
                <AvatarImage src={profile?.avatar_url ?? undefined} alt="" />
                <AvatarFallback className="bg-primary/15 text-xs font-semibold text-primary">
                  {initialsFrom(profile?.full_name, user?.email)}
                </AvatarFallback>
              </Avatar>
              <span className="hidden text-sm font-medium sm:inline">
                {profile?.full_name ?? user?.email?.split("@")[0]}
              </span>
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel>
              <div className="truncate text-sm font-medium">{profile?.full_name ?? "Meu perfil"}</div>
              <div className="truncate text-xs font-normal text-muted-foreground">{user?.email}</div>
              {primaryRole ? (
                <Badge variant="secondary" className="mt-2">
                  {ROLE_LABEL[primaryRole]}
                </Badge>
              ) : null}
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link to="/configuracoes">
                <Settings className="mr-2 size-4" />
                Configurações
              </Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleSignOut} className="text-destructive focus:text-destructive">
              <LogOut className="mr-2 size-4" />
              Sair
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
