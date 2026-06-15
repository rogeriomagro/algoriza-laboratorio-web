"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Activity, LogOut, RefreshCw } from "lucide-react";
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
    { href: "/sugestoes-base", label: "Sugestões da base", disabled: true, badge: "Em homologação" },
  ];

  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-30 border-b border-brand-forest/10 bg-white/95 backdrop-blur">
        <div className="mx-auto flex max-w-[1600px] flex-col gap-2 px-4 py-2.5 xl:flex-row xl:items-center xl:justify-between">
          <div className="flex min-w-0 items-center gap-3 xl:flex-[1.15]">
            <LabBrand compact />
            <div className="min-w-0">
              <p className="text-lg font-semibold leading-tight tracking-tight text-brand-forest">
                Validação de Orçamentos
              </p>
              <p className="mt-0.5 text-xs text-slate-600">
                Laboratórios Nossa Senhora da Penha e Alfa Diagnóstico
              </p>
            </div>
          </div>

          <nav className="flex flex-wrap items-center gap-1.5 xl:justify-center">
            {navItems.map((item) => {
              const active = pathname === item.href;

              if (item.disabled) {
                return (
                  <span
                    key={item.href}
                    title="Função em desenvolvimento"
                    className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1.5 text-sm font-medium text-slate-400"
                  >
                    <span>{item.label}</span>
                    {item.badge ? (
                      <span className="rounded-full border border-slate-200 bg-white px-2 py-0.5 text-[10px] font-semibold text-slate-500">
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
                  className={`rounded-lg border px-3 py-1.5 text-sm font-medium transition ${
                    active
                      ? "border-brand-emerald/20 bg-brand-mint text-brand-forest shadow-sm"
                      : "border-slate-200 bg-white text-slate-700 hover:border-brand-emerald/30 hover:bg-brand-mint/60"
                  }`}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>

          <div className="flex flex-wrap items-center gap-1.5 xl:flex-[1.05] xl:justify-end">
            {realtimeState ? (
              <span className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1.5 text-xs font-medium text-slate-600">
                <Activity className="h-3.5 w-3.5 text-brand-emerald" />
                Realtime: {realtimeState}
              </span>
            ) : null}

            <div className="rounded-lg border border-brand-emerald/15 bg-[linear-gradient(180deg,#f7fcfa_0%,#eff8f4_100%)] px-3 py-1.5 text-sm shadow-sm">
              <span className="block text-[10px] uppercase tracking-[0.08em] text-brand-forest/60">
                Validador atual
              </span>
              <span className="block font-semibold leading-5 text-brand-forest">
                {validatorName || "Usuário sem nome configurado"}
              </span>
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

        <div className="border-t border-slate-200/80 bg-[linear-gradient(90deg,#f5faf7_0%,#f9fbfa_60%,#eef7f2_100%)]">
          <div className="mx-auto flex max-w-[1600px] items-center justify-end px-4 py-1.5">
            <p className="powered-by">
              Powered by <span className="font-medium text-slate-700">Algoriza</span>
            </p>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-[1600px] px-4 py-4">{children}</main>
    </div>
  );
}
