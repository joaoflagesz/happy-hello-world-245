import { Bell, CheckCheck } from "lucide-react";
import { useMarkNotifications, useNotifications } from "@/features/platform/api";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ScrollArea } from "@/components/ui/scroll-area";

export function NotificationsMenu() {
  const { data: notifications } = useNotifications();
  const mark = useMarkNotifications();

  const list = notifications ?? [];
  const unread = list.filter((n) => !n.read_at).length;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative" aria-label="Notificações">
          <Bell className="size-4" />
          {unread ? (
            <span className="absolute right-1 top-1 flex size-2 rounded-full bg-primary" />
          ) : null}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80">
        <DropdownMenuLabel className="flex items-center justify-between">
          <span>Notificações</span>
          {unread ? (
            <button
              className="inline-flex items-center gap-1 text-xs font-normal text-primary hover:underline"
              onClick={() => mark.mutate("all")}
            >
              <CheckCheck className="size-3" />
              Marcar todas
            </button>
          ) : null}
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <ScrollArea className="max-h-80">
          {list.length === 0 ? (
            <p className="px-3 py-6 text-center text-sm text-muted-foreground">
              Nenhuma notificação por aqui.
            </p>
          ) : (
            <div className="space-y-1 p-1">
              {list.map((notification) => (
                <div
                  key={notification.id}
                  className={`rounded-lg p-2 text-sm ${notification.read_at ? "opacity-60" : "bg-accent/40"}`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <p className="truncate font-medium">{notification.title}</p>
                    <Badge variant="secondary" className="text-[10px]">
                      {notification.kind}
                    </Badge>
                  </div>
                  {notification.body ? (
                    <p className="mt-0.5 line-clamp-2 text-xs text-muted-foreground">{notification.body}</p>
                  ) : null}
                  <p className="mt-1 text-[10px] text-muted-foreground">
                    {new Date(notification.created_at).toLocaleString("pt-BR")}
                  </p>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
