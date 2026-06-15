import type { Atendimento } from "@/lib/supabase/types";
import { formatCurrency, parseCurrency } from "@/lib/format";

export function TotalSummary({ atendimento }: { atendimento: Atendimento }) {
  const total = parseCurrency(atendimento.total_validado);

  return (
    <section className="section">
      <h2 className="text-lg font-semibold text-slate-950">Resumo financeiro</h2>
      <p className="mt-1 text-sm text-slate-600">Este é o total atualmente considerado para validação do atendimento.</p>

      <div className="mt-4 rounded-2xl border border-brand-emerald/15 bg-[linear-gradient(180deg,#f5fffb_0%,#ecf8f3_100%)] px-5 py-5">
        <p className="field-label text-brand-forest/70">Total validado</p>
        <p className="mt-2 text-4xl font-semibold tracking-tight text-brand-forest">
          {formatCurrency(atendimento.total_validado)}
        </p>

        {atendimento.total_validado === null ? (
          <p className="mt-2 text-sm text-amber-700">Ainda não há total calculado para este atendimento.</p>
        ) : total === 0 ? (
          <p className="mt-2 text-sm text-rose-700">O total está zerado. Vale revisar os exames antes de validar.</p>
        ) : (
          <p className="mt-2 text-sm text-slate-600">Revise os exames abaixo se precisar ajustar esse valor.</p>
        )}
      </div>
    </section>
  );
}
