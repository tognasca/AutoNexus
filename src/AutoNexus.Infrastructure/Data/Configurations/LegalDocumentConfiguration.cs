using AutoNexus.Domain.Entities;
using AutoNexus.Domain.Enums;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace AutoNexus.Infrastructure.Data.Configurations;

/// <summary>
/// IMPORTANTE: o conteúdo semeado abaixo (TermsV1/PrivacyV1/CookiesV1) é um
/// texto ESTRUTURAL PLACEHOLDER — cobre as seções que um SaaS B2B
/// normalmente precisa ter, mas contém marcadores [ENTRE COLCHETES] no
/// lugar de qualquer dado jurídico específico da empresa (razão social,
/// CNPJ, endereço, foro, DPO/encarregado, etc.), porque esses dados não
/// foram fornecidos e não devem ser inventados (requisito 12 do documento
/// original). NÃO representa conformidade jurídica validada — precisa de
/// revisão por advogado antes de valer como documento legal real.
/// </summary>
public class LegalDocumentConfiguration : IEntityTypeConfiguration<LegalDocument>
{
    private static readonly DateTime SeedDate = new(2026, 1, 1, 0, 0, 0, DateTimeKind.Utc);

    public void Configure(EntityTypeBuilder<LegalDocument> builder)
    {
        builder.ToTable("legal_documents");
        builder.HasKey(x => x.Id);

        builder.Property(x => x.Type).HasConversion<int>().IsRequired();
        builder.Property(x => x.Version).IsRequired();
        builder.Property(x => x.Content).IsRequired();
        builder.Property(x => x.IsActive).IsRequired();
        builder.Property(x => x.PublishedAt).IsRequired();
        builder.Property(x => x.CreatedAt).IsRequired();
        builder.Property(x => x.UpdatedAt);

        builder.HasIndex(x => new { x.Type, x.Version }).IsUnique();

        builder.HasData(
            new
            {
                Id = Guid.Parse("00000000-0000-0000-0000-0000000000c1"),
                Type = LegalDocumentType.TermsOfUse,
                Version = 1,
                Content = TermsV1,
                IsActive = true,
                PublishedAt = SeedDate,
                CreatedAt = SeedDate,
                UpdatedAt = (DateTime?)null
            },
            new
            {
                Id = Guid.Parse("00000000-0000-0000-0000-0000000000c2"),
                Type = LegalDocumentType.PrivacyPolicy,
                Version = 1,
                Content = PrivacyV1,
                IsActive = true,
                PublishedAt = SeedDate,
                CreatedAt = SeedDate,
                UpdatedAt = (DateTime?)null
            },
            new
            {
                Id = Guid.Parse("00000000-0000-0000-0000-0000000000c3"),
                Type = LegalDocumentType.CookiePolicy,
                Version = 1,
                Content = CookiesV1,
                IsActive = true,
                PublishedAt = SeedDate,
                CreatedAt = SeedDate,
                UpdatedAt = (DateTime?)null
            }
        );
    }

    private const string TermsV1 = @"# Termos de Uso — AutoNexus

**[RASCUNHO ESTRUTURAL — PENDENTE DE REVISÃO JURÍDICA. NÃO USAR COMO TERMO FINAL.]**

1. Identificação do prestador de serviço
[Razão social], inscrita no CNPJ sob o nº [CNPJ], com sede em [endereço completo] (""AutoNexus"" ou ""nós""), disponibiliza a plataforma AutoNexus (""Plataforma"") como um serviço de software como serviço (SaaS) para gestão de compra, venda e troca de veículos.

2. Aceite
Ao criar uma conta ou utilizar a Plataforma, você (""Cliente"" ou ""Usuário"") declara ter lido, compreendido e aceitado estes Termos de Uso e a Política de Privacidade vigente.

3. Cadastro e conta
3.1. O Cliente é responsável pela veracidade das informações fornecidas no cadastro da empresa e dos usuários.
3.2. O Cliente é responsável por manter a confidencialidade das credenciais de acesso de seus usuários.

4. Planos, preços e pagamento
4.1. O uso da Plataforma é condicionado à contratação de um plano pago, podendo haver período de teste gratuito (trial) conforme indicado no momento da contratação.
4.2. Os valores vigentes de cada plano são exibidos na página de preços da Plataforma e podem ser alterados mediante aviso prévio.
4.3. Os pagamentos são processados por gateway de pagamento terceirizado([gateway de pagamento]). O AutoNexus não armazena dados completos de cartão de crédito.

5. Cancelamento
5.1. O Cliente pode cancelar sua assinatura a qualquer momento através do painel da conta.
5.2. O cancelamento não gera reembolso automático de período já pago, ressalvadas as hipóteses legais aplicáveis (ex.: direito de arrependimento em até 7 dias, art. 49 do CDC).

6. Dados do Cliente
6.1. Os dados inseridos pelo Cliente na Plataforma (veículos, clientes, documentos, etc.) permanecem de propriedade do Cliente.
6.2. Em caso de cancelamento, os dados são mantidos pelo período descrito na Política de Privacidade antes de eventual exclusão/anonimização.

7. Limitação de responsabilidade
[A ser definido com apoio jurídico — cláusula padrão de limitação de responsabilidade proporcional ao valor pago, exclusão de danos indiretos, etc.]

8. Foro
Fica eleito o foro da comarca de [cidade/UF] para dirimir eventuais controvérsias oriundas destes Termos, com renúncia a qualquer outro, por mais privilegiado que seja.

9. Contato
Dúvidas sobre estes Termos podem ser enviadas para [e-mail de contato].

Versão 1 — [data de publicação real a definir]";

    private const string PrivacyV1 = @"# Política de Privacidade — AutoNexus

**[RASCUNHO ESTRUTURAL — PENDENTE DE REVISÃO JURÍDICA. NÃO USAR COMO POLÍTICA FINAL.]**

Esta Política de Privacidade descreve como o AutoNexus coleta, usa, armazena e protege dados pessoais, em conformidade com a Lei Geral de Proteção de Dados (Lei nº 13.709/2018 — LGPD).

1. Controlador de dados
[Razão social], CNPJ [CNPJ]. Encarregado de Dados (DPO): [nome/e-mail do encarregado — a definir].

2. Dados coletados
2.1. Dados de cadastro: nome, e-mail, telefone, dados da empresa (razão social, CNPJ, endereço).
2.2. Dados de uso: veículos cadastrados, clientes, documentos, histórico de navegação na Plataforma.
2.3. Dados de pagamento: processados pelo gateway de pagamento — o AutoNexus não armazena número completo de cartão de crédito.

3. Finalidade do tratamento
Prestação do serviço contratado, comunicação sobre a conta e cobrança, cumprimento de obrigações legais/regulatórias, prevenção a fraude e melhoria da Plataforma.

4. Base legal
Execução de contrato (art. 7º, V, LGPD), cumprimento de obrigação legal (art. 7º, II) e, quando aplicável, consentimento (art. 7º, I).

5. Compartilhamento de dados
Dados podem ser compartilhados com: gateway de pagamento ([Mercado Pago]), provedor de e-mail transacional ([Resend]), provedores de infraestrutura (hospedagem/banco de dados), e autoridades quando exigido por lei.

6. Direitos do titular
Nos termos do art. 18 da LGPD, o titular pode solicitar: confirmação de tratamento, acesso, correção, anonimização/eliminação, portabilidade, informação sobre compartilhamento, e revogação de consentimento. Solicitações podem ser enviadas para [e-mail de contato do encarregado].

7. Retenção e eliminação
Dados são mantidos enquanto a conta estiver ativa e pelo prazo adicional necessário para cumprimento de obrigações legais/fiscais após o cancelamento. Após esse prazo, podem ser anonimizados ou eliminados mediante solicitação do titular, observadas as exceções legais.

8. Segurança
Adotamos medidas técnicas e organizacionais para proteger os dados, incluindo isolamento lógico entre empresas clientes (multi-tenancy) e controle de acesso por autenticação.

9. Cookies
Veja a Política de Cookies para detalhes sobre o uso de cookies e tecnologias similares.

10. Alterações
Esta política pode ser atualizada; a versão vigente estará sempre disponível na Plataforma, com indicação da data/versão.

Versão 1 — [data de publicação real a definir]";

    private const string CookiesV1 = @"# Política de Cookies — AutoNexus

**[RASCUNHO ESTRUTURAL — PENDENTE DE REVISÃO JURÍDICA.]**

1. O que são cookies
Pequenos arquivos armazenados no navegador do usuário para permitir o funcionamento e a melhoria da Plataforma.

2. Cookies utilizados
2.1. Essenciais: necessários para autenticação e funcionamento básico (ex.: manter a sessão do usuário logado). Não podem ser desativados sem comprometer o funcionamento da Plataforma.
2.2. Desempenho/analytics: [a definir caso sejam adicionadas ferramentas de analytics].

3. Gerenciamento de cookies
O usuário pode gerenciar/bloquear cookies diretamente nas configurações do navegador, ciente de que isso pode afetar o funcionamento da Plataforma.

4. Alterações
Esta política pode ser atualizada; a versão vigente estará sempre disponível na Plataforma.

Versão 1 — [data de publicação real a definir]";
}
