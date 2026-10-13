using System.Text;
using System.Threading.RateLimiting;
using AutoNexus.Application;
using AutoNexus.Infrastructure;
using AutoNexus.Infrastructure.Data;
using AutoNexus.Infrastructure.Data.Seeds;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Http.Features;
using Microsoft.AspNetCore.RateLimiting;
using Microsoft.IdentityModel.Tokens;

var builder = WebApplication.CreateBuilder(args);

// Variáveis de ambiente de produção com os nomes definidos pelo negócio
// (nunca valores no código): mapeadas para a configuração da aplicação.
var envToConfig = new Dictionary<string, string>
{
    ["MERCADOPAGO_ACCESS_TOKEN"] = "MercadoPago:AccessToken",
    ["MERCADOPAGO_WEBHOOK_SECRET"] = "MercadoPago:WebhookSecret",
    ["RESEND_API_KEY"] = "Resend:ApiKey",
    ["RESEND_FROM_EMAIL"] = "Resend:FromEmail",
    ["RESEND_FROM_NAME"] = "Resend:FromName",
    ["APPLICATION_URL"] = "Application:Url"
};
foreach (var (envName, configKey) in envToConfig)
{
    var envValue = Environment.GetEnvironmentVariable(envName);
    if (!string.IsNullOrWhiteSpace(envValue)) builder.Configuration[configKey] = envValue;
}

var wwwrootFolder = Path.Combine(builder.Environment.ContentRootPath, "wwwroot");
if (!Directory.Exists(wwwrootFolder))
{
    Directory.CreateDirectory(wwwrootFolder);
}
builder.Environment.WebRootPath = wwwrootFolder;

builder.Services.AddApplication();
builder.Services.AddInfrastructure(builder.Configuration);

var jwtSecretKey = builder.Configuration["Jwt:SecretKey"]
    ?? throw new InvalidOperationException("Jwt:SecretKey não configurada.");

builder.Services.AddAuthentication(options =>
{
    options.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
    options.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
})
.AddJwtBearer(options =>
{
    options.TokenValidationParameters = new TokenValidationParameters
    {
        ValidateIssuer = true,
        ValidateAudience = true,
        ValidateLifetime = true,
        ValidateIssuerSigningKey = true,
        ValidIssuer = builder.Configuration["Jwt:Issuer"],
        ValidAudience = builder.Configuration["Jwt:Audience"],
        IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtSecretKey)),
        ClockSkew = TimeSpan.Zero
    };
});

builder.WebHost.ConfigureKestrel(options =>
{
    options.Limits.MaxRequestBodySize = 52_428_800;
});

builder.Services.Configure<FormOptions>(options =>
{
    options.MultipartBodyLengthLimit = 52_428_800;
    options.ValueLengthLimit = int.MaxValue;
    options.MultipartHeadersLengthLimit = int.MaxValue;
});

builder.Services.AddAuthorization();

// Limita tentativas de login por IP — antes não havia nenhuma proteção
// contra força bruta. 5 tentativas por minuto é suficiente para uso legítimo
// (ninguém erra a senha 6 vezes em 60s) e já dificulta bastante um ataque
// automatizado. Aplicado só no endpoint de login (ver [EnableRateLimiting]
// no AuthController), não afeta o resto da API.
builder.Services.AddRateLimiter(options =>
{
    options.AddFixedWindowLimiter("login", limiterOptions =>
    {
        limiterOptions.PermitLimit = 5;
        limiterOptions.Window = TimeSpan.FromMinutes(1);
        limiterOptions.QueueProcessingOrder = QueueProcessingOrder.OldestFirst;
        limiterOptions.QueueLimit = 0;
    });
    options.AddFixedWindowLimiter("signup", limiterOptions =>
    {
        limiterOptions.PermitLimit = 10;
        limiterOptions.Window = TimeSpan.FromHours(1);
        limiterOptions.QueueLimit = 0;
    });
    options.OnRejected = async (context, cancellationToken) =>
    {
        context.HttpContext.Response.StatusCode = StatusCodes.Status429TooManyRequests;
        await context.HttpContext.Response.WriteAsJsonAsync(
            new { message = "Muitas tentativas. Aguarde um instante e tente novamente." },
            cancellationToken);
    };
});

builder.Services.AddHostedService<AutoNexus.Api.Workers.BillingMaintenanceWorker>();

builder.Services.AddControllers();
builder.Services.AddOpenApi();
builder.Services.AddHealthChecks(); // Diagnóstico de Saúde da Aplicação
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowFrontend", policy =>
    {
        policy.WithOrigins(
            "https://ademartognasca.com.br",
            "https://www.ademartognasca.com.br",
            "http://localhost:3000"
        )
        .AllowAnyHeader()
        .AllowAnyMethod()
        .AllowCredentials();
    });
});

var app = builder.Build();

using (var scope = app.Services.CreateScope())
{
    var context = scope.ServiceProvider.GetRequiredService<AutoNexusDbContext>();
    await DbInitializer.SeedAsync(context);
}

if (app.Environment.IsDevelopment())
{
    app.MapOpenApi();
}
// // Garantir que a pasta /uploads exista e seja servida
// var uploadsDirectory = Path.Combine(builder.Environment.ContentRootPath, "uploads");
// if (!Directory.Exists(uploadsDirectory))
// {
//     Directory.CreateDirectory(uploadsDirectory);
// }

// app.UseStaticFiles(new StaticFileOptions
// {
//     FileProvider = new PhysicalFileProvider(uploadsDirectory),
//     RequestPath = "/uploads"
// });

app.UseStaticFiles(); // Suporte a wwwroot se existir

if (!app.Environment.IsDevelopment())
{
    app.UseHttpsRedirection();
}

app.UseCors("AllowFrontend");

app.UseRateLimiter();

app.UseAuthentication();
app.UseMiddleware<AutoNexus.Api.Middleware.PlanLimitExceptionMiddleware>();
app.UseMiddleware<AutoNexus.Api.Middleware.SubscriptionAccessMiddleware>();
app.UseAuthorization();

app.MapHealthChecks("/health"); // Mapeamento da rota pública /health
app.MapControllers();

app.Run();
