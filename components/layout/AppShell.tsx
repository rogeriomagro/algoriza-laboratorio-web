"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Activity, ChevronDown, LogOut, RefreshCw, UserRound } from "lucide-react";
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
    { href: "/sugestoes-base", label: "Base de exames", disabled: true, badge: "Em homologação" },
  ];

  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-30 border-b border-brand-forest/10 bg-white/95 backdrop-blur">
        <div className="mx-auto flex max-w-[1600px] flex-col gap-3 px-4 py-2.5">
          <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
            <div className="flex min-w-0 flex-col gap-3 xl:flex-row xl:items-center xl:gap-5">
              <div className="shrink-0">
                <LabBrand compact />
              </div>

              <div className="min-w-0 xl:max-w-[260px]">
                <p className="text-[14px] font-semibold leading-tight tracking-tight text-brand-forest sm:text-[15px]">
                  Validação de Orçamentos
                </p>
                <p className="mt-0.5 truncate text-xs text-slate-600">Penha + Alfa Diagnóstico</p>
              </div>

              <nav className="flex flex-wrap items-center gap-0 rounded-xl border border-slate-200 bg-white shadow-sm shadow-slate-900/5">
                {navItems.map((item, index) => {
                  const active = pathname === item.href;
                  const edgeClass =
                    index === 0
                      ? "rounded-l-xl"
                      : index === navItems.length - 1
                        ? "rounded-r-xl"
                        : "";

                  if (item.disabled) {
                    return (
                      <span
                        key={item.href}
                        title="Função em desenvolvimento"
                        className={`inline-flex items-center gap-2 border-l border-slate-200 px-4 py-2 text-sm font-medium text-slate-400 first:border-l-0 ${edgeClass}`}
                      >
                        <span>{item.label}</span>
                        {item.badge ? (
                          <span className="rounded-full border border-slate-200 bg-slate-50 px-2 py-0.5 text-[10px] font-semibold text-slate-500">
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
                      className={`border-l border-slate-200 px-4 py-2 text-sm font-medium transition first:border-l-0 ${edgeClass} ${
                        active
                          ? "bg-brand-mint/60 text-brand-forest shadow-inner shadow-brand-emerald/5"
                          : "text-slate-700 hover:bg-slate-50"
                      }`}
                    >
                      {item.label}
                    </Link>
                  );
                })}
              </nav>
            </div>

            <div className="flex flex-wrap items-center gap-2 xl:justify-end">
              {realtimeState ? (
                <span className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-600">
                  <span className="h-2 w-2 rounded-full bg-emerald-500" />
                  Online
                </span>
              ) : null}

              <div className="inline-flex items-center gap-2 rounded-xl border border-brand-emerald/15 bg-brand-mint/30 px-3 py-1.5 text-sm text-brand-forest shadow-sm shadow-slate-900/5">
                <UserRound className="h-4 w-4 text-brand-forest/80" />
                <span className="whitespace-nowrap font-medium">
                  Validador: {validatorName || "Usuário sem nome"}
                </span>
                <ChevronDown className="h-4 w-4 text-brand-forest/60" />
              </div>

              {onRefresh ? (
                <button className="btn btn-secondary h-10 px-4 py-0" onClick={onRefresh}>
                  <RefreshCw className="h-4 w-4" />
                  Atualizar
                </button>
              ) : null}

              <button className="btn btn-secondary h-10 px-4 py-0" onClick={logout}>
                <LogOut className="h-4 w-4" />
                Sair
              </button>
            </div>
          </div>

          <div className="flex justify-end">
            <p className="text-[11px] text-slate-400">
              Powered by <span className="font-medium text-slate-500">Algoriza</span>
            </p>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-[1600px] px-4 py-4">{children}</main>
    </div>
  );
}
