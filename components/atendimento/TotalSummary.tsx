"use client";

import { useEffect, useState } from "react";
import type { Atendimento } from "@/lib/supabase/types";
import { formatCurrency, parseCurrency } from "@/lib/format";

interface TotalSummaryProps {
  atendimento: Atendimento;
  readOnly: boolean;
  saving: boolean;
  onSave: (patch: Partial<Atendimento>) => Promise<void>;
}

function clampPct(value: number): number {
  if (!Number.isFinite(value)) return 0;
  return Math.min(100, Math.max(0, value));
}

export function TotalSummary({ atendimento, readOnly, saving, onSave }: TotalSummaryProps) {
  const bruto = parseCurrency(atendimento.total_validado);
  const descontoSalvo = clampPct(Number(atendimento.desconto_pct ?? 0) || 0);
  const [desconto, setDesconto] = useState(String(descontoSalvo));

  useEffect(() => {
    setDesconto(String(clampPct(Number(atendimento.desconto_pct ?? 0) || 0)));
  }, [atendimento.desconto_pct]);

  const descontoNum = clampPct(Number(desconto.replace(",", ".")) || 0);
  const final = bruto === null ? null : Number((bruto * (1 - descontoNum / 100)).toFixed(2));
  const economia = bruto === null ? null : Number((bruto * (descontoNum / 100)).toFixed(2));
  const temDesconto = descontoNum > 0;

  async function commit() {
    const novo = clampPct(Number(desconto.replace(",", ".")) || 0);
    setDesconto(String(novo));
    if (novo === descontoSalvo) return;
    await onSave({ desconto_pct: novo });
  }

  return (
    <section className="section">
      <h2 className="section-title">Resumo do orçamento</h2>

      <div className="mt-3 rounded-lg border border-brand-emerald/15 bg-[linear-gradient(180deg,#f5fffb_0%,#ebf7f1_100%)] px-4 py-4">
        <div className="flex items-center justify-between text-sm">
          <span className="text-slate-600">Total dos exames</span>
          <span className={temDesconto ? "font-medium text-slate-400 line-through" : "font-medium text-slate-700"}>
            {formatCurrency(atendimento.total_validado)}
          </span>
        </div>

        <div className="mt-3 flex items-center justify-between gap-3">
          <label className="field-label text-brand-forest/70" htmlFor="desconto-pct">
            Desconto manual
          </label>
          <div className="relative w-24">
            <input
              id="desconto-pct"
              inputMode="decimal"
              className="field-input h-9 pr-7 text-right text-sm"
              value={desconto}
              disabled={readOnly || saving || bruto === null}
              onChange={(event) => setDesconto(event.target.value.replace(/[^0-9.,]/g, ""))}
              onBlur={commit}
              onKeyDown={(event) => {
                if (event.key === "Enter") (event.target as HTMLInputElement).blur();
              }}
            />
            <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-sm text-slate-400">%</span>
          </div>
        </div>

        {temDesconto && economia !== null ? (
          <p className="mt-1 text-right text-xs font-medium text-emerald-700">
            Economia de {formatCurrency(economia)}
          </p>
        ) : null}

        <div className="mt-3 border-t border-brand-emerald/15 pt-3">
          <p className="field-label text-brand-forest/70">{temDesconto ? "Total com desconto" : "Total aprovado"}</p>
          <p className="mt-1 text-3xl font-semibold tracking-tight text-brand-forest">
            {bruto === null ? "Não informado" : formatCurrency(final)}
          </p>
        </div>

        {atendimento.total_validado === null ? (
          <p className="mt-2 text-sm text-amber-700">Total ainda não calculado.</p>
        ) : bruto === 0 ? (
          <p className="mt-2 text-sm text-rose-700">Total zerado. Revise os exames.</p>
        ) : (
          <p className="mt-2 text-sm text-slate-600">
            {temDesconto
              ? "Desconto aplicado — este é o valor que vai ao cliente no PDF."
              : "Valor atual consolidado para aprovação."}
          </p>
        )}
      </div>
    </section>
  );
}
