"use client";

import { Search } from "lucide-react";

interface KanbanFiltersProps {
  value: string;
  onChange: (value: string) => void;
}

export function KanbanFilters({ value, onChange }: KanbanFiltersProps) {
  return (
    <div className="mb-5 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm shadow-slate-900/5">
      <label className="block">
        <span className="field-label">Buscar por protocolo, paciente, telefone ou médico</span>
        <div className="relative mt-2">
          <Search className="pointer-events-none absolute left-3 top-3 h-4 w-4 text-slate-400" />
          <input
            className="field-input pl-9"
            value={value}
            onChange={(event) => onChange(event.target.value)}
            placeholder="Digite um protocolo, nome, telefone ou médico"
          />
        </div>
      </label>
    </div>
  );
}
