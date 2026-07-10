"use client";

import { Search } from "lucide-react";
import { LAB_META } from "@/lib/format";

interface KanbanFiltersProps {
  value: string;
  onChange: (value: string) => void;
  validador: string;
  onValidadorChange: (value: string) => void;
  validadores: string[];
  lab: string;
  onLabChange: (value: string) => void;
}

export function KanbanFilters({
  value,
  onChange,
  validador,
  onValidadorChange,
  validadores,
  lab,
  onLabChange,
}: KanbanFiltersProps) {
  return (
    <div className="mb-5 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm shadow-slate-900/5">
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="block">
          <span className="field-label">Validado por</span>
          <select
            className="field-input mt-2"
            value={validador}
            onChange={(event) => onValidadorChange(event.target.value)}
          >
            <option value="">Todos os usuários</option>
            {validadores.map((nome) => (
              <option key={nome} value={nome}>
                {nome}
              </option>
            ))}
          </select>
        </label>

        <label className="block">
          <span className="field-label">Laboratório</span>
          <select className="field-input mt-2" value={lab} onChange={(event) => onLabChange(event.target.value)}>
            <option value="">Todos os laboratórios</option>
            <option value="alfa">{LAB_META.alfa.nome}</option>
            <option value="penha">{LAB_META.penha.nome}</option>
          </select>
        </label>
      </div>

      <label className="mt-3 block">
        <span className="field-label">Buscar por protocolo, paciente, telefone ou médico</span>
        <div className="relative mt-2">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            className="field-input !pl-9"
            value={value}
            onChange={(event) => onChange(event.target.value)}
            placeholder="Digite um protocolo, nome, telefone ou médico"
          />
        </div>
      </label>
    </div>
  );
}
