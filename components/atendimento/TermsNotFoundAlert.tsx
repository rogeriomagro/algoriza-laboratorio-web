"use client";

import { AlertCircle, Check, Search } from "lucide-react";

interface TermsNotFoundAlertProps {
  terms: string[] | null;
  onPickTerm: (term: string) => void;
  /** Remove o termo da lista (resolvido). Quando ausente, o botão não aparece (modo leitura). */
  onResolve?: (term: string) => void | Promise<void>;
}

export function TermsNotFoundAlert({ terms, onPickTerm, onResolve }: TermsNotFoundAlertProps) {
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

      {onResolve ? (
        <p className="mt-1.5 text-xs text-amber-800/90">
          Clique no termo para buscar no catálogo. Depois de resolver, use o ✓ para tirar o aviso.
        </p>
      ) : null}

      <div className="mt-2 flex flex-wrap gap-1.5">
        {terms.map((term) => (
          <span
            key={term}
            className="inline-flex items-center overflow-hidden rounded-full border border-amber-200 bg-white text-xs font-medium text-amber-950"
          >
            <button
              type="button"
              className="inline-flex items-center gap-1.5 px-2.5 py-1 transition hover:bg-amber-100"
              onClick={() => onPickTerm(term)}
              title="Buscar este termo no catálogo"
            >
              <Search className="h-3 w-3" />
              {term}
            </button>
            {onResolve ? (
              <button
                type="button"
                className="flex items-center border-l border-amber-200 px-2 py-1 text-emerald-700 transition hover:bg-emerald-50"
                onClick={() => onResolve(term)}
                title="Marcar como resolvido (remove o aviso)"
                aria-label={`Marcar "${term}" como resolvido`}
              >
                <Check className="h-3.5 w-3.5" />
              </button>
            ) : null}
          </span>
        ))}
      </div>
    </section>
  );
}
