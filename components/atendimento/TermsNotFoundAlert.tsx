"use client";

import { AlertCircle, ArrowRight } from "lucide-react";

interface TermsNotFoundAlertProps {
  terms: string[] | null;
  onPickTerm: (term: string) => void;
}

export function TermsNotFoundAlert({ terms, onPickTerm }: TermsNotFoundAlertProps) {
  if (!terms || terms.length === 0) return null;

  return (
    <section className="rounded-2xl border border-amber-200 bg-[linear-gradient(180deg,#fffaf0_0%,#fff7e6_100%)] p-5 shadow-sm shadow-amber-100/40">
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div className="max-w-3xl">
          <div className="flex items-center gap-2 text-sm font-semibold text-amber-950">
            <AlertCircle className="h-4 w-4" />
            Termos que ainda precisam de atenção humana
          </div>
          <p className="mt-2 text-sm leading-6 text-amber-900/85">
            O agente não conseguiu localizar esses termos com segurança no catálogo. Clique em um deles para trazer a
            sugestão direto para a busca manual logo abaixo.
          </p>
        </div>
        <div className="chip border-amber-200 bg-white text-amber-900">
          {terms.length} {terms.length === 1 ? "termo pendente" : "termos pendentes"}
        </div>
      </div>

      <div className="mt-4 flex flex-wrap gap-2.5">
        {terms.map((term) => (
          <button
            key={term}
            className="inline-flex items-center gap-2 rounded-full border border-amber-300 bg-white px-3.5 py-2 text-sm font-medium text-amber-950 transition hover:border-amber-400 hover:bg-amber-100"
            onClick={() => onPickTerm(term)}
          >
            {term}
            <ArrowRight className="h-3.5 w-3.5" />
          </button>
        ))}
      </div>
    </section>
  );
}
