"use client";

import { useEffect, useState } from "react";
import { AlertTriangle, Save, Trash2 } from "lucide-react";
import type { AtendimentoExame } from "@/lib/supabase/types";
import { asString, formatCurrency, parseCurrency } from "@/lib/format";

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

  useEffect(() => {
    setPreco(parseCurrency(exame.preco)?.toString().replace(".", ",") || "");
    setPrazoDias(asString(exame.prazo_dias));
    setJejumHoras(asString(exame.jejum_horas));
    setPreparo(asString(exame.preparo));
    setIncluido(exame.incluido !== false);
    setError(null);
  }, [exame]);

  async function save() {
    setError(null);
    const precoNumber = toNumberOrNull(preco);
    const prazoNumber = toNumberOrNull(prazoDias);
    const jejumNumber = toNumberOrNull(jejumHoras);

    if (precoNumber !== null && precoNumber < 0) return setError("Preço não pode ser negativo.");
    if (prazoNumber !== null && prazoNumber < 0) return setError("Prazo não pode ser negativo.");
    if (jejumNumber !== null && jejumNumber < 0) return setError("Jejum não pode ser negativo.");

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
    <div className={`rounded-lg border p-3 ${incluido ? "border-slate-200 bg-white" : "border-slate-200 bg-slate-50 opacity-75"}`}>
      <div className="mb-3 flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h3 className={`text-sm font-semibold ${incluido ? "text-slate-950" : "text-slate-500 line-through"}`}>
              {exame.nome || "Exame sem nome"}
            </h3>
            {exame.ambiguo ? (
              <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-1 text-xs font-semibold text-amber-800">
                <AlertTriangle className="h-3.5 w-3.5" />
                Ambíguo
              </span>
            ) : null}
            {exame.editado_manual ? (
              <span className="rounded-full border border-brand-teal/20 bg-brand-teal/10 px-2 py-1 text-xs font-semibold text-brand-forest">
                Editado
              </span>
            ) : null}
          </div>
          <p className="mt-1 text-xs text-slate-500">
            SKU: {exame.sku || "-"} · termo original: {exame.termo_original || "-"} · match: {exame.match_por || "-"} · score: {asString(exame.score) || "-"}
          </p>
        </div>
        <label className="flex items-center gap-2 text-sm text-slate-700">
          <input type="checkbox" checked={incluido} disabled={readOnly || saving} onChange={(event) => toggleIncluded(event.target.checked)} />
          Incluído
        </label>
      </div>

      <div className="grid gap-3 md:grid-cols-4">
        <label className="block">
          <span className="field-label">Preço</span>
          <input className="field-input mt-1" value={preco} onChange={(event) => setPreco(event.target.value)} disabled={readOnly} />
          {preco === "0" || preco === "0,00" ? <span className="text-xs text-amber-700">Preço zero.</span> : null}
        </label>
        <label className="block">
          <span className="field-label">Prazo dias</span>
          <input className="field-input mt-1" value={prazoDias} onChange={(event) => setPrazoDias(event.target.value)} disabled={readOnly} />
        </label>
        <label className="block">
          <span className="field-label">Jejum horas</span>
          <input className="field-input mt-1" value={jejumHoras} onChange={(event) => setJejumHoras(event.target.value)} disabled={readOnly} />
        </label>
        <div className="rounded-md bg-slate-50 px-3 py-2 text-sm text-slate-600">
          <span className="field-label block">Valor atual</span>
          <span className="font-semibold text-slate-950">{formatCurrency(exame.preco)}</span>
        </div>
        <label className="block md:col-span-4">
          <span className="field-label">Preparo</span>
          <textarea className="field-input mt-1 min-h-20" value={preparo} onChange={(event) => setPreparo(event.target.value)} disabled={readOnly} />
          {!preparo ? <span className="text-xs text-amber-700">Preparo vazio.</span> : null}
        </label>
      </div>

      {error ? <p className="mt-2 text-sm text-rose-700">{error}</p> : null}

      <div className="mt-3 flex flex-wrap justify-end gap-2">
        <button className="btn btn-secondary" onClick={save} disabled={readOnly || saving}>
          <Save className="h-4 w-4" />
          Salvar exame
        </button>
        <button className="btn btn-danger" onClick={() => toggleIncluded(false)} disabled={readOnly || saving || !incluido}>
          <Trash2 className="h-4 w-4" />
          Remover do orçamento
        </button>
      </div>
    </div>
  );
}
