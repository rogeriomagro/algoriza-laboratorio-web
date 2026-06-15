import type { Atendimento } from "@/lib/supabase/types";
import { formatCurrency, parseCurrency } from "@/lib/format";

export function TotalSummary({ atendimento }: { atendimento: Atendimento }) {
  const total = parseCurrency(atendimento.total_validado);

  return (
    <section className="section">
      <h2 className="section-title">Resumo do orçamento</h2>
      <p className="section-copy">
        Valor atual consolidado para aprovação e envio ao cliente.
      </p>

      <div className="mt-4 rounded-[24px] border border-brand-emerald/15 bg-[linear-gradient(180deg,#f5fffb_0%,#ebf7f1_100%)] px-5 py-5">
        <p className="field-label text-brand-forest/70">Total aprovado até o momento</p>
        <p className="mt-2 text-4xl font-semibold tracking-tight text-brand-forest">
          {formatCurrency(atendimento.total_validado)}
        </p>

        {atendimento.total_validado === null ? (
          <p className="mt-2 text-sm text-amber-700">Ainda não existe um total calculado para este atendimento.</p>
        ) : total === 0 ? (
          <p className="mt-2 text-sm text-rose-700">O total está zerado. Vale revisar os exames antes de concluir.</p>
        ) : (
          <p className="mt-2 text-sm text-slate-600">
            Revise os exames abaixo somente se houver necessidade de ajuste final.
          </p>
        )}
      </div>
    </section>
  );
}
