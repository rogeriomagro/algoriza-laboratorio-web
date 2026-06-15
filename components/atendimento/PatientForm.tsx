"use client";

import { useEffect, useState } from "react";
import type { Atendimento } from "@/lib/supabase/types";
import {
  asString,
  formatBirthDateInput,
  formatCpf,
  formatPhone,
  formatSchedulePreference
} from "@/lib/format";

const fields: Array<{ key: keyof Atendimento; label: string; placeholder?: string }> = [
  { key: "paciente_nome", label: "Nome do paciente" },
  { key: "paciente_cpf", label: "CPF" },
  { key: "paciente_nascimento", label: "Data de nascimento" },
  { key: "paciente_cidade", label: "Cidade" },
  { key: "plano_convenio", label: "Plano ou convênio" },
  { key: "unidade_preferida", label: "Unidade preferida" },
  { key: "agendamento_desejado", label: "Preferência de agendamento" }
];

interface PatientFormProps {
  atendimento: Atendimento;
  readOnly: boolean;
  saving: boolean;
  onSave: (patch: Partial<Atendimento>) => Promise<void>;
}

function normalizePatientForm(form: Record<string, string>): Record<string, string> {
  return {
    ...form,
    paciente_cpf: formatCpf(form.paciente_cpf),
    paciente_nascimento: formatBirthDateInput(form.paciente_nascimento),
    agendamento_desejado: formatSchedulePreference(form.agendamento_desejado)
  };
}

export function PatientForm({ atendimento, readOnly, saving, onSave }: PatientFormProps) {
  const [form, setForm] = useState<Record<string, string>>({});

  useEffect(() => {
    setForm(
      normalizePatientForm(
        Object.fromEntries(fields.map((field) => [field.key, asString(atendimento[field.key])]))
      )
    );
  }, [atendimento]);

  async function save() {
    await onSave(form as Partial<Atendimento>);
  }

  return (
    <section className="section">
      <div className="mb-5 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-slate-950">Dados do paciente</h2>
          <p className="mt-1 text-sm text-slate-600">
            Confirme os dados cadastrais antes de aprovar o orçamento.
          </p>
        </div>
        <button className="btn btn-secondary" onClick={save} disabled={readOnly || saving}>
          {saving ? "Salvando..." : "Salvar dados do paciente"}
        </button>
      </div>

      <div className="mb-4 grid gap-3 md:grid-cols-3">
        <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
          <p className="field-label">Contato do responsável</p>
          <p className="mt-1 text-sm font-semibold text-slate-950">{formatPhone(atendimento.telefone)}</p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
          <p className="field-label">Responsável pelo atendimento</p>
          <p className="mt-1 text-sm font-semibold text-slate-950">
            {atendimento.responsavel_nome || "Não informado"}
          </p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
          <p className="field-label">Situação cadastral</p>
          <p className="mt-1 text-sm font-semibold text-slate-950">
            {form.paciente_nome ? "Dados em revisão" : "Aguardando preenchimento"}
          </p>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {fields.map((field) => (
          <label key={field.key} className="block">
            <span className="field-label">{field.label}</span>
            <input
              className="field-input mt-1"
              value={form[field.key] || ""}
              placeholder={field.placeholder}
              onChange={(event) => {
                const value = event.target.value;
                setForm((current) =>
                  normalizePatientForm({
                    ...current,
                    [field.key]: value
                  })
                );
              }}
              disabled={readOnly}
            />
          </label>
        ))}
      </div>
    </section>
  );
}
