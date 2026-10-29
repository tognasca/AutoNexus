# AutoNexus — Skills de prevenção de regressões

## Regra obrigatória: login e isolamento multi-tenant

### Falha registrada
O endpoint `POST /api/auth/login` passou a responder `401 {"message":"Credenciais inválidas."}` para um usuário que já existia. A causa foi o filtro global de tenant em `AutoNexusDbContext`: sem JWT ainda não há tenant no contexto HTTP, então consultas comuns a entidades tenant-owned não retornam usuários. O login consulta o usuário antes de autenticar e não pode depender do tenant já autenticado.

### Correção aplicada
`UserRepository.GetByEmailAsync` usa `IgnoreQueryFilters()` para localizar o usuário antes da autenticação. O `AuthService.LoginAsync` continua validando usuário ativo, senha e estado do tenant antes de emitir JWT. Consultas comuns por ID/listagem continuam respeitando o filtro global.

### Não repetir
- Nunca remover nem enfraquecer a validação JWT para resolver um `401` devolvido pelo próprio endpoint de login.
- Nunca concluir que um `401` significa token expirado sem identificar endpoint, status e corpo da resposta.
- Nunca usar `GetByEmailAsync` sob o filtro global de tenant para um fluxo pré-autenticação.
- Nunca resolver isso com `IgnoreQueryFilters()` indiscriminado em todos os métodos do repositório; limitar a exceção ao lookup necessário antes da autenticação e documentar o motivo.
- Não alterar autenticação, autorização, filtros globais ou fluxo de login sem verificar os efeitos em isolamento entre tenants.

## Checklist obrigatório antes de encerrar correção de autenticação

1. Reproduzir/identificar a primeira requisição que falha e guardar endpoint, status e mensagem sem coletar senha, token, cookies ou cabeçalhos secretos.
2. Separar falhas de credenciais no `POST /api/auth/login` de falhas de autorização nas requisições seguintes.
3. Conferir `AuthService.LoginAsync`, `UserRepository.GetByEmailAsync`, `AutoNexusDbContext.ApplyTenantQueryFilter`, `ITenantContext` e o fluxo de emissão/armazenamento do JWT.
4. Adicionar testes automatizados cobrindo: lookup de usuário sem tenant autenticado; senha inválida; usuário inativo; tenant inativo; e acesso cross-tenant bloqueado nas consultas autenticadas.
5. Rodar CI de backend e frontend e inspecionar o resultado antes de merge. Não afirmar que testes passaram sem consultar o CI.
6. Depois do merge, confirmar que a implantação de produção concluiu e verificar login com uma conta de teste autorizada. Merge no GitHub não significa deploy concluído.
7. Se o sintoma continuar após deploy, conferir qual versão/commit está em execução e repetir o diagnóstico com evidência; não criar outra correção especulativa.

## Regra de segurança
A busca pré-autenticação pode localizar um usuário por e-mail, mas nunca deve emitir token até validar senha, usuário ativo e tenant ativo (exceto SuperAdmin conforme regra de domínio). O isolamento multi-tenant deve permanecer aplicado a todas as consultas de dados após autenticação.
