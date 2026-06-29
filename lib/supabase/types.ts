export type AtendimentoStatus =
  | "aguardando_validacao"
  | "em_validacao"
  | "validado"
  | "rejeitado"
  | "enviado"
  | "cancelado"
  | "convertido";

export type JsonValue =
  | string
  | number
  | boolean
  | null
  | JsonValue[]
  | { [key: string]: JsonValue };

export interface Atendimento {
  id: string;
  protocolo: string | null;
  telefone: string | null;
  responsavel_nome: string | null;
  paciente_nome: string | null;
  paciente_cpf: string | null;
  paciente_nascimento: string | null;
  paciente_cidade: string | null;
  plano_convenio: string | null;
  unidade_preferida: string | null;
  agendamento_desejado: string | null;
  medico_solicitante: string | null;
  qualidade_pedido_imagem: string | null;
  observacoes_prescricao: string | null;
  observacoes_conversa: string | null;
  total_bruto: number | string | null;
  total_validado: number | string | null;
  desconto_pct: number | string | null;
  desconto_tipo: "percentual" | "reais" | null;
  desconto_reais: number | string | null;
  validade_dias: number | string | null;
  status: AtendimentoStatus;
  termos_nao_encontrados: string[] | null;
  cotacao_original: JsonValue | null;
  validado_por: string | null;
  validado_em: string | null;
  enviado_em: string | null;
  convertido_por: string | null;
  convertido_em: string | null;
  created_at: string | null;
  updated_at: string | null;
}

export interface AtendimentoExame {
  id: string;
  atendimento_id: string;
  sku: string | null;
  nome: string | null;
  preco: number | string | null;
  prazo_dias: number | string | null;
  jejum_horas: number | string | null;
  preparo: string | null;
  termo_original: string | null;
  match_por: string | null;
  score: number | string | null;
  ambiguo: boolean | null;
  cobertura: "sus" | "unimed" | null;
  incluido: boolean | null;
  editado_manual: boolean | null;
  ordem: number | null;
  created_at?: string | null;
}

export interface CatalogoExame {
  sku: string | null;
  nome: string;
  sinonimos: string | null;
  preco: number | string | null;
  material: string | null;
  metodo: string | null;
  preparo: string | null;
  prazo_dias: number | string | null;
  jejum_horas: number | string | null;
}

export interface KanbanUsuario {
  id: string;
  auth_user_id: string;
  nome: string;
  email: string;
  ativo: boolean;
  criado_por: string | null;
  created_at: string | null;
  updated_at: string | null;
}

export type SugestaoCatalogoStatus = "pendente" | "aprovado" | "rejeitado";
export type SugestaoCatalogoRisco = "baixo" | "medio" | "alto";

export interface SugestaoCatalogo {
  id: string;
  sku: string | null;
  nome_exame: string;
  sinonimo_sugerido: string;
  termo_original: string | null;
  contexto: string | null;
  atendimento_id: string | null;
  protocolo: string | null;
  ocorrencias: number | string | null;
  risco: SugestaoCatalogoRisco;
  status: SugestaoCatalogoStatus;
  origem: string | null;
  observacao: string | null;
  criado_por: string | null;
  aprovado_por: string | null;
  aprovado_em: string | null;
  rejeitado_por: string | null;
  rejeitado_em: string | null;
  aplicado: boolean | null;
  created_at: string | null;
  updated_at: string | null;
}

export interface AgendaConfig {
  id: number | string;
  unidade: string;
  dia_semana: number;
  hora_inicio: string;
  hora_fim: string;
  slot_min: number;
  capacidade: number;
  ativo: boolean;
}

export interface AgendaExcecao {
  id: number | string;
  unidade: string | null;
  data: string;
  tipo: "bloqueio" | "especial";
  hora_inicio: string | null;
  hora_fim: string | null;
  motivo: string | null;
  created_at: string | null;
}

export type AgendamentoStatus =
  | "pendente"
  | "confirmado"
  | "cancelado"
  | "expirado"
  | "realizado";

export interface Agendamento {
  id: string;
  atendimento_id: string | null;
  unidade: string;
  data: string;
  hora: string;
  status: AgendamentoStatus;
  expira_em: string | null;
  created_at: string | null;
}
