"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  AlertCircle,
  CalendarClock,
  CalendarDays,
  ChevronDown,
  ExternalLink,
  MapPin,
  Phone,
  Stethoscope,
  XCircle,
} from "lucide-react";
import type { Atendimento } from "@/lib/supabase/types";
import {
  LAB_META,
  formatCurrency,
  formatDate,
  formatPhone,
  formatSchedulePreference,
  labFromUnidade,
  parseCurrency,
  totalComDesconto,
} from "@/lib/format";
import { supabase } from "@/lib/supabase/client";
import { StatusBadge } from "@/components/ui/StatusBadge";

interface AtendimentoCardProps {
  atendimento: Atendimento;
  onChanged?: () => void | Promise<void>;
}

interface CardDetails {
  observacoes_conversa: string | null;
  observacoes_prescricao: string | null;
  agendamento_desejado: string | null;
}

export function AtendimentoCard({ atendimento, onChanged }: AtendimentoCardProps) {
  const [expanded, setExpanded] = useState(false);
  const [details, setDetails] = useState<CardDetails | null>(null);
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [cancelling, setCancelling] = useState(false);

  const grossTotal = atendimento.total_validado ?? atendimento.total_bruto;
  const grossNum = parseCurrency(grossTotal);
  const { final: totalComDesc } = totalComDesconto(grossNum, atendimento);
  const total = grossNum === null ? grossTotal : totalComDesc;
  const labMeta = labFromUnidade(atendimento.unidade_preferida);
  const missing = Array.isArray(atendimento.termos_nao_encontrados) ? atendimento.termos_nao_encontrados : [];
  const missingCount = missing.length;

  async function loadDetails() {
    if (details || loadingDetails) return;
    setLoadingDetails(true);
    const { data } = await supabase
      .from("atendimentos")
      .select("observacoes_conversa,observacoes_prescricao,agendamento_desejado")
      .eq("id", atendimento.id)
      .single();
    setDetails({
      observacoes_conversa: data?.observacoes_conversa ?? null,
      observacoes_prescricao: data?.observacoes_prescricao ?? null,
      agendamento_desejado: data?.agendamento_desejado ?? null,
    });
    setLoadingDetails(false);
  }

  function toggle() {
    const next = !expanded;
    setExpanded(next);
    if (next) void loadDetails();
  }

  async function handleCancel() {
    const ok = window.confirm(
      "Cancelar este atendimento no quadro?\n\nOs dados continuam salvos no banco. Apenas o status será alterado para cancelado."
    );
    if (!ok) return;

    setCancelling(true);
    const { error } = await supabase.from("atendimentos").update({ status: "cancelado" }).eq("id", atendimento.id);
    setCancelling(false);

    if (error) {
      window.alert(`Não foi possível cancelar o atendimento: ${error.message}`);
      return;
    }

    await onChanged?.();
  }

  const agendamento = formatSchedulePreference(details?.agendamento_desejado);

  return (
    <article className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm shadow-slate-900/5 transition hover:border-brand-emerald/30 hover:shadow-md hover:shadow-brand-forest/10">
      {/* --- Cabeçalho compacto (clique = expande/recolhe) --- */}
      <button
        type="button"
        onClick={toggle}
        aria-expanded={expanded}
        className="flex w-full items-start justify-between gap-2 p-3 text-left"
      >
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5">
            <ChevronDown
              className={`h-4 w-4 shrink-0 text-slate-400 transition-transform ${expanded ? "rotate-180" : ""}`}
            />
            {missingCount > 0 ? (
              <AlertCircle
                className="h-3.5 w-3.5 shrink-0 text-amber-500"
                aria-label={`${missingCount} termo(s) pendente(s)`}
              />
            ) : null}
            <h3 className="truncate text-sm font-semibold leading-tight text-slate-950">
              {atendimento.paciente_nome || "Paciente não informado"}
            </h3>
          </div>

          <div className="mt-1.5 flex flex-wrap items-center gap-x-2 gap-y-1 pl-[22px] text-xs text-slate-500">
            {labMeta ? (
              <span className="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-slate-50 px-1.5 py-0.5">
                <Image
                  src={LAB_META[labMeta].logo}
                  alt={LAB_META[labMeta].nome}
                  width={12}
                  height={12}
                  className="h-3 w-3 object-contain"
                />
                <span className="text-[10px] font-medium text-slate-600">
                  {labMeta === "alfa" ? "Alfa Labs" : "N. S. da Penha"}
                </span>
              </span>
            ) : null}
            <span className="inline-flex items-center gap-1">
              <CalendarClock className="h-3.5 w-3.5 text-brand-emerald/80" />
              {formatDate(atendimento.created_at)}
            </span>
          </div>
        </div>

        <div className="flex shrink-0 flex-col items-end gap-1.5">
          <StatusBadge status={atendimento.status} />
          <span className="text-sm font-semibold tracking-tight text-brand-forest">{formatCurrency(total)}</span>
        </div>
      </button>

      {/* --- Detalhes (expandido) --- */}
      {expanded ? (
        <div className="space-y-3 border-t border-slate-100 bg-slate-50/40 p-3">
          <div className="grid gap-1.5 text-xs text-slate-600">
            <p className="font-medium tracking-[0.03em] text-slate-500">
              {atendimento.protocolo || "Sem protocolo"}
            </p>
            <div className="flex items-center gap-1.5">
              <Phone className="h-3.5 w-3.5 text-brand-emerald" />
              <span className="truncate">{formatPhone(atendimento.telefone) || "Telefone não informado"}</span>
            </div>
            {atendimento.unidade_preferida ? (
              <div className="flex items-center gap-1.5">
                <MapPin className="h-3.5 w-3.5 text-brand-emerald" />
                <span className="truncate">{atendimento.unidade_preferida}</span>
              </div>
            ) : null}
            {atendimento.medico_solicitante ? (
              <div className="flex items-center gap-1.5">
                <Stethoscope className="h-3.5 w-3.5 text-brand-emerald" />
                <span className="truncate">{atendimento.medico_solicitante}</span>
              </div>
            ) : null}
            {agendamento ? (
              <div className="flex items-center gap-1.5">
                <CalendarDays className="h-3.5 w-3.5 text-brand-emerald" />
                <span className="truncate">Coleta: {agendamento}</span>
              </div>
            ) : null}
          </div>

          {/* Pendências */}
          {missingCount > 0 ? (
            <div className="rounded-lg border border-amber-200 bg-amber-50 p-2">
              <p className="mb-1 flex items-center gap-1.5 text-[11px] font-semibold text-amber-800">
                <AlertCircle className="h-3 w-3" />
                {missingCount} termo{missingCount === 1 ? "" : "s"} não encontrado{missingCount === 1 ? "" : "s"}
              </p>
              <p className="text-[11px] leading-snug text-amber-800/90">{missing.join(", ")}</p>
            </div>
          ) : null}

          {/* Observações */}
          {details?.observacoes_prescricao ? (
            <div className="text-xs">
              <p className="field-label mb-0.5">Observações do pedido</p>
              <p className="leading-snug text-slate-600">{details.observacoes_prescricao}</p>
            </div>
          ) : null}
          {details?.observacoes_conversa ? (
            <div className="text-xs">
              <p className="field-label mb-0.5">Observações da conversa</p>
              <p className="leading-snug text-slate-600">{details.observacoes_conversa}</p>
            </div>
          ) : null}

          {/* Ações */}
          <div className="flex flex-wrap gap-2 pt-1">
            <Link
              href={`/atendimentos/${atendimento.id}`}
              className="inline-flex items-center gap-1.5 rounded-lg border border-brand-emerald/30 bg-brand-mint/40 px-3 py-1.5 text-xs font-semibold text-brand-forest transition hover:bg-brand-mint"
            >
              <ExternalLink className="h-3.5 w-3.5" />
              Abrir detalhes
            </Link>
            <button
              type="button"
              onClick={handleCancel}
              disabled={cancelling}
              className="inline-flex items-center gap-1.5 rounded-lg border border-rose-200 bg-white px-3 py-1.5 text-xs font-semibold text-rose-700 transition hover:bg-rose-50 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <XCircle className="h-3.5 w-3.5" />
              {cancelling ? "Cancelando..." : "Cancelar card"}
            </button>
          </div>
        </div>
      ) : null}
    </article>
  );
}
