"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import { AuthGate } from "@/components/auth/AuthGate";
import { AppShell } from "@/components/layout/AppShell";
import { AtendimentoHeader } from "@/components/atendimento/AtendimentoHeader";
import { PatientForm } from "@/components/atendimento/PatientForm";
import { PrescriptionPanel } from "@/components/atendimento/PrescriptionPanel";
import { TermsNotFoundAlert } from "@/components/atendimento/TermsNotFoundAlert";
import { TotalSummary } from "@/components/atendimento/TotalSummary";
import { ExamList } from "@/components/exames/ExamList";
import { CatalogAutocomplete } from "@/components/exames/CatalogAutocomplete";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { supabase } from "@/lib/supabase/client";
import type { Atendimento, AtendimentoExame } from "@/lib/supabase/types";
import { formatCurrency, formatDate, parseCurrency } from "@/lib/format";
import { READONLY_STATUS } from "@/lib/status";
import { useRealtimeAtendimento } from "@/hooks/useRealtimeAtendimento";
import { useValidatorName } from "@/hooks/useValidatorName";

function termsAsArray(value: Atendimento["termos_nao_encontrados"]): string[] {
  if (Array.isArray(value)) return value;
  return [];
}

function sortExames(exames: AtendimentoExame[]) {
  return [...exames].sort((a, b) => {
    const ordemA = a.ordem ?? Number.MAX_SAFE_INTEGER;
    const ordemB = b.ordem ?? Number.MAX_SAFE_INTEGER;
    if (ordemA !== ordemB) return ordemA - ordemB;
    return String(a.created_at || a.nome || "").localeCompare(String(b.created_at || b.nome || ""));
  });
}

function AtendimentoPageContent() {
  const params = useParams<{ id: string }>();
  const id = params.id;
  const { validatorName } = useValidatorName();

  const [atendimento, setAtendimento] = useState<Atendimento | null>(null);
  const [exames, setExames] = useState<AtendimentoExame[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [warning, setWarning] = useState<string | null>(null);
  const [catalogInitialSearch, setCatalogInitialSearch] = useState("");
  const [validateOpen, setValidateOpen] = useState(false);
  const [rejectOpen, setRejectOpen] = useState(false);

  const loadAll = useCallback(async () => {
    setError(null);

    const { data: atendimentoData, error: atendimentoError } = await supabase
      .from("atendimentos")
      .select("*")
      .eq("id", id)
      .maybeSingle();

    if (atendimentoError) {
      setError(atendimentoError.message);
      setLoading(false);
      return;
    }

    if (!atendimentoData) {
      setError("Atendimento não encontrado.");
      setLoading(false);
      return;
    }

    let currentAtendimento = atendimentoData as Atendimento;

    if (currentAtendimento.status === "aguardando_validacao") {
      const { data: claimed, error: claimError } = await supabase
        .from("atendimentos")
        .update({ status: "em_validacao" })
        .eq("id", id)
        .eq("status", "aguardando_validacao")
        .select("*");

      if (claimError) {
        setWarning(`Não foi possível assumir a validação automaticamente: ${claimError.message}`);
      } else if (claimed && claimed.length > 0) {
        currentAtendimento = claimed[0] as Atendimento;
      } else {
        setWarning("Este atendimento já está em validação ou já foi finalizado.");
        const { data: refreshed } = await supabase.from("atendimentos").select("*").eq("id", id).maybeSingle();
        if (refreshed) currentAtendimento = refreshed as Atendimento;
      }
    } else if (currentAtendimento.status === "em_validacao") {
      setWarning("Este atendimento já estava em validação. Vale confirmar se outra pessoa não está editando ao mesmo tempo.");
    }

    const { data: examesData, error: examesError } = await supabase
      .from("atendimento_exames")
      .select("*")
      .eq("atendimento_id", id);

    if (examesError) {
      setError(examesError.message);
    } else {
      setAtendimento(currentAtendimento);
      setExames(sortExames((examesData || []) as AtendimentoExame[]));
    }

    setLoading(false);
  }, [id]);

  const realtime = useRealtimeAtendimento(id, loadAll);

  useEffect(() => {
    loadAll();
  }, [loadAll]);

  const readOnly = useMemo(() => {
    if (!atendimento) return true;
    return READONLY_STATUS.has(atendimento.status) || atendimento.status !== "em_validacao";
  }, [atendimento]);

  async function saveAtendimento(patch: Partial<Atendimento>) {
    if (!atendimento) return;
    setSaving(true);
    setError(null);
    const { data, error: updateError } = await supabase
      .from("atendimentos")
      .update(patch)
      .eq("id", atendimento.id)
      .select("id")
      .maybeSingle();
    if (updateError) setError(updateError.message);
    else if (!data) setError("Nenhum atendimento foi atualizado. Recarregue a página e tente novamente.");
    await loadAll();
    setSaving(false);
  }

  async function saveExame(exameId: string, patch: Partial<AtendimentoExame>) {
    setSaving(true);
    setError(null);
    const { data, error: updateError } = await supabase
      .from("atendimento_exames")
      .update(patch)
      .eq("id", exameId)
      .select("id")
      .maybeSingle();
    if (updateError) setError(updateError.message);
    else if (!data) setError("Nenhum exame foi atualizado. Recarregue a página e tente novamente.");
    await loadAll();
    setSaving(false);
  }

  async function validate() {
    if (!atendimento) return;

    const currentIncludedExams = exames.filter((exame) => exame.incluido !== false);
    if (currentIncludedExams.length === 0) {
      setError("Não é possível validar sem pelo menos um exame incluído no orçamento.");
      setValidateOpen(false);
      return;
    }

    if (!atendimento.telefone) {
      setError("Não é possível validar: o atendimento não possui telefone do responsável.");
      setValidateOpen(false);
      return;
    }

    setActionLoading(true);
    setError(null);

    const { data: validatedRecord, error: updateError } = await supabase
      .from("atendimentos")
      .update({
        status: "validado",
        validado_por: validatorName || null,
        validado_em: new Date().toISOString()
      })
      .eq("id", atendimento.id)
      .eq("status", "em_validacao")
      .select("*")
      .maybeSingle();

    if (updateError) {
      setError(updateError.message);
    } else if (!validatedRecord) {
      setError("O atendimento não foi validado. Ele pode não estar mais em validação.");
    } else {
      try {
        const webhookResponse = await fetch("/api/resposta-validada", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            type: "UPDATE",
            table: "atendimentos",
            record: validatedRecord,
            old_record: atendimento
          })
        });

        if (!webhookResponse.ok) {
          const detail = await webhookResponse.text();
          setWarning(`Atendimento validado, mas o webhook não confirmou o disparo: ${detail}`);
        }
      } catch (webhookError) {
        setWarning(`Atendimento validado, mas houve falha ao chamar o webhook: ${String(webhookError)}`);
      }
    }

    setValidateOpen(false);
    await loadAll();
    setActionLoading(false);
  }

  async function reject() {
    if (!atendimento) return;
    setActionLoading(true);
    setError(null);

    const { error: updateError } = await supabase
      .from("atendimentos")
      .update({ status: "rejeitado" })
      .eq("id", atendimento.id)
      .eq("status", "em_validacao");

    if (updateError) setError(updateError.message);

    setRejectOpen(false);
    await loadAll();
    setActionLoading(false);
  }

  if (loading) {
    return (
      <AppShell realtimeState={realtime.state}>
        <div className="rounded-2xl border border-slate-200 bg-white p-10 text-center text-sm text-slate-600">
          Carregando atendimento...
        </div>
      </AppShell>
    );
  }

  if (error && !atendimento) {
    return (
      <AppShell onRefresh={loadAll} realtimeState={realtime.state}>
        <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">{error}</div>
      </AppShell>
    );
  }

  if (!atendimento) return null;

  const includedExams = exames.filter((exame) => exame.incluido !== false);
  const total = parseCurrency(atendimento.total_validado);
  const validateDisabledReason =
    includedExams.length === 0 ? "não há nenhum exame incluído no orçamento." : null;

  const validationWarnings = [
    !validatorName ? "Usuário autenticado sem nome configurado." : null,
    total === null ? "Total validado ainda não calculado." : null,
    total === 0 ? "Total validado está zerado." : null,
    includedExams.length === 0 ? "Nenhum exame incluído no orçamento." : null,
    termsAsArray(atendimento.termos_nao_encontrados).length > 0 ? "Há termos não encontrados." : null,
    exames.some((exame) => exame.ambiguo) ? "Há exames marcados como ambíguos." : null
  ].filter(Boolean);

  return (
    <AppShell onRefresh={loadAll} realtimeState={realtime.state}>
      <div className="space-y-5">
        {error ? <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">{error}</div> : null}
        {warning ? (
          <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">{warning}</div>
        ) : null}

        {realtime.changed ? (
          <div className="flex items-center justify-between rounded-2xl border border-brand-teal/20 bg-brand-teal/10 p-4 text-sm text-brand-forest">
            <span>Este atendimento recebeu atualizações em tempo real.</span>
            <button className="font-semibold" onClick={realtime.clearChanged}>
              Ocultar aviso
            </button>
          </div>
        ) : null}

        {READONLY_STATUS.has(atendimento.status) ? (
          <div className="rounded-2xl border border-slate-200 bg-white p-4 text-sm text-slate-700">
            Este atendimento está finalizado nesta versão e abriu em modo somente leitura.
          </div>
        ) : null}

        <AtendimentoHeader
          atendimento={atendimento}
          canEdit={!readOnly}
          validateDisabledReason={validateDisabledReason}
          onValidate={() => setValidateOpen(true)}
          onReject={() => setRejectOpen(true)}
        />

        {!readOnly && validateDisabledReason ? (
          <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm font-medium text-amber-900">
            Antes de validar, precisamos corrigir este ponto: {validateDisabledReason}
          </div>
        ) : null}

        <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_360px]">
          <div className="space-y-5">
            <PatientForm atendimento={atendimento} readOnly={readOnly} saving={saving} onSave={saveAtendimento} />
            <PrescriptionPanel atendimento={atendimento} readOnly={readOnly} saving={saving} onSave={saveAtendimento} />
            <TermsNotFoundAlert
              terms={termsAsArray(atendimento.termos_nao_encontrados)}
              onPickTerm={setCatalogInitialSearch}
            />
            <CatalogAutocomplete
              atendimentoId={atendimento.id}
              exames={exames}
              readOnly={readOnly}
              initialSearch={catalogInitialSearch}
              onConsumedInitialSearch={() => setCatalogInitialSearch("")}
              onAdded={loadAll}
            />
            <ExamList exames={exames} readOnly={readOnly} saving={saving} onSave={saveExame} />
          </div>

          <div className="space-y-5">
            <TotalSummary atendimento={atendimento} />

            <section className="section">
              <h2 className="text-lg font-semibold text-slate-950">Rastreio</h2>
              <p className="mt-1 text-sm text-slate-600">
                Histórico simples do que já aconteceu com este atendimento.
              </p>

              <dl className="mt-4 space-y-3 text-sm">
                <div>
                  <dt className="field-label">Validado por</dt>
                  <dd className="text-slate-900">{atendimento.validado_por || "Ainda não validado"}</dd>
                </div>
                <div>
                  <dt className="field-label">Validado em</dt>
                  <dd className="text-slate-900">{formatDate(atendimento.validado_em)}</dd>
                </div>
                <div>
                  <dt className="field-label">Enviado em</dt>
                  <dd className="text-slate-900">{formatDate(atendimento.enviado_em)}</dd>
                </div>
              </dl>
            </section>
          </div>
        </div>
      </div>

      <ConfirmDialog
        open={validateOpen}
        title="Validar atendimento"
        message="Ao validar, o orçamento será enviado ao cliente pelo WhatsApp. Deseja continuar?"
        confirmLabel="Validar e enviar"
        loading={actionLoading}
        onCancel={() => setValidateOpen(false)}
        onConfirm={validate}
        details={
          <div className="space-y-2">
            <p>Telefone: {atendimento.telefone || "-"}</p>
            <p>Total validado: {formatCurrency(atendimento.total_validado)}</p>
            <p>Validador atual: {validatorName || "Usuário sem nome configurado"}</p>
            {validationWarnings.length > 0 ? (
              <ul className="list-disc space-y-1 pl-5 text-amber-800">
                {validationWarnings.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            ) : null}
          </div>
        }
      />

      <ConfirmDialog
        open={rejectOpen}
        title="Rejeitar atendimento"
        message="Este atendimento será marcado como rejeitado e não seguirá para envio ao cliente."
        confirmLabel="Rejeitar"
        danger
        loading={actionLoading}
        onCancel={() => setRejectOpen(false)}
        onConfirm={reject}
      />
    </AppShell>
  );
}

export default function AtendimentoPage() {
  return (
    <AuthGate>
      <AtendimentoPageContent />
    </AuthGate>
  );
}
