"use client";

import { useState } from "react";
import { AlertTriangle, ClipboardList, FileCheck2, PlusCircle } from "lucide-react";
import type { AtendimentoExame } from "@/lib/supabase/types";
import { ExamRow } from "@/components/exames/ExamRow";
import { ManualExamRow } from "@/components/exames/ManualExamRow";

interface ExamListProps {
  exames: AtendimentoExame[];
  termosNaoEncontrados: string[];
  readOnly: boolean;
  saving: boolean;
  onSave: (id: string, patch: Partial<AtendimentoExame>) => Promise<void>;
  onCreate: (patch: Partial<AtendimentoExame>) => Promise<boolean>;
}

export function ExamList({ exames, termosNaoEncontrados, readOnly, saving, onSave, onCreate }: ExamListProps) {
  const [addingManual, setAddingManual] = useState(false);

  async function createManualExam(patch: Partial<AtendimentoExame>) {
    const created = await onCreate(patch);
    if (created) setAddingManual(false);
    return created;
  }

  const incluidosCount = exames.filter((exame) => exame.incluido !== false).length;
  const termosCount = termosNaoEncontrados.length;

  return (
    <section className="section">
      <div className="mb-3">
        <h2 className="section-title">Exames do orçamento</h2>
        <p className="section-copy">Revise, inclua ou ajuste valores sem perder a leitura rápida do orçamento.</p>
      </div>

      <div className="mb-3 grid grid-cols-1 gap-2 sm:grid-cols-3">
        <div className="metric-card">
          <div className="flex items-center gap-2 text-slate-500">
            <ClipboardList className="h-4 w-4 text-brand-emerald" />
            <p className="field-label">Exames encontrados</p>
          </div>
          <p className="mt-1 text-xl font-semibold text-slate-950">{exames.length}</p>
        </div>

        <div className={`metric-card ${termosCount > 0 ? "border-amber-200 bg-amber-50/70" : ""}`}>
          <div className={`flex items-center gap-2 ${termosCount > 0 ? "text-amber-700" : "text-slate-500"}`}>
            <AlertTriangle className="h-4 w-4" />
            <p className={`field-label ${termosCount > 0 ? "text-amber-700" : ""}`}>Termos não encontrados</p>
          </div>
          <p className={`mt-1 text-xl font-semibold ${termosCount > 0 ? "text-amber-900" : "text-slate-950"}`}>
            {termosCount}
          </p>
        </div>

        <div className="rounded-lg border border-brand-emerald/15 bg-[linear-gradient(180deg,#f8fcfa_0%,#eef8f3_100%)] px-3 py-2.5 shadow-sm shadow-brand-forest/5">
          <div className="flex items-center gap-2 text-brand-forest/70">
            <FileCheck2 className="h-4 w-4 text-brand-emerald" />
            <p className="field-label text-brand-forest/70">Inclusos no PDF</p>
          </div>
          <p className="mt-1 text-xl font-semibold text-brand-forest">{incluidosCount}</p>
        </div>
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
