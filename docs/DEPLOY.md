# Deploy da Ferramenta Web

## Ambiente oficial

- Repositorio: `https://github.com/rogeriomagro/algoriza-laboratorio-web`
- Branch de producao: `main`
- Hospedagem: Vercel
- URL atualmente usada: `https://algoriza-laboratorio-web-mu.vercel.app`

O repositorio Git tem a aplicacao Next.js na propria raiz. Portanto, ao importar esse repositorio na Vercel, use **Root Directory `./`** e Framework Preset **Next.js**.

## Variaveis obrigatorias

Configure em Vercel > Project Settings > Environment Variables, para Production e Preview:

```env
NEXT_PUBLIC_SUPABASE_URL=https://seu-projeto.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=sua_anon_key
SUPABASE_SERVICE_ROLE_KEY=sua_service_role_key
USER_MANAGEMENT_ALLOWED_EMAILS=admin1@empresa.com,admin2@empresa.com
N8N_RESPOSTA_VALIDADA_WEBHOOK_URL=https://seu-n8n/webhook/resposta-validada
```

Regras:

- `SUPABASE_SERVICE_ROLE_KEY` nunca pode ser exposta no navegador ou receber prefixo `NEXT_PUBLIC_`.
- `USER_MANAGEMENT_ALLOWED_EMAILS` deve conter somente administradores autorizados a criar usuarios.
- Alterar variavel de ambiente exige novo deploy para a alteracao entrar em vigor.

## Publicacao normal

Depois que GitHub e Vercel estao conectados, nao e necessario usar a CLI da Vercel. Publique com:

```powershell
git add .
git commit -m "descreva a alteracao"
git push
```

O push na `main` inicia automaticamente um deploy de producao. Acompanhe em Vercel > Deployments.

## Validacao antes do push

```powershell
npx tsc --noEmit
npm run build
```

O aviso `vercel found in project dependencies and will be ignored` nao impede o deploy. A Vercel usa a propria CLI durante o build.

## Smoke test apos o deploy

1. Abrir `/login` e autenticar.
2. Confirmar que o Kanban carrega e o indicador fica online.
3. Abrir um card `aguardando_validacao` e confirmar a mudanca para `em_validacao`.
4. Pesquisar um exame por nome, SKU e sinonimo.
5. Editar um exame e verificar o total validado.
6. Validar um atendimento de teste e confirmar a execucao do webhook no n8n.
7. Abrir `/usuarios`, criar um usuario de teste e depois desativa-lo operacionalmente.

## Falhas comuns

### `No entrypoint found`

A Vercel foi configurada com preset ou Root Directory incorretos. Use Next.js e `./` para este repositorio.

### `Ambiente de gestao de usuarios nao configurado`

Falta `SUPABASE_SERVICE_ROLE_KEY` ou alguma variavel publica do Supabase. Corrija as variaveis e redeploy.

### Login funciona, mas consultas retornam vazio

Verifique RLS e policies das tabelas consultadas pelo cliente autenticado.

### Validacao muda o status, mas o cliente nao recebe

Verifique `N8N_RESPOSTA_VALIDADA_WEBHOOK_URL`, a execucao do endpoint `/api/resposta-validada` e o workflow `Resposta Validada` no n8n.

### O site continua antigo apos o push

Confirme que o commit chegou a `main`, que o deployment terminou com sucesso e que o dominio aponta para o deployment de producao. Depois force a recarga do navegador.
