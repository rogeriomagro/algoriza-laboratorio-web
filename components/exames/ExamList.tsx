"use client";

import { useState } from "react";
import { PlusCircle } from "lucide-react";
import type { AtendimentoExame } from "@/lib/supabase/types";
import { ExamRow } from "@/components/exames/ExamRow";
import { ManualExamRow } from "@/components/exames/ManualExamRow";

interface ExamListProps {
  exames: AtendimentoExame[];
  readOnly: boolean;
  saving: boolean;
  onSave: (id: string, patch: Partial<AtendimentoExame>) => Promise<void>;
  onCreate: (patch: Partial<AtendimentoExame>) => Promise<boolean>;
}

export function ExamList({ exames, readOnly, saving, onSave, onCreate }: ExamListProps) {
  const [addingManual, setAddingManual] = useState(false);

  async function createManualExam(patch: Partial<AtendimentoExame>) {
    const created = await onCreate(patch);
    if (created) setAddingManual(false);
    return created;
  }

  return (
    <section className="section">
      <div className="mb-3">
        <h2 className="section-title">Exames do orçamento</h2>
        <p className="section-copy">Revise, inclua ou ajuste valores sem perder a leitura rápida do orçamento.</p>
      </div>

      {exames.length === 0 && !addingManual ? (
        <div className="rounded-lg border border-dashed border-slate-300 bg-slate-50 p-6 text-center text-sm text-slate-500">
          Nenhum exame vinculado a este atendimento.
        </div>
      ) : exames.length > 0 ? (
        <div className="space-y-2.5">
          {exames.map((exame) => (
            <ExamRow key={exame.id} exame={exame} readOnly={readOnly} saving={saving} onSave={onSave} />
          ))}
        </div>
      ) : null}

      {addingManual ? (
        <div className="mt-2.5">
          <ManualExamRow saving={saving} onCancel={() => setAddingManual(false)} onCreate={createManualExam} />
        </div>
      ) : null}

      {!readOnly && !addingManual ? (
        <button
          type="button"
          className="btn btn-secondary mt-2.5 px-3 py-1.5"
          onClick={() => setAddingManual(true)}
          disabled={saving}
        >
          <PlusCircle className="h-4 w-4 text-brand-emerald" />
          Adicionar novo exame
        </button>
      ) : null}
    </section>
  );
}
