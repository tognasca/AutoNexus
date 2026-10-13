# AutoNexus — Billing, Assinaturas, Mercado Pago, Resend e LGPD

## Variáveis de ambiente (produção) — preencher com valores reais
| Variável | Para quê |
|---|---|
| `MERCADOPAGO_ACCESS_TOKEN` | Access Token da conta Mercado Pago (produção) |
| `MERCADOPAGO_WEBHOOK_SECRET` | "Assinatura secreta" do webhook (painel Mercado Pago > Webhooks) |
| `RESEND_API_KEY` | API Key do Resend |
| `RESEND_FROM_EMAIL` | Remetente verificado no Resend (ex.: `nao-responder@seudominio.com.br`) |
| `RESEND_FROM_NAME` | Nome do remetente (padrão: AutoNexus) |
| `APPLICATION_URL` | URL pública do sistema, sem barra no final (ex.: `https://app.seudominio.com.br`) |

Nada disso fica no código. Sem `RESEND_*` o sistema NÃO quebra: apenas registra aviso e não envia e-mail.
Sem `MERCADOPAGO_*` o checkout retorna erro claro e o webhook é recusado por segurança.

## Webhook do Mercado Pago
Cadastre em *Suas integrações > Webhooks* a URL `https://SEU-DOMINIO/api/webhooks/mercadopago`
com os eventos **Pagamentos** e **Planos e assinaturas** (`subscription_preapproval`).
- Assinatura `x-signature` (HMAC-SHA256) validada com `MERCADOPAGO_WEBHOOK_SECRET`.
- Idempotente: índice único `(Provider, ExternalEventId)` + checagem de estado (um pagamento já aprovado não é aplicado duas vezes).
- O pagamento só é aprovado após consulta direta à API do Mercado Pago — nunca pelo corpo do webhook nem pelo frontend.

## Fluxo
Cadastro público (`/cadastro`, com aceite de Termos/Privacidade/Cookies versionados) → trial (7 dias, configurável por plano)
→ checkout (`Minha Assinatura`: Pix, cartão ou boleto) → webhook confirma → assinatura Active → e-mail.
Troca de plano (upgrade/downgrade) = novo checkout do novo plano; a assinatura recorrente anterior é cancelada no gateway antes (evita cobrança duplicada).

## Preços e limites
Ficam no banco (tabela `plans`), editáveis no Painel SuperAdmin > Planos > Editar — sem deploy.
Valores iniciais: Starter R$ 49,90/mês · R$ 499,00/ano; Profissional R$ 99,90 · R$ 999,00; Premium R$ 199,90 · R$ 1.999,00; trial 7 dias.
Limites (`MaxUsers`, `MaxVehicles`, `MaxStorageMb`) começam **ilimitados (vazio)**: defina no painel. Usuários e veículos já são verificados no backend.

## Migration (obrigatória)
```
dotnet ef migrations add BillingSaas --project src/AutoNexus.Infrastructure --startup-project src/AutoNexus.Api
dotnet ef database update --project src/AutoNexus.Infrastructure --startup-project src/AutoNexus.Api
```
Cria `payments`, `webhook_events`, `legal_documents`, `user_consents`, novas colunas em `plans` e `tenant_subscriptions`,
e atualiza o catálogo (Free→Starter, Basic→Profissional, Professional→Premium; Enterprise fica inativo).

## Decisões técnicas (sem regra comercial definida — ajuste se precisar)
- Acesso: Active/Trialing/PastDue liberados; Canceled até o fim do período pago; Expired/Suspended bloqueiam (HTTP 402) — dados preservados.
- Trial com cartão já cadastrado: tolerância de 3 dias após o fim do trial para a 1ª cobrança confirmar.
- Troca de plano sem pró-rata: o novo período soma ao já pago.
- Pix/Boleto não são recorrentes no gateway: renovação manual a cada período (cartão renova sozinho).
- Textos legais semeados são **rascunhos estruturais com [PLACEHOLDERS]** — precisam de revisão jurídica.
