import type { Atendimento } from "@/lib/supabase/types";
import { formatCurrency, parseCurrency } from "@/lib/format";

export function TotalSummary({ atendimento }: { atendimento: Atendimento }) {
  const total = parseCurrency(atendimento.total_validado);

  return (
    <section className="section">
      <h2 className="text-base font-semibold text-slate-950">Total validado</h2>
      <p className="mt-2 text-3xl font-semibold text-brand-forest">{formatCurrency(atendimento.total_validado)}</p>
      {atendimento.total_validado === null ? (
        <p className="mt-1 text-sm text-amber-700">Total ainda não calculado pelo banco.</p>
      ) : total === 0 ? (
        <p className="mt-1 text-sm text-rose-700">Total zerado. Revise os exames antes de validar.</p>
      ) : (
        <p className="mt-1 text-sm text-slate-600">Valor lido de `atendimentos.total_validado`.</p>
      )}
    </section>
  );
}
