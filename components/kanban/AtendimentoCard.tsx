"use client";

import { useState, type MouseEvent } from "react";
import Link from "next/link";
import { AlertCircle, CalendarClock, Trash2 } from "lucide-react";
import type { Atendimento } from "@/lib/supabase/types";
import { formatCurrency, formatDate } from "@/lib/format";
import { supabase } from "@/lib/supabase/client";
import { StatusBadge } from "@/components/ui/StatusBadge";

interface AtendimentoCardProps {
  atendimento: Atendimento;
  onChanged?: () => void | Promise<void>;
}

export function AtendimentoCard({ atendimento, onChanged }: AtendimentoCardProps) {
  const [cancelling, setCancelling] = useState(false);
  const total = atendimento.total_validado ?? atendimento.total_bruto;
  const hasMissingTerms = Array.isArray(atendimento.termos_nao_encontrados) && atendimento.termos_nao_encontrados.length > 0;

  async function handleCancel(event: MouseEvent<HTMLButtonElement>) {
    event.preventDefault();
    event.stopPropagation();

    const ok = window.confirm(
      "Remover este card do Kanban?\n\nOs dados não serão apagados. O atendimento será marcado como cancelado no Supabase."
    );
    if (!ok) return;

    setCancelling(true);
    const { error } = await supabase
      .from("atendimentos")
      .update({ status: "cancelado" })
      .eq("id", atendimento.id);

    setCancelling(false);

    if (error) {
      window.alert(`Não foi possível cancelar o atendimento: ${error.message}`);
      return;
    }

    await onChanged?.();
  }

  return (
    <article className="group block rounded-lg border border-brand-forest/10 bg-gradient-to-br from-white via-white to-brand-mint/55 p-3 shadow-sm shadow-brand-forest/5 transition hover:-translate-y-0.5 hover:border-brand-emerald/45 hover:shadow-md hover:shadow-brand-forest/10">
      <div className="mb-3 h-1 rounded-full bg-gradient-to-r from-brand-forest via-brand-emerald to-brand-teal opacity-80 transition group-hover:opacity-100" />

      <div className="mb-2 flex items-start justify-between gap-2">
        <Link href={`/atendimentos/${atendimento.id}`} className="min-w-0 flex-1">
          <p className="text-xs font-medium text-slate-500">{atendimento.protocolo || "Sem protocolo"}</p>
          <h3 className="mt-1 text-sm font-semibold text-slate-950">
            {atendimento.paciente_nome || "Paciente não informado"}
          </h3>
        </Link>

        <div className="flex shrink-0 items-center gap-1">
          <StatusBadge status={atendimento.status} />
          <button
            type="button"
            onClick={handleCancel}
            disabled={cancelling}
            className="inline-flex h-7 w-7 items-center justify-center rounded-full border border-rose-100 bg-white text-rose-600 transition hover:border-rose-200 hover:bg-rose-50 disabled:cursor-wait disabled:opacity-60"
            title="Remover card do Kanban"
            aria-label="Remover card do Kanban"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      <Link href={`/atendimentos/${atendimento.id}`} className="block">
        <div className="space-y-1 text-xs text-slate-600">
          <p>Telefone: {atendimento.telefone || "-"}</p>
          <p>Médico: {atendimento.medico_solicitante || "-"}</p>
          <p className="font-semibold text-slate-900">Total: {formatCurrency(total)}</p>
          <p className="flex items-center gap-1">
            <CalendarClock className="h-3.5 w-3.5" />
            {formatDate(atendimento.created_at)}
          </p>
        </div>

        {hasMissingTerms ? (
          <div className="mt-2 flex items-center gap-1 rounded-md border border-amber-100 bg-amber-50 px-2 py-1 text-xs font-medium text-amber-800">
            <AlertCircle className="h-3.5 w-3.5" />
            Termos não encontrados
          </div>
        ) : null}
      </Link>
    </article>
  );
}
