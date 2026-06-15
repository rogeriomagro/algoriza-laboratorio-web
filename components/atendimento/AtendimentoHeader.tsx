"use client";

import Link from "next/link";
import { ArrowLeft, CheckCircle2, XCircle } from "lucide-react";
import type { Atendimento } from "@/lib/supabase/types";
import { formatCurrency, formatDate } from "@/lib/format";
import { StatusBadge } from "@/components/ui/StatusBadge";

interface AtendimentoHeaderProps {
  atendimento: Atendimento;
  canEdit: boolean;
  validateDisabledReason?: string | null;
  onValidate: () => void;
  onReject: () => void;
}

export function AtendimentoHeader({ atendimento, canEdit, validateDisabledReason, onValidate, onReject }: AtendimentoHeaderProps) {
  const canValidate = canEdit && !validateDisabledReason;

  return (
    <div className="section">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <Link href="/" className="mb-3 inline-flex items-center gap-2 text-sm font-medium text-brand-emerald hover:text-brand-forest">
            <ArrowLeft className="h-4 w-4" />
            Voltar ao Kanban
          </Link>
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-xl font-semibold text-slate-950">{atendimento.protocolo || "Sem protocolo"}</h1>
            <StatusBadge status={atendimento.status} />
          </div>
          <div className="mt-2 grid gap-1 text-sm text-slate-600 md:grid-cols-2 xl:grid-cols-4">
            <span>Data: {formatDate(atendimento.created_at)}</span>
            <span>Telefone: {atendimento.telefone || "-"}</span>
            <span>Responsável: {atendimento.responsavel_nome || "-"}</span>
            <span className="font-semibold text-slate-950">Total: {formatCurrency(atendimento.total_validado)}</span>
          </div>
        </div>

        <div className="flex gap-2">
          <button className="btn btn-secondary" onClick={onReject} disabled={!canEdit}>
            <XCircle className="h-4 w-4" />
            Rejeitar
          </button>
          <button className="btn btn-primary" onClick={onValidate} disabled={!canValidate} title={validateDisabledReason || undefined}>
            <CheckCircle2 className="h-4 w-4" />
            Validar
          </button>
        </div>
      </div>
    </div>
  );
}
