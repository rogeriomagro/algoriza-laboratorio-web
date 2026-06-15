"use client";

import { useEffect, useState } from "react";
import type { Atendimento } from "@/lib/supabase/types";
import { asString } from "@/lib/format";

interface PrescriptionPanelProps {
  atendimento: Atendimento;
  readOnly: boolean;
  saving: boolean;
  onSave: (patch: Partial<Atendimento>) => Promise<void>;
}

export function PrescriptionPanel({ atendimento, readOnly, saving, onSave }: PrescriptionPanelProps) {
  const [medico, setMedico] = useState("");
  const [observacoes, setObservacoes] = useState("");
  const [observacoesConversa, setObservacoesConversa] = useState("");

  useEffect(() => {
    setMedico(asString(atendimento.medico_solicitante));
    setObservacoes(asString(atendimento.observacoes_prescricao));
    setObservacoesConversa(asString(atendimento.observacoes_conversa));
  }, [atendimento]);

  async function save() {
    await onSave({
      medico_solicitante: medico,
      observacoes_prescricao: observacoes,
      observacoes_conversa: observacoesConversa
    });
  }

  return (
    <section className="section">
      <div className="mb-4 flex items-center justify-between gap-3">
        <h2 className="text-base font-semibold text-slate-950">Prescrição e conversa</h2>
        <button className="btn btn-secondary" onClick={save} disabled={readOnly || saving}>
          {saving ? "Salvando..." : "Salvar observações"}
        </button>
      </div>

      <div className="grid gap-3 xl:grid-cols-3">
        <label className="block">
          <span className="field-label">Médico solicitante</span>
          <input className="field-input mt-1" value={medico} onChange={(event) => setMedico(event.target.value)} disabled={readOnly} />
        </label>
        <label className="block">
          <span className="field-label">Qualidade da imagem</span>
          <input className="field-input mt-1" value={asString(atendimento.qualidade_pedido_imagem)} disabled />
        </label>
        <label className="block xl:col-span-3">
          <span className="field-label">Observações da prescrição</span>
          <textarea className="field-input mt-1 min-h-24" value={observacoes} onChange={(event) => setObservacoes(event.target.value)} disabled={readOnly} />
        </label>
        <label className="block xl:col-span-3">
          <span className="field-label">Observações da conversa</span>
          <textarea className="field-input mt-1 min-h-24" value={observacoesConversa} onChange={(event) => setObservacoesConversa(event.target.value)} disabled={readOnly} />
        </label>
      </div>
    </section>
  );
}
