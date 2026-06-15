"use client";

import { useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  ChevronDown,
  ChevronUp,
  ClipboardList,
  FlaskConical,
  Save
} from "lucide-react";
import type { AtendimentoExame } from "@/lib/supabase/types";
import {
  asString,
  describeMatch,
  formatCurrency,
  formatDays,
  formatHours,
  parseCurrency
} from "@/lib/format";

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
  const [preco, setPreco] = useState("");
  const [prazoDias, setPrazoDias] = useState("");
  const [jejumHoras, setJejumHoras] = useState("");
  const [preparo, setPreparo] = useState("");
  const [incluido, setIncluido] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    setPreco(parseCurrency(exame.preco)?.toString().replace(".", ",") || "");
    setPrazoDias(asString(exame.prazo_dias));
    setJejumHoras(asString(exame.jejum_horas));
    setPreparo(asString(exame.preparo));
    setIncluido(exame.incluido !== false);
    setError(null);
  }, [exame]);

  const helperText = useMemo(() => describeMatch(exame.match_por), [exame.match_por]);

  async function save() {
    setError(null);

    const precoNumber = toNumberOrNull(preco);
    const prazoNumber = toNumberOrNull(prazoDias);
    const jejumNumber = toNumberOrNull(jejumHoras);

    if (precoNumber !== null && precoNumber < 0) return setError("O valor não pode ser negativo.");
    if (prazoNumber !== null && prazoNumber < 0) return setError("O prazo não pode ser negativo.");
    if (jejumNumber !== null && jejumNumber < 0) return setError("O jejum não pode ser negativo.");

    await onSave(exame.id, {
      preco: precoNumber,
      prazo_dias: prazoNumber,
      jejum_horas: jejumNumber,
      preparo,
      incluido,
      editado_manual: true
    });
  }

  async function toggleIncluded(nextValue: boolean) {
    setIncluido(nextValue);
    await onSave(exame.id, {
      incluido: nextValue,
      editado_manual: true
    });
  }

  return (
    <article
      className={`rounded-2xl border p-4 transition ${
        incluido
          ? "border-slate-200 bg-white shadow-sm shadow-slate-200/60"
          : "border-slate-200 bg-slate-50 opacity-80"
      }`}
    >
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className={`text-base font-semibold ${incluido ? "text-slate-950" : "text-slate-500 line-through"}`}>
              {exame.nome || "Exame sem nome"}
            </h3>

            {exame.editado_manual ? (
              <span className="chip border-brand-teal/20 bg-brand-teal/10 text-brand-forest">Editado</span>
            ) : null}

            {exame.ambiguo ? (
              <span className="chip border-amber-200 bg-amber-50 text-amber-800">
                <AlertTriangle className="h-3.5 w-3.5" />
                Revisão importante
              </span>
            ) : null}
          </div>

          <div className="mt-3 grid gap-2 text-sm text-slate-600 md:grid-cols-2 xl:grid-cols-4">
            <span>
              <strong className="font-medium text-slate-900">SKU:</strong> {exame.sku || "Não informado"}
            </span>
            <span>
              <strong className="font-medium text-slate-900">Valor:</strong> {formatCurrency(exame.preco)}
            </span>
            <span>
              <strong className="font-medium text-slate-900">Prazo:</strong> {formatDays(exame.prazo_dias)}
            </span>
            <span>
              <strong className="font-medium text-slate-900">Jejum:</strong> {formatHours(exame.jejum_horas)}
            </span>
          </div>

          <div className="mt-3 rounded-xl border border-slate-200 bg-slate-50 px-3 py-3 text-sm text-slate-700">
            <p className="field-label">Preparo</p>
            <p className="mt-1 leading-6">{preparo || "Sem preparo informado"}</p>
          </div>
        </div>

        <div className="flex shrink-0 flex-col items-stretch gap-2 lg:w-[260px]">
          <label className="flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-700">
            <span>Incluir no orçamento</span>
            <input
              type="checkbox"
              checked={incluido}
              disabled={readOnly || saving}
              onChange={(event) => toggleIncluded(event.target.checked)}
            />
          </label>

          <button className="btn btn-secondary justify-center" onClick={save} disabled={readOnly || saving}>
            <Save className="h-4 w-4" />
            Salvar alterações
          </button>

          <button
            type="button"
            className="btn btn-secondary justify-center"
            onClick={() => setExpanded((current) => !current)}
          >
            {expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            {expanded ? "Ocultar detalhes" : "Ver detalhes técnicos"}
          </button>
        </div>
      </div>

      {error ? <p className="mt-3 text-sm text-rose-700">{error}</p> : null}

      {expanded ? (
        <div className="mt-4 grid gap-4 rounded-2xl border border-slate-200 bg-slate-50 p-4 xl:grid-cols-[1fr_1fr]">
          <div className="space-y-4">
            <div>
              <div className="mb-2 flex items-center gap-2 text-sm font-semibold text-slate-900">
                <ClipboardList className="h-4 w-4 text-brand-emerald" />
                Ajustes financeiros e operacionais
              </div>
              <div className="grid gap-3 md:grid-cols-3">
                <label className="block">
                  <span className="field-label">Preço</span>
                  <input
                    className="field-input mt-1"
                    value={preco}
                    onChange={(event) => setPreco(event.target.value)}
                    disabled={readOnly}
                  />
                </label>
                <label className="block">
                  <span className="field-label">Prazo em dias</span>
                  <input
                    className="field-input mt-1"
                    value={prazoDias}
                    onChange={(event) => setPrazoDias(event.target.value)}
                    disabled={readOnly}
                  />
                </label>
                <label className="block">
                  <span className="field-label">Jejum em horas</span>
                  <input
                    className="field-input mt-1"
                    value={jejumHoras}
                    onChange={(event) => setJejumHoras(event.target.value)}
                    disabled={readOnly}
                  />
                </label>
              </div>
            </div>

            <label className="block">
              <span className="field-label">Preparo detalhado</span>
              <textarea
                className="field-input mt-1 min-h-28"
                value={preparo}
                onChange={(event) => setPreparo(event.target.value)}
                disabled={readOnly}
              />
            </label>
          </div>

          <div className="space-y-4">
            <div className="rounded-xl border border-slate-200 bg-white px-4 py-3">
              <div className="mb-2 flex items-center gap-2 text-sm font-semibold text-slate-900">
                <FlaskConical className="h-4 w-4 text-brand-emerald" />
                Origem da sugestão
              </div>
              <div className="space-y-2 text-sm text-slate-600">
                <p>
                  <strong className="font-medium text-slate-900">Termo encontrado:</strong>{" "}
                  {exame.termo_original || "Não informado"}
                </p>
                <p>
                  <strong className="font-medium text-slate-900">Forma do match:</strong> {helperText}
                </p>
                <p>
                  <strong className="font-medium text-slate-900">Score:</strong> {asString(exame.score) || "Não informado"}
                </p>
              </div>
            </div>

            <div className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-600">
              <p className="field-label">Situação do exame</p>
              <p className="mt-2 leading-6">
                {incluido
                  ? "Este exame está contando normalmente no total do atendimento."
                  : "Este exame está fora do total enquanto permanecer desmarcado."}
              </p>
            </div>
          </div>
        </div>
      ) : null}
    </article>
  );
}
