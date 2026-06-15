import type { AtendimentoExame } from "@/lib/supabase/types";
import { ExamRow } from "@/components/exames/ExamRow";

interface ExamListProps {
  exames: AtendimentoExame[];
  readOnly: boolean;
  saving: boolean;
  onSave: (id: string, patch: Partial<AtendimentoExame>) => Promise<void>;
}

export function ExamList({ exames, readOnly, saving, onSave }: ExamListProps) {
  return (
    <section className="section">
      <div className="mb-5">
        <h2 className="section-title">Exames do orçamento</h2>
        <p className="section-copy">
          A lista abaixo prioriza leitura rápida. Os campos de edição continuam disponíveis sem deixar a tela pesada.
        </p>
      </div>

      {exames.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-8 text-center text-sm text-slate-500">
          Nenhum exame vinculado a este atendimento.
        </div>
      ) : (
        <div className="space-y-3">
          {exames.map((exame) => (
            <ExamRow key={exame.id} exame={exame} readOnly={readOnly} saving={saving} onSave={onSave} />
          ))}
        </div>
      )}
    </section>
  );
}
