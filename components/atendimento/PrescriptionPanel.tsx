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
      <div className="mb-3 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="section-title">Prescrição e contexto</h2>
          <p className="section-copy">
            Separe o que veio do pedido médico do que foi complementado durante a conversa com o cliente.
          </p>
        </div>
        <button className="btn btn-secondary" onClick={save} disabled={readOnly || saving}>
          {saving ? "Salvando..." : "Salvar notas"}
        </button>
      </div>

      <div className="grid gap-3 xl:grid-cols-[1.05fr_0.95fr]">
        <div className="subsection">
          <div className="mb-3">
            <h3 className="text-base font-semibold text-slate-950">Pedido médico</h3>
            <p className="mt-1 text-sm text-slate-600">
              Dados clínicos mais objetivos ligados ao exame e ao pedido anexado.
            </p>
          </div>

          <div className="grid gap-3 md:grid-cols-2">
            <label className="block">
              <span className="field-label">Médico solicitante</span>
              <input
                className="field-input mt-1"
                value={medico}
                onChange={(event) => setMedico(event.target.value)}
                disabled={readOnly}
              />
            </label>

            <label className="block">
              <span className="field-label">Qualidade da imagem</span>
              <input
                className="field-input mt-1 bg-slate-50"
                value={asString(atendimento.qualidade_pedido_imagem) || "Não classificada"}
                disabled
              />
            </label>

            <label className="block md:col-span-2">
              <span className="field-label">Observações da prescrição</span>
              <textarea
                className="field-input mt-1 min-h-[96px]"
                value={observacoes}
                onChange={(event) => setObservacoes(event.target.value)}
                disabled={readOnly}
              />
            </label>
          </div>
        </div>

        <div className="subsection">
          <div className="mb-3">
            <h3 className="text-base font-semibold text-slate-950">Notas da conversa</h3>
            <p className="mt-1 text-sm text-slate-600">
              Preferências, restrições e observações operacionais passadas durante o atendimento.
            </p>
          </div>

          <label className="block">
            <span className="field-label">Anotações internas</span>
            <textarea
              className="field-input mt-1 min-h-[150px]"
              value={observacoesConversa}
              onChange={(event) => setObservacoesConversa(event.target.value)}
              disabled={readOnly}
            />
          </label>
        </div>
      </div>
    </section>
  );
}
