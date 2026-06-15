"use client";

import Link from "next/link";
import { ArrowLeft, CheckCircle2, Clock3, Phone, ReceiptText, UserRound, XCircle } from "lucide-react";
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
    <section className="section overflow-hidden">
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 pb-4">
        <div>
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-sm font-medium text-brand-emerald transition hover:text-brand-forest"
          >
            <ArrowLeft className="h-4 w-4" />
            Voltar ao Kanban
          </Link>
          <div className="mt-3 flex flex-wrap items-center gap-3">
            <h1 className="text-2xl font-semibold tracking-tight text-slate-950">Orçamento em validação</h1>
            <StatusBadge status={atendimento.status} />
          </div>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">
            Revise os dados do atendimento, confirme os exames e só finalize quando o retorno estiver pronto para o cliente.
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <button className="btn btn-secondary" onClick={onReject} disabled={!canEdit}>
            <XCircle className="h-4 w-4" />
            Rejeitar orçamento
          </button>
          <button
            className="btn btn-primary"
            onClick={onValidate}
            disabled={!canValidate}
            title={validateDisabledReason || undefined}
          >
            <CheckCircle2 className="h-4 w-4" />
            Validar orçamento
          </button>
        </div>
      </div>

      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-5">
        <div className="metric-card xl:col-span-2">
          <p className="field-label">Paciente</p>
          <p className="mt-1 text-lg font-semibold text-slate-950">{atendimento.paciente_nome || "Paciente não informado"}</p>
          <p className="mt-2 text-sm text-slate-600">Protocolo: {atendimento.protocolo || "Sem protocolo"}</p>
        </div>

        <div className="metric-card">
          <div className="flex items-center gap-2 text-slate-500">
            <Phone className="h-4 w-4 text-brand-emerald" />
            <p className="field-label">Telefone</p>
          </div>
          <p className="mt-1 text-sm font-semibold text-slate-950">{formatPhone(atendimento.telefone)}</p>
        </div>

        <div className="metric-card">
          <div className="flex items-center gap-2 text-slate-500">
            <UserRound className="h-4 w-4 text-brand-emerald" />
            <p className="field-label">Validador responsável</p>
          </div>
          <p className="mt-1 text-sm font-semibold text-slate-950">{atendimento.validado_por || atendimento.responsavel_nome || "Ainda não definido"}</p>
        </div>

        <div className="rounded-xl border border-brand-emerald/15 bg-[linear-gradient(180deg,#f8fcfa_0%,#eef8f3_100%)] px-4 py-3 shadow-sm shadow-brand-forest/5">
          <div className="flex items-center gap-2 text-brand-forest/70">
            <ReceiptText className="h-4 w-4 text-brand-emerald" />
            <p className="field-label text-brand-forest/70">Total atual</p>
          </div>
          <p className="mt-1 text-2xl font-semibold tracking-tight text-brand-forest">
            {formatCurrency(atendimento.total_validado ?? atendimento.total_bruto)}
          </p>
        </div>
      </div>

      <div className="mt-4 flex flex-wrap gap-x-6 gap-y-2 text-sm text-slate-600">
        <span className="inline-flex items-center gap-2">
          <Clock3 className="h-4 w-4 text-brand-emerald" />
          Recebido em {formatDate(atendimento.created_at)}
        </span>
        <span>Última atualização em {formatDate(atendimento.updated_at)}</span>
      </div>
    </section>
  );
}
