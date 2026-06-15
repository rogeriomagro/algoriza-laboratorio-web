"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Hammer, LogOut, RefreshCw } from "lucide-react";
import { supabase } from "@/lib/supabase/client";
import { useValidatorName } from "@/hooks/useValidatorName";

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
    { href: "/sugestoes-base", label: "Sugestões da base", disabled: true, badge: "Em desenvolvimento" }
  ];

  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-30 border-b border-brand-emerald/20 bg-gradient-to-r from-brand-deep via-brand-forest to-brand-emerald text-white shadow-lg shadow-brand-forest/20">
        <div className="h-1 bg-gradient-to-r from-brand-teal via-brand-mint to-white/80" />
        <div className="mx-auto flex max-w-[1600px] flex-wrap items-center justify-between gap-3 px-4 py-3">
          <Link href="/" className="flex items-center gap-3">
            <span className="flex h-11 w-11 items-center justify-center rounded-md border border-white/20 bg-white">
              <img src="/brand/brand-mark.png" alt="" className="h-9 w-9 object-contain" />
            </span>
            <span>
              <span className="block text-base font-semibold text-white">Validação de Orçamentos</span>
              <span className="block text-xs text-brand-mint">Laboratórios Nossa Senhora da Penha e Alfa Diagnóstico</span>
            </span>
          </Link>

          <div className="flex flex-wrap items-center gap-2">
            <nav className="mr-1 flex rounded-lg border border-white/15 bg-white/10 p-1 text-sm">
              {navItems.map((item) => {
                const active = pathname === item.href;

                if (item.disabled) {
                  return (
                    <span
                      key={item.href}
                      aria-disabled="true"
                      title="Função em desenvolvimento"
                      className="inline-flex items-center gap-2 rounded-md px-3 py-1.5 font-medium text-white/55"
                    >
                      <span>{item.label}</span>
                      {item.badge ? (
                        <span className="rounded-full border border-white/15 bg-white/10 px-2 py-0.5 text-[11px] font-semibold uppercase tracking-[0.08em] text-white/70">
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
                    className={`rounded-md px-3 py-1.5 font-medium transition ${
                      active ? "bg-white text-brand-forest" : "text-white/85 hover:bg-white/10 hover:text-white"
                    }`}
                  >
                    {item.label}
                  </Link>
                );
              })}
            </nav>
            {realtimeState ? (
              <span className="rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs font-medium text-brand-mint">
                Realtime: {realtimeState}
              </span>
            ) : null}
            <div className="flex items-center gap-2 rounded-md border border-white/15 bg-white/10 px-3 py-2 text-sm">
              <Hammer className="h-4 w-4 text-brand-mint" />
              <div>
                <span className="block text-[11px] uppercase tracking-[0.08em] text-white/65">Validador atual</span>
                <span className="block font-medium text-white">{validatorName || "Usuário sem nome configurado"}</span>
              </div>
            </div>
            {onRefresh ? (
              <button className="btn border border-white/20 bg-white/10 text-white hover:bg-white/20" onClick={onRefresh}>
                <RefreshCw className="h-4 w-4" />
                Atualizar
              </button>
            ) : null}
            <button className="btn border border-white/20 bg-white text-brand-forest hover:bg-brand-mint" onClick={logout}>
              <LogOut className="h-4 w-4" />
              Sair
            </button>
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-[1600px] px-4 py-5">{children}</main>
    </div>
  );
}
