import type { AtendimentoStatus } from "@/lib/supabase/types";

// Status visiveis no Kanban. "cancelado" fica fora de proposito:
// o card sai das colunas, mas o registro continua preservado no banco.
export const STATUS_ORDER: AtendimentoStatus[] = [
  "aguardando_validacao",
  "em_validacao",
  "validado",
  "enviado",
  "rejeitado"
];

export const STATUS_LABEL: Record<AtendimentoStatus, string> = {
  aguardando_validacao: "Aguardando",
  em_validacao: "Em validação",
  validado: "Validado",
  enviado: "Enviado",
  rejeitado: "Rejeitado",
  cancelado: "Cancelado"
};

export const STATUS_DESCRIPTION: Record<AtendimentoStatus, string> = {
  aguardando_validacao: "Novos atendimentos enviados pelo bot",
  em_validacao: "Atendimentos em revisão humana",
  validado: "Validados e prontos para envio",
  enviado: "Resposta já enviada ao cliente",
  rejeitado: "Atendimentos rejeitados",
  cancelado: "Atendimentos removidos do Kanban"
};

export const READONLY_STATUS = new Set<AtendimentoStatus>([
  "validado",
  "enviado",
  "rejeitado",
  "cancelado"
]);

export const STATUS_BADGE_CLASS: Record<AtendimentoStatus, string> = {
  aguardando_validacao: "bg-amber-100 text-amber-800 border-amber-200",
  em_validacao: "bg-brand-teal/10 text-brand-forest border-brand-teal/25",
  validado: "bg-emerald-100 text-emerald-800 border-emerald-200",
  enviado: "bg-brand-forest/10 text-brand-forest border-brand-forest/20",
  rejeitado: "bg-rose-100 text-rose-800 border-rose-200",
  cancelado: "bg-slate-100 text-slate-600 border-slate-200"
};
