"use client";

import Link from "next/link";
import { ArrowLeft, CheckCircle2, Phone, ReceiptText, UserRound, XCircle } from "lucide-react";
import type { Atendimento } from "@/lib/supabase/types";
import { formatCurrency, formatDate, formatPhone } from "@/lib/format";
import { StatusBadge } from "@/components/ui/StatusBadge";

interface AtendimentoHeaderProps {
  atendimento: Atendimento;
  canEdit: boolean;
  validateDisabledReason?: string | null;
  onValidate: () => void;
  onReject: () => void;
}

export function AtendimentoHeader({
  atendimento,
  canEdit,
  validateDisabledReason,
  onValidate,
  onReject
}: AtendimentoHeaderProps) {
  const canValidate = canEdit && !validateDisabledReason;

  return (
    <section className="section">
      <div className="flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
        <div className="min-w-0 flex-1">
          <Link
            href="/"
            className="mb-3 inline-flex items-center gap-2 text-sm font-medium text-brand-emerald transition hover:text-brand-forest"
          >
            <ArrowLeft className="h-4 w-4" />
            Voltar ao Kanban
          </Link>

          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-2xl font-semibold tracking-tight text-slate-950">
              {atendimento.protocolo || "Atendimento sem protocolo"}
            </h1>
            <StatusBadge status={atendimento.status} />
          </div>

          <p className="mt-2 max-w-3xl text-sm text-slate-600">
            Revise os dados do paciente, confirme os exames e valide somente quando o orçamento estiver pronto para
            retornar ao cliente.
          </p>

          <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
            <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
              <p className="field-label">Paciente</p>
              <p className="mt-1 text-sm font-semibold text-slate-950">
                {atendimento.paciente_nome || "Não informado"}
              </p>
            </div>

            <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
              <div className="flex items-center gap-2 text-slate-500">
                <Phone className="h-4 w-4" />
                <p className="field-label">Contato</p>
              </div>
              <p className="mt-1 text-sm font-semibold text-slate-950">{formatPhone(atendimento.telefone)}</p>
            </div>

            <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
              <div className="flex items-center gap-2 text-slate-500">
                <UserRound className="h-4 w-4" />
                <p className="field-label">Responsável</p>
              </div>
              <p className="mt-1 text-sm font-semibold text-slate-950">
                {atendimento.responsavel_nome || "Não informado"}
              </p>
            </div>

            <div className="rounded-xl border border-brand-emerald/20 bg-brand-mint/50 px-4 py-3">
              <div className="flex items-center gap-2 text-brand-forest">
                <ReceiptText className="h-4 w-4" />
                <p className="field-label text-brand-forest/70">Total atual</p>
              </div>
              <p className="mt-1 text-lg font-semibold text-brand-forest">
                {formatCurrency(atendimento.total_validado ?? atendimento.total_bruto)}
              </p>
            </div>
          </div>

          <div className="mt-4 flex flex-wrap gap-x-6 gap-y-2 text-sm text-slate-600">
            <span>
              <strong className="font-medium text-slate-900">Recebido em:</strong> {formatDate(atendimento.created_at)}
            </span>
            <span>
              <strong className="font-medium text-slate-900">Status atual:</strong> {atendimento.status}
            </span>
          </div>
        </div>

        <div className="flex shrink-0 flex-wrap gap-2">
          <button className="btn btn-secondary" onClick={onReject} disabled={!canEdit}>
            <XCircle className="h-4 w-4" />
            Rejeitar
          </button>
          <button
            className="btn btn-primary"
            onClick={onValidate}
            disabled={!canValidate}
            title={validateDisabledReason || undefined}
          >
            <CheckCircle2 className="h-4 w-4" />
            Validar e enviar
          </button>
        </div>
      </div>
    </section>
  );
}
