import { canManageUsers, createSupabaseAdminClient, getRequesterFromAuthorization, hasUserManagementEnv } from "@/lib/supabase/admin";

const SELECT_FIELDS = "id,auth_user_id,nome,email,ativo,criado_por,created_at,updated_at";

function jsonError(message: string, status: number) {
  return Response.json({ error: message }, { status });
}

function validateEmail(email: string) {
  return /\S+@\S+\.\S+/.test(email);
}

export async function GET(request: Request) {
  if (!hasUserManagementEnv()) {
    return jsonError("Ambiente de gestão de usuários não configurado.", 500);
  }

  try {
    const requester = await getRequesterFromAuthorization(request);

    if (!canManageUsers(requester.email)) {
      return jsonError("Usuário sem permissão para gerenciar acessos.", 403);
    }

    const admin = createSupabaseAdminClient();
    const { data, error } = await admin
      .from("kanban_usuarios")
      .select(SELECT_FIELDS)
      .order("created_at", { ascending: false });

    if (error) {
      return jsonError(error.message, 500);
    }

    return Response.json({ items: data || [] });
  } catch (error) {
    return jsonError(error instanceof Error ? error.message : "Falha ao carregar usuários.", 401);
  }
}

export async function POST(request: Request) {
  if (!hasUserManagementEnv()) {
    return jsonError("Ambiente de gestão de usuários não configurado.", 500);
  }

  try {
    const requester = await getRequesterFromAuthorization(request);

    if (!canManageUsers(requester.email)) {
      return jsonError("Usuário sem permissão para criar acessos.", 403);
    }

    const body = await request.json();
    const nome = String(body.nome || "").trim();
    const email = String(body.email || "").trim().toLowerCase();
    const senha = String(body.senha || "");

    if (!nome) return jsonError("Informe o nome do usuário.", 400);
    if (!email || !validateEmail(email)) return jsonError("Informe um e-mail válido.", 400);
    if (senha.length < 8) return jsonError("A senha deve ter pelo menos 8 caracteres.", 400);

    const admin = createSupabaseAdminClient();
    const { data: created, error: createError } = await admin.auth.admin.createUser({
      email,
      password: senha,
      email_confirm: true,
      user_metadata: {
        full_name: nome
      }
    });

    if (createError || !created.user) {
      return jsonError(createError?.message || "Não foi possível criar o usuário.", 400);
    }

    const { error: insertError } = await admin.from("kanban_usuarios").insert({
      auth_user_id: created.user.id,
      nome,
      email,
      ativo: true,
      criado_por: requester.email || null
    });

    if (insertError) {
      await admin.auth.admin.deleteUser(created.user.id);
      return jsonError(insertError.message, 500);
    }

    return Response.json({
      ok: true,
      item: {
        auth_user_id: created.user.id,
        nome,
        email,
        ativo: true,
        criado_por: requester.email || null
      }
    });
  } catch (error) {
    return jsonError(error instanceof Error ? error.message : "Falha ao criar usuário.", 401);
  }
}

export async function PATCH(request: Request) {
  if (!hasUserManagementEnv()) {
    return jsonError("Ambiente de gestao de usuarios nao configurado.", 500);
  }

  try {
    const requester = await getRequesterFromAuthorization(request);

    if (!canManageUsers(requester.email)) {
      return jsonError("Usuario sem permissao para alterar acessos.", 403);
    }

    const body = await request.json();
    const id = String(body.id || "").trim();
    const ativo = Boolean(body.ativo);

    if (!id) {
      return jsonError("Informe o usuario que sera atualizado.", 400);
    }

    const admin = createSupabaseAdminClient();
    const { data, error } = await admin
      .from("kanban_usuarios")
      .update({
        ativo
      })
      .eq("id", id)
      .select(SELECT_FIELDS)
      .single();

    if (error) {
      return jsonError(error.message, 500);
    }

    if (!data) {
      return jsonError("Usuario nao encontrado.", 404);
    }

    return Response.json({
      ok: true,
      item: data
    });
  } catch (error) {
    return jsonError(error instanceof Error ? error.message : "Falha ao atualizar usuario.", 401);
  }
}
