# Execução local do AutoNexus com Cloudflare Tunnel

Este guia descreve como validar o AutoNexus no computador que executa o Docker Compose e publicar somente o frontend pelo Cloudflare Tunnel. Seguir o guia não comprova que o serviço já esteja publicado; confirme cada etapa no ambiente real.

## 1. Preparar o ambiente sem sobrescrever segredos

No PowerShell, entre na pasta local do repositório e confira se o Docker está disponível:

```powershell
cd C:\git\AutoNexus
docker --version
docker compose version
```

Se o repositório estiver em outro diretório, use o caminho real dessa instalação.

Confira se existe um arquivo `.env`. Se não existir, copie o exemplo e preencha os segredos localmente:

```powershell
if (-not (Test-Path .env)) { Copy-Item .env.example .env }
notepad .env
```

**Não substitua um `.env` existente sem revisar os valores.** O banco usa um volume persistente; trocar `POSTGRES_PASSWORD` no arquivo não altera automaticamente a senha de um banco já inicializado. Não publique o `.env`, senhas, tokens, chaves JWT ou credenciais no GitHub.

Para esta etapa:
- Preencha `POSTGRES_PASSWORD` e `JWT_SECRET_KEY` com os valores seguros já definidos para esse ambiente.
- Deixe `VITE_DEMO_VIDEO_URL=` vazio enquanto não houver um MP4 real hospedado publicamente.
- Preencha `VITE_PUBLIC_WHATSAPP_NUMBER` localmente com o número de atendimento em formato internacional, somente dígitos. Não cole o número no código nem no Git.
- Não configure tokens de produção de pagamento ou contas administrativas usando valores fictícios. Para testar checkout real, configure as credenciais oficiais somente quando estiver pronto para operar pagamentos.

## 2. Validar a configuração e iniciar os containers

Execute na raiz do repositório:

```powershell
docker compose config --quiet
if ($LASTEXITCODE -ne 0) { throw "Configuração do Docker Compose inválida." }

docker compose up -d --build
if ($LASTEXITCODE -ne 0) { throw "Falha ao iniciar os serviços." }

docker compose ps
```

Verifique os logs se algum serviço não estiver saudável:

```powershell
docker compose logs --tail=100 postgres api frontend
```

Não compartilhe logs sem revisar e ocultar tokens, strings de conexão, e-mails e outros dados privados.

## 3. Testar localmente antes de publicar

```powershell
Invoke-WebRequest http://localhost:3000/ -UseBasicParsing
```

Confirme no navegador que a página carrega e teste login, navegação e chamadas da API. O frontend usa o proxy Nginx para encaminhar `/api/` e `/uploads/` para a API; por isso, o hostname público do túnel deve apontar para o frontend, não diretamente para a API ou o banco.

Se houver erro, pare aqui e investigue os logs antes de expor o serviço.

## 4. Configurar o Cloudflare Tunnel

No painel do Cloudflare Zero Trust, abra o túnel já existente e configure uma rota de hostname público para o serviço local:

- **Hostname público:** use o domínio/subdomínio que você controla e que já está configurado no Cloudflare. Não invente um hostname novo.
- **Tipo de serviço:** HTTP.
- **URL de origem:** `localhost:3000`, se o conector do túnel estiver instalado e rodando nesse mesmo computador.
- Se o conector estiver em outra máquina ou em um container, `localhost` apontará para essa máquina/container, não para o computador do AutoNexus; use o endereço interno correto e alcançável a partir do conector.

Não crie rotas públicas para PostgreSQL (`5433`) ou para a porta direta da API (`5000`). Publique apenas o frontend, que encaminha as rotas necessárias à API.

## 5. Conferir o endereço público

Depois de salvar a rota, abra o hostname real configurado em uma janela anônima. Confirme:
- a página carrega por HTTPS;
- login e chamadas da API funcionam;
- os dados exibidos pertencem ao tenant correto;
- o botão de WhatsApp abre o destino configurado;
- nenhum e-mail pessoal ou dado interno aparece;
- a área de vídeo continua identificada como guia provisório enquanto `VITE_DEMO_VIDEO_URL` estiver vazia.

Se o endereço público falhar, confira o status do túnel no painel Cloudflare e os logs locais. Não considere o deploy concluído só porque os containers iniciaram.

## 6. Segurança e limitações conhecidas

O `docker-compose.yml` atual publica as portas locais `5000` (API) e `5433` (PostgreSQL) além da `3000` (frontend). O Cloudflare Tunnel não exige publicar API ou banco diretamente. Antes de operar com dados reais, revise e restrinja esses mapeamentos para que o banco e a API não fiquem acessíveis desnecessariamente pela rede local; preserve a conectividade interna entre containers.

O número de WhatsApp fornecido por `VITE_PUBLIC_WHATSAPP_NUMBER` é incorporado ao bundle do frontend. A interface pode ocultá-lo como texto, mas o destino pode ser descoberto inspecionando o link ou o bundle. Essa variável não é um segredo.

Sem um MP4 real, não há vídeo demonstrativo para publicar. Quando existir, hospede o arquivo em URL HTTPS pública com acesso direto ao MP4, configure `VITE_DEMO_VIDEO_URL` no `.env` e reconstrua o frontend:

```powershell
docker compose up -d --build frontend
```

## Checklist de conclusão

- [ ] `docker compose config --quiet` passou.
- [ ] Os três serviços aparecem ativos em `docker compose ps`.
- [ ] O frontend responde em `http://localhost:3000/`.
- [ ] O hostname real do Cloudflare aponta para o frontend.
- [ ] O endereço HTTPS público foi testado fora da rede local.
- [ ] API, banco, login, isolamento por tenant e botão WhatsApp foram validados.
- [ ] Segredos não foram commitados.
- [ ] O vídeo permanece como guia provisório até existir um MP4 real.
