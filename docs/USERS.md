# Gestao de usuarios

## Objetivo

A rota `/usuarios` cria acessos internos para o Kanban. Cada cadastro gera:

1. um usuario em Supabase Auth, com e-mail confirmado;
2. um perfil em `public.kanban_usuarios`;
3. o nome usado posteriormente como identificacao do validador.

## Pre-requisitos

- SQL `documentacao/build/kanban_usuarios_schema.sql` aplicado no Supabase;
- `SUPABASE_SERVICE_ROLE_KEY` configurada apenas no servidor/Vercel;
- e-mail do administrador presente em `USER_MANAGEMENT_ALLOWED_EMAILS`;
- usuario administrador autenticado no Kanban.

## Variaveis relacionadas

```env
NEXT_PUBLIC_SUPABASE_URL=https://seu-projeto.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=sua_anon_key
SUPABASE_SERVICE_ROLE_KEY=sua_service_role_key
USER_MANAGEMENT_ALLOWED_EMAILS=admin1@empresa.com,admin2@empresa.com
```

Se a allowlist ficar vazia, a implementacao atual permite que qualquer usuario autenticado use a API administrativa. Isso nao e adequado para producao.

## Criar usuario

1. Acessar `/usuarios` com uma conta administradora.
2. Informar nome completo, e-mail e senha com pelo menos 8 caracteres.
3. Clicar em **Criar usuario**.
4. Confirmar que o registro aparece na lista.
5. Testar o login em uma janela anonima.

O endpoint `POST /api/users` cria primeiro o usuario no Auth. Se a insercao em `kanban_usuarios` falhar, ele tenta excluir o usuario recem-criado do Auth para evitar cadastro parcial.

## Nome do validador

O nome exibido e gravado como validador segue esta prioridade:

1. `user_metadata.full_name`;
2. `user_metadata.name`;
3. parte do e-mail antes de `@`.

Por isso, o nome preenchido no cadastro deve ser o nome profissional que aparecera na auditoria.

## Ativar e desativar

O endpoint `PATCH /api/users` altera `kanban_usuarios.ativo`.

Limitacao atual: desativar o perfil operacional **nao bloqueia automaticamente a sessao ou o login no Supabase Auth**. Para desligamento completo, tambem remova ou bloqueie o usuario em Supabase > Authentication > Users. Essa integracao deve ser endurecida antes de tratar o botao como revogacao definitiva.

## Permissoes

- A interface exige sessao autenticada.
- A API administrativa valida o token Bearer do usuario.
- Somente e-mails da allowlist devem criar ou alterar usuarios.
- A service role e usada apenas nas rotas server-side.

## Diagnostico

### `Ambiente de gestao de usuarios nao configurado`

Confirme as tres variaveis do Supabase e faça novo deploy.

### `Usuario sem permissao para gerenciar acessos`

Inclua o e-mail autenticado em `USER_MANAGEMENT_ALLOWED_EMAILS`, sem espacos indevidos, e redeploy.

### Usuario criado no Auth, mas nao aparece na lista

Verifique a tabela `kanban_usuarios`, seus grants e a policy para `service_role`. Consulte tambem os logs da Function na Vercel.

## Auditoria minima recomendada

Para cada alteracao de acesso, registre:

- quem solicitou;
- quem executou;
- data e hora;
- usuario afetado;
- motivo da ativacao ou desativacao.
