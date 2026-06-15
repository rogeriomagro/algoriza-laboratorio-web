"use client";

import { AlertCircle, Search } from "lucide-react";

interface TermsNotFoundAlertProps {
  terms: string[] | null;
  onPickTerm: (term: string) => void;
}

export function TermsNotFoundAlert({ terms, onPickTerm }: TermsNotFoundAlertProps) {
  if (!terms || terms.length === 0) return null;

  return (
    <section className="rounded-2xl border border-amber-200/80 bg-amber-50/70 p-4">
      <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
        <div className="max-w-3xl">
          <div className="flex items-center gap-2 text-sm font-semibold text-amber-950">
            <AlertCircle className="h-4 w-4" />
            Termos não encontrados na base
          </div>
          <p className="mt-1.5 text-sm leading-6 text-amber-900/80">
            Esses termos vieram do atendimento, mas ainda não tiveram correspondência segura no catálogo. Você pode
            clicar em qualquer um deles para trazer a busca manual logo abaixo.
          </p>
        </div>
        <div className="chip border-amber-200 bg-white text-amber-900">
          {terms.length} {terms.length === 1 ? "termo pendente" : "termos pendentes"}
        </div>
      </div>

      <div className="mt-3 flex flex-wrap gap-2">
        {terms.map((term) => (
          <button
            key={term}
            className="inline-flex items-center gap-2 rounded-full border border-amber-200 bg-white px-3 py-1.5 text-sm font-medium text-amber-950 transition hover:border-amber-300 hover:bg-amber-100"
            onClick={() => onPickTerm(term)}
          >
            <Search className="h-3.5 w-3.5" />
            {term}
          </button>
        ))}
      </div>
    </section>
  );
}
