# Integração Banco BV — condições de financiamento

## Escopo implementado

O AutoNexus possui uma primeira integração técnica com a operação documentada **BV Condição Financiamento Parceiro**:

- Método: `POST`
- Endpoint Sandbox confirmado na documentação BV Open:
  `https://apige-uat-sbx.bancobv.com.br/partner-funding/v1/financing-conditions`
- Caminho: `/partner-funding/v1/financing-conditions`
- Autorização: `Authorization: Bearer {token}`
- Conteúdo: JSON
- Operação: consulta parâmetros/tabelas, taxas de retorno e prazos de financiamento.

Esta operação **não envia proposta de crédito**, não consulta aprovação individual e não formaliza contratação.

## Configuração segura

Não coloque tokens, client secrets ou códigos de parceiro no Git, no frontend ou em valores padrão do banco de dados.

Configurar no ambiente do servidor:

- `BV_OPEN_ACCESS_TOKEN`: token Bearer emitido/habilitado pelo BV para o ambiente de Sandbox.
- `BV_OPEN_COMMERCIAL_PARTNER_CODE`: código comercial do parceiro fornecido pelo BV.
- `BV_OPEN_FINANCING_CONDITIONS_ENDPOINT`: opcional; por padrão usa o endpoint Sandbox documentado acima.

A API mapeia essas variáveis para `BvOpen:AccessToken`, `BvOpen:CommercialPartnerCode` e `BvOpen:FinancingConditionsEndpoint`.

A documentação pública consultada informa Bearer token, mas não expõe de forma suficiente o fluxo completo de emissão/renovação OAuth nem o host de produção. Portanto, o AutoNexus não inventa URL de token ou endpoint de produção. Esses dados precisam ser fornecidos/confirmados pelo BV após o cadastro e habilitação do parceiro.

## Endpoint interno AutoNexus

`POST /api/credit/bv/financing-conditions`

Requer autenticação JWT do AutoNexus.

Exemplo de corpo:

```json
{
  "financingTableCode": "BVIST",
  "zeroVehicle": false,
  "personType": "F",
  "vehicleBrandDescription": "HONDA",
  "vehicleCategoryDescription": "AUTOMOVEL",
  "cylinderQuantity": 185,
  "fullVehicleModelVersionDescription": "MODELO VERSAO",
  "financingEntryDate": "2026-10-29",
  "vehicleSubCategoryDescription": "AUTOMOVEL",
  "vehicleModelYear": "2020"
}
```

O código do parceiro é injetado exclusivamente pelo backend a partir da configuração protegida do servidor; o navegador não pode escolher outro código.

## Bloqueios antes de produção

1. Cadastrar a empresa no portal BV Open e solicitar habilitação do produto de financiamento para parceiros.
2. Obter credenciais e token válidos de Sandbox, além do código comercial do parceiro.
3. Confirmar com o BV o fluxo OAuth de emissão/renovação do token e os endpoints oficiais de UAT e produção.
4. Executar testes de contrato com dados de homologação fornecidos pelo BV.
5. Só configurar endpoint de produção após contrato de parceria, credenciais e homologação formal.

## Referências oficiais

- Portal de APIs: https://developers-sandbox.bvopen.com.br/index.php/apis?page=0
- Documentação Condição Financiamento Parceiro: https://developers-sandbox.bvopen.com.br/index.php/taxonomy/term/20?page=0
- Ajuda e cadastro BV Open: https://developers-sandbox.bvopen.com.br/index.php/ajuda
