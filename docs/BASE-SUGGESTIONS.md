# Base de exames - sugestoes supervisionadas

## Estado atual

A navegacao **Base de exames** esta desabilitada e exibe a informacao **Em desenvolvimento**. A rota `/sugestoes-base` e apenas um placeholder e nao deve ser considerada funcionalidade de producao.

## Objetivo futuro

Transformar correcoes humanas recorrentes em sugestoes revisaveis de novos sinonimos, sem permitir que o agente altere diretamente `catalogo_exames`.

Fluxo pretendido:

```text
operador corrige um exame no atendimento
  -> sistema registra termo original + exame escolhido
  -> gera sugestao em sugestoes_catalogo
  -> equipe tecnica revisa
  -> aprova ou rejeita
  -> somente a aprovacao chama a RPC que atualiza catalogo_exames
```

## Principio de seguranca

O aprendizado deve ser supervisionado. Uma correcao isolada nao e prova suficiente de que um termo e sinonimo universal. Contexto, erro de digitacao, painel, material e metodo podem tornar a sugestao perigosa.

Regras obrigatorias:

- nunca escrever automaticamente no catalogo mestre;
- manter protocolo, termo original, SKU escolhido, usuario e data;
- permitir remover sinonimos individuais antes da aprovacao;
- bloquear duplicados normalizados;
- destacar siglas curtas e termos ambiguos como alto risco;
- exigir confirmacao humana;
- manter historico imutavel de aprovacao e rejeicao.

## Dados previstos

Tabela `sugestoes_catalogo`:

- `id`;
- `sku`;
- `nome_exame`;
- `sinonimo_sugerido`;
- `termo_original`;
- `protocolo`;
- `contexto`;
- `risco`;
- `status` (`pendente`, `aprovado`, `rejeitado`);
- `sugerido_por`, `revisado_por`;
- timestamps.

RPCs previstas:

- `aprovar_sugestao_catalogo(uuid, text)`;
- `rejeitar_sugestao_catalogo(uuid, text)`.

## Criterios para liberar a tela

1. Schema e RPCs aplicados e testados no Supabase.
2. Policies RLS separadas para leitura e revisao.
3. Captura de sugestoes integrada ao ato de corrigir o exame.
4. Filtros por risco, status, exame e protocolo.
5. Aprovar/rejeitar com auditoria.
6. Testes contra contaminacao por siglas ambiguas.
7. Plano de rollback do sinonimo aprovado.
8. Revisao de um responsavel tecnico do laboratorio.

Enquanto esses requisitos nao forem cumpridos, o menu deve permanecer desabilitado.
