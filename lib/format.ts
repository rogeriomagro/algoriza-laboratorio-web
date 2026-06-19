export function parseCurrency(value: number | string | null | undefined): number | null {
  if (value === null || value === undefined || value === "") return null;
  if (typeof value === "number") return Number.isFinite(value) ? value : null;

  const normalized = String(value)
    .replace(/R\$\s*/i, "")
    .replace(/\./g, "")
    .replace(",", ".")
    .trim();

  const parsed = Number.parseFloat(normalized);
  return Number.isFinite(parsed) ? parsed : null;
}

export function formatCurrency(value: number | string | null | undefined): string {
  const parsed = parseCurrency(value);
  if (parsed === null) return "Não informado";

  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(parsed);
}

export function formatDate(value: string | null | undefined): string {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;

  return new Intl.DateTimeFormat("pt-BR", {
    timeZone: "America/Sao_Paulo",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

export function formatDateOnly(value: string | null | undefined): string {
  if (!value) return "-";

  const directMatch = String(value).match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  if (directMatch) return directMatch[0];

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);

  return new Intl.DateTimeFormat("pt-BR", {
    timeZone: "America/Sao_Paulo",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(date);
}

export function normalizeSearch(value: string | null | undefined): string {
  return String(value || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim();
}

export function asString(value: unknown): string {
  if (value === null || value === undefined) return "";
  return String(value);
}

export function formatCpf(value: string | null | undefined): string {
  const digits = String(value || "").replace(/\D/g, "").slice(0, 11);
  if (!digits) return "";

  return digits
    .replace(/^(\d{3})(\d)/, "$1.$2")
    .replace(/^(\d{3})\.(\d{3})(\d)/, "$1.$2.$3")
    .replace(/\.(\d{3})(\d)/, ".$1-$2");
}

export function formatPhone(value: string | null | undefined): string {
  const digits = String(value || "").replace(/\D/g, "");
  if (!digits) return "";

  const national = digits.length > 11 ? digits.slice(-11) : digits;
  if (national.length <= 10) {
    return national
      .replace(/^(\d{2})(\d)/, "($1) $2")
      .replace(/(\d{4})(\d)/, "$1-$2");
  }

  return national
    .replace(/^(\d{2})(\d)/, "($1) $2")
    .replace(/(\d{5})(\d)/, "$1-$2");
}

export function formatBirthDateInput(value: string | null | undefined): string {
  const digits = String(value || "").replace(/\D/g, "").slice(0, 8);
  if (!digits) return "";

  return digits.replace(/^(\d{2})(\d)/, "$1/$2").replace(/^(\d{2})\/(\d{2})(\d)/, "$1/$2/$3");
}

export function formatSchedulePreference(value: string | null | undefined): string {
  const input = String(value || "").trim();
  if (!input) return "";

  const match = input.match(/^(\d{4})-(\d{2})-(\d{2})(?:\s+(.+))?$/i);
  if (!match) return input;

  const [, year, month, day, periodRaw] = match;
  const period = normalizeSearch(periodRaw || "");

  let suffix = "";
  if (period.includes("manha")) suffix = "período da manhã";
  else if (period.includes("tarde")) suffix = "período da tarde";
  else if (period.includes("noite")) suffix = "período da noite";

  return suffix ? `${day}/${month}/${year}, ${suffix}` : `${day}/${month}/${year}`;
}

export function describeMatch(match: string | null | undefined): string {
  const value = normalizeSearch(match);

  switch (value) {
    case "nome_exato":
      return "Correspondência exata";
    case "sinonimo_exato":
      return "Sinônimo exato";
    case "sku_exato":
      return "SKU exato";
    case "substring":
      return "Correspondência por termo";
    case "manual_catalogo":
      return "Adicionado manualmente";
    case "similarity":
      return "Correspondência aproximada";
    default:
      return value ? "Correspondência identificada" : "Sem correspondência registrada";
  }
}

// Unidades de atendimento (5). Iúna é atendida pelo Alfa Diagnóstico; as demais
// pelo Laboratório Nossa Senhora da Penha.
export const UNIDADES = [
  "Ibatiba - Matriz",
  "Ibatiba - Centro",
  "Iúna",
  "Brejetuba",
  "Piaçu",
] as const;

export type LabTag = "alfa" | "penha";

export interface LabMeta {
  tag: LabTag;
  nome: string;
  logo: string;
}

export const LAB_META: Record<LabTag, LabMeta> = {
  alfa: { tag: "alfa", nome: "Alfa Diagnóstico", logo: "/labs/alfa-logo.png" },
  penha: { tag: "penha", nome: "Nossa Senhora da Penha", logo: "/labs/penha-logo.jpg" },
};

// Regra de tag: unidade de Iúna → Alfa Labs; todas as outras → Nossa Senhora da Penha.
// Retorna null quando a unidade está vazia/indefinida (não rotular por engano).
export function labFromUnidade(unidade: string | null | undefined): LabTag | null {
  const u = normalizeSearch(unidade);
  if (!u || u === "nao informado") return null;
  if (u.includes("iuna") || u.includes("alfa")) return "alfa";
  return "penha";
}

export function formatDays(value: number | string | null | undefined): string {
  const raw = String(value ?? "").trim();
  if (!raw) return "Prazo não informado";
  const amount = Number(raw.replace(",", "."));
  if (!Number.isFinite(amount)) return raw;
  return `${amount} ${amount === 1 ? "dia" : "dias"}`;
}

export function formatHours(value: number | string | null | undefined): string {
  const raw = String(value ?? "").trim();
  if (!raw) return "Sem jejum informado";
  const amount = Number(raw.replace(",", "."));
  if (!Number.isFinite(amount)) return raw;
  return `${amount} ${amount === 1 ? "hora" : "horas"}`;
}
