# Arquitetura da Ferramenta Web

## Escopo

Este documento descreve apenas a aplicacao Next.js de validacao humana. Os workflows do n8n, o Redis e o matcher completo estao documentados nos arquivos gerais do projeto.

## Diagrama

```text
Navegador
  |-- Supabase Auth
  |-- Supabase JS + RLS
  |     |-- atendimentos
  |     |-- atendimento_exames
  |     |-- catalogo_exames
  |     `-- match_termos_exames()
  |
  |-- /api/users
  |     `-- Supabase Admin (service role, somente servidor)
  |
  `-- /api/resposta-validada
        `-- webhook n8n Resposta Validada
```

## Organizacao do codigo

```text
app/
  page.tsx                     Kanban (com filtros de validador e laboratorio)
  login/page.tsx               autenticacao
  atendimentos/[id]/page.tsx   revisao do atendimento
  calendario/page.tsx          calendario de coletas (somente front-end)
  usuarios/page.tsx            gestao de usuarios
  sugestoes-base/page.tsx      placeholder futuro
  api/users/route.ts            API administrativa
  api/resposta-validada/route.ts ponte para o n8n
components/
  atendimento/                 dados, resumo/desconto (TotalSummary), termos (TermsNotFoundAlert)
  exames/                      busca, lista e edicao (ExamRow com botoes SUS/Unimed)
  kanban/                      quadro, colunas, cards (tag de laboratorio) e filtros
  calendario/                  CalendarioView (estado local, sem banco)
  layout/                      header e marcas
  auth/                        protecao de rotas
hooks/                         sessao e Realtime
lib/
  status.ts                    estados e leitura
  format.ts                    formatacao BR + UNIDADES, LAB_META e labFromUnidade
  supabase/                    clientes, tipos e admin
```

## Autenticacao e autorizacao

O login usa Supabase Auth no navegador. `AuthGate` protege as telas internas.

O nome operacional do validador e calculado por `useValidatorName` nesta ordem:

1. `user_metadata.full_name`;
2. `user_metadata.name`;
3. parte do e-mail antes de `@`.

A rota `/api/users` recebe o access token do usuario no header `Authorization`. O servidor valida o token com a anon key e, depois, usa a service role para criar usuarios.

`USER_MANAGEMENT_ALLOWED_EMAILS` e a allowlist de administradores. Em producao, ela nao deve ficar vazia.

## Estados do atendimento

| Estado | Significado | Editavel |
|---|---|---|
| `aguardando_validacao` | Recebido do bot | Ao abrir, e reservado |
| `em_validacao` | Em revisao humana | Sim |
| `validado` | Aprovado pela equipe | Nao |
| `enviado` | Resposta encaminhada | Nao |
| `rejeitado` | Rejeitado pela equipe | Nao |
| `cancelado` | Removido do quadro ativo | Nao |

O Kanban combina `validado` e `enviado` em uma unica coluna visual. `cancelado` fica fora da consulta do quadro.

## Reserva do card

Ao abrir um atendimento `aguardando_validacao`, a pagina executa um update condicionado ao status anterior. Isso evita que duas pessoas assumam silenciosamente o mesmo card. Se o card ja estiver `em_validacao`, a tela avisa que pode haver outro operador trabalhando nele.

## Dados e fonte de verdade

### `atendimentos`

Guarda paciente, prescricao, totais, status, protocolo e rastreio (`validado_por`, `validado_em`, `enviado_em`). Inclui **`desconto_pct`** (NUMERIC 0–100) — o desconto manual concedido pela equipe naquele orcamento.

### `atendimento_exames`

Guarda a copia operacional de cada exame daquele atendimento. E aqui que a equipe edita nome, SKU, preco, prazo, jejum, preparo e inclusao. Inclui **`cobertura`** (`'sus' | 'unimed' | NULL`) — quando preenchido, o exame e coberto pelo plano e sai zerado do orcamento (nao entra no `total_validado`).

### `catalogo_exames`

E o catalogo mestre consultado pela busca. A tela de atendimento nao atualiza essa tabela.

## Busca e correcao de exames

A busca usa duas fontes em paralelo:

1. RPC `match_termos_exames`, que aplica o matcher SQL;
2. consulta direta com `ilike` em `nome`, `sku` e `sinonimos`.

Os resultados sao deduplicados por `sku + nome`.

Existem dois usos:

- **Adicionar exame pelo catalogo:** cria nova linha em `atendimento_exames`.
- **Adicionar novo exame manual:** abre um formulario vazio, nao executa busca no catalogo e cria uma linha com `match_por = manual_livre`.
- **Editar nome no card:** ao selecionar um resultado, substitui os campos do rascunho; somente o clique em **Salvar** grava a alteracao.

Salvar uma edicao define `editado_manual = true`. Selecoes do catalogo usam `match_por = manual_catalogo`; cadastros totalmente livres usam `match_por = manual_livre`.

## Total validado, desconto e cobertura

O frontend nao e a fonte de verdade do total. O banco executa `recalc_total_validado()` depois de mudancas em `atendimento_exames` e soma os precos das linhas com `incluido = true` **e `cobertura IS NULL`** (exames cobertos por SUS/Unimed nao entram).

O **desconto manual** (`atendimentos.desconto_pct`) **nao** e gravado em `total_validado` — e aplicado na exibicao: total final = `total_validado * (1 - desconto_pct/100)`. Assim, mudar a % nao depende do trigger (que so dispara em `atendimento_exames`).

- **Desconto e validade** (`components/atendimento/TotalSummary.tsx`): campo de % que salva `desconto_pct` (mostra o "Total com desconto") e campo de **validade (dias)** que salva `atendimentos.validade_dias` (padrao 30) — usada pelo PDF.
- **Cobertura** (`components/exames/ExamRow.tsx`): botoes **SUS/Unimed** por exame que salvam `cobertura` (e zeram o exame); o trigger recalcula o total ao mudar `cobertura`.

A interface recarrega o atendimento e mostra `atendimentos.total_validado` (e o total com desconto quando houver).

## Filtros, tags de laboratorio e termos resolvidos

- **Filtros do Kanban** (`components/kanban/KanbanFilters.tsx`): texto + **Validado por** (lista nomes de `kanban_usuarios` ativos via SELECT autenticado, somados aos `validado_por` ja presentes) + **Laboratorio** (`alfa`/`penha`). A derivacao usa `labFromUnidade()` em `lib/format.ts` (unidade com "iuna"/"alfa" => Alfa; demais => N. S. da Penha).
- **Tag/logo** do laboratorio aparece no card (`AtendimentoCard`) e na ficha (`PatientForm`), usando `LAB_META` e as imagens em `public/labs/`.
- **Termo resolvido** (`components/atendimento/TermsNotFoundAlert.tsx`): cada termo tem um botao ✓ que o remove de `atendimentos.termos_nao_encontrados` (a contagem do card some junto).
- **Unidade** no `PatientForm` sugere as 5 cidades (datalist) e e marcada como obrigatoria.

## Calendario (somente front-end)

`/calendario` (`components/calendario/CalendarioView.tsx`) e uma prova visual: abre/fecha dias (incl. fins de semana), abre/fecha horarios, capacidade e feriados, tudo em **estado local React**. Nao ha banco, agente nem persistencia ainda — o desenho tecnico da agenda real esta em `../documentacao/agenda-plano.md`.

## Validacao e n8n

Ao validar:

1. a tela confirma que existe telefone e exame incluido;
2. atualiza o atendimento para `validado`;
3. grava `validado_por` e `validado_em`;
4. chama `POST /api/resposta-validada`;
5. a rota server-side encaminha o payload para `N8N_RESPOSTA_VALIDADA_WEBHOOK_URL`;
6. o n8n envia mensagem/PDF e marca o atendimento como `enviado`.

O webhook do banco pode coexistir com essa chamada, mas a implantacao deve ter apenas um mecanismo efetivo de disparo para evitar envio duplicado. A configuracao operacional atual deve ser validada antes de alterar esse ponto.

## Realtime

O Kanban escuta mudancas em `atendimentos`. A tela de detalhe escuta `atendimentos` e `atendimento_exames` do atendimento aberto. O chip **Online** indica que a assinatura foi iniciada; nao e um monitor completo de saude do Supabase.

## Gestao de usuarios

`POST /api/users`:

1. valida o solicitante e a allowlist;
2. cria o usuario no Supabase Auth com e-mail confirmado;
3. grava o perfil em `kanban_usuarios`;
4. remove o usuario do Auth se o insert do perfil falhar.

`PATCH /api/users` altera apenas `kanban_usuarios.ativo` na implementacao atual. Isso e um status operacional; nao bloqueia sozinho o login no Supabase Auth. Para revogar acesso imediatamente, tambem e necessario desativar/remover o usuario em Supabase Auth ou evoluir a API.

## Seguranca

- O navegador usa anon key e depende das politicas RLS.
- A service role existe apenas no servidor.
- A API de usuarios valida o access token antes de usar privilegios administrativos.
- A allowlist administrativa deve ser explicita em producao.
- Segredos nao devem ser commitados.
- Alteracoes de catalogo devem continuar supervisionadas; o card edita somente a copia do atendimento.

## Limitacoes atuais

- A aba **Base de exames** esta desabilitada e a rota e apenas placeholder.
- A aba **Calendario** e somente visual (estado local) — sem banco, agente nem agendamento real.
- Nao ha status **`convertido`** nem relatorio de comissao ainda (so o filtro por validador).
- Nao ha botao de **reabrir/editar atendimento ja enviado** com login restrito.
- Inativar um perfil nao revoga automaticamente o Supabase Auth.
- Nao ha papel `admin`/perfis por tipo de usuario persistido; a administracao usa allowlist por e-mail.
- O chip Realtime nao mede latencia nem confirma recuperacao apos falhas de rede.
- O frontend confia no trigger para o total; sem o trigger, o total exibido fica desatualizado.
