"use client";

import { useEffect, useMemo, useState } from "react";
import { AlertTriangle, ChevronDown, ChevronUp, ClipboardList, FlaskConical, Pencil, Save, X } from "lucide-react";
import type { AtendimentoExame } from "@/lib/supabase/types";
import { asString, describeMatch, formatCurrency, formatDays, formatHours, parseCurrency } from "@/lib/format";

function toNumberOrNull(value: string): number | null {
  if (value.trim() === "") return null;
  const parsed = Number(value.replace(",", "."));
  return Number.isFinite(parsed) ? parsed : null;
}

interface ExamRowProps {
  exame: AtendimentoExame;
  readOnly: boolean;
  saving: boolean;
  onSave: (id: string, patch: Partial<AtendimentoExame>) => Promise<void>;
}

export function ExamRow({ exame, readOnly, saving, onSave }: ExamRowProps) {
  const [nome, setNome] = useState("");
  const [sku, setSku] = useState("");
  const [preco, setPreco] = useState("");
  const [prazoDias, setPrazoDias] = useState("");
  const [jejumHoras, setJejumHoras] = useState("");
  const [preparo, setPreparo] = useState("");
  const [incluido, setIncluido] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expanded, setExpanded] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    setNome(asString(exame.nome));
    setSku(asString(exame.sku));
    setPreco(parseCurrency(exame.preco)?.toString().replace(".", ",") || "");
    setPrazoDias(asString(exame.prazo_dias));
    setJejumHoras(asString(exame.jejum_horas));
    setPreparo(asString(exame.preparo));
    setIncluido(exame.incluido !== false);
    setError(null);
    setIsEditing(false);
  }, [exame]);

  const helperText = useMemo(() => describeMatch(exame.match_por), [exame.match_por]);
  const fieldsDisabled = readOnly || !isEditing || saving;

  function resetDraft() {
    setNome(asString(exame.nome));
    setSku(asString(exame.sku));
    setPreco(parseCurrency(exame.preco)?.toString().replace(".", ",") || "");
    setPrazoDias(asString(exame.prazo_dias));
    setJejumHoras(asString(exame.jejum_horas));
    setPreparo(asString(exame.preparo));
    setError(null);
  }

  async function save() {
    setError(null);

    const nomeNormalizado = nome.trim();
    const skuNormalizado = sku.trim();
    const precoNumber = toNumberOrNull(preco);
    const prazoNumber = toNumberOrNull(prazoDias);
    const jejumNumber = toNumberOrNull(jejumHoras);

    if (!nomeNormalizado) return setError("Informe o nome do exame.");
    if (precoNumber !== null && precoNumber < 0) return setError("O valor nao pode ser negativo.");
    if (prazoNumber !== null && prazoNumber < 0) return setError("O prazo nao pode ser negativo.");
    if (jejumNumber !== null && jejumNumber < 0) return setError("O jejum nao pode ser negativo.");

    await onSave(exame.id, {
      nome: nomeNormalizado,
      sku: skuNormalizado || null,
      preco: precoNumber,
      prazo_dias: prazoNumber,
      jejum_horas: jejumNumber,
      preparo,
      incluido,
      editado_manual: true,
    });

    setIsEditing(false);
  }

  async function toggleIncluded(nextValue: boolean) {
    setIncluido(nextValue);
    await onSave(exame.id, {
      incluido: nextValue,
      editado_manual: true,
    });
  }

  return (
    <article
      className={`rounded-lg border px-3 py-2.5 transition ${
        incluido
          ? "border-slate-200 bg-gradient-to-br from-white to-brand-mint/20 shadow-sm shadow-slate-900/5"
          : "border-slate-200 bg-slate-50/80 opacity-80"
      }`}
    >
      <div className="flex flex-col gap-2.5">
        <div className="flex flex-col gap-2 lg:flex-row lg:items-start lg:justify-between">
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-1.5">
              <h3 className={`text-sm font-semibold ${incluido ? "text-slate-950" : "text-slate-500 line-through"}`}>
                {nome || "Exame sem nome"}
              </h3>

              {exame.editado_manual ? (
                <span className="chip border-brand-teal/20 bg-brand-teal/10 text-brand-forest">Editado</span>
              ) : null}

              {exame.ambiguo ? (
                <span className="chip border-amber-200 bg-amber-50 text-amber-800">
                  <AlertTriangle className="h-3.5 w-3.5" />
                  Revisar
                </span>
              ) : null}

              {!incluido ? <span className="chip border-slate-200 bg-slate-100 text-slate-600">Fora do total</span> : null}
            </div>

            <p className="mt-1 text-[12px] leading-5 text-slate-600">
              {exame.termo_original ? `Termo: ${exame.termo_original} · ${helperText}` : helperText}
            </p>
          </div>

          <label className="flex items-center justify-between gap-2 rounded-lg border border-slate-200 bg-white/90 px-2.5 py-1.5 text-sm text-slate-700 lg:min-w-[142px]">
            <span>Incluído</span>
            <input
              type="checkbox"
              checked={incluido}
              disabled={readOnly || saving}
              onChange={(event) => toggleIncluded(event.target.checked)}
            />
          </label>
        </div>

        <div className="grid gap-2.5 xl:grid-cols-[minmax(0,1fr)_220px]">
          <div className="grid gap-2 md:grid-cols-3">
            <label className="block">
              <span className="field-label">SKU</span>
              <input
                className="field-input mt-1 px-3 py-1.5 text-sm"
                value={sku}
                onChange={(event) => setSku(event.target.value)}
                disabled={fieldsDisabled}
              />
            </label>

            <label className="block">
              <span className="field-label">Preço</span>
              <input
                className="field-input mt-1 px-3 py-1.5 text-sm"
                value={preco}
                onChange={(event) => setPreco(event.target.value)}
                disabled={fieldsDisabled}
              />
            </label>

            <label className="block">
              <span className="field-label">Prazo dias</span>
              <input
                className="field-input mt-1 px-3 py-1.5 text-sm"
                value={prazoDias}
                onChange={(event) => setPrazoDias(event.target.value)}
                disabled={fieldsDisabled}
              />
            </label>

            <label className="block md:col-span-3 lg:md:col-span-1">
              <span className="field-label">Jejum horas</span>
              <input
                className="field-input mt-1 px-3 py-1.5 text-sm"
                value={jejumHoras}
                onChange={(event) => setJejumHoras(event.target.value)}
                disabled={fieldsDisabled}
              />
            </label>

            <label className="block md:col-span-3">
              <span className="field-label">Preparo</span>
              <textarea
                className="field-input mt-1 min-h-[74px] px-3 py-2 text-sm leading-5"
                value={preparo}
                onChange={(event) => setPreparo(event.target.value)}
                disabled={fieldsDisabled}
                placeholder="Sem preparo informado"
              />
            </label>
          </div>

          <div className="rounded-lg border border-brand-teal/15 bg-white/85 px-3 py-2 shadow-sm shadow-slate-900/5">
            <p className="field-label text-brand-forest">Resumo</p>
            <div className="mt-1.5 space-y-1 text-xs leading-5 text-slate-700">
              <p><strong className="font-medium text-slate-900">Nome:</strong> {nome || "Nao informado"}</p>
              <p><strong className="font-medium text-slate-900">SKU:</strong> {sku || "Nao informado"}</p>
              <p><strong className="font-medium text-slate-900">Valor:</strong> {preco.trim() ? formatCurrency(toNumberOrNull(preco)) : "Nao informado"}</p>
              <p><strong className="font-medium text-slate-900">Prazo:</strong> {formatDays(toNumberOrNull(prazoDias))}</p>
              <p><strong className="font-medium text-slate-900">Jejum:</strong> {formatHours(toNumberOrNull(jejumHoras))}</p>
            </div>
          </div>
        </div>

        {error ? <p className="text-xs text-rose-700">{error}</p> : null}

        <div className="flex flex-wrap items-center gap-2">
          {!isEditing && !readOnly ? (
            <button className="btn btn-secondary px-3 py-1.5" onClick={() => setIsEditing(true)} disabled={saving}>
              <Pencil className="h-4 w-4" />
              Editar
            </button>
          ) : null}

          {isEditing && !readOnly ? (
            <>
              <button className="btn btn-primary px-3 py-1.5" onClick={save} disabled={saving}>
                <Save className="h-4 w-4" />
                Salvar
              </button>

              <button
                type="button"
                className="btn btn-secondary px-3 py-1.5"
                onClick={() => {
                  resetDraft();
                  setIsEditing(false);
                }}
                disabled={saving}
              >
                <X className="h-4 w-4" />
                Cancelar
              </button>
            </>
          ) : null}

          <button type="button" className="btn btn-secondary px-3 py-1.5" onClick={() => setExpanded((current) => !current)}>
            {expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            {expanded ? "Ocultar detalhes" : "Detalhes técnicos"}
          </button>
        </div>

        {expanded ? (
          <div className="grid gap-2 rounded-lg border border-slate-200 bg-slate-50/80 p-2.5 xl:grid-cols-[1fr_1fr]">
            <div className="rounded-lg border border-slate-200 bg-white px-3 py-2">
              <div className="mb-1 flex items-center gap-2 text-sm font-semibold text-slate-900">
                <ClipboardList className="h-4 w-4 text-brand-emerald" />
                Origem do match
              </div>
              <div className="space-y-1 text-sm leading-5 text-slate-600">
                <p><strong className="font-medium text-slate-900">Termo:</strong> {exame.termo_original || "Não informado"}</p>
                <p><strong className="font-medium text-slate-900">Tipo:</strong> {helperText}</p>
                <p><strong className="font-medium text-slate-900">Score:</strong> {asString(exame.score) || "Não informado"}</p>
              </div>
            </div>

            <div className="rounded-lg border border-slate-200 bg-white px-3 py-2">
              <div className="mb-1 flex items-center gap-2 text-sm font-semibold text-slate-900">
                <FlaskConical className="h-4 w-4 text-brand-emerald" />
                Situação do exame
              </div>
              <p className="text-sm leading-5 text-slate-600">
                {incluido
                  ? "Incluído normalmente no total validado."
                  : "Mantido no atendimento, mas fora do total enquanto estiver desmarcado."}
              </p>
            </div>
          </div>
        ) : null}
      </div>
    </article>
  );
}
