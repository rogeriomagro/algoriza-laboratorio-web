"use client";

import { AlertCircle } from "lucide-react";

interface TermsNotFoundAlertProps {
  terms: string[] | null;
  onPickTerm: (term: string) => void;
}

export function TermsNotFoundAlert({ terms, onPickTerm }: TermsNotFoundAlertProps) {
  if (!terms || terms.length === 0) return null;

  return (
    <section className="rounded-lg border border-amber-200 bg-amber-50 p-4">
      <div className="flex items-center gap-2 text-sm font-semibold text-amber-900">
        <AlertCircle className="h-4 w-4" />
        Termos não encontrados
      </div>
      <div className="mt-3 flex flex-wrap gap-2">
        {terms.map((term) => (
          <button
            key={term}
            className="rounded-full border border-amber-300 bg-white px-3 py-1 text-xs font-medium text-amber-900 hover:bg-amber-100"
            onClick={() => onPickTerm(term)}
          >
            {term}
          </button>
        ))}
      </div>
    </section>
  );
}
