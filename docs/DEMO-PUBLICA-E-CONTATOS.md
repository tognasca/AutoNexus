# Demonstração pública e contatos do AutoNexus

## Vídeo demonstrativo

A página de planos aceita um vídeo MP4 público pela variável de build `VITE_DEMO_VIDEO_URL`.

1. Grave a tela do AutoNexus com dados fictícios ou devidamente autorizados.
2. Mostre, nesta ordem: cadastro/estoque de veículos e fotos; fluxo de compra, venda e troca; documentos; indicadores e relatórios; catálogo público de uma loja.
3. Não mostre placas, chassi, Renavam, dados pessoais, credenciais, tokens, e-mails reais ou informações financeiras privadas.
4. Exporte em MP4 (H.264/AAC) e hospede em um endereço HTTPS público que permita reprodução direta do arquivo.
5. Configure `VITE_DEMO_VIDEO_URL` no ambiente de build do frontend e reconstrua/republique o frontend. A variável Vite é incorporada durante o build; alterar apenas o ambiente do container depois de compilado não muda o bundle.

Sem a URL, a página apresenta um guia provisório de funcionalidades e informa explicitamente que ele não é uma gravação de tela.

## WhatsApp público

Configure `VITE_PUBLIC_WHATSAPP_NUMBER` no ambiente de build com o número de atendimento no formato internacional, apenas dígitos (código do país + DDD + número). Não coloque o número real no repositório.

O catálogo exibe botões de WhatsApp, não o número como texto. Para o link abrir uma conversa, o navegador precisa receber o destino `wa.me`; portanto, o número pode ser descoberto por alguém que inspecione o link ou o bundle. A variável Vite não é segredo. Se for necessário manter o contato realmente privado, use um endpoint intermediário no servidor e proteção contra abuso.

Nesta versão o número é global para todas as lojas; não existe configuração individual por tenant.

## E-mail

O catálogo público não precisa exibir um endereço de e-mail e não deve renderizar um endereço pessoal. Não adicione o e-mail de administração ao frontend, a variáveis `VITE_*`, a links públicos nem a conteúdo de demonstração. E-mails administrativos devem ficar apenas na configuração privada do servidor quando necessários.

## Validação antes da divulgação

- [ ] O vídeo MP4 abre sem autenticação em uma janela anônima.
- [ ] O frontend foi reconstruído após configurar as variáveis.
- [ ] O botão do WhatsApp abre o contato correto sem mostrar o número como texto na interface.
- [ ] Nenhum e-mail pessoal aparece no catálogo ou na landing page.
- [ ] O catálogo `/loja/<slug>` mostra somente veículos da empresa correspondente.
- [ ] Fotos, preços, detalhes e documentos públicos foram verificados com dados de teste.
- [ ] A publicação foi validada no endereço real; merge de código, sozinho, não comprova deploy.
