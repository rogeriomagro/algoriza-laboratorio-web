"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Activity, Hammer, LogOut, RefreshCw } from "lucide-react";
import { supabase } from "@/lib/supabase/client";
import { useValidatorName } from "@/hooks/useValidatorName";
import { LabBrand } from "@/components/layout/LabBrand";

interface AppShellProps {
  children: React.ReactNode;
  onRefresh?: () => void;
  realtimeState?: string;
}

export function AppShell({ children, onRefresh, realtimeState }: AppShellProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { validatorName } = useValidatorName();

  async function logout() {
    await supabase.auth.signOut();
    router.replace("/login");
  }

  const navItems = [
    { href: "/", label: "Kanban", disabled: false },
    { href: "/usuarios", label: "Usuários", disabled: false },
    { href: "/sugestoes-base", label: "Sugestões da base", disabled: true, badge: "Ambiente de homologação" },
  ];

  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-30 border-b border-brand-forest/10 bg-white/95 shadow-sm backdrop-blur">
        <div className="mx-auto flex max-w-[1600px] flex-col gap-4 px-4 py-4 xl:flex-row xl:items-center xl:justify-between">
          <div className="flex min-w-0 flex-1 items-start gap-4">
            <LabBrand compact />
            <div className="min-w-0">
              <p className="text-xl font-semibold text-brand-forest">Validação de Orçamentos</p>
              <p className="mt-1 text-sm text-slate-600">Laboratórios Nossa Senhora da Penha e Alfa Diagnóstico</p>
              <p className="powered-by mt-1">
                Powered by <span className="font-medium text-slate-700">Algoriza</span>
              </p>
            </div>
          </div>

          <div className="flex flex-1 flex-col gap-3 xl:items-end">
            <nav className="flex flex-wrap items-center gap-2">
              {navItems.map((item) => {
                const active = pathname === item.href;

                if (item.disabled) {
                  return (
                    <span
                      key={item.href}
                      title="Função em desenvolvimento"
                      className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-medium text-slate-400"
                    >
                      <span>{item.label}</span>
                      {item.badge ? (
                        <span className="rounded-full border border-slate-200 bg-white px-2 py-0.5 text-[11px] font-semibold text-slate-500">
                          {item.badge}
                        </span>
                      ) : null}
                    </span>
                  );
                }

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`rounded-xl border px-4 py-2 text-sm font-medium transition ${
                      active
                        ? "border-brand-emerald/30 bg-brand-mint text-brand-forest"
                        : "border-slate-200 bg-white text-slate-700 hover:border-brand-emerald/30 hover:bg-brand-mint/60"
                    }`}
                  >
                    {item.label}
                  </Link>
                );
              })}
            </nav>

            <div className="flex flex-wrap items-center gap-2">
              {realtimeState ? (
                <span className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-medium text-slate-600">
                  <Activity className="h-4 w-4 text-brand-emerald" />
                  Sincronização: {realtimeState}
                </span>
              ) : null}

              <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm shadow-sm">
                <Hammer className="h-4 w-4 text-brand-emerald" />
                <div>
                  <span className="block text-[11px] uppercase tracking-[0.08em] text-slate-500">Validador atual</span>
                  <span className="block font-medium text-slate-800">{validatorName || "Usuário sem nome configurado"}</span>
                </div>
              </div>

              {onRefresh ? (
                <button className="btn btn-secondary" onClick={onRefresh}>
                  <RefreshCw className="h-4 w-4" />
                  Atualizar
                </button>
              ) : null}

              <button className="btn btn-secondary" onClick={logout}>
                <LogOut className="h-4 w-4" />
                Sair
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-[1600px] px-4 py-5">{children}</main>
    </div>
  );
}
