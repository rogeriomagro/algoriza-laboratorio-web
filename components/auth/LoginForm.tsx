"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { LogIn } from "lucide-react";
import { hasSupabaseEnv, supabase } from "@/lib/supabase/client";

export function LoginForm() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!hasSupabaseEnv) {
      setError("Configure NEXT_PUBLIC_SUPABASE_URL e NEXT_PUBLIC_SUPABASE_ANON_KEY antes de acessar.");
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
      setError(signInError.message);
      return;
    }

    router.replace("/");
  }

  return (
    <form onSubmit={handleSubmit} className="w-full max-w-md">
      <div className="mb-6">
        <img src="/brand/brand-logo.png" alt="Algoriza" className="mb-5 h-24 w-auto object-contain" />
        <p className="text-xs font-semibold uppercase text-brand-emerald">Acesso interno</p>
        <h1 className="mt-1 text-2xl font-semibold text-brand-charcoal">Validação de orçamentos</h1>
        <p className="mt-2 text-sm text-slate-600">Kanban operacional para conferência humana dos atendimentos.</p>
      </div>

      <label className="mb-4 block">
        <span className="field-label">E-mail</span>
        <input
          className="field-input mt-1"
          type="email"
          value={email}
          autoComplete="email"
          onChange={(event) => setEmail(event.target.value)}
          required
        />
      </label>

      <label className="mb-4 block">
        <span className="field-label">Senha</span>
        <input
          className="field-input mt-1"
          type="password"
          value={password}
          autoComplete="current-password"
          onChange={(event) => setPassword(event.target.value)}
          required
        />
      </label>

      {error ? <p className="mb-4 rounded-md border border-rose-100 bg-rose-50 p-3 text-sm text-rose-700">{error}</p> : null}
      {!hasSupabaseEnv ? (
        <p className="mb-4 rounded-md border border-amber-100 bg-amber-50 p-3 text-sm text-amber-800">
          Variáveis de ambiente do Supabase ainda não configuradas.
        </p>
      ) : null}

      <button className="btn btn-primary w-full" type="submit" disabled={loading || !hasSupabaseEnv}>
        <LogIn className="h-4 w-4" />
        {loading ? "Entrando..." : "Entrar"}
      </button>
    </form>
  );
}
