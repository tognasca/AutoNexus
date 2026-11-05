# Configurações de produção — Resend e BV

As configurações globais das integrações Resend e BV Open são administradas pelo perfil **SuperAdmin** em **Prontidão para Produção**.

## Persistência e segurança

- A API Key do Resend é armazenada criptografada com AES-GCM.
- O Access Token e o código comercial do parceiro BV são armazenados criptografados com AES-GCM.
- E-mail/nome remetente e endpoint HTTPS BV são persistidos como configurações não secretas.
- A API nunca devolve os valores secretos. A tela apresenta apenas uma máscara.
- Para trocar um segredo, informe o novo valor. Para manter o valor atual, deixe o campo secreto vazio.
- As credenciais salvas no banco prevalecem sobre as variáveis legadas no próximo startup.
- Alterações salvas pelo SuperAdmin são aplicadas imediatamente no processo atual, sem reiniciar a API.

## Segredos que continuam na infraestrutura

A connection string PostgreSQL, a chave JWT e a chave usada para derivar a proteção criptográfica permanecem no gerenciador de secrets do host. Não devem ser gravadas no banco, em `appsettings.json` ou no Git.

A proteção atual deriva a chave criptográfica de `Jwt:SecretKey`, seguindo o mesmo mecanismo já usado pela configuração do Mercado Pago. Portanto, preserve a chave JWT entre deploys e backups; se houver rotação, cadastre novamente as credenciais criptografadas.

## Resend

Use uma API Key do Resend e um endereço remetente de domínio verificado. A autorização HTTP é montada em cada envio para que a rotação da API Key passe a valer no envio seguinte.

## BV Open

A integração implementada consulta condições/tabelas de financiamento. Não submete propostas de crédito nem confirma aprovação. Configure somente o endpoint HTTPS e as credenciais efetivamente fornecidas pelo BV após habilitação/homologação. O envio externo de propostas permanece desabilitado.

## Migration

A migration `20261105160000_AddPlatformIntegrationConfiguration` cria a tabela global `platform_integration_configurations`. Ela é aplicada pelo fluxo normal de migrations da API.
