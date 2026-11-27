# Piloto comercial do AT Motors

## Perfil da primeira revenda

Revenda independente de Cotia ou região que atende pelo WhatsApp, mantém parte do estoque em planilha e consegue indicar um responsável da loja e um vendedor para o teste. Faça o convite por um canal comercial autorizado.

> Olá! Estamos selecionando uma revenda da região para testar o AT Motors acompanhando uma venda do WhatsApp à entrega. Em cinco minutos consigo mostrar como retomar um atendimento, enviar uma proposta e acompanhar o pós-venda. Se fizer sentido, podemos conferir sua planilha e combinar um piloto acompanhado. Qual horário funciona melhor?

## Demonstração de cinco minutos

| Tempo | Mostre | Pergunte |
|---|---|---|
| 0:00–1:30 | Abra `/demo#atendimento`, localize o Corolla e mostre a próxima ação. | Se o vendedor estiver fora, como alguém retoma o atendimento hoje? |
| 1:30–3:10 | Avance até a proposta, confira valor e entrada e registre interesse. | Quanto tempo costuma levar para enviar uma proposta? |
| 3:10–4:30 | Mostre a fila de entregas e transferências e explique o link de documentos do comprador. | Quem acompanha as pendências depois do pagamento? |
| 4:30–5:00 | Combine uma amostra do estoque, o responsável e a data do primeiro acompanhamento. Na versão de homologação, mostre o Portal do Comprador se a revenda quiser conhecer os downloads. | Qual etapa valeria testar primeiro com sua equipe? |

## Implantação acompanhada

1. Combine escopo, valor, responsáveis, data de revisão e canal de suporte. Oriente a loja a enviar pela via acordada apenas os campos de estoque necessários.
2. Na empresa da revenda, baixe o modelo pelo assistente de importação. Mapeie os dados e valide uma amostra na prévia. Resolva erros e compare contagens e placas antes de importar o restante.
3. Configure nome, identidade e WhatsApp comercial. Confira a vitrine no celular e valide o destino do botão de contato.
4. Treine um vendedor com um atendimento de exemplo. Pratique a proposta, a reserva e o fechamento. Confira a fila de pós-venda e um link de teste do portal.
5. Na primeira operação real, registre o tempo de cada tarefa e onde houve retrabalho. Confirme com o responsável se o fluxo pode ser repetido sem ajuda.
6. Revise os resultados, a decisão de continuidade e as pendências com a loja. Se houver interesse em divulgar, obtenha autorização para nome, números, imagens e depoimento.

## Ficha do piloto

Meça tarefas comparáveis com o processo anterior e no AT Motors. Para estoque, use a mesma quantidade de linhas e conte revisão e correção. Marque entradas sem medição como `pendente`.

| Indicador | Como medir | Antes | AT Motors | Observações |
|---|---|---|---|---|
| Importar o estoque | Da planilha pronta até o lote revisado e conferido. Registre tamanho do lote e erros. | Pendente | Pendente | |
| Preparar uma proposta | Do atendimento aberto até a proposta pronta para compartilhar. | Pendente | Pendente | |
| Encontrar uma entrega pendente | Da abertura do sistema até identificar veículo, responsável e etapa pendente. | Pendente | Pendente | |

**Registro da loja:** responsável, vendedor, datas, quantidade de veículos, dificuldades, ações acordadas e decisão de continuidade.

**Estrutura do caso comercial:** situação anterior, fluxo implantado, período e amostra, resultados medidos, limites e depoimento aprovado. Publique apenas fatos conferidos e autorizados.

## Conferência para publicação

- A página inicial mostra as três telas capturadas com dados de exemplo, acima dos planos.
- `/demo` completa as etapas sem login nem gravações na operação da revenda.
- O número comercial é configurado no build com `VITE_PUBLIC_WHATSAPP_NUMBER`, em formato internacional. Confira o destino e a mensagem gerada antes de oferecer a página a lojas. A solicitação é enviada pelo visitante no WhatsApp.
- Confirme preços, planos e cadastro consultando a API do ambiente publicado.
