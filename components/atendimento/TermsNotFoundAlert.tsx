"use client";

import { AlertCircle, Search } from "lucide-react";

interface TermsNotFoundAlertProps {
  terms: string[] | null;
  onPickTerm: (term: string) => void;
}

export function TermsNotFoundAlert({ terms, onPickTerm }: TermsNotFoundAlertProps) {
  if (!terms || terms.length === 0) return null;

  return (
    <section className="rounded-lg border border-amber-200/80 bg-amber-50/70 p-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2 text-sm font-semibold text-amber-950">
          <AlertCircle className="h-4 w-4" />
          Termos pendentes
        </div>
        <span className="chip border-amber-200 bg-white text-amber-900">
          {terms.length} {terms.length === 1 ? "termo" : "termos"}
        </span>
      </div>

      <div className="mt-2 flex flex-wrap gap-1.5">
        {terms.map((term) => (
          <button
            key={term}
            className="inline-flex items-center gap-1.5 rounded-full border border-amber-200 bg-white px-2.5 py-1 text-xs font-medium text-amber-950 transition hover:border-amber-300 hover:bg-amber-100"
            onClick={() => onPickTerm(term)}
          >
            <Search className="h-3 w-3" />
            {term}
          </button>
        ))}
      </div>
    </section>
  );
}
