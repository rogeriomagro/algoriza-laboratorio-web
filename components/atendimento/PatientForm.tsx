"use client";

import { useEffect, useState } from "react";
import type { Atendimento } from "@/lib/supabase/types";
import { asString, formatBirthDateInput, formatCpf, formatPhone, formatSchedulePreference } from "@/lib/format";

const fields: Array<{ key: keyof Atendimento; label: string; placeholder?: string }> = [
  { key: "paciente_nome", label: "Nome do paciente" },
  { key: "paciente_cpf", label: "CPF" },
  { key: "paciente_nascimento", label: "Nascimento" },
  { key: "paciente_cidade", label: "Cidade" },
  { key: "plano_convenio", label: "Plano ou convênio" },
  { key: "unidade_preferida", label: "Unidade preferida" },
  { key: "agendamento_desejado", label: "Agendamento desejado" }
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
    setForm(normalizePatientForm(Object.fromEntries(fields.map((field) => [field.key, asString(atendimento[field.key])]))) );
  }, [atendimento]);

  async function save() {
    await onSave(form as Partial<Atendimento>);
  }

  return (
    <section className="section">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="section-title">Dados do paciente</h2>
          <p className="section-copy">Confira os dados principais antes de validar.</p>
        </div>
        <button className="btn btn-secondary" onClick={save} disabled={readOnly || saving}>
          {saving ? "Salvando..." : "Salvar dados"}
        </button>
      </div>

      <div className="mb-3 grid gap-2 lg:grid-cols-3">
        <div className="soft-card">
          <p className="field-label">Telefone</p>
          <p className="mt-1 text-sm font-semibold text-slate-950">{formatPhone(atendimento.telefone)}</p>
        </div>
        <div className="soft-card">
          <p className="field-label">Responsável</p>
          <p className="mt-1 truncate text-sm font-semibold text-slate-950">{atendimento.responsavel_nome || "Não informado"}</p>
        </div>
        <div className="soft-card">
          <p className="field-label">Cadastro</p>
          <p className="mt-1 text-sm font-semibold text-slate-950">
            {form.paciente_nome ? "Em conferência" : "Aguardando preenchimento"}
          </p>
        </div>
      </div>

      <div className="grid gap-2.5 md:grid-cols-2 xl:grid-cols-4">
        {fields.map((field) => (
          <label key={field.key} className={field.key === "paciente_nome" ? "block xl:col-span-2" : "block"}>
            <span className="field-label">{field.label}</span>
            <input
              className="field-input mt-1"
              value={form[field.key] || ""}
              placeholder={field.placeholder}
              onChange={(event) => {
                const value = event.target.value;
                setForm((current) => normalizePatientForm({ ...current, [field.key]: value }));
              }}
              disabled={readOnly}
            />
          </label>
        ))}
      </div>
    </section>
  );
}
