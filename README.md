# Sistema de Compra, Venda e Troca de Veículos

Sistema web profissional para **compra, venda, troca, gestão e análise financeira de veículos**, desenvolvido com arquitetura preparada para utilização em **desktop, tablet e smartphone**, com experiência de aplicativo através de **PWA (Progressive Web App)**.

---

## 1. Visão Geral

O sistema tem como objetivo centralizar toda a operação de veículos em uma única plataforma.

O sistema deverá permitir:

* Cadastro de veículos;
* Controle de estoque;
* Fotos;
* Documentos;
* Custos;
* Consulta e histórico FIPE;
* Compras;
* Vendas;
* Trocas;
* Análise financeira de negociações;
* Controle de usuários e permissões;
* Portal do comprador;
* Compartilhamento seguro de documentos;
* Download individual ou em ZIP;
* Aceite eletrônico de recebimento;
* Utilização em desktop e smartphone;
* Instalação como aplicativo através de PWA.

A aplicação deve possuir uma arquitetura modular, segura, testável e preparada para evolução.

---

# 2. Plataforma

O sistema será desenvolvido como uma:

**Aplicação Web + Progressive Web App (PWA).**

A mesma aplicação deverá funcionar em:

* Desktop;
* Notebook;
* Tablet;
* Android;
* iPhone.

Não será necessário publicar inicialmente o sistema em:

* Apple App Store;
* Google Play Store.

O usuário poderá acessar o sistema pelo navegador e, em dispositivos compatíveis, adicioná-lo à tela inicial para utilizá-lo com experiência semelhante à de um aplicativo instalado.

---

# 3. PWA — Progressive Web App

A aplicação deverá implementar os recursos necessários para funcionamento como PWA.

## Requisitos

* Web App Manifest;
* Nome da aplicação;
* Nome curto;
* Ícones;
* Tema;
* Splash/startup quando suportado;
* `display: standalone`;
* viewport adequado;
* Service Worker;
* estratégia de cache;
* HTTPS em produção.

## Experiência esperada

Fluxo:

```text
Usuário acessa o sistema
        ↓
Utiliza pelo navegador
        ↓
Instala na tela inicial
        ↓
Abre como aplicativo
        ↓
Utiliza a mesma aplicação
```

Não criar aplicativos nativos separados para Android e iOS nesta primeira versão.

---

# 4. Experiência Mobile

A aplicação deve ser **mobile-first**.

A interface mobile não deve ser simplesmente uma versão reduzida da interface desktop.

Deve considerar:

* toque;
* telas pequenas;
* navegação vertical;
* botões apropriados para toque;
* menus mobile;
* cards responsivos;
* formulários adaptados;
* câmera;
* galeria;
* upload múltiplo;
* documentos;
* download;
* compartilhamento.

---

# 5. Veículos

O sistema deverá permitir cadastrar diferentes tipos de veículos.

Tipos iniciais:

* Carro;
* Moto;
* Caminhão;
* Jetski;
* Outros.

A estrutura deve permitir adicionar novos tipos futuramente.

## Dados do veículo

* Tipo;
* Marca;
* Modelo;
* Versão;
* Ano de fabricação;
* Ano modelo;
* Placa;
* Chassi;
* Quilometragem;
* Cor;
* Combustível;
* Câmbio;
* Status;
* Valor de compra;
* Valor anunciado;
* Valor de venda;
* Observações.

## Status

Inicialmente:

* `À venda`;
* `Em troca`;
* `Vendido`.

A arquitetura deve permitir novos status futuramente.

---

# 6. Fotos

Cada veículo poderá possuir múltiplas fotos.

## Funcionalidades

* Upload múltiplo;
* Galeria;
* Câmera do smartphone;
* Seleção de arquivos;
* Visualização;
* Ordenação;
* Definição de foto principal;
* Exclusão.

## Smartphone

Deve permitir:

```text
Câmera
   ↓
Capturar foto
   ↓
Visualizar
   ↓
Confirmar
   ↓
Enviar
```

Também deve permitir selecionar imagens existentes na galeria.

A implementação deve utilizar APIs Web padronizadas e possuir fallback quando determinado recurso não estiver disponível.

---

# 7. Documentos

Cada veículo poderá possuir múltiplos documentos.

## Formatos

* JPG;
* JPEG;
* PDF.

## Exemplos

* Laudo;
* Documento do veículo;
* Transferência;
* Documento de leilão;
* Recibos;
* Comprovantes;
* Outros.

## Dados

Cada documento deverá possuir:

* Veículo;
* Categoria;
* Nome;
* Arquivo;
* Data de inclusão;
* Usuário responsável;
* Observação.

As categorias devem permitir expansão futura.

---

# 8. Custos

Todos os custos relacionados ao veículo deverão ser registrados.

## Exemplos

* Compra;
* Manutenção;
* Reparo;
* Peças;
* Pintura;
* Funilaria;
* Documentação;
* Taxas;
* Transporte;
* Outros.

## Dados

Cada custo deverá possuir:

* Categoria;
* Descrição;
* Valor;
* Data;
* Usuário responsável;
* Observação.

## Cálculo

```text
Custo Total =
Valor de Aquisição
+
Todos os Custos Registrados
```

O custo total será utilizado na análise de margem e negociações.

---

# 9. FIPE

O sistema deverá permitir consultar o valor FIPE do veículo.

## Funcionalidades

* Consulta FIPE;
* Botão `Atualizar valor FIPE`;
* Armazenamento do resultado;
* Data da consulta;
* Histórico;
* Visualização mês a mês.

## Histórico

Uma nova consulta não deve sobrescrever consultas anteriores.

Exemplo:

```text
Janeiro/2026 → R$ XX.XXX
Fevereiro/2026 → R$ XX.XXX
Março/2026 → R$ XX.XXX
Abril/2026 → R$ XX.XXX
```

## Integração

Não inventar API FIPE.

Antes da implementação deverá ser definida:

* Fonte;
* API;
* Autenticação;
* Limites;
* Estrutura dos dados;
* Política de atualização;
* Tratamento de indisponibilidade.

---

# 10. Compra

O sistema deverá registrar a aquisição do veículo.

A operação deverá permitir manter histórico de:

* Veículo;
* Vendedor/origem;
* Data;
* Valor de aquisição;
* Custos associados;
* Documentação;
* Usuário responsável;
* Observações.

O valor de aquisição deverá integrar o cálculo de custo total.

---

# 11. Venda

O sistema deverá registrar a venda do veículo.

Informações esperadas:

* Veículo;
* Comprador;
* Valor de venda;
* Data;
* Usuário responsável;
* Forma de negociação;
* Observações.

Após a conclusão da venda, o status do veículo deverá ser atualizado para:

`Vendido`

A transição de status deverá ser controlada pela regra de negócio.

---

# 12. Trocas

Uma operação de troca deverá registrar os dois lados da negociação.

## Veículo entregue

Registrar:

* Veículo;
* FIPE;
* Valor considerado na negociação;
* Custos relacionados.

## Veículo recebido

Registrar:

* Veículo;
* FIPE;
* Valor considerado na negociação;
* Custos estimados/reais.

## Diferença financeira

Registrar:

* Valor da diferença;
* Quem pagou;
* Data;
* Observações.

A operação deverá possuir histórico completo e auditável.

---

# 13. Avaliação da Troca

A avaliação deverá ser **transparente e explicável**.

Regra fornecida:

```text
Valor do veículo recebido (FIPE)
-
Custo estimado de revenda

VS

Valor do veículo entregue (FIPE)
+
Diferença paga
```

O sistema deverá comparar os dois resultados.

## Resultado

A negociação deverá possuir um indicador:

* 🟢 Troca vantajosa;
* 🟡 Troca neutra;
* 🔴 Troca desfavorável.

### Importante

A fórmula deverá ser implementada exatamente conforme a regra de negócio definida.

Não criar:

* Score de IA;
* Fórmula oculta;
* Peso arbitrário;
* Algoritmo subjetivo.

O cálculo deverá ser demonstrado ao usuário.

---

# 14. Transparência do Cálculo

O card da troca deverá apresentar:

```text
FIPE veículo recebido
- Custo estimado de revenda
= Resultado veículo recebido


FIPE veículo entregue
+ Diferença paga
= Resultado veículo entregue
```

Depois:

```text
Resultado da comparação
        ↓
Indicador
```

O usuário deverá conseguir entender exatamente por que a troca foi classificada daquela forma.

---

# 15. Limites do Indicador

Os critérios exatos para:

* Verde;
* Amarelo;
* Vermelho;

ainda deverão ser definidos como **regra de negócio**.

Não inventar percentuais ou valores de tolerância.

Até que sejam definidos, registrar esse item como:

> REQUISITO PENDENTE — definir limites de classificação da troca.

---

# 16. Usuários

Perfis iniciais:

## ADMIN

Acesso total ao sistema.

## VENDEDOR

Acesso às funcionalidades necessárias para operação comercial, conforme permissões definidas.

## CLIENTE

Acesso limitado às informações disponibilizadas para ele.

---

# 17. Autorização

As permissões devem ser aplicadas no backend.

Não utilizar apenas:

```text
Ocultar botão na interface
```

como mecanismo de segurança.

O backend deverá validar:

* usuário;
* perfil;
* permissão;
* recurso;
* operação.

---

# 18. Portal do Comprador

Após uma venda, deverá existir uma área específica para o comprador.

O comprador poderá acessar os dados disponibilizados referentes ao veículo adquirido.

## Recursos

* Fotos;
* Documentos;
* Laudo;
* Histórico disponibilizado;
* Download individual;
* Download de todos os arquivos;
* Aceite de recebimento.

---

# 19. Acesso do Comprador

O sistema deverá suportar duas estratégias.

## Opção A — Link temporário

O vendedor gera um link exclusivo para o comprador.

O link deverá possuir:

* Identificador seguro;
* Expiração;
* Revogação;
* Controle de acesso.

## Opção B — Login

O comprador acessa através de autenticação.

A arquitetura deverá permitir suportar ambas as estratégias sem duplicação das regras de negócio.

---

# 20. Segurança dos Links

Nunca permitir acesso através de simples alteração de:

```text
/veiculo/123
```

para:

```text
/veiculo/124
```

O sistema deve impedir acesso indevido a dados de outros veículos.

Considerar:

* tokens seguros;
* expiração;
* revogação;
* autorização;
* controle de acesso;
* auditoria.

---

# 21. Download de Documentos

Permitir:

### Individual

```text
Documento → Baixar
```

### Todos

```text
Baixar tudo
      ↓
Gerar ZIP
      ↓
Download
```

O ZIP deverá ser gerado de maneira segura.

Nunca expor diretamente caminhos físicos do servidor.

---

# 22. Aceite Eletrônico

O comprador poderá registrar um aceite simples de recebimento.

Registrar:

* Comprador;
* Veículo;
* Data;
* Hora;
* Aceite;
* IP, quando aplicável;
* Identificação da operação;
* Versão do termo aceito.

Isso deverá ser tratado como:

**Aceite eletrônico simples.**

Não classificar automaticamente como assinatura digital qualificada ou assinatura ICP-Brasil.

---

# 23. Dashboard

O sistema deverá possuir dashboard operacional.

Possíveis indicadores:

* Veículos à venda;
* Veículos em troca;
* Veículos vendidos;
* Custo total do estoque;
* Valor FIPE;
* Valor anunciado;
* Margem;
* Operações recentes;
* Trocas recentes.

Os indicadores devem utilizar dados reais do sistema.

Não criar números fictícios em produção.

---

# 24. Filtros

A listagem de veículos deverá possuir filtros rápidos.

Filtros iniciais:

* Tipo;
* Marca;
* Modelo;
* Status;
* Faixa de preço;
* Ano;
* Quilometragem;
* Outros filtros relevantes.

Os filtros devem funcionar adequadamente em desktop e smartphone.

---

# 25. Interface

Estilo visual:

**Escuro + Futurista + Profissional**

Características:

* Cards;
* Fotos grandes;
* Badges;
* Indicadores;
* Dashboard;
* Navegação limpa;
* Responsividade;
* Mobile-first.

## Card do veículo

Informações prioritárias:

* Foto principal;
* Marca;
* Modelo;
* Ano;
* KM;
* Preço;
* FIPE;
* Status.

---

# 26. Arquitetura

A arquitetura deverá ser:

* Modular;
* Testável;
* Segura;
* Escalável;
* Manutenível;
* Preparada para evolução.

Sempre que compatível com a stack escolhida, manter separação clara entre:

```text
Domain
Application
Infrastructure
Presentation
```

A arquitetura definitiva deverá ser definida de acordo com a stack efetivamente escolhida.

---

# 27. Stack

A stack tecnológica deverá ser definida antes da implementação.

Não assumir tecnologia sem confirmação.

A definição deverá considerar:

* Backend;
* Frontend;
* Banco de dados;
* Storage;
* Autenticação;
* PWA;
* API;
* Hospedagem;
* CI/CD;
* Monitoramento.

---

# 28. Regra Contra Achismo

Esta é uma regra fundamental do projeto.

### NÃO INVENTAR.

Quando uma informação não estiver definida, classificar como:

* Requisito definido;
* Requisito derivado;
* Requisito pendente;
* Decisão técnica;
* Decisão de negócio.

## Decisões de negócio

Não escolher automaticamente.

Apresentar opções e solicitar definição.

## Decisões técnicas

Podem ser tomadas pelo arquiteto quando forem necessárias para implementação.

A decisão deve ser acompanhada de justificativa objetiva.

---

# 29. Regra de Não Refatoração

**NÃO REFATORAR CÓDIGO EXISTENTE SEM SOLICITAÇÃO EXPLÍCITA.**

Quando o projeto existente for fornecido:

* preservar arquitetura;
* preservar nomes;
* preservar namespaces;
* preservar contratos;
* preservar regras;
* preservar comportamento;
* não mover arquivos sem necessidade;
* não substituir tecnologias;
* não criar abstrações desnecessárias.

Se uma alteração existente for indispensável:

```text
Arquivo:
Alteração:
Motivo:
Impacto:
```

deverá ser informado antes da alteração.

---

# 30. Desenvolvimento Incremental

O sistema não deverá ser implementado inteiro de uma única vez.

## Fase 1

Arquitetura e domínio.

## Fase 2

Banco de dados e persistência.

## Fase 3

API e casos de uso.

## Fase 4

Autenticação e autorização.

## Fase 5

Veículos.

## Fase 6

Fotos e documentos.

## Fase 7

Custos.

## Fase 8

FIPE e histórico.

## Fase 9

Compra, venda e troca.

## Fase 10

Motor de avaliação de troca.

## Fase 11

Portal do comprador.

## Fase 12

Download ZIP e aceite eletrônico.

## Fase 13

Dashboard e filtros.

## Fase 14

PWA e experiência mobile.

## Fase 15

Testes, segurança e produção.

---

# 31. Validação

Após cada fase:

1. Compilar;
2. Executar testes;
3. Validar integração;
4. Validar banco;
5. Validar API;
6. Validar interface;
7. Validar permissões;
8. Corrigir erros encontrados;
9. Somente então avançar.

Não considerar uma etapa concluída apenas porque o código foi escrito.

---

# 32. Testes

Criar testes para as regras críticas.

## Domínio

* Criação de veículo;
* Alteração de status;
* Custos;
* Cálculos;
* Compra;
* Venda;
* Troca.

## FIPE

* Consulta;
* Atualização;
* Histórico;
* Falha da integração.

## Segurança

* Autorização;
* Permissões;
* Links;
* Expiração;
* Revogação;
* Download;
* IDOR.

## Portal

* Acesso do comprador;
* Visualização;
* Download;
* Aceite.

---

# 33. Segurança

Considerar obrigatoriamente:

* Autenticação;
* Autorização;
* Controle de acesso;
* Validação de arquivos;
* Limite de tamanho;
* Validação de extensão;
* Validação de MIME type;
* Nomes de arquivos seguros;
* Proteção contra arquivos maliciosos;
* Proteção contra IDOR;
* Tokens seguros;
* Expiração;
* Revogação;
* Auditoria;
* HTTPS;
* Proteção dos documentos;
* Não exposição de caminhos físicos.

---

# 34. Auditoria

Operações importantes deverão possuir histórico.

Exemplos:

* Criação de veículo;
* Alteração de dados;
* Alteração de status;
* Upload de documento;
* Exclusão de documento;
* Registro de custo;
* Atualização FIPE;
* Compra;
* Venda;
* Troca;
* Geração de link;
* Revogação de link;
* Download;
* Aceite do comprador.

Sempre que aplicável, registrar:

* usuário;
* data;
* hora;
* operação;
* recurso afetado.

---

# 35. Responsividade

A aplicação deverá ser validada em diferentes tamanhos:

* Desktop;
* Notebook;
* Tablet;
* Smartphone pequeno;
* Smartphone médio;
* Smartphone grande.

Não utilizar somente dimensões fixas.

---

# 36. Compatibilidade Mobile

Priorizar recursos Web padronizados.

Especial atenção para:

* câmera;
* upload;
* galeria;
* downloads;
* compartilhamento;
* instalação PWA;
* armazenamento;
* notificações, quando posteriormente necessárias.

Caso uma funcionalidade possua limitações específicas no iOS ou Android, documentar explicitamente.

---

# 37. Dados e Arquivos

Fotos e documentos não devem ser tratados simplesmente como strings ou armazenados indiscriminadamente no banco.

A arquitetura deverá separar:

```text
Metadados
    +
Arquivo físico / objeto
```

O mecanismo definitivo de armazenamento deverá ser definido conforme a infraestrutura escolhida.

---

# 38. Histórico

Informações históricas relevantes não devem ser sobrescritas.

Exemplos:

* FIPE;
* Trocas;
* Custos;
* Alterações;
* Vendas;
* Documentos;
* Aceites.

O sistema deve preservar rastreabilidade.

---

# 39. Princípios do Projeto

O desenvolvimento deve seguir estes princípios:

### Precisão

Não inventar requisitos.

### Transparência

Cálculos financeiros devem ser explicáveis.

### Segurança

Dados e documentos devem possuir controle de acesso.

### Simplicidade

Evitar complexidade desnecessária.

### Evolução

Preparar o sistema para novos tipos de veículos, categorias e funcionalidades.

### Testabilidade

Regras críticas devem possuir testes.

### Mobile-first

O smartphone é uma plataforma principal.

### Código existente

Não refatorar sem autorização.

---

# 40. Regras para Agentes de IA

Qualquer agente de IA utilizado no desenvolvimento deverá seguir obrigatoriamente:

```text
1. Não inventar informações.
2. Não assumir requisitos de negócio.
3. Não refatorar sem autorização.
4. Não substituir tecnologias sem autorização.
5. Não alterar contratos existentes sem necessidade.
6. Não gerar código fictício como código funcional.
7. Validar antes de declarar concluído.
8. Informar arquivos alterados.
9. Informar alterações realizadas.
10. Informar impactos.
11. Preservar comportamento existente.
12. Priorizar segurança.
13. Priorizar testes.
14. Explicar decisões técnicas.
15. Separar fato de hipótese.
```

---

# 41. Formato Obrigatório das Respostas da IA

Sempre que estiver trabalhando no projeto, utilizar preferencialmente:

```text
## Objetivo

O que será realizado.

## Análise

O que foi identificado.

## Solução

Como será implementado.

## Alterações

Arquivos/componentes que serão alterados.

## Validação

Como confirmar que a implementação está correta.

## Pendências

Somente informações realmente necessárias.
```

---

# 42. Critério de Conclusão

Uma funcionalidade somente será considerada concluída quando:

* estiver implementada;
* estiver integrada;
* compilar;
* possuir testes quando aplicável;
* respeitar as regras de negócio;
* respeitar as permissões;
* funcionar no desktop;
* funcionar no mobile quando aplicável;
* não introduzir regressões;
* possuir validação correspondente.

---

# 43. Requisitos Pendentes

Os seguintes pontos devem ser definidos antes da implementação definitiva:

* Stack tecnológica;
* Banco de dados;
* Estratégia de armazenamento de arquivos;
* API/fonte FIPE;
* Critérios verde/amarelo/vermelho da troca;
* Estratégia definitiva de autenticação do comprador;
* Política de retenção de documentos;
* Política de backup;
* Hospedagem/infraestrutura;
* Regras comerciais específicas de compra e venda.

**Nenhum desses pontos deve ser inventado pela IA.**

---

# 44. Resultado Esperado

O resultado final deverá ser uma plataforma profissional de gestão de veículos com:

```text
                    SISTEMA
                       │
       ┌───────────────┼────────────────┐
       │               │                │
    ESTOQUE         NEGOCIAÇÃO       CLIENTES
       │               │                │
   Veículos        Compra/Venda      Portal
   Fotos           Trocas            Documentos
   Documentos      FIPE              Aceite
   Custos          Margem
                   Análise
       │               │
       └───────────────┼────────────────┘
                       │
                    PWA WEB
                       │
             ┌─────────┴─────────┐
             │                   │
          DESKTOP             MOBILE
                                 │
                       ┌─────────┴─────────┐
                       │                   │
                     ANDROID             iPHONE
                       │                   │
                    Instalação         Tela inicial
                    PWA                PWA
```

A plataforma deve oferecer uma experiência única, segura e profissional para controlar o ciclo completo dos veículos, desde a aquisição até a venda ou troca, incluindo custos, documentação, análise financeira e entrega digital ao comprador.

---

# 45. Regra Final

**Este README.md é a especificação funcional e arquitetural inicial do projeto.**

Qualquer implementação deverá respeitar este documento.

Quando houver conflito entre uma implementação sugerida e este documento:

1. Identificar o conflito;
2. Não decidir silenciosamente;
3. Explicar a diferença;
4. Solicitar decisão quando for regra de negócio;
5. Aplicar a alteração somente após definição.

**Objetivo principal: construir exatamente o sistema especificado, sem achismo, sem escopo inventado e sem refatoração desnecessária.**
