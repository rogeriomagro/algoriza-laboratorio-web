"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { LogIn, Microscope, ReceiptText, ShieldCheck } from "lucide-react";
import { hasSupabaseEnv, supabase } from "@/lib/supabase/client";
import { LabBrand } from "@/components/layout/LabBrand";

export function LoginForm() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!hasSupabaseEnv) {
      setError("Configure as variáveis do Supabase antes de acessar.");
      return;
    }

    setLoading(true);
    setError(null);

    const { error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password
    });

    setLoading(false);

    if (signInError) {
      setError("E-mail ou senha inválidos.");
      return;
    }

    router.replace("/");
  }

  return (
    <div className="grid w-full overflow-hidden rounded-[32px] border border-slate-200 bg-white shadow-[0_40px_120px_rgba(6,63,52,0.08)] lg:grid-cols-[0.9fr_1.1fr]">
      <div className="flex items-center justify-center p-6 sm:p-10">
        <form onSubmit={handleSubmit} className="w-full max-w-md">
          <LabBrand />

          <div className="mt-8">
            <p className="text-xs font-semibold tracking-[0.12em] text-brand-emerald">ACESSO INTERNO</p>
            <h1 className="mt-2 text-3xl font-semibold text-brand-forest">Validação de orçamentos</h1>
            <p className="mt-3 text-sm leading-6 text-slate-600">
              Ambiente operacional dos Laboratórios Nossa Senhora da Penha e Alfa Diagnóstico.
            </p>
          </div>

          <div className="mt-8 space-y-4">
            <label className="block">
              <span className="field-label">E-mail</span>
              <input
                className="field-input mt-2"
                type="email"
                value={email}
                autoComplete="email"
                onChange={(event) => setEmail(event.target.value)}
                required
                placeholder="seuemail@empresa.com"
              />
            </label>

            <label className="block">
              <span className="field-label">Senha</span>
              <input
                className="field-input mt-2"
                type="password"
                value={password}
                autoComplete="current-password"
                onChange={(event) => setPassword(event.target.value)}
                required
                placeholder="Digite sua senha"
              />
            </label>
          </div>

          {error ? (
            <p className="mt-4 rounded-xl border border-rose-100 bg-rose-50 p-3 text-sm text-rose-700">{error}</p>
          ) : null}
          {!hasSupabaseEnv ? (
            <p className="mt-4 rounded-xl border border-amber-100 bg-amber-50 p-3 text-sm text-amber-800">
              Variáveis de ambiente do Supabase ainda não configuradas.
            </p>
          ) : null}

          <button className="btn btn-primary mt-6 w-full" type="submit" disabled={loading || !hasSupabaseEnv}>
            <LogIn className="h-4 w-4" />
            {loading ? "Entrando..." : "Entrar"}
          </button>

          <p className="powered-by mt-6 text-center">
            Powered by <span className="font-medium text-slate-700">Algoriza</span>
          </p>
        </form>
      </div>

      <aside className="hidden border-l border-slate-200 bg-[linear-gradient(135deg,rgba(0,122,90,0.08)_0%,rgba(47,143,139,0.12)_38%,rgba(255,255,255,0.84)_100%)] lg:block">
        <div className="flex h-full flex-col justify-between p-10">
          <div className="rounded-[28px] border border-brand-emerald/10 bg-white/80 p-8 shadow-sm backdrop-blur-sm">
            <p className="text-sm font-medium text-brand-emerald">Operação assistida</p>
            <h2 className="mt-3 text-2xl font-semibold text-brand-forest">
              Conferência clínica com leitura simples e resposta organizada.
            </h2>
            <p className="mt-3 text-sm leading-6 text-slate-600">
              O painel foi pensado para a equipe revisar rapidamente exames, dados do paciente e valores sem carregar
              a sensação de sistema técnico demais.
            </p>
          </div>

          <div className="grid gap-4">
            <div className="subsection flex items-start gap-3">
              <span className="rounded-2xl bg-brand-mint p-3 text-brand-forest">
                <ReceiptText className="h-5 w-5" />
              </span>
              <div>
                <p className="font-medium text-slate-900">Orçamentos organizados</p>
                <p className="mt-1 text-sm text-slate-600">
                  Paciente, exames, preparo e valores em uma estrutura pensada para conferência humana.
                </p>
              </div>
            </div>

            <div className="subsection flex items-start gap-3">
              <span className="rounded-2xl bg-brand-mint p-3 text-brand-forest">
                <Microscope className="h-5 w-5" />
              </span>
              <div>
                <p className="font-medium text-slate-900">Catálogo oficial na operação</p>
                <p className="mt-1 text-sm text-slate-600">
                  Busca manual por nome, SKU e sinônimo para corrigir o orçamento com segurança.
                </p>
              </div>
            </div>
          </div>

          <div className="rounded-[28px] border border-brand-emerald/10 bg-brand-forest px-6 py-5 text-white">
            <div className="flex items-center gap-3">
              <ShieldCheck className="h-5 w-5 text-brand-mint" />
              <p className="font-medium">Uso interno e controlado</p>
            </div>
            <p className="mt-2 text-sm text-white/75">
              Acesso restrito à equipe responsável por revisar e validar os atendimentos antes do envio ao cliente.
            </p>
          </div>
        </div>
      </aside>
    </div>
  );
}
