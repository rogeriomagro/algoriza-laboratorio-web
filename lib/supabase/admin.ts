import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

function requireEnv(value: string | undefined, label: string) {
  if (!value) {
    throw new Error(`${label} não configurada.`);
  }

  return value;
}

export function hasUserManagementEnv() {
  return Boolean(supabaseUrl && supabaseAnonKey && supabaseServiceRoleKey);
}

export function createSupabaseAdminClient() {
  return createClient(
    requireEnv(supabaseUrl, "NEXT_PUBLIC_SUPABASE_URL"),
    requireEnv(supabaseServiceRoleKey, "SUPABASE_SERVICE_ROLE_KEY"),
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    }
  );
}

export async function getRequesterFromAuthorization(request: Request) {
  const authHeader = request.headers.get("authorization");
  const token = authHeader?.replace(/^Bearer\s+/i, "").trim();

  if (!token) {
    throw new Error("Sessão ausente. Faça login novamente.");
  }

  const client = createClient(
    requireEnv(supabaseUrl, "NEXT_PUBLIC_SUPABASE_URL"),
    requireEnv(supabaseAnonKey, "NEXT_PUBLIC_SUPABASE_ANON_KEY"),
    {
      global: {
        headers: {
          Authorization: `Bearer ${token}`
        }
      },
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    }
  );

  const { data, error } = await client.auth.getUser();

  if (error || !data.user) {
    throw new Error("Sessão inválida. Entre novamente.");
  }

  return data.user;
}

export function canManageUsers(email?: string | null) {
  const allowList = (process.env.USER_MANAGEMENT_ALLOWED_EMAILS || "")
    .split(",")
    .map((item) => item.trim().toLowerCase())
    .filter(Boolean);

  if (allowList.length === 0) return true;
  if (!email) return false;

  return allowList.includes(email.toLowerCase());
}
