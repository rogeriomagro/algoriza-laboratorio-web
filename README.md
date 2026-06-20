# Ferramenta Web - Validacao de Orcamentos

Aplicacao interna em Next.js para a equipe dos Laboratorios Nossa Senhora da Penha e Alfa Diagnostico revisar, corrigir e validar os atendimentos preparados pelo chatbot.

> Estado documentado: 19/06/2026. Este README descreve o codigo atual da pasta `Ferramenta Web`.

## O que a aplicacao faz

- autentica a equipe com Supabase Auth;
- exibe os atendimentos em um Kanban operacional;
- reserva um atendimento para revisao ao abrir o card;
- permite editar os dados do paciente e da prescricao;
- permite incluir, excluir do total e corrigir exames individualmente;
- pesquisa exames por nome, SKU e sinonimos no `catalogo_exames`;
- aplica **desconto manual (%)** por atendimento e recalcula o total exibido;
- define a **validade do orcamento** (dias, padrao 30, editavel) usada no PDF;
- marca exames como cobertos por **SUS/Unimed** (zera o exame no orcamento);
- recalcula o total validado no banco (excluindo exames cobertos);
- filtra o quadro por texto, por **validador** e por **laboratorio**;
- exibe a **tag/logo do laboratorio** no card (Iuna = Alfa; demais = N. S. da Penha);
- permite marcar um **termo nao encontrado como resolvido** (some o aviso);
- permite marcar um orcamento ja enviado como **Convertido** (coluna propria), exigindo a **senha do operador**;
- registra o nome do usuario autenticado como validador;
- chama o webhook do n8n quando o atendimento e validado;
- mantem atendimentos cancelados no banco, mas fora do quadro ativo;
- tem uma aba **Calendario** (`/calendario`) ainda **somente visual** (estado local, sem banco/agente).

## Stack

- Next.js 14 (App Router)
- React 18 + TypeScript
- Tailwind CSS
- Supabase Auth, Postgres e Realtime
- n8n para a entrega do orcamento validado ao cliente
- Vercel para hospedagem

## Rotas

| Rota | Uso |
|---|---|
| `/login` | Login da equipe pelo Supabase Auth |
| `/` | Kanban de atendimentos (com filtros de validador e laboratorio) |
| `/atendimentos/[id]` | Revisao e validacao de um atendimento |
| `/calendario` | Calendario de coletas — **somente front-end** (estado local, sem persistencia) |
| `/usuarios` | Criacao, listagem e ativacao operacional de usuarios |
| `/sugestoes-base` | Placeholder da futura curadoria do catalogo; acesso desabilitado no menu |
| `/api/users` | API server-side de gestao de usuarios |
| `/api/resposta-validada` | Ponte server-side entre o Kanban e o webhook do n8n |

## Fluxo principal

```text
n8n salva atendimento
  -> aguardando_validacao
  -> operador abre o card
  -> em_validacao
  -> equipe corrige dados e exames
  -> equipe valida
  -> validado
  -> /api/resposta-validada chama o n8n
  -> n8n envia o PDF/mensagem
  -> enviado
```

`validado` e `enviado` aparecem juntos na coluna visual **Validados / enviados**. Eles continuam sendo estados diferentes no banco para manter o rastreio tecnico.

## Regras importantes

- Abrir um card `aguardando_validacao` tenta muda-lo atomicamente para `em_validacao`.
- Cards `validado`, `enviado`, `rejeitado` e `cancelado` sao somente leitura.
- Cancelar um card muda o status para `cancelado`; os dados nao sao apagados.
- A coluna `Aguardando` e ordenada do atendimento mais antigo para o mais novo.
- O total oficial vem de `atendimentos.total_validado`.
- Alteracoes nos exames sao gravadas em `atendimento_exames`, nunca no catalogo mestre.
- O trigger `recalc_total_validado()` recalcula o total usando exames com `incluido = true` **e `cobertura IS NULL`** (exames cobertos por SUS/Unimed saem zerados).
- O **desconto manual** (`atendimentos.desconto_pct`) NAO entra em `total_validado`; o total final exibido/PDF = `total_validado * (1 - desconto_pct/100)`.
- O desconto vem com **20% por padrao**: quando o valor salvo e 0, a tela (card, dialogo de validar e total do quadro) **exibe/aplica 20%** — sem precisar de SQL e coerente com o PDF, que ja aplicava 20% a vista. O operador pode trocar por outro valor.
- No PDF, quando ha desconto especial ele **substitui** os 20% a vista (nao soma); sem desconto, segue os 20% normais.
- Validar exige telefone e pelo menos um exame incluido.

## Edicao de exames

Cada exame abre em modo de leitura. O botao **Editar** libera:

- nome;
- SKU;
- preco;
- prazo em dias;
- jejum em horas;
- preparo.

Ao editar o nome, a interface consulta `match_termos_exames` e `catalogo_exames`. Selecionar um resultado preenche os dados oficiais do catalogo. O botao **Salvar** persiste a copia corrigida somente em `atendimento_exames` e marca `editado_manual = true`.

O checkbox **Incluido** controla se o exame participa do total sem apagar a linha.

O botao **Adicionar novo exame**, exibido no fim da lista, abre um card totalmente vazio. Esse cadastro e livre: nao consulta nem preenche dados do `catalogo_exames`. Ao salvar, cria uma linha em `atendimento_exames` com `match_por = manual_livre` e `editado_manual = true`. Se estiver incluido e possuir preco, o trigger do banco incorpora o valor ao total validado.

## Variaveis de ambiente

Crie `.env.local` a partir de `.env.example`:

```env
NEXT_PUBLIC_SUPABASE_URL=https://seu-projeto.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=sua_anon_key
SUPABASE_SERVICE_ROLE_KEY=sua_service_role_key
USER_MANAGEMENT_ALLOWED_EMAILS=admin@empresa.com
N8N_RESPOSTA_VALIDADA_WEBHOOK_URL=https://seu-n8n/webhook/resposta-validada
```

### Seguranca

- `NEXT_PUBLIC_*` pode chegar ao navegador e depende de RLS correto.
- `SUPABASE_SERVICE_ROLE_KEY` e secreta e deve existir somente no servidor/Vercel.
- Nunca prefixe a service role com `NEXT_PUBLIC_`.
- Em producao, configure `USER_MANAGEMENT_ALLOWED_EMAILS`. Se ela ficar vazia, qualquer usuario autenticado pode usar a API administrativa atual.

## Banco necessario

Tabelas usadas diretamente:

- `atendimentos`
- `atendimento_exames`
- `catalogo_exames`
- `kanban_usuarios`

Funcao e trigger usados:

- `match_termos_exames(termos text[])`
- `recalc_total_validado()`

SQLs principais:

- `../documentacao/build/atendimentos_schema.sql`
- `../documentacao/build/salvar_atendimento.sql`
- `../documentacao/build/kanban_usuarios_schema.sql`
- `../documentacao/build/add_desconto_cobertura.sql` (colunas `atendimentos.desconto_pct` e `atendimento_exames.cobertura` + trigger que exclui cobertos)

> A web le `kanban_usuarios` (SELECT autenticado) para listar os usuarios no filtro **Validado por**.

## Rodar localmente

```powershell
cd "C:\Users\roger\OneDrive\Area de Trabalho\Claude Code\Laboratorio\Ferramenta Web"
npm install
npm run dev
```

Abra `http://localhost:3000`.

Validacao antes de publicar:

```powershell
npx tsc --noEmit
npm run build
```

## Deploy

O repositorio Git publicado e:

- `https://github.com/rogeriomagro/algoriza-laboratorio-web`

Como esse repositorio ja tem a aplicacao na raiz, na Vercel use:

- Framework Preset: `Next.js`
- Root Directory: `./`
- Branch de producao: `main`

Depois da integracao GitHub/Vercel, cada `git push` na `main` cria um novo deploy automaticamente.

Guia completo: [`docs/DEPLOY.md`](docs/DEPLOY.md).

## Documentacao tecnica

- [`ARCHITECTURE.md`](ARCHITECTURE.md): componentes, dados e fluxos internos.
- [`OPERATIONS.md`](OPERATIONS.md): operacao, usuarios, incidentes e checklist.
- [`docs/DEPLOY.md`](docs/DEPLOY.md): publicacao e operacao na Vercel.
- [`docs/USERS.md`](docs/USERS.md): cadastro, permissao e manutencao de acessos.
- [`docs/BASE-SUGGESTIONS.md`](docs/BASE-SUGGESTIONS.md): especificacao da funcionalidade futura.

`Plano Tecnico.pdf` e `system prompt.txt` sao referencias historicas de construcao. Em caso de divergencia, o codigo, este README e `ARCHITECTURE.md` representam o estado atual.
