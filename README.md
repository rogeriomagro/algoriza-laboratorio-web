# Ferramenta Web — Validação de Orçamentos

MVP interno em Next.js para revisar atendimentos criados pelo bot, corrigir exames e validar o orçamento antes do envio ao cliente.

## Variáveis de ambiente

Crie `.env.local` a partir de `.env.example`:

```env
NEXT_PUBLIC_SUPABASE_URL=https://huxfekflbeuynbkktyny.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=sua_anon_key
```

Nunca use `service_role` no front.

## Rodar localmente

```bash
npm install
npm run dev
```

Abra `http://localhost:3000`.

## Rotas

- `/login`: login via Supabase Auth.
- `/`: Kanban por status.
- `/atendimentos/[id]`: card de validação.

## Regras implementadas

- Abrir atendimento `aguardando_validacao` muda para `em_validacao`.
- Status `validado`, `enviado` e `rejeitado` abrem em somente leitura.
- Exames são editados em `atendimento_exames` com `editado_manual = true`.
- Remover exame seta `incluido = false`.
- Total oficial é apenas lido de `atendimentos.total_validado`.
- Validar exige confirmação e grava `status = validado`, `validado_por` e `validado_em`.
- Rejeitar exige confirmação e grava `status = rejeitado`.
- Kanban e detalhe usam Supabase Realtime.

## Deploy

Deploy na Vercel:

- root directory: `Ferramenta Web`
- framework: `Next.js`
- variáveis obrigatórias:
  - `NEXT_PUBLIC_SUPABASE_URL`
  - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
  - `N8N_RESPOSTA_VALIDADA_WEBHOOK_URL`

Documento completo:

- `documentacao/DEPLOY-VERCEL.md`
