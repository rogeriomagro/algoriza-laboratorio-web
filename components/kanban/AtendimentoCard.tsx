"use client";

import { useState, type MouseEvent } from "react";
import Link from "next/link";
import { AlertCircle, CalendarClock, Phone, Stethoscope, Trash2 } from "lucide-react";
import type { Atendimento } from "@/lib/supabase/types";
import { formatCurrency, formatDate, formatPhone } from "@/lib/format";
import { supabase } from "@/lib/supabase/client";
import { StatusBadge } from "@/components/ui/StatusBadge";

interface AtendimentoCardProps {
  atendimento: Atendimento;
  onChanged?: () => void | Promise<void>;
}

export function AtendimentoCard({ atendimento, onChanged }: AtendimentoCardProps) {
  const [cancelling, setCancelling] = useState(false);

  const total = atendimento.total_validado ?? atendimento.total_bruto;
  const hasMissingTerms =
    Array.isArray(atendimento.termos_nao_encontrados) && atendimento.termos_nao_encontrados.length > 0;

  async function handleCancel(event: MouseEvent<HTMLButtonElement>) {
    event.preventDefault();
    event.stopPropagation();

    const ok = window.confirm(
      "Remover este atendimento do quadro?\n\nOs dados continuarão salvos. O status será alterado para cancelado."
    );
    if (!ok) return;

    setCancelling(true);

    const { error } = await supabase.from("atendimentos").update({ status: "cancelado" }).eq("id", atendimento.id);

    setCancelling(false);

    if (error) {
      window.alert(`Não foi possível remover o card: ${error.message}`);
      return;
    }

    await onChanged?.();
  }

  return (
    <article className="group rounded-xl border border-slate-200 bg-white p-4 shadow-sm shadow-slate-200/70 transition hover:-translate-y-0.5 hover:border-brand-emerald/35 hover:shadow-md hover:shadow-brand-forest/10">
      <div className="mb-4 h-1 rounded-full bg-gradient-to-r from-brand-forest via-brand-emerald to-brand-teal" />

      <div className="mb-3 flex items-start justify-between gap-3">
        <Link href={`/atendimentos/${atendimento.id}`} className="min-w-0 flex-1">
          <p className="text-xs font-medium tracking-[0.02em] text-slate-500">
            {atendimento.protocolo || "Sem protocolo"}
          </p>
          <h3 className="mt-1 text-base font-semibold leading-tight text-slate-950">
            {atendimento.paciente_nome || "Paciente não informado"}
          </h3>
        </Link>

        <div className="flex items-center gap-2">
          <StatusBadge status={atendimento.status} />
          <button
            type="button"
            onClick={handleCancel}
            disabled={cancelling}
            className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-500 transition hover:border-rose-200 hover:bg-rose-50 hover:text-rose-600 disabled:cursor-wait disabled:opacity-60"
            title="Retirar este atendimento do quadro"
            aria-label="Retirar este atendimento do quadro"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      </div>

      <Link href={`/atendimentos/${atendimento.id}`} className="block space-y-3">
        <div className="space-y-2 text-sm text-slate-600">
          <div className="flex items-center gap-2">
            <Phone className="h-4 w-4 text-brand-emerald" />
            <span>{formatPhone(atendimento.telefone)}</span>
          </div>

          <div className="flex items-start gap-2">
            <Stethoscope className="mt-0.5 h-4 w-4 text-brand-emerald" />
            <span className="line-clamp-2">{atendimento.medico_solicitante || "Médico não informado"}</span>
          </div>

          <div className="flex items-center gap-2">
            <CalendarClock className="h-4 w-4 text-brand-emerald" />
            <span>{formatDate(atendimento.created_at)}</span>
          </div>
        </div>

        <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2">
          <p className="text-[11px] font-medium uppercase tracking-[0.08em] text-slate-500">Total do atendimento</p>
          <p className="mt-1 text-lg font-semibold text-slate-950">{formatCurrency(total)}</p>
        </div>

        {hasMissingTerms ? (
          <div className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900">
            <div className="flex items-center gap-2 font-medium">
              <AlertCircle className="h-4 w-4" />
              Atenção para termos não reconhecidos
            </div>
          </div>
        ) : null}
      </Link>
    </article>
  );
}
