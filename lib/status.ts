import type { AtendimentoStatus } from "@/lib/supabase/types";

// "cancelado" fica fora do Kanban, mas continua salvo no banco.
export const STATUS_ORDER: AtendimentoStatus[] = [
  "aguardando_validacao",
  "em_validacao",
  "validado",
  "enviado",
  "convertido",
  "rejeitado"
];

export const STATUS_LABEL: Record<AtendimentoStatus, string> = {
  aguardando_validacao: "Aguardando",
  em_validacao: "Em validação",
  validado: "Validado",
  enviado: "Enviado",
  convertido: "Convertido",
  rejeitado: "Rejeitado",
  cancelado: "Cancelado"
};

export const STATUS_DESCRIPTION: Record<AtendimentoStatus, string> = {
  aguardando_validacao: "Atendimentos recebidos pelo bot e aguardando leitura da equipe.",
  em_validacao: "Atendimentos em revisão humana, com edição liberada.",
  validado: "Orçamentos aprovados e prontos para seguir para o cliente.",
  enviado: "Resposta já encaminhada ao cliente.",
  convertido: "Orçamentos que viraram coleta/venda (paciente compareceu e pagou).",
  rejeitado: "Atendimentos rejeitados pela equipe.",
  cancelado: "Atendimentos removidos da operação ativa."
};

export const READONLY_STATUS = new Set<AtendimentoStatus>([
  "validado",
  "enviado",
  "convertido",
  "rejeitado",
  "cancelado"
]);

export const STATUS_BADGE_CLASS: Record<AtendimentoStatus, string> = {
  aguardando_validacao: "border-amber-200 bg-amber-50 text-amber-800",
  em_validacao: "border-teal-200 bg-teal-50 text-teal-800",
  validado: "border-emerald-200 bg-emerald-50 text-emerald-800",
  enviado: "border-brand-forest/15 bg-brand-forest/5 text-brand-forest",
  convertido: "border-violet-200 bg-violet-50 text-violet-700",
  rejeitado: "border-rose-200 bg-rose-50 text-rose-700",
  cancelado: "border-slate-200 bg-slate-100 text-slate-600"
};
