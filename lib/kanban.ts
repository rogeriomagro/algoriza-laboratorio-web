import type { AtendimentoStatus } from "@/lib/supabase/types";

// Colunas trazidas para o Kanban (subconjunto usado pelo card — mantém o payload enxuto).
export const KANBAN_SELECT =
  "id,protocolo,telefone,responsavel_nome,paciente_nome,medico_solicitante,total_validado,total_bruto,desconto_pct,desconto_tipo,desconto_reais,status,termos_nao_encontrados,unidade_preferida,validado_por,created_at,updated_at";

export interface KanbanGroup {
  key: string;
  title: string;
  description: string;
  statuses: AtendimentoStatus[];
  // Coluna de ordenação (created_at para todas — sempre preenchida, evita nulos no topo).
  orderColumn: "created_at" | "updated_at";
  ascending: boolean;
  // Tamanho da página inicial e de cada "Carregar mais".
  pageSize: number;
}

// As colunas acionáveis (aguardando/em validação) esvaziam com o trabalho da equipe,
// então recebem página maior. As terminais acumulam com o tempo → página curta + "Carregar mais".
export const KANBAN_GROUPS: KanbanGroup[] = [
  {
    key: "aguardando",
    title: "Aguardando",
    description: "Novos atendimentos enviados pelo bot",
    statuses: ["aguardando_validacao"],
    orderColumn: "created_at",
    ascending: true,
    pageSize: 100,
  },
  {
    key: "em_validacao",
    title: "Em validação",
    description: "Atendimentos em revisão humana",
    statuses: ["em_validacao"],
    orderColumn: "created_at",
    ascending: false,
    pageSize: 100,
  },
  {
    key: "finalizados",
    title: "Validados / enviados",
    description: "Orçamentos aprovados e já encaminhados ao cliente",
    statuses: ["validado", "enviado"],
    orderColumn: "created_at",
    ascending: false,
    pageSize: 25,
  },
  {
    key: "convertido",
    title: "Convertido",
    description: "Orçamentos que viraram coleta/venda",
    statuses: ["convertido"],
    orderColumn: "created_at",
    ascending: false,
    pageSize: 25,
  },
  {
    key: "rejeitado",
    title: "Rejeitado",
    description: "Atendimentos rejeitados",
    statuses: ["rejeitado"],
    orderColumn: "created_at",
    ascending: false,
    pageSize: 25,
  },
];

export interface KanbanFilters {
  query: string;
  validador: string;
  lab: string;
}

// Campos varridos pela busca textual (server-side, via ilike).
export const SEARCH_COLUMNS = [
  "protocolo",
  "paciente_nome",
  "telefone",
  "medico_solicitante",
  "responsavel_nome",
];

// Sanitiza o termo para a sintaxe de .or() do PostgREST — vírgula/parênteses/% quebram o filtro.
export function sanitizeSearch(value: string): string {
  return String(value || "")
    .replace(/[,()%]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

// lab -> padrões de unidade_preferida (espelha labFromUnidade em format.ts).
// Alfa = Iúna; Penha = demais unidades conhecidas (Ibatiba matriz/centro, Brejetuba, Piaçu).
export function labUnidadePatterns(lab: string): string[] | null {
  if (lab === "alfa") return ["%iuna%", "%alfa%"];
  if (lab === "penha") return ["%matriz%", "%centro%", "%brejetuba%", "%piacu%", "%ibatiba%"];
  return null;
}
