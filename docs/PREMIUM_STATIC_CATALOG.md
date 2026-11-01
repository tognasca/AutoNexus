# Catálogo Premium em hospedagem própria

O catálogo publicado em domínio/hospedagem própria é exclusivo do plano Premium.

## Arquitetura

O pacote baixado é um shell estático. Ele não contém veículos, credenciais, JWT ou segredos. Ao abrir o domínio do cliente, o JavaScript consulta a API pública do AutoNexus usando o slug público da loja. Assim estoque, preços, fotos, identidade visual e WhatsApp permanecem atualizados sem novo download.

## Segurança

- A autorização do recurso Premium é feita no backend.
- O slug do tenant é público, mas nunca é usado como mecanismo de isolamento sozinho; todas as consultas públicas filtram o tenant.
- O pacote não contém tokens ou credenciais privadas.
- O domínio informado pelo tenant é usado como origem permitida quando CORS dinâmico estiver habilitado.
- CORS não substitui autenticação nem isolamento de tenant.

## Publicação

1. No AutoNexus, abra **Catálogo > Publicação própria**.
2. Informe o domínio que será usado pelo catálogo, por exemplo `www.minhaloja.com.br`.
3. Salve o domínio.
4. Gere e baixe o pacote.
5. Extraia o ZIP na pasta pública da hospedagem do cliente.
6. Aponte o domínio para essa pasta.
7. Ative HTTPS no domínio.

O catálogo continua dependente da disponibilidade da API AutoNexus para carregar os dados atuais.

## Limitação planejada

A primeira versão usa uma SPA estática dinâmica. SEO/SSR avançado para domínio próprio pode ser adicionado posteriormente sem alterar o contrato de dados.
