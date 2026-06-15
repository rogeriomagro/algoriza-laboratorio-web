"use client";

import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import { KeyRound, RefreshCw, ShieldAlert, ShieldCheck, ShieldPlus, UserPlus } from "lucide-react";
import { AuthGate } from "@/components/auth/AuthGate";
import { AppShell } from "@/components/layout/AppShell";
import { useSession } from "@/hooks/useSession";
import type { KanbanUsuario } from "@/lib/supabase/types";

function formatDateTime(value: string | null) {
  if (!value) return "-";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;

  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(date);
}

function UsuariosPageContent() {
  const { session } = useSession();
  const [items, setItems] = useState<KanbanUsuario[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [forbidden, setForbidden] = useState(false);
  const [form, setForm] = useState({
    nome: "",
    email: "",
    senha: "",
  });

  const authHeaders = useMemo(() => {
    if (!session?.access_token) return null;

    return {
      Authorization: `Bearer ${session.access_token}`,
    };
  }, [session?.access_token]);

  const loadUsers = useCallback(async () => {
    if (!authHeaders) return;

    setLoading(true);
    setError(null);

    const response = await fetch("/api/users", {
      headers: authHeaders,
    });

    const payload = await response.json().catch(() => ({}));

    if (response.status === 403) {
      setForbidden(true);
      setItems([]);
      setLoading(false);
      return;
    }

    setForbidden(false);

    if (!response.ok) {
      setError(payload.error || "Nao foi possivel carregar os usuarios.");
      setItems([]);
      setLoading(false);
      return;
    }

    setItems(payload.items || []);
    setLoading(false);
  }, [authHeaders]);

  useEffect(() => {
    loadUsers();
  }, [loadUsers]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!authHeaders || forbidden) return;

    setSaving(true);
    setError(null);
    setSuccess(null);

    const response = await fetch("/api/users", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...authHeaders,
      },
      body: JSON.stringify(form),
    });

    const payload = await response.json().catch(() => ({}));
    setSaving(false);

    if (response.status === 403) {
      setForbidden(true);
      setError(payload.error || "Voce nao tem permissao para criar usuarios.");
      return;
    }

    if (!response.ok) {
      setError(payload.error || "Nao foi possivel criar o usuario.");
      return;
    }

    setForm({ nome: "", email: "", senha: "" });
    setSuccess("Usuario criado com sucesso.");
    await loadUsers();
  }

  async function toggleUser(item: KanbanUsuario) {
    if (!authHeaders || forbidden) return;

    setUpdatingId(item.id);
    setError(null);
    setSuccess(null);

    const response = await fetch("/api/users", {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        ...authHeaders,
      },
      body: JSON.stringify({
        id: item.id,
        ativo: !item.ativo,
      }),
    });

    const payload = await response.json().catch(() => ({}));
    setUpdatingId(null);

    if (response.status === 403) {
      setForbidden(true);
      setError(payload.error || "Voce nao tem permissao para alterar usuarios.");
      return;
    }

    if (!response.ok) {
      setError(payload.error || "Nao foi possivel atualizar o usuario.");
      return;
    }

    setSuccess(item.ativo ? "Usuario inativado com sucesso." : "Usuario reativado com sucesso.");
    await loadUsers();
  }

  return (
    <AppShell onRefresh={loadUsers}>
      <div className="grid gap-4 xl:grid-cols-[420px_1fr]">
        <section className="section">
          <div className="flex items-start gap-3">
            <span className="mt-1 inline-flex h-10 w-10 items-center justify-center rounded-xl bg-brand-mint/70 text-brand-forest">
              <UserPlus className="h-5 w-5" />
            </span>
            <div>
              <h1 className="text-xl font-semibold text-slate-950">Criar usuario</h1>
              <p className="mt-1 text-sm text-slate-600">
                Cadastro interno para acesso ao Kanban. A senha fica protegida no Supabase Auth.
              </p>
            </div>
          </div>

          {forbidden ? (
            <div className="mt-6 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
              <div className="flex items-start gap-2">
                <ShieldAlert className="mt-0.5 h-4 w-4" />
                <div>
                  <p className="font-medium">Acesso restrito</p>
                  <p className="mt-1">
                    Seu usuario esta autenticado, mas nao foi liberado para gerenciar acessos. Peça a inclusao do seu
                    e-mail na variavel <code>USER_MANAGEMENT_ALLOWED_EMAILS</code>.
                  </p>
                </div>
              </div>
            </div>
          ) : null}

          <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
            <label className="block">
              <span className="field-label">Nome</span>
              <input
                className="field-input mt-1"
                value={form.nome}
                onChange={(event) => setForm((current) => ({ ...current, nome: event.target.value }))}
                placeholder="Nome completo"
                required
                disabled={forbidden}
              />
            </label>

            <label className="block">
              <span className="field-label">E-mail</span>
              <input
                className="field-input mt-1"
                type="email"
                value={form.email}
                onChange={(event) => setForm((current) => ({ ...current, email: event.target.value }))}
                placeholder="usuario@empresa.com"
                required
                disabled={forbidden}
              />
            </label>

            <label className="block">
              <span className="field-label">Senha</span>
              <input
                className="field-input mt-1"
                type="password"
                value={form.senha}
                onChange={(event) => setForm((current) => ({ ...current, senha: event.target.value }))}
                placeholder="Minimo de 8 caracteres"
                minLength={8}
                required
                disabled={forbidden}
              />
            </label>

            {error ? <div className="rounded-lg border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700">{error}</div> : null}
            {success ? <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-700">{success}</div> : null}

            <div className="rounded-xl border border-brand-forest/10 bg-brand-mint/20 p-3 text-sm text-slate-700">
              <div className="flex items-start gap-2">
                <KeyRound className="mt-0.5 h-4 w-4 text-brand-forest" />
                <p>
                  O nome criado aqui sera o mesmo nome usado como <strong>validador</strong> no Kanban, no campo
                  <strong> validado_por</strong>.
                </p>
              </div>
            </div>

            <button className="btn btn-primary w-full" type="submit" disabled={saving || forbidden}>
              <ShieldPlus className="h-4 w-4" />
              {saving ? "Criando usuario..." : "Criar usuario"}
            </button>
          </form>
        </section>

        <section className="section">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-semibold text-slate-950">Usuarios cadastrados</h2>
              <p className="mt-1 text-sm text-slate-600">Base operacional usada para controle interno de acesso.</p>
            </div>
            <button className="btn btn-secondary" onClick={loadUsers} disabled={loading}>
              <RefreshCw className="h-4 w-4" />
              Atualizar
            </button>
          </div>

          <div className="mt-4 overflow-hidden rounded-xl border border-slate-200">
            <table className="min-w-full divide-y divide-slate-200 text-sm">
              <thead className="bg-slate-50">
                <tr className="text-left text-xs uppercase tracking-[0.08em] text-slate-500">
                  <th className="px-4 py-3">Nome</th>
                  <th className="px-4 py-3">E-mail</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Criado em</th>
                  <th className="px-4 py-3">Criado por</th>
                  <th className="px-4 py-3 text-right">Acoes</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white">
                {loading ? (
                  <tr>
                    <td className="px-4 py-6 text-slate-600" colSpan={6}>
                      Carregando usuarios...
                    </td>
                  </tr>
                ) : items.length === 0 ? (
                  <tr>
                    <td className="px-4 py-6 text-slate-600" colSpan={6}>
                      {forbidden ? "Sem permissao para visualizar usuarios." : "Nenhum usuario cadastrado."}
                    </td>
                  </tr>
                ) : (
                  items.map((item) => (
                    <tr key={item.id}>
                      <td className="px-4 py-3 font-medium text-slate-900">{item.nome}</td>
                      <td className="px-4 py-3 text-slate-600">{item.email}</td>
                      <td className="px-4 py-3">
                        <span
                          className={`rounded-full px-2 py-1 text-xs font-semibold ${
                            item.ativo ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-500"
                          }`}
                        >
                          {item.ativo ? "Ativo" : "Inativo"}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-slate-600">{formatDateTime(item.created_at)}</td>
                      <td className="px-4 py-3 text-slate-600">{item.criado_por || "-"}</td>
                      <td className="px-4 py-3 text-right">
                        <button
                          className={`btn ${item.ativo ? "btn-secondary" : "btn-primary"}`}
                          onClick={() => toggleUser(item)}
                          disabled={updatingId === item.id || forbidden}
                        >
                          {item.ativo ? <ShieldAlert className="h-4 w-4" /> : <ShieldCheck className="h-4 w-4" />}
                          {updatingId === item.id ? "Salvando..." : item.ativo ? "Inativar" : "Reativar"}
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </AppShell>
  );
}

export default function UsuariosPage() {
  return (
    <AuthGate>
      <UsuariosPageContent />
    </AuthGate>
  );
}
