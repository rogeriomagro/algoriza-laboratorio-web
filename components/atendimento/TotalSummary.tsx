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

function clampDays(value: number): number {
  if (!Number.isFinite(value)) return 30;
  return Math.min(365, Math.max(1, Math.round(value)));
}

export function TotalSummary({ atendimento, readOnly, saving, onSave }: TotalSummaryProps) {
  const bruto = parseCurrency(atendimento.total_validado);
  // Padrão de desconto = 20%: quando o valor salvo for 0 (ou vazio), exibe/aplica 20.
  const descontoSalvo = clampPct(Number(atendimento.desconto_pct ?? 0) || 0);
  const descontoInicial = descontoSalvo > 0 ? descontoSalvo : 20;
  const [desconto, setDesconto] = useState(String(descontoInicial));
  const validadeSalva = clampDays(Number(atendimento.validade_dias ?? 30) || 30);
  const [validade, setValidade] = useState(String(validadeSalva));

  useEffect(() => {
    const s = clampPct(Number(atendimento.desconto_pct ?? 0) || 0);
    setDesconto(String(s > 0 ? s : 20));
  }, [atendimento.desconto_pct]);

  useEffect(() => {
    setValidade(String(clampDays(Number(atendimento.validade_dias ?? 30) || 30)));
  }, [atendimento.validade_dias]);

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

  async function commitValidade() {
    const novo = clampDays(Number(validade) || 30);
    setValidade(String(novo));
    if (novo === validadeSalva) return;
    await onSave({ validade_dias: novo });
  }

  return (
    <>
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
              className="field-input h-9 !pr-8 text-right text-sm"
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

    <section className="section">
      <h2 className="section-title">Validade do orçamento</h2>
      <div className="mt-3 flex items-center justify-between gap-3">
        <div className="min-w-0">
          <label className="field-label text-brand-forest/70" htmlFor="validade-dias">
            Dias de validade
          </label>
          <p className="mt-0.5 text-xs text-slate-500">
            Quanto tempo o orçamento fica válido após a validação (vai no PDF).
          </p>
        </div>
        <div className="w-24 shrink-0">
          <input
            id="validade-dias"
            inputMode="numeric"
            className="field-input h-9 text-right text-sm"
            value={validade}
            disabled={readOnly || saving}
            onChange={(event) => setValidade(event.target.value.replace(/[^0-9]/g, ""))}
            onBlur={commitValidade}
            onKeyDown={(event) => {
              if (event.key === "Enter") (event.target as HTMLInputElement).blur();
            }}
          />
        </div>
      </div>
    </section>
    </>
  );
}
