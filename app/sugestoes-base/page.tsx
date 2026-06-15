"use client";

import { AuthGate } from "@/components/auth/AuthGate";
import { AppShell } from "@/components/layout/AppShell";

function SugestoesBaseContent() {
  return (
    <AppShell>
      <section className="section mx-auto max-w-3xl">
        <div className="rounded-2xl border border-brand-forest/10 bg-gradient-to-br from-white via-brand-mint/20 to-brand-teal/10 p-8 shadow-sm">
          <div className="max-w-2xl">
            <span className="inline-flex rounded-full border border-brand-forest/10 bg-white px-3 py-1 text-xs font-semibold uppercase tracking-[0.12em] text-brand-forest">
              Em desenvolvimento
            </span>
            <h1 className="mt-4 text-2xl font-semibold text-slate-950">Sugestões da base</h1>
            <p className="mt-3 text-sm leading-6 text-slate-600">
              Esta frente vai voltar em uma próxima etapa com fluxo de revisão, aprovação e rejeição de sinônimos sugeridos pela equipe.
            </p>
            <div className="mt-6 rounded-xl border border-dashed border-brand-forest/20 bg-white/80 p-4 text-sm text-slate-600">
              Por enquanto, o Kanban principal segue ativo normalmente. Esta aba foi mantida apenas como placeholder para a evolução futura da ferramenta.
            </div>
          </div>
        </div>
      </section>
    </AppShell>
  );
}

export default function SugestoesBasePage() {
  return (
    <AuthGate>
      <SugestoesBaseContent />
    </AuthGate>
  );
}
