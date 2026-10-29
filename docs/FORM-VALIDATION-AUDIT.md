# Auditoria de máscaras e validações de formulários — AutoNexus

Data da auditoria: 2026-10-28

## Objetivo
Padronizar máscaras de apresentação, validações de formulário e validação no backend. Máscara não substitui validação; validações no frontend também não substituem validações na API.

## Correções incluídas nesta entrega

- Utilitários compartilhados para máscara de telefone brasileiro, normalização de placa e validação dos dígitos verificadores de CPF/CNPJ.
- Contrato de venda/proposta: CPF/CNPJ validado, telefone mascarado e validado quando preenchido, placa de troca validada quando preenchida, valor de venda positivo e entrada não superior ao valor de venda.
- Portal do comprador: CPF/CNPJ validado antes do aceite eletrônico.
- Análise de crédito: exige CPF válido, data de nascimento no passado e renda mensal positiva.
- Cadastro público: exige nomes não vazios após trim, e-mail com formato básico válido, senha com pelo menos 8 caracteres, plano selecionado e aceite das políticas.
- API de veículos: rejeita tipo/marca/modelo ausentes, anos fora do intervalo, ano-modelo anterior ao ano de fabricação, quilometragem negativa, valores negativos e placa fora do formato antigo/Mercosul.

## Inventário estático — campos/telas que ainda precisam de revisão

| Área | Estado após esta entrega |
|---|---|
| Cadastro/edição de veículos | KM mascarado no frontend; API valida KM, anos, preço e placa |
| Valores monetários | Existe componente compartilhado `CurrencyInput`; confirmar cada formulário que ainda usa inputs numéricos diretos |
| CPF/CNPJ | Utilitário com validação de dígitos verificadores; aplicado no contrato, portal do comprador e análise de crédito |
| Telefone | Utilitário de máscara; aplicado ao telefone do contrato |
| Placa | Normalização e validação; aplicado à placa do veículo na troca do contrato e à API de veículos |
| Cadastro público/assinatura | Validações básicas de formulário no frontend; validação equivalente no endpoint de signup ainda precisa ser confirmada |
| Login, redefinição de senha e usuários | Revisar mensagens, limites e validação server-side |
| Assinatura/checkout e documento do pagador | Revisar CPF/CNPJ e validação de valores antes de enviar ao gateway |
| Simulador e análise financeira | A análise de crédito recebeu validações; revisar todos os inputs numéricos do simulador |
| Financeiras e SuperAdmin | Revisar taxas, preços, limites, campos obrigatórios e intervalos |
| Custos, FIPE e negociação de troca | Revisar datas, valores, anos, quilometragem e campos obrigatórios |
| Documentos e uploads | Revisar tamanho real, extensão/MIME, conteúdo permitido e mensagens de erro no servidor |
| API .NET em geral | Fazer revisão endpoint a endpoint de DTOs, regras de domínio e respostas HTTP; esta entrega só cobre validação de veículos |

## Critério de conclusão

Não declarar todos os campos validados até:
1. concluir a revisão de todos os formulários e endpoints;
2. adicionar testes automatizados para CPF/CNPJ, placa, datas, valores, KM e campos obrigatórios;
3. executar build/testes de frontend e backend;
4. testar os principais fluxos em ambiente de homologação.

## Observação
Esta auditoria é baseada em inspeção estática do código. Não substitui build, testes automatizados, teste manual de interface nem validação em produção. Não publicar diretamente sem CI e revisão da PR.
