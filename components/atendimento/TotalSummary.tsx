import type { Atendimento } from "@/lib/supabase/types";
import { formatCurrency, parseCurrency } from "@/lib/format";

export function TotalSummary({ atendimento }: { atendimento: Atendimento }) {
  const total = parseCurrency(atendimento.total_validado);

  return (
    <section className="section">
      <h2 className="section-title">Resumo do orçamento</h2>

      <div className="mt-3 rounded-lg border border-brand-emerald/15 bg-[linear-gradient(180deg,#f5fffb_0%,#ebf7f1_100%)] px-4 py-4">
        <p className="field-label text-brand-forest/70">Total aprovado</p>
        <p className="mt-1 text-3xl font-semibold tracking-tight text-brand-forest">
          {formatCurrency(atendimento.total_validado)}
        </p>

        {atendimento.total_validado === null ? (
          <p className="mt-2 text-sm text-amber-700">Total ainda não calculado.</p>
        ) : total === 0 ? (
          <p className="mt-2 text-sm text-rose-700">Total zerado. Revise os exames.</p>
        ) : (
          <p className="mt-2 text-sm text-slate-600">Valor atual consolidado para aprovação.</p>
        )}
      </div>
    </section>
  );
}
