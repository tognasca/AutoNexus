using System.Text;
using System.Security.Cryptography;
using System.Threading.RateLimiting;
using AutoNexus.Application;
using AutoNexus.Infrastructure;
using AutoNexus.Infrastructure.Data;
using AutoNexus.Infrastructure.Data.Seeds;
using AutoNexus.Api.Security;
using Microsoft.EntityFrameworkCore;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Http.Features;
using Microsoft.AspNetCore.RateLimiting;
using Microsoft.Extensions.FileProviders;
using Microsoft.IdentityModel.Tokens;
using Microsoft.AspNetCore.HttpOverrides;
using System.Net;
var builder = WebApplication.CreateBuilder(args);

var envToConfig = new Dictionary<string, string>
{
    ["MERCADOPAGO_ACCESS_TOKEN"] = "MercadoPago:AccessToken",
    ["MERCADOPAGO_WEBHOOK_SECRET"] = "MercadoPago:WebhookSecret",
    ["RESEND_API_KEY"] = "Resend:ApiKey",
    ["RESEND_FROM_EMAIL"] = "Resend:FromEmail",
    ["RESEND_FROM_NAME"] = "Resend:FromName",
    ["BV_OPEN_ACCESS_TOKEN"] = "BvOpen:AccessToken",
    ["BV_OPEN_COMMERCIAL_PARTNER_CODE"] = "BvOpen:CommercialPartnerCode",
    ["BV_OPEN_FINANCING_CONDITIONS_ENDPOINT"] = "BvOpen:FinancingConditionsEndpoint",
    ["APPLICATION_URL"] = "Application:Url",
    ["AUTONEXUS_INITIAL_ADMIN_EMAIL"] = "Seed:AdminEmail",
    ["AUTONEXUS_INITIAL_ADMIN_PASSWORD"] = "Seed:AdminPassword",
    ["AUTONEXUS_SUPERADMIN_EMAIL"] = "Seed:SuperAdminEmail",
    ["AUTONEXUS_SUPERADMIN_PASSWORD"] = "Seed:SuperAdminPassword"
};
foreach (var (envName, configKey) in envToConfig)
{
    var envValue = Environment.GetEnvironmentVariable(envName);
    if (!string.IsNullOrWhiteSpace(envValue)) builder.Configuration[configKey] = envValue;
}

var wwwrootFolder = Path.Combine(builder.Environment.ContentRootPath, "wwwroot");
if (!Directory.Exists(wwwrootFolder)) Directory.CreateDirectory(wwwrootFolder);
builder.Environment.WebRootPath = wwwrootFolder;

builder.Services.AddApplication();
builder.Services.AddInfrastructure(builder.Configuration);

var jwtSecretKey = builder.Configuration["Jwt:SecretKey"]
    ?? throw new InvalidOperationException("Jwt:SecretKey não configurada.");
var jwtIssuer = builder.Configuration["Jwt:Issuer"] ?? "AutoNexusApi";
var jwtAudience = builder.Configuration["Jwt:Audience"] ?? "AutoNexusApp";

builder.Services.AddAuthentication(options =>
{
    options.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
    options.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
})
.AddJwtBearer(options =>
{
    options.TokenValidationParameters = new TokenValidationParameters
    {
        ValidateIssuer = true, ValidateAudience = true, ValidateLifetime = true,
        ValidateIssuerSigningKey = true, ValidIssuer = jwtIssuer, ValidAudience = jwtAudience,
        IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtSecretKey)),
        ClockSkew = TimeSpan.Zero
    };
});

builder.WebHost.ConfigureKestrel(options => options.Limits.MaxRequestBodySize = 52_428_800);
builder.Services.Configure<FormOptions>(options =>
{
    options.MultipartBodyLengthLimit = 52_428_800;
    options.ValueLengthLimit = int.MaxValue;
    options.MultipartHeadersLengthLimit = int.MaxValue;
});
builder.Services.AddAuthorization();
builder.Services.AddRateLimiter(options =>
{
    options.AddPolicy("login", context =>
    {
        // Use only the connection IP; forwarded headers must be handled by trusted proxy middleware.
        var clientIp = context.Connection.RemoteIpAddress?.ToString() ?? "unknown";
        return RateLimitPartition.GetFixedWindowLimiter(clientIp, _ => new FixedWindowRateLimiterOptions
        {
            PermitLimit = 5, Window = TimeSpan.FromMinutes(1),
            QueueProcessingOrder = QueueProcessingOrder.OldestFirst, QueueLimit = 0
        });
    });
    options.AddPolicy("signup", context =>
        RateLimitPartition.GetFixedWindowLimiter(context.Connection.RemoteIpAddress?.ToString() ?? "unknown",
            _ => new FixedWindowRateLimiterOptions { PermitLimit = 10, Window = TimeSpan.FromHours(1), QueueLimit = 0 }));
    options.OnRejected = async (context, cancellationToken) =>
    {
        context.HttpContext.Response.StatusCode = StatusCodes.Status429TooManyRequests;
        await context.HttpContext.Response.WriteAsJsonAsync(
            new { message = "Muitas tentativas. Aguarde um instante e tente novamente." }, cancellationToken);
    };
});

builder.Services.AddHostedService<AutoNexus.Api.Workers.BillingMaintenanceWorker>();
builder.Services.AddSingleton<MercadoPagoCredentialProtector>();
builder.Services.AddHttpClient();
builder.Services.AddControllers();
builder.Services.AddOpenApi();
builder.Services.AddHealthChecks();
builder.Services.AddCors(options => options.AddPolicy("AllowFrontend", policy =>
{
    policy.WithOrigins("https://atmotors.com.br", "https://www.atmotors.com.br", "https://novamarcha.ademartognasca.com.br", "https://autonexus.ademartognasca.com.br", "https://ademartognasca.com.br", "https://www.ademartognasca.com.br", "http://localhost:3000")
        .AllowAnyHeader().AllowAnyMethod().AllowCredentials();
}));
builder.Services.Configure<ForwardedHeadersOptions>(options =>
{
    options.ForwardedHeaders =
        ForwardedHeaders.XForwardedFor |
        ForwardedHeaders.XForwardedProto;

    options.KnownProxies.Add(IPAddress.Loopback);
    options.KnownProxies.Add(IPAddress.IPv6Loopback);

    // Only explicitly configured reverse-proxy IPs may supply forwarded headers.
    // Docker bridge addresses are deployment-specific; do not hardcode 172.18.0.1.
    var trustedProxies = builder.Configuration["Security:TrustedProxyIps"];
    if (!string.IsNullOrWhiteSpace(trustedProxies))
    {
        foreach (var entry in trustedProxies.Split(',', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries))
        {
            if (!IPAddress.TryParse(entry, out var proxyIp))
                throw new InvalidOperationException("Security:TrustedProxyIps contém um endereço IP inválido.");
            options.KnownProxies.Add(proxyIp);
        }
    }

    options.ForwardLimit = 1;
});
var app = builder.Build();
app.UseForwardedHeaders();
using (var scope = app.Services.CreateScope())
{
    var context = scope.ServiceProvider.GetRequiredService<AutoNexusDbContext>();
    await DbInitializer.SeedAsync(context, builder.Configuration, builder.Environment.IsDevelopment());
    var protector = scope.ServiceProvider.GetRequiredService<MercadoPagoCredentialProtector>();

    var savedMercadoPago = await context.MercadoPagoConfigurations
        .OrderByDescending(x => x.ConfiguredAtUtc).FirstOrDefaultAsync();
    if (savedMercadoPago != null)
    {
        try
        {
            builder.Configuration["MercadoPago:AccessToken"] = protector.Unprotect(savedMercadoPago.EncryptedAccessToken);
            builder.Configuration["MercadoPago:WebhookSecret"] = protector.Unprotect(savedMercadoPago.EncryptedWebhookSecret);
            builder.Configuration["MercadoPago:Environment"] = savedMercadoPago.Environment;
        }
        catch (Exception ex) when (ex is CryptographicException or FormatException)
        {
            Console.Error.WriteLine("Credenciais Mercado Pago inválidas/ilegíveis. Cadastre novamente no painel SuperAdmin.");
        }
    }

    var savedIntegrations = await context.PlatformIntegrationConfigurations
        .OrderByDescending(x => x.ConfiguredAtUtc).FirstOrDefaultAsync();
    if (savedIntegrations != null)
    {
        try
        {
            if (!string.IsNullOrWhiteSpace(savedIntegrations.EncryptedResendApiKey))
                builder.Configuration["Resend:ApiKey"] = protector.Unprotect(savedIntegrations.EncryptedResendApiKey);
            if (!string.IsNullOrWhiteSpace(savedIntegrations.ResendFromEmail))
                builder.Configuration["Resend:FromEmail"] = savedIntegrations.ResendFromEmail;
            builder.Configuration["Resend:FromName"] = savedIntegrations.ResendFromName;
            if (!string.IsNullOrWhiteSpace(savedIntegrations.EncryptedBvAccessToken))
                builder.Configuration["BvOpen:AccessToken"] = protector.Unprotect(savedIntegrations.EncryptedBvAccessToken);
            if (!string.IsNullOrWhiteSpace(savedIntegrations.EncryptedBvCommercialPartnerCode))
                builder.Configuration["BvOpen:CommercialPartnerCode"] = protector.Unprotect(savedIntegrations.EncryptedBvCommercialPartnerCode);
            builder.Configuration["BvOpen:FinancingConditionsEndpoint"] = savedIntegrations.BvFinancingConditionsEndpoint;
        }
        catch (Exception ex) when (ex is CryptographicException or FormatException)
        {
            Console.Error.WriteLine("Configurações Resend/BV não puderam ser descriptografadas. Rotacione e salve novamente as credenciais no painel SuperAdmin.");
        }
    }
}

if (app.Environment.IsDevelopment()) app.MapOpenApi();

var uploadsDirectory = Path.Combine(builder.Environment.ContentRootPath, "uploads");
if (!Directory.Exists(uploadsDirectory)) Directory.CreateDirectory(uploadsDirectory);
app.Use(async (context, next) =>
{
    if (context.Request.Path.StartsWithSegments("/uploads", out var relativePath))
    {
        var segments = relativePath.Value?.Split('/', StringSplitOptions.RemoveEmptyEntries) ?? [];
        var isImage = segments.Length > 0 && new[] { ".jpg", ".jpeg", ".png", ".webp" }
            .Contains(Path.GetExtension(segments[^1]), StringComparer.OrdinalIgnoreCase);
        var isTenantBrandingImage = segments.Length == 4 &&
            segments[0].Equals("tenants", StringComparison.OrdinalIgnoreCase) &&
            Guid.TryParse(segments[1], out _) && segments[2].Equals("branding", StringComparison.OrdinalIgnoreCase) &&
            Path.GetFileName(segments[3]) == segments[3];
        var isTenantVehiclePhoto = segments.Length == 5 &&
            segments[0].Equals("tenants", StringComparison.OrdinalIgnoreCase) &&
            Guid.TryParse(segments[1], out _) && segments[2].Equals("vehicles", StringComparison.OrdinalIgnoreCase) &&
            Guid.TryParse(segments[3], out _) && Path.GetFileName(segments[4]) == segments[4];
        var isLegacyVehiclePhoto = segments.Length == 3 &&
            segments[0].Equals("vehicles", StringComparison.OrdinalIgnoreCase) &&
            Guid.TryParse(segments[1], out _) && Path.GetFileName(segments[2]) == segments[2];
        if (!isImage || (!isTenantVehiclePhoto && !isTenantBrandingImage && !isLegacyVehiclePhoto))
        {
            context.Response.StatusCode = StatusCodes.Status404NotFound;
            return;
        }
    }
    await next();
});
app.UseStaticFiles(new StaticFileOptions
{
    FileProvider = new PhysicalFileProvider(uploadsDirectory),
    RequestPath = "/uploads"
});
app.UseStaticFiles();
if (!app.Environment.IsDevelopment()) app.UseHttpsRedirection();
app.UseCors("AllowFrontend");
app.UseRateLimiter();
app.UseAuthentication();
app.UseMiddleware<AutoNexus.Api.Middleware.PlanLimitExceptionMiddleware>();
app.UseMiddleware<AutoNexus.Api.Middleware.SubscriptionAccessMiddleware>();
app.UseAuthorization();
app.MapHealthChecks("/health");
app.MapControllers();
app.Run();
