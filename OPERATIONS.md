# Operacao e Suporte da Ferramenta Web

## Abertura diaria

1. Acesse a URL da Vercel.
2. Entre com a conta individual.
3. Confirme o nome exibido em **Validador**.
4. Confirme o indicador **Online**.
5. Use **Atualizar** se os cards nao aparecerem imediatamente.

## Tratamento de um atendimento

1. Abra o card mais antigo da coluna **Aguardando**.
2. Confirme que ele passou para `em_validacao`.
3. Revise paciente, prescricao, termos nao encontrados e exames.
4. Corrija exames pelo botao **Editar**, adicione pelo catalogo ou use **Adicionar novo exame** para um lancamento totalmente manual.
5. Desmarque **Incluido** para manter um exame registrado, mas fora do total.
6. Se um exame for coberto, use **Coberto por: SUS / Unimed** (ele zera e sai do total).
7. Se for dar desconto, digite a **%** no campo **Desconto manual** do "Resumo do orcamento".
8. Resolva os **termos pendentes** (busque no catalogo e clique no ✓ para tirar o aviso).
9. Confirme o total (e o "Total com desconto", se houver).
10. Valide ou rejeite. No dialogo de validar aparece o **Total com desconto** quando aplicado.

Depois de validar, acompanhe a mudanca para `enviado`. Se permanecer em `validado`, verifique o workflow `Resposta Validada` no n8n.

## Marcar como convertido

Quando o paciente comparece, coleta e paga, abra o card (que estara em **Validados / enviados**) e clique em **Marcar como convertido**. O botao so aparece depois que o orcamento foi **enviado**. A acao pede a **sua senha** (confirmacao). Confirmada, o card vai para a coluna **Convertido** e o **Rastreio** registra quem converteu e quando. Esses dados alimentam o futuro relatorio de comissao.

## Criacao de usuarios

Pre-requisitos:

- `kanban_usuarios_schema.sql` aplicado;
- `SUPABASE_SERVICE_ROLE_KEY` configurada na Vercel;
- e-mail do administrador presente em `USER_MANAGEMENT_ALLOWED_EMAILS`.

Fluxo:

1. abra `/usuarios`;
2. informe nome completo, e-mail e senha de pelo menos 8 caracteres;
3. crie o usuario;
4. teste o login em janela anonima;
5. confirme o nome do validador.

O status **inativo** da tela ainda nao revoga o login do Auth. Para desligamento imediato, desative/remova o usuario em Supabase Authentication.

## Publicacao

O deploy normal e automatico via GitHub:

```powershell
git add .
git commit -m "descricao objetiva"
git push
```

O push na branch `main` dispara a Vercel. Nao e necessario executar Vercel CLI para o fluxo normal.

Antes do push:

```powershell
npx tsc --noEmit
npm run build
```

## Diagnostico rapido

### Login invalido

- confirme se o usuario existe em Supabase Authentication;
- confirme e-mail e senha;
- verifique URL e anon key na Vercel;
- confirme RLS das tabelas usadas.

### Kanban vazio

- verifique se existem linhas em `atendimentos` com status ativo;
- confirme as politicas SELECT para `authenticated`;
- confira o console do navegador;
- teste a consulta no Supabase SQL Editor.

### Busca de exame nao retorna resultado

- confirme que `catalogo_exames` esta populada;
- confirme RLS SELECT para `authenticated`;
- teste `match_termos_exames(ARRAY['hemograma'])` no SQL Editor;
- verifique se `nome`, `sku` ou `sinonimos` contem o termo;
- confirme que o termo tem pelo menos 2 caracteres.

### Total nao muda

- confirme que o exame foi salvo;
- confirme `incluido = true` e `cobertura` vazio (exame coberto sai zerado);
- lembre que o **desconto manual** so altera o total exibido (`total_validado` segue cheio);
- verifique o trigger `recalc_total_validado()` (deve excluir `cobertura IS NOT NULL`) e se `add_desconto_cobertura.sql` foi aplicado;
- recarregue o atendimento.

### Validou, mas nao enviou

- confirme `N8N_RESPOSTA_VALIDADA_WEBHOOK_URL` na Vercel;
- abra os logs da Function `/api/resposta-validada`;
- confira as execucoes do workflow `Resposta Validada`;
- confirme as credenciais Z-API/n8n;
- verifique se o atendimento ficou `validado` ou mudou para `enviado`.

### Tela de usuarios diz que o ambiente nao esta configurado

Confirme na Vercel:

- `NEXT_PUBLIC_SUPABASE_URL`;
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`;
- `SUPABASE_SERVICE_ROLE_KEY`.

Depois de alterar envs, gere um novo deploy.

## Alteracoes de dados

| Acao | Onde grava |
|---|---|
| Editar paciente/prescricao | `atendimentos` |
| Editar exame do card | `atendimento_exames` |
| Adicionar exame pelo catalogo | `atendimento_exames` |
| Adicionar novo exame manual | `atendimento_exames` (`match_por = manual_livre`) |
| Desmarcar incluido | `atendimento_exames.incluido` |
| Marcar SUS/Unimed | `atendimento_exames.cobertura` (zera o exame no total) |
| Definir desconto manual | `atendimentos.desconto_pct` |
| Resolver termo pendente | `atendimentos.termos_nao_encontrados` (remove o termo) |
| Cancelar card | `atendimentos.status = cancelado` |
| Validar | `atendimentos.status`, `validado_por`, `validado_em` |
| Marcar convertido (com senha) | `atendimentos.status='convertido'`, `convertido_por`, `convertido_em` |
| Criar usuario | Supabase Auth + `kanban_usuarios` |

Nenhuma edicao comum do card altera `catalogo_exames`.

No cadastro manual, informe pelo menos o nome. Preco, prazo, jejum, SKU e preparo sao opcionais. O valor so participa do total quando o exame estiver marcado como **Incluido** e possuir preco.

## Checklist de release

- [ ] typecheck sem erro;
- [ ] build de producao concluido;
- [ ] login testado;
- [ ] Kanban carregando;
- [ ] busca do catalogo testada;
- [ ] edicao e total testados;
- [ ] validacao testada com telefone de homologacao;
- [ ] execucao do n8n confirmada;
- [ ] deploy da Vercel marcado como Ready;
- [ ] smoke test na URL de producao.

## Recuperacao

- Para erro de frontend, use o rollback de Deployment na Vercel.
- Para erro de dados, nao apague atendimentos; corrija status/linhas com auditoria.
- Para segredo exposto, rotacione a chave no provedor e atualize a Vercel/n8n.
- Antes de alteracoes de schema, exporte ou faça backup das tabelas operacionais.
