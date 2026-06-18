"use client";

import { useState } from "react";
import { PlusCircle, Save, X } from "lucide-react";
import type { AtendimentoExame } from "@/lib/supabase/types";
import { formatCurrency, formatDays, formatHours } from "@/lib/format";

function toNumberOrNull(value: string): number | null {
  if (value.trim() === "") return null;
  const parsed = Number(value.replace(",", "."));
  return Number.isFinite(parsed) ? parsed : null;
}

interface ManualExamRowProps {
  saving: boolean;
  onCancel: () => void;
  onCreate: (patch: Partial<AtendimentoExame>) => Promise<boolean>;
}

export function ManualExamRow({ saving, onCancel, onCreate }: ManualExamRowProps) {
  const [nome, setNome] = useState("");
  const [sku, setSku] = useState("");
  const [preco, setPreco] = useState("");
  const [prazoDias, setPrazoDias] = useState("");
  const [jejumHoras, setJejumHoras] = useState("");
  const [preparo, setPreparo] = useState("");
  const [incluido, setIncluido] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function save() {
    setError(null);

    const nomeNormalizado = nome.trim();
    const skuNormalizado = sku.trim();
    const precoNumber = toNumberOrNull(preco);
    const prazoNumber = toNumberOrNull(prazoDias);
    const jejumNumber = toNumberOrNull(jejumHoras);

    if (!nomeNormalizado) return setError("Informe o nome do exame.");
    if (preco.trim() && precoNumber === null) return setError("Informe um valor valido.");
    if (prazoDias.trim() && prazoNumber === null) return setError("Informe um prazo valido.");
    if (jejumHoras.trim() && jejumNumber === null) return setError("Informe um tempo de jejum valido.");
    if (prazoNumber !== null && !Number.isInteger(prazoNumber)) return setError("O prazo deve ser informado em dias inteiros.");
    if (jejumNumber !== null && !Number.isInteger(jejumNumber)) return setError("O jejum deve ser informado em horas inteiras.");
    if (precoNumber !== null && precoNumber < 0) return setError("O valor nao pode ser negativo.");
    if (prazoNumber !== null && prazoNumber < 0) return setError("O prazo nao pode ser negativo.");
    if (jejumNumber !== null && jejumNumber < 0) return setError("O jejum nao pode ser negativo.");

    const created = await onCreate({
      nome: nomeNormalizado,
      sku: skuNormalizado || null,
      preco: precoNumber,
      prazo_dias: prazoNumber,
      jejum_horas: jejumNumber,
      preparo: preparo.trim() || null,
      termo_original: nomeNormalizado,
      match_por: "manual_livre",
      score: null,
      ambiguo: false,
      incluido,
      editado_manual: true,
    });

    if (!created) setError("Nao foi possivel salvar o exame. Verifique os dados e tente novamente.");
  }

  return (
    <article className="rounded-lg border border-brand-teal/30 bg-gradient-to-br from-white to-brand-mint/30 px-3 py-3 shadow-sm shadow-slate-900/5">
      <div className="flex flex-col gap-3">
        <div className="flex flex-col gap-2 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <PlusCircle className="h-4 w-4 text-brand-emerald" />
              <h3 className="text-sm font-semibold text-slate-950">Novo exame manual</h3>
            </div>
            <p className="mt-1 text-xs text-slate-600">Preencha os dados livremente. Nenhuma busca no catalogo sera realizada.</p>
          </div>

          <label className="flex items-center justify-between gap-2 rounded-lg border border-slate-200 bg-white/90 px-2.5 py-1.5 text-sm text-slate-700 lg:min-w-[142px]">
            <span>Incluido</span>
            <input type="checkbox" checked={incluido} onChange={(event) => setIncluido(event.target.checked)} disabled={saving} />
          </label>
        </div>

        <div className="grid gap-2.5 xl:grid-cols-[minmax(0,1fr)_220px]">
          <div className="grid gap-2 md:grid-cols-3">
            <label className="block md:col-span-2">
              <span className="field-label">Nome do exame</span>
              <input
                autoFocus
                className="field-input mt-1 px-3 py-1.5 text-sm"
                value={nome}
                onChange={(event) => setNome(event.target.value)}
                placeholder="Digite o nome do exame"
                disabled={saving}
              />
            </label>

            <label className="block">
              <span className="field-label">SKU</span>
              <input
                className="field-input mt-1 px-3 py-1.5 text-sm"
                value={sku}
                onChange={(event) => setSku(event.target.value)}
                placeholder="Opcional"
                disabled={saving}
              />
            </label>

            <label className="block">
              <span className="field-label">Preco</span>
              <input
                inputMode="decimal"
                className="field-input mt-1 px-3 py-1.5 text-sm"
                value={preco}
                onChange={(event) => setPreco(event.target.value)}
                placeholder="0,00"
                disabled={saving}
              />
            </label>

            <label className="block">
              <span className="field-label">Prazo dias</span>
              <input
                inputMode="numeric"
                className="field-input mt-1 px-3 py-1.5 text-sm"
                value={prazoDias}
                onChange={(event) => setPrazoDias(event.target.value)}
                placeholder="Opcional"
                disabled={saving}
              />
            </label>

            <label className="block">
              <span className="field-label">Jejum horas</span>
              <input
                inputMode="decimal"
                className="field-input mt-1 px-3 py-1.5 text-sm"
                value={jejumHoras}
                onChange={(event) => setJejumHoras(event.target.value)}
                placeholder="Opcional"
                disabled={saving}
              />
            </label>

            <label className="block md:col-span-3">
              <span className="field-label">Preparo</span>
              <textarea
                className="field-input mt-1 min-h-[74px] px-3 py-2 text-sm leading-5"
                value={preparo}
                onChange={(event) => setPreparo(event.target.value)}
                placeholder="Digite as orientacoes de preparo"
                disabled={saving}
              />
            </label>
          </div>

          <div className="rounded-lg border border-brand-teal/15 bg-white/85 px-3 py-2 shadow-sm shadow-slate-900/5">
            <p className="field-label text-brand-forest">Resumo</p>
            <div className="mt-1.5 space-y-1 text-xs leading-5 text-slate-700">
              <p><strong className="font-medium text-slate-900">Nome:</strong> {nome.trim() || "Nao informado"}</p>
              <p><strong className="font-medium text-slate-900">SKU:</strong> {sku.trim() || "Nao informado"}</p>
              <p><strong className="font-medium text-slate-900">Valor:</strong> {preco.trim() ? formatCurrency(toNumberOrNull(preco)) : "Nao informado"}</p>
              <p><strong className="font-medium text-slate-900">Prazo:</strong> {formatDays(toNumberOrNull(prazoDias))}</p>
              <p><strong className="font-medium text-slate-900">Jejum:</strong> {formatHours(toNumberOrNull(jejumHoras))}</p>
            </div>
          </div>
        </div>

        {error ? <p className="text-xs text-rose-700">{error}</p> : null}

        <div className="flex flex-wrap items-center gap-2">
          <button type="button" className="btn btn-primary px-3 py-1.5" onClick={save} disabled={saving}>
            <Save className="h-4 w-4" />
            {saving ? "Salvando..." : "Salvar exame"}
          </button>
          <button type="button" className="btn btn-secondary px-3 py-1.5" onClick={onCancel} disabled={saving}>
            <X className="h-4 w-4" />
            Cancelar
          </button>
        </div>
      </div>
    </article>
  );
}
