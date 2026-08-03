import { useEffect, useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { MessageCircle } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toWhatsappNumber, type Lead } from "./constants";
import { invalidateLeadSurfaces, registerLeadContact } from "./contact-sync";

const DEFAULT_TEMPLATE =
  "Olá, equipe da {{empresa}}! Tudo bem? Vi vocês no Google e percebi que ainda não possuem um site profissional. Hoje muitos clientes pesquisam empresas na internet antes de comprar, e acredito que um site moderno pode aumentar bastante a credibilidade e trazer novos clientes. Posso mostrar algumas ideias sem compromisso?";

export function renderTemplate(template: string, lead: Lead) {
  return template
    .replaceAll("{{empresa}}", lead.company_name)
    .replaceAll("{{cidade}}", lead.city ?? "sua região")
    .replaceAll("{{categoria}}", lead.category ?? "seu segmento")
    .replaceAll("{{nome}}", lead.contact_name ?? lead.company_name)
    .replaceAll("{{telefone}}", lead.phone ?? "");
}

export function WhatsappDialog({
  lead,
  onOpenChange,
}: {
  lead: Lead | null;
  onOpenChange: (open: boolean) => void;
}) {
  const queryClient = useQueryClient();
  const [templateId, setTemplateId] = useState<string>("default");
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);

  const { data: templates } = useQuery({
    queryKey: ["message-templates"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("message_templates")
        .select("*")
        .order("created_at", { ascending: true });
      if (error) throw error;
      return data ?? [];
    },
  });

  const selectedBody = useMemo(() => {
    if (templateId === "default") return DEFAULT_TEMPLATE;
    return templates?.find((item) => item.id === templateId)?.content ?? DEFAULT_TEMPLATE;
  }, [templateId, templates]);

  useEffect(() => {
    if (lead) setMessage(renderTemplate(selectedBody, lead));
  }, [lead, selectedBody]);

  async function handleOpenWhatsapp() {
    if (!lead) return;
    const number = toWhatsappNumber(lead.whatsapp ?? lead.phone);
    if (!number) {
      toast.error("Telefone inválido para WhatsApp.");
      return;
    }

    setSending(true);
    try {
      await registerLeadContact({
        leadId: lead.id,
        channel: "whatsapp",
        title: "Mensagem de WhatsApp enviada",
        message,
        phone: lead.whatsapp ?? lead.phone,
      });
      invalidateLeadSurfaces(queryClient, lead.id);

      window.open(
        `https://wa.me/${number}?text=${encodeURIComponent(message)}`,
        "_blank",
        "noopener,noreferrer",
      );
      onOpenChange(false);
    } catch (error) {
      console.error(error);
      toast.error("Não foi possível registrar o contato.");
    } finally {
      setSending(false);
    }
  }

  return (
    <Dialog open={Boolean(lead)} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Abrir no WhatsApp</DialogTitle>
          <DialogDescription>
            Revise a mensagem personalizada para {lead?.company_name}. O contato é registrado
            automaticamente no histórico do lead.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <Select value={templateId} onValueChange={setTemplateId}>
            <SelectTrigger>
              <SelectValue placeholder="Modelo de mensagem" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="default">Padrão — empresa sem site</SelectItem>
              {templates?.map((template) => (
                <SelectItem key={template.id} value={template.id}>
                  {template.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Textarea
            value={message}
            onChange={(event) => setMessage(event.target.value)}
            rows={8}
            maxLength={2000}
          />

          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button onClick={handleOpenWhatsapp} disabled={sending || !message.trim()}>
              <MessageCircle className="mr-2 size-4" />
              Abrir conversa
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
