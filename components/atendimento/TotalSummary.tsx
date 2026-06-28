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

type ModoDesconto = "percentual" | "reais";

function clampPct(value: number): number {
  if (!Number.isFinite(value)) return 0;
  return Math.min(100, Math.max(0, value));
}

function clampReais(value: number): number {
  if (!Number.isFinite(value) || value < 0) return 0;
  return Number(value.toFixed(2));
}

function clampDays(value: number): number {
  if (!Number.isFinite(value)) return 30;
  return Math.min(365, Math.max(1, Math.round(value)));
}

export function TotalSummary({ atendimento, readOnly, saving, onSave }: TotalSummaryProps) {
  const bruto = parseCurrency(atendimento.total_validado);

  const tipoSalvo: ModoDesconto = atendimento.desconto_tipo === "reais" ? "reais" : "percentual";
  const pctSalvo = clampPct(Number(atendimento.desconto_pct ?? 0) || 0);
  const reaisSalvo = clampReais(Number(atendimento.desconto_reais ?? 0) || 0);
  const validadeSalva = clampDays(Number(atendimento.validade_dias ?? 30) || 30);

  const [modo, setModo] = useState<ModoDesconto>(tipoSalvo);
  // Padrão de desconto percentual = 20% (quando salvo é 0/vazio).
  const [desconto, setDesconto] = useState(String(pctSalvo > 0 ? pctSalvo : 20));
  const [descontoReais, setDescontoReais] = useState(reaisSalvo > 0 ? String(reaisSalvo).replace(".", ",") : "");
  const [validade, setValidade] = useState(String(validadeSalva));

  useEffect(() => {
    setModo(atendimento.desconto_tipo === "reais" ? "reais" : "percentual");
  }, [atendimento.desconto_tipo]);

  useEffect(() => {
    const s = clampPct(Number(atendimento.desconto_pct ?? 0) || 0);
    setDesconto(String(s > 0 ? s : 20));
  }, [atendimento.desconto_pct]);

  useEffect(() => {
    const r = clampReais(Number(atendimento.desconto_reais ?? 0) || 0);
    setDescontoReais(r > 0 ? String(r).replace(".", ",") : "");
  }, [atendimento.desconto_reais]);

  useEffect(() => {
    setValidade(String(clampDays(Number(atendimento.validade_dias ?? 30) || 30)));
  }, [atendimento.validade_dias]);

  const descontoNum = clampPct(Number(desconto.replace(",", ".")) || 0);
  const reaisNum = clampReais(Number(descontoReais.replace(",", ".")) || 0);

  let economia: number | null = null;
  let final: number | null = null;
  let temDesconto = false;
  if (bruto !== null) {
    if (modo === "reais") {
      // Modo R$: o valor é o desconto exato; 0 = sem desconto (sem piso de 20%).
      economia = Number(Math.min(reaisNum, bruto).toFixed(2));
      final = Number((bruto - economia).toFixed(2));
      temDesconto = economia > 0;
    } else {
      // Modo %: 0 cai no padrão 20% à vista.
      const pct = descontoNum > 0 ? descontoNum : 20;
      economia = Number((bruto * (pct / 100)).toFixed(2));
      final = Number((bruto * (1 - pct / 100)).toFixed(2));
      temDesconto = pct > 0;
    }
  }

  async function switchModo(m: ModoDesconto) {
    if (m === modo || readOnly || saving) return;
    setModo(m);
    if (m !== tipoSalvo) await onSave({ desconto_tipo: m });
  }

  async function commitPct() {
    const novo = clampPct(Number(desconto.replace(",", ".")) || 0);
    setDesconto(String(novo));
    if (novo === pctSalvo && tipoSalvo === "percentual") return;
    await onSave({ desconto_pct: novo, desconto_tipo: "percentual" });
  }

  async function commitReais() {
    const novo = clampReais(Number(descontoReais.replace(",", ".")) || 0);
    setDescontoReais(novo > 0 ? String(novo).replace(".", ",") : "");
    if (novo === reaisSalvo && tipoSalvo === "reais") return;
    await onSave({ desconto_reais: novo, desconto_tipo: "reais" });
  }

  async function commitValidade() {
    const novo = clampDays(Number(validade) || 30);
    setValidade(String(novo));
    if (novo === validadeSalva) return;
    await onSave({ validade_dias: novo });
  }

  const toggleBtn = (m: ModoDesconto, label: string) =>
    `px-2 py-1 text-xs font-semibold transition ${
      modo === m ? "bg-brand-forest text-white" : "bg-white text-slate-500 hover:bg-brand-mint/50"
    }`;

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
          <label className="field-label text-brand-forest/70" htmlFor="desconto-input">
            Desconto manual
          </label>
          <div className="flex items-center gap-2">
            <div className="inline-flex shrink-0 overflow-hidden rounded-md border border-brand-emerald/30">
              <button
                type="button"
                className={toggleBtn("percentual", "%")}
                disabled={readOnly || saving || bruto === null}
                onClick={() => switchModo("percentual")}
                title="Desconto em porcentagem"
              >
                %
              </button>
              <button
                type="button"
                className={toggleBtn("reais", "R$")}
                disabled={readOnly || saving || bruto === null}
                onClick={() => switchModo("reais")}
                title="Desconto em reais"
              >
                R$
              </button>
            </div>
            <div className="relative w-24">
              <input
                id="desconto-input"
                inputMode="decimal"
                className={`field-input h-9 text-right text-sm ${modo === "reais" ? "!pl-9" : "!pr-8"}`}
                value={modo === "reais" ? descontoReais : desconto}
                placeholder={modo === "reais" ? "0,00" : "0"}
                disabled={readOnly || saving || bruto === null}
                onChange={(event) => {
                  const v = event.target.value.replace(/[^0-9.,]/g, "");
                  if (modo === "reais") setDescontoReais(v);
                  else setDesconto(v);
                }}
                onBlur={() => (modo === "reais" ? commitReais() : commitPct())}
                onKeyDown={(event) => {
                  if (event.key === "Enter") (event.target as HTMLInputElement).blur();
                }}
              />
              {modo === "reais" ? (
                <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-slate-400">R$</span>
              ) : (
                <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-sm text-slate-400">%</span>
              )}
            </div>
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
