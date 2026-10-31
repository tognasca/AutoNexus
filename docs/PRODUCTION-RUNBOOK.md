# AutoNexus — Runbook de Produção

Este documento fecha a preparação operacional sem colocar segredos no repositório.

## 1. Pré-requisitos

- Docker Engine + Docker Compose.
- Domínio HTTPS apontando para o servidor/reverse proxy ou Cloudflare Tunnel.
- Conta Mercado Pago de produção com webhook configurado.
- Conta Resend com domínio/remetente verificado.
- PostgreSQL persistente.
- Termos de Uso, Política de Privacidade e Política de Cookies revisados e publicados com os dados reais da empresa.

## 2. Configuração

Copie `.env.example` para `.env` e preencha os valores reais.

Obrigatórios para liberar o diagnóstico de produção:

- `POSTGRES_PASSWORD`
- `JWT_SECRET_KEY`
- `APPLICATION_URL` com HTTPS
- `MERCADOPAGO_ACCESS_TOKEN`
- `MERCADOPAGO_WEBHOOK_SECRET`
- `RESEND_API_KEY`
- `RESEND_FROM_EMAIL`

O BV permanece opcional até homologação. O envio externo de crédito permanece `false` até haver uma financeira homologada.

## 3. Banco

Em ambiente novo, o container da API executa o seed inicial. Para mudanças de schema, aplique as migrations versionadas antes de abrir o sistema ao público.

Nunca substitua um banco de produção por `autonexus-backup.sql` sem validar o backup e o plano de restauração.

## 4. Subida

```bash
docker compose up -d --build
```

Verifique:

```bash
docker compose ps
curl https://SEU-DOMINIO/health
```

A rota `/health` é o liveness básico. O diagnóstico completo fica no Painel SuperAdmin em `?view=production-readiness` e não expõe segredos.

## 5. Mercado Pago

Webhook:

`https://SEU-DOMINIO/api/webhooks/mercadopago`

Eventos necessários:

- Pagamentos
- Planos e assinaturas (`subscription_preapproval`)

O webhook deve usar o segredo configurado em `MERCADOPAGO_WEBHOOK_SECRET`.

## 6. Primeiro acesso

Em banco novo, use credenciais fortes em:

- `AUTONEXUS_INITIAL_ADMIN_EMAIL`
- `AUTONEXUS_INITIAL_ADMIN_PASSWORD`
- `AUTONEXUS_SUPERADMIN_EMAIL`
- `AUTONEXUS_SUPERADMIN_PASSWORD`

Depois do bootstrap, remova os secrets de bootstrap do ambiente se não forem mais necessários e use o fluxo normal de gestão de usuários.

Nunca exponha as credenciais históricas de desenvolvimento.

## 7. Antes de abrir vendas

O painel de preparação para produção deve ser revisado. Itens bloqueantes precisam estar verdes, especialmente:

- banco acessível;
- JWT forte;
- URL HTTPS;
- Mercado Pago;
- e-mail transacional;
- documentos legais finais.

A tela não armazena tokens, senhas ou chaves. Esses valores permanecem no ambiente/secret manager.

## 8. Operação e recuperação

- Faça backup do PostgreSQL antes de migrations relevantes.
- Mantenha o volume de uploads persistente.
- Monitore `/health`, logs da API, erros 5xx e webhooks do Mercado Pago.
- Em caso de falha do webhook, use o mecanismo idempotente/reprocessável existente; não aplique pagamentos manualmente no banco.
- Nunca marque uma assinatura como paga diretamente no banco para contornar o gateway.

## 9. Financiamento

O AutoNexus deve iniciar em modo simulação/cadastro. Não habilite `AUTONEXUS_ENABLE_EXTERNAL_CREDIT_SUBMISSION=true` antes da homologação real da instituição financeira.

## 10. Critério de go-live

O sistema está tecnicamente preparado quando CI estiver verde e todos os itens bloqueantes do diagnóstico estiverem verdes no ambiente real. A publicação dos documentos legais finais é uma dependência empresarial/jurídica e não deve ser mascarada por código.
