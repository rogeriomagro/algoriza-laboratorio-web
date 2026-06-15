"use client";

import { Search } from "lucide-react";

interface KanbanFiltersProps {
  value: string;
  onChange: (value: string) => void;
}

export function KanbanFilters({ value, onChange }: KanbanFiltersProps) {
  return (
    <div className="mb-4 rounded-lg border border-brand-forest/10 bg-gradient-to-r from-white via-white to-brand-mint/70 p-4 shadow-sm shadow-brand-forest/5">
      <label className="block">
        <span className="field-label">Buscar por protocolo, paciente, telefone ou médico</span>
        <div className="relative mt-1">
          <Search className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
          <input
            className="field-input pl-9"
            value={value}
            onChange={(event) => onChange(event.target.value)}
            placeholder="Digite para filtrar..."
          />
        </div>
      </label>
    </div>
  );
}
