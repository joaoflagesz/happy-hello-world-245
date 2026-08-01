import { useEffect, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { Search } from "lucide-react";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command";
import { Kbd } from "@/components/ui-kit";
import { NAV } from "@/components/app/app-shell";
import { useLeads } from "@/features/leads/api";

export function CommandPalette() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const navigate = useNavigate();
  const { data: leads } = useLeads();

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setOpen((value) => !value);
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  const term = query.trim().toLowerCase();
  const matches = term
    ? (leads ?? [])
        .filter(
          (lead) =>
            lead.company_name.toLowerCase().includes(term) ||
            (lead.city ?? "").toLowerCase().includes(term) ||
            (lead.phone ?? "").includes(term),
        )
        .slice(0, 8)
    : [];

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="hidden h-9 w-full max-w-sm items-center gap-2 rounded-lg border border-input bg-background/60 px-3 text-sm text-muted-foreground transition-colors hover:bg-accent md:flex"
      >
        <Search className="size-4" />
        <span className="flex-1 text-left">Buscar ou executar…</span>
        <Kbd>Ctrl K</Kbd>
      </button>

      <CommandDialog open={open} onOpenChange={setOpen}>
        <CommandInput
          placeholder="Buscar páginas, leads e ações…"
          value={query}
          onValueChange={setQuery}
        />
        <CommandList>
          <CommandEmpty>Nada encontrado.</CommandEmpty>
          {NAV.map((group) => (
            <CommandGroup key={group.section} heading={group.section}>
              {group.items.map((item) => (
                <CommandItem
                  key={item.to}
                  value={`${group.section} ${item.label}`}
                  onSelect={() => {
                    setOpen(false);
                    void navigate({ to: item.to });
                  }}
                >
                  <item.icon className="mr-2 size-4" />
                  {item.label}
                </CommandItem>
              ))}
            </CommandGroup>
          ))}
          {matches.length ? (
            <>
              <CommandSeparator />
              <CommandGroup heading="Leads">
                {matches.map((lead) => (
                  <CommandItem
                    key={lead.id}
                    value={`lead ${lead.company_name}`}
                    onSelect={() => {
                      setOpen(false);
                      void navigate({ to: "/leads/$id", params: { id: lead.id } });
                    }}
                  >
                    <Search className="mr-2 size-4" />
                    <span className="truncate">{lead.company_name}</span>
                    <span className="ml-auto text-xs text-muted-foreground">{lead.city ?? ""}</span>
                  </CommandItem>
                ))}
              </CommandGroup>
            </>
          ) : null}
        </CommandList>
      </CommandDialog>
    </>
  );
}
