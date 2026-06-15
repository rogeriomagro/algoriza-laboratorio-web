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
      <div className="mb-4">
        <h2 className="text-base font-semibold text-slate-950">Exames</h2>
        <p className="text-sm text-slate-600">Edite preço, prazo, jejum, preparo e inclusão. O total oficial vem do banco.</p>
      </div>

      {exames.length === 0 ? (
        <div className="rounded-md border border-dashed border-slate-300 p-6 text-center text-sm text-slate-500">
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
