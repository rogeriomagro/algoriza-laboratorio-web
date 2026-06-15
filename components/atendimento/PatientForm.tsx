"use client";

import { useEffect, useState } from "react";
import type { Atendimento } from "@/lib/supabase/types";
import { asString } from "@/lib/format";

const fields: Array<{ key: keyof Atendimento; label: string }> = [
  { key: "paciente_nome", label: "Nome" },
  { key: "paciente_cpf", label: "CPF" },
  { key: "paciente_nascimento", label: "Nascimento" },
  { key: "paciente_cidade", label: "Cidade" },
  { key: "plano_convenio", label: "Plano/convênio" },
  { key: "unidade_preferida", label: "Unidade preferida" },
  { key: "agendamento_desejado", label: "Agendamento desejado" }
];

interface PatientFormProps {
  atendimento: Atendimento;
  readOnly: boolean;
  saving: boolean;
  onSave: (patch: Partial<Atendimento>) => Promise<void>;
}

export function PatientForm({ atendimento, readOnly, saving, onSave }: PatientFormProps) {
  const [form, setForm] = useState<Record<string, string>>({});

  useEffect(() => {
    setForm(Object.fromEntries(fields.map((field) => [field.key, asString(atendimento[field.key])])));
  }, [atendimento]);

  async function save() {
    await onSave(form as Partial<Atendimento>);
  }

  return (
    <section className="section">
      <div className="mb-4 flex items-center justify-between gap-3">
        <div>
          <h2 className="text-base font-semibold text-slate-950">Dados do paciente</h2>
          {!form.paciente_nome ? <p className="mt-1 text-xs text-amber-700">Nome do paciente vazio.</p> : null}
        </div>
        <button className="btn btn-secondary" onClick={save} disabled={readOnly || saving}>
          {saving ? "Salvando..." : "Salvar paciente"}
        </button>
      </div>

      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        {fields.map((field) => (
          <label key={field.key} className="block">
            <span className="field-label">{field.label}</span>
            <input
              className="field-input mt-1"
              value={form[field.key] || ""}
              onChange={(event) => setForm((current) => ({ ...current, [field.key]: event.target.value }))}
              disabled={readOnly}
            />
          </label>
        ))}
      </div>
    </section>
  );
}
