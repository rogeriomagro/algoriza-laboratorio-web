# Ferramenta Web - Validacao de Orcamentos

MVP interno em Next.js para revisar atendimentos criados pelo bot, corrigir exames e validar o orcamento antes do envio ao cliente.

## Variaveis de ambiente

Crie `.env.local` a partir de `.env.example`:

```env
NEXT_PUBLIC_SUPABASE_URL=https://huxfekflbeuynbkktyny.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=sua_anon_key
SUPABASE_SERVICE_ROLE_KEY=sua_service_role_key
USER_MANAGEMENT_ALLOWED_EMAILS=rogeriosimiqueli@gmail.com
N8N_RESPOSTA_VALIDADA_WEBHOOK_URL=https://n8n-cliente1-3.algoriza.cloud/webhook/resposta-validada
```

Nunca use `service_role` no front.
Ela deve existir apenas no servidor (API routes / Vercel).

## Rodar localmente

```bash
npm install
npm run dev
```

Abra [http://localhost:3000](http://localhost:3000).

## Rotas

- `/login`: login via Supabase Auth.
- `/`: Kanban por status.
- `/atendimentos/[id]`: card de validacao.
- `/usuarios`: criacao e listagem de usuarios internos.
- `/sugestoes-base`: placeholder visual da frente em desenvolvimento.

## Regras implementadas

- Abrir atendimento `aguardando_validacao` muda para `em_validacao`.
- Status `validado`, `enviado` e `rejeitado` abrem em somente leitura.
- Exames sao editados em `atendimento_exames` com `editado_manual = true`.
- Remover exame seta `incluido = false`.
- Total oficial e apenas lido de `atendimentos.total_validado`.
- Validar exige confirmacao e grava `status = validado`, `validado_por` e `validado_em`.
- Rejeitar exige confirmacao e grava `status = rejeitado`.
- Kanban e detalhe usam Supabase Realtime.
- O nome do validador vem do usuario autenticado no Supabase Auth.

## Nome do validador

O sistema nao usa mais um nome digitado manualmente no navegador.

O nome exibido em `Validador atual` e o nome salvo em `validado_por` vem do usuario autenticado, nesta ordem:

1. `user_metadata.full_name`
2. `user_metadata.name`
3. parte anterior ao `@` do e-mail, como fallback tecnico

## Gestao de usuarios

O ambiente `/usuarios` cria usuarios internos com os campos:

- nome
- email
- senha
- status ativo/inativo

Fluxo tecnico:

1. a senha e criada no Supabase Auth
2. o perfil operacional e salvo na tabela `public.kanban_usuarios`
3. o nome do usuario passa a alimentar automaticamente o campo `Validador atual`
4. usuarios podem ser inativados sem apagar os dados

Antes de usar essa tela, aplique no Supabase:

- `documentacao/build/kanban_usuarios_schema.sql`

E configure no ambiente local / Vercel:

- `SUPABASE_SERVICE_ROLE_KEY`
- `USER_MANAGEMENT_ALLOWED_EMAILS`

`USER_MANAGEMENT_ALLOWED_EMAILS` define quais e-mails podem abrir e usar a tela de criacao.
Quando um usuario nao estiver nessa allowlist, a rota continua protegida e a tela exibe acesso restrito.

## Processo de criacao de usuarios

Documento operacional:

- [documentacao/PROTOCOLO-USUARIOS-KANBAN.md](C:\Users\roger\OneDrive\Área%20de%20Trabalho\Claude%20Code\Laboratorio\documentacao\PROTOCOLO-USUARIOS-KANBAN.md)

## Deploy

Deploy na Vercel:

- root directory: `Ferramenta Web`
- framework: `Next.js`
- variaveis obrigatorias:
  - `NEXT_PUBLIC_SUPABASE_URL`
  - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
  - `N8N_RESPOSTA_VALIDADA_WEBHOOK_URL`

Documento completo:

- `documentacao/DEPLOY-VERCEL.md`
