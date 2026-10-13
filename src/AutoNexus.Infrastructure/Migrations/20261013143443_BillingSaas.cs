using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

#pragma warning disable CA1814 // Prefer jagged arrays over multidimensional

namespace AutoNexus.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class BillingSaas : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<int>(
                name: "billingCycle",
                table: "tenant_subscriptions",
                type: "integer",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<DateTime>(
                name: "cancelledAt",
                table: "tenant_subscriptions",
                type: "timestamp with time zone",
                nullable: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "currentPeriodEnd",
                table: "tenant_subscriptions",
                type: "timestamp with time zone",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "externalSubscriptionId",
                table: "tenant_subscriptions",
                type: "character varying(200)",
                maxLength: 200,
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "paymentMethod",
                table: "tenant_subscriptions",
                type: "integer",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "paymentProvider",
                table: "tenant_subscriptions",
                type: "character varying(50)",
                maxLength: 50,
                nullable: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "trialEndsAt",
                table: "tenant_subscriptions",
                type: "timestamp with time zone",
                nullable: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "trialReminderSentAt",
                table: "tenant_subscriptions",
                type: "timestamp with time zone",
                nullable: true);

            migrationBuilder.AddColumn<decimal>(
                name: "annualPrice",
                table: "plans",
                type: "numeric(10,2)",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "trialDays",
                table: "plans",
                type: "integer",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.CreateTable(
                name: "legal_documents",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false),
                    type = table.Column<int>(type: "integer", nullable: false),
                    version = table.Column<int>(type: "integer", nullable: false),
                    content = table.Column<string>(type: "text", nullable: false),
                    isActive = table.Column<bool>(type: "boolean", nullable: false),
                    publishedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    createdAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    updatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_legal_documents", x => x.id);
                });

            migrationBuilder.CreateTable(
                name: "payments",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false),
                    subscriptionId = table.Column<Guid>(type: "uuid", nullable: false),
                    amount = table.Column<decimal>(type: "numeric(10,2)", nullable: false),
                    currency = table.Column<string>(type: "character varying(3)", maxLength: 3, nullable: false),
                    method = table.Column<int>(type: "integer", nullable: false),
                    status = table.Column<int>(type: "integer", nullable: false),
                    provider = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    externalPaymentId = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: true),
                    failureReason = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: true),
                    paidAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    planId = table.Column<Guid>(type: "uuid", nullable: true),
                    billingCycle = table.Column<int>(type: "integer", nullable: true),
                    createdAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    updatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    tenantId = table.Column<Guid>(type: "uuid", nullable: false, defaultValue: new Guid("00000000-0000-0000-0000-000000000001"))
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_payments", x => x.id);
                });

            migrationBuilder.CreateTable(
                name: "user_consents",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false),
                    userId = table.Column<Guid>(type: "uuid", nullable: false),
                    documentType = table.Column<int>(type: "integer", nullable: false),
                    documentVersion = table.Column<int>(type: "integer", nullable: false),
                    acceptedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    ipAddress = table.Column<string>(type: "character varying(64)", maxLength: 64, nullable: true),
                    createdAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    updatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    tenantId = table.Column<Guid>(type: "uuid", nullable: false, defaultValue: new Guid("00000000-0000-0000-0000-000000000001"))
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_user_consents", x => x.id);
                });

            migrationBuilder.CreateTable(
                name: "webhook_events",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false),
                    provider = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    externalEventId = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: false),
                    eventType = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    rawPayload = table.Column<string>(type: "text", nullable: true),
                    processedSuccessfully = table.Column<bool>(type: "boolean", nullable: false),
                    processingError = table.Column<string>(type: "character varying(1000)", maxLength: 1000, nullable: true),
                    receivedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    processedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    createdAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    updatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_webhook_events", x => x.id);
                });

            migrationBuilder.InsertData(
                table: "legal_documents",
                columns: new[] { "id", "content", "createdAt", "isActive", "publishedAt", "type", "updatedAt", "version" },
                values: new object[,]
                {
                    { new Guid("00000000-0000-0000-0000-0000000000c1"), "# Termos de Uso — AutoNexus\n\n**[RASCUNHO ESTRUTURAL — PENDENTE DE REVISÃO JURÍDICA. NÃO USAR COMO TERMO FINAL.]**\n\n1. Identificação do prestador de serviço\n[Razão social], inscrita no CNPJ sob o nº [CNPJ], com sede em [endereço completo] (\"AutoNexus\" ou \"nós\"), disponibiliza a plataforma AutoNexus (\"Plataforma\") como um serviço de software como serviço (SaaS) para gestão de compra, venda e troca de veículos.\n\n2. Aceite\nAo criar uma conta ou utilizar a Plataforma, você (\"Cliente\" ou \"Usuário\") declara ter lido, compreendido e aceitado estes Termos de Uso e a Política de Privacidade vigente.\n\n3. Cadastro e conta\n3.1. O Cliente é responsável pela veracidade das informações fornecidas no cadastro da empresa e dos usuários.\n3.2. O Cliente é responsável por manter a confidencialidade das credenciais de acesso de seus usuários.\n\n4. Planos, preços e pagamento\n4.1. O uso da Plataforma é condicionado à contratação de um plano pago, podendo haver período de teste gratuito (trial) conforme indicado no momento da contratação.\n4.2. Os valores vigentes de cada plano são exibidos na página de preços da Plataforma e podem ser alterados mediante aviso prévio.\n4.3. Os pagamentos são processados por gateway de pagamento terceirizado([gateway de pagamento]). O AutoNexus não armazena dados completos de cartão de crédito.\n\n5. Cancelamento\n5.1. O Cliente pode cancelar sua assinatura a qualquer momento através do painel da conta.\n5.2. O cancelamento não gera reembolso automático de período já pago, ressalvadas as hipóteses legais aplicáveis (ex.: direito de arrependimento em até 7 dias, art. 49 do CDC).\n\n6. Dados do Cliente\n6.1. Os dados inseridos pelo Cliente na Plataforma (veículos, clientes, documentos, etc.) permanecem de propriedade do Cliente.\n6.2. Em caso de cancelamento, os dados são mantidos pelo período descrito na Política de Privacidade antes de eventual exclusão/anonimização.\n\n7. Limitação de responsabilidade\n[A ser definido com apoio jurídico — cláusula padrão de limitação de responsabilidade proporcional ao valor pago, exclusão de danos indiretos, etc.]\n\n8. Foro\nFica eleito o foro da comarca de [cidade/UF] para dirimir eventuais controvérsias oriundas destes Termos, com renúncia a qualquer outro, por mais privilegiado que seja.\n\n9. Contato\nDúvidas sobre estes Termos podem ser enviadas para [e-mail de contato].\n\nVersão 1 — [data de publicação real a definir]", new DateTime(2026, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), true, new DateTime(2026, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), 1, null, 1 },
                    { new Guid("00000000-0000-0000-0000-0000000000c2"), "# Política de Privacidade — AutoNexus\n\n**[RASCUNHO ESTRUTURAL — PENDENTE DE REVISÃO JURÍDICA. NÃO USAR COMO POLÍTICA FINAL.]**\n\nEsta Política de Privacidade descreve como o AutoNexus coleta, usa, armazena e protege dados pessoais, em conformidade com a Lei Geral de Proteção de Dados (Lei nº 13.709/2018 — LGPD).\n\n1. Controlador de dados\n[Razão social], CNPJ [CNPJ]. Encarregado de Dados (DPO): [nome/e-mail do encarregado — a definir].\n\n2. Dados coletados\n2.1. Dados de cadastro: nome, e-mail, telefone, dados da empresa (razão social, CNPJ, endereço).\n2.2. Dados de uso: veículos cadastrados, clientes, documentos, histórico de navegação na Plataforma.\n2.3. Dados de pagamento: processados pelo gateway de pagamento — o AutoNexus não armazena número completo de cartão de crédito.\n\n3. Finalidade do tratamento\nPrestação do serviço contratado, comunicação sobre a conta e cobrança, cumprimento de obrigações legais/regulatórias, prevenção a fraude e melhoria da Plataforma.\n\n4. Base legal\nExecução de contrato (art. 7º, V, LGPD), cumprimento de obrigação legal (art. 7º, II) e, quando aplicável, consentimento (art. 7º, I).\n\n5. Compartilhamento de dados\nDados podem ser compartilhados com: gateway de pagamento ([Mercado Pago]), provedor de e-mail transacional ([Resend]), provedores de infraestrutura (hospedagem/banco de dados), e autoridades quando exigido por lei.\n\n6. Direitos do titular\nNos termos do art. 18 da LGPD, o titular pode solicitar: confirmação de tratamento, acesso, correção, anonimização/eliminação, portabilidade, informação sobre compartilhamento, e revogação de consentimento. Solicitações podem ser enviadas para [e-mail de contato do encarregado].\n\n7. Retenção e eliminação\nDados são mantidos enquanto a conta estiver ativa e pelo prazo adicional necessário para cumprimento de obrigações legais/fiscais após o cancelamento. Após esse prazo, podem ser anonimizados ou eliminados mediante solicitação do titular, observadas as exceções legais.\n\n8. Segurança\nAdotamos medidas técnicas e organizacionais para proteger os dados, incluindo isolamento lógico entre empresas clientes (multi-tenancy) e controle de acesso por autenticação.\n\n9. Cookies\nVeja a Política de Cookies para detalhes sobre o uso de cookies e tecnologias similares.\n\n10. Alterações\nEsta política pode ser atualizada; a versão vigente estará sempre disponível na Plataforma, com indicação da data/versão.\n\nVersão 1 — [data de publicação real a definir]", new DateTime(2026, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), true, new DateTime(2026, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), 2, null, 1 },
                    { new Guid("00000000-0000-0000-0000-0000000000c3"), "# Política de Cookies — AutoNexus\n\n**[RASCUNHO ESTRUTURAL — PENDENTE DE REVISÃO JURÍDICA.]**\n\n1. O que são cookies\nPequenos arquivos armazenados no navegador do usuário para permitir o funcionamento e a melhoria da Plataforma.\n\n2. Cookies utilizados\n2.1. Essenciais: necessários para autenticação e funcionamento básico (ex.: manter a sessão do usuário logado). Não podem ser desativados sem comprometer o funcionamento da Plataforma.\n2.2. Desempenho/analytics: [a definir caso sejam adicionadas ferramentas de analytics].\n\n3. Gerenciamento de cookies\nO usuário pode gerenciar/bloquear cookies diretamente nas configurações do navegador, ciente de que isso pode afetar o funcionamento da Plataforma.\n\n4. Alterações\nEsta política pode ser atualizada; a versão vigente estará sempre disponível na Plataforma.\n\nVersão 1 — [data de publicação real a definir]", new DateTime(2026, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), true, new DateTime(2026, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), 3, null, 1 }
                });

            migrationBuilder.UpdateData(
                table: "plans",
                keyColumn: "id",
                keyValue: new Guid("00000000-0000-0000-0000-0000000000f1"),
                columns: new[] { "annualPrice", "maxStorageMb", "maxUsers", "maxVehicles", "name", "price", "trialDays" },
                values: new object[] { 499.00m, null, null, null, "Starter", 49.90m, 7 });

            migrationBuilder.UpdateData(
                table: "plans",
                keyColumn: "id",
                keyValue: new Guid("00000000-0000-0000-0000-0000000000f2"),
                columns: new[] { "annualPrice", "maxStorageMb", "maxUsers", "maxVehicles", "name", "price", "trialDays" },
                values: new object[] { 999.00m, null, null, null, "Profissional", 99.90m, 7 });

            migrationBuilder.UpdateData(
                table: "plans",
                keyColumn: "id",
                keyValue: new Guid("00000000-0000-0000-0000-0000000000f3"),
                columns: new[] { "annualPrice", "maxStorageMb", "maxUsers", "maxVehicles", "name", "price", "trialDays" },
                values: new object[] { 1999.00m, null, null, null, "Premium", 199.90m, 7 });

            migrationBuilder.UpdateData(
                table: "plans",
                keyColumn: "id",
                keyValue: new Guid("00000000-0000-0000-0000-0000000000f4"),
                columns: new[] { "annualPrice", "isActive", "name", "price", "trialDays" },
                values: new object[] { null, false, "Enterprise (legado)", 0m, 0 });

            migrationBuilder.UpdateData(
                table: "tenant_subscriptions",
                keyColumn: "id",
                keyValue: new Guid("00000000-0000-0000-0000-0000000000a1"),
                columns: new[] { "billingCycle", "cancelledAt", "currentPeriodEnd", "externalSubscriptionId", "paymentMethod", "paymentProvider", "trialEndsAt", "trialReminderSentAt" },
                values: new object[] { 1, null, null, null, null, null, null, null });

            migrationBuilder.CreateIndex(
                name: "IX_tenant_subscriptions_externalSubscriptionId",
                table: "tenant_subscriptions",
                column: "externalSubscriptionId");

            migrationBuilder.CreateIndex(
                name: "IX_tenant_subscriptions_planId",
                table: "tenant_subscriptions",
                column: "planId");

            migrationBuilder.CreateIndex(
                name: "IX_tenant_subscriptions_status",
                table: "tenant_subscriptions",
                column: "status");

            migrationBuilder.CreateIndex(
                name: "IX_legal_documents_type_version",
                table: "legal_documents",
                columns: new[] { "type", "version" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_payments_externalPaymentId",
                table: "payments",
                column: "externalPaymentId");

            migrationBuilder.CreateIndex(
                name: "IX_payments_subscriptionId",
                table: "payments",
                column: "subscriptionId");

            migrationBuilder.CreateIndex(
                name: "IX_payments_tenantId",
                table: "payments",
                column: "tenantId");

            migrationBuilder.CreateIndex(
                name: "IX_user_consents_tenantId",
                table: "user_consents",
                column: "tenantId");

            migrationBuilder.CreateIndex(
                name: "IX_user_consents_userId",
                table: "user_consents",
                column: "userId");

            migrationBuilder.CreateIndex(
                name: "IX_webhook_events_provider_externalEventId",
                table: "webhook_events",
                columns: new[] { "provider", "externalEventId" },
                unique: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "legal_documents");

            migrationBuilder.DropTable(
                name: "payments");

            migrationBuilder.DropTable(
                name: "user_consents");

            migrationBuilder.DropTable(
                name: "webhook_events");

            migrationBuilder.DropIndex(
                name: "IX_tenant_subscriptions_externalSubscriptionId",
                table: "tenant_subscriptions");

            migrationBuilder.DropIndex(
                name: "IX_tenant_subscriptions_planId",
                table: "tenant_subscriptions");

            migrationBuilder.DropIndex(
                name: "IX_tenant_subscriptions_status",
                table: "tenant_subscriptions");

            migrationBuilder.DropColumn(
                name: "billingCycle",
                table: "tenant_subscriptions");

            migrationBuilder.DropColumn(
                name: "cancelledAt",
                table: "tenant_subscriptions");

            migrationBuilder.DropColumn(
                name: "currentPeriodEnd",
                table: "tenant_subscriptions");

            migrationBuilder.DropColumn(
                name: "externalSubscriptionId",
                table: "tenant_subscriptions");

            migrationBuilder.DropColumn(
                name: "paymentMethod",
                table: "tenant_subscriptions");

            migrationBuilder.DropColumn(
                name: "paymentProvider",
                table: "tenant_subscriptions");

            migrationBuilder.DropColumn(
                name: "trialEndsAt",
                table: "tenant_subscriptions");

            migrationBuilder.DropColumn(
                name: "trialReminderSentAt",
                table: "tenant_subscriptions");

            migrationBuilder.DropColumn(
                name: "annualPrice",
                table: "plans");

            migrationBuilder.DropColumn(
                name: "trialDays",
                table: "plans");

            migrationBuilder.UpdateData(
                table: "plans",
                keyColumn: "id",
                keyValue: new Guid("00000000-0000-0000-0000-0000000000f1"),
                columns: new[] { "maxStorageMb", "maxUsers", "maxVehicles", "name", "price" },
                values: new object[] { 500, 2, 10, "Free", 0m });

            migrationBuilder.UpdateData(
                table: "plans",
                keyColumn: "id",
                keyValue: new Guid("00000000-0000-0000-0000-0000000000f2"),
                columns: new[] { "maxStorageMb", "maxUsers", "maxVehicles", "name", "price" },
                values: new object[] { 2000, 5, 50, "Basic", 99m });

            migrationBuilder.UpdateData(
                table: "plans",
                keyColumn: "id",
                keyValue: new Guid("00000000-0000-0000-0000-0000000000f3"),
                columns: new[] { "maxStorageMb", "maxUsers", "maxVehicles", "name", "price" },
                values: new object[] { 10000, 20, 500, "Professional", 299m });

            migrationBuilder.UpdateData(
                table: "plans",
                keyColumn: "id",
                keyValue: new Guid("00000000-0000-0000-0000-0000000000f4"),
                columns: new[] { "isActive", "name", "price" },
                values: new object[] { true, "Enterprise", 999m });
        }
    }
}
