using System.Globalization;
using System.Text.Json;
using AutoNexus.Application.DTOs;
using AutoNexus.Application.Interfaces;

namespace AutoNexus.Infrastructure.Services;

/// <summary>
/// Integração com a API atual da Parallelum (FIPE v2).
/// Mantém a consulta histórica por código FIPE via BrasilAPI.
/// </summary>
public class BrasilApiFipeService : IFipeExternalService
{
    private readonly HttpClient _httpClient;

    public BrasilApiFipeService(HttpClient httpClient)
    {
        _httpClient = httpClient;
        _httpClient.BaseAddress = new Uri("https://fipe.parallelum.com.br/api/v2/");
        _httpClient.Timeout = TimeSpan.FromSeconds(20);
    }

    public async Task<IEnumerable<FipeLookupItemDto>> GetBrandsAsync(string vehicleType, CancellationToken cancellationToken = default)
    {
        var response = await _httpClient.GetAsync($"{MapVehicleType(vehicleType)}/brands", cancellationToken);
        response.EnsureSuccessStatusCode();

        using var doc = JsonDocument.Parse(await response.Content.ReadAsStringAsync(cancellationToken));
        return ReadLookupItems(doc.RootElement)
            .OrderBy(x => x.Name)
            .ToList();
    }

    public async Task<IEnumerable<FipeLookupItemDto>> GetModelsAsync(string vehicleType, string brandCode, CancellationToken cancellationToken = default)
    {
        var response = await _httpClient.GetAsync(
            $"{MapVehicleType(vehicleType)}/brands/{Uri.EscapeDataString(brandCode)}/models", cancellationToken);
        response.EnsureSuccessStatusCode();

        using var doc = JsonDocument.Parse(await response.Content.ReadAsStringAsync(cancellationToken));
        var root = doc.RootElement;
        // A API v2 retorna um array; o objeto "modelos" é aceito para compatibilidade.
        var items = root.ValueKind == JsonValueKind.Object && root.TryGetProperty("modelos", out var models)
            ? models
            : root;

        return ReadLookupItems(items).OrderBy(x => x.Name).ToList();
    }

    public async Task<IEnumerable<FipeLookupItemDto>> GetYearsAsync(string vehicleType, string brandCode, string modelCode, CancellationToken cancellationToken = default)
    {
        var response = await _httpClient.GetAsync(
            $"{MapVehicleType(vehicleType)}/brands/{Uri.EscapeDataString(brandCode)}/models/{Uri.EscapeDataString(modelCode)}/years",
            cancellationToken);
        response.EnsureSuccessStatusCode();

        using var doc = JsonDocument.Parse(await response.Content.ReadAsStringAsync(cancellationToken));
        return ReadLookupItems(doc.RootElement).ToList();
    }

    public async Task<(decimal FipeValue, int Month, int Year, string FipeCode)> FetchByBrandModelYearAsync(
        string vehicleType, string brandCode, string modelCode, string yearCode, CancellationToken cancellationToken = default)
    {
        var url = $"{MapVehicleType(vehicleType)}/brands/{Uri.EscapeDataString(brandCode)}/models/{Uri.EscapeDataString(modelCode)}/years/{Uri.EscapeDataString(yearCode)}";
        var response = await _httpClient.GetAsync(url, cancellationToken);
        response.EnsureSuccessStatusCode();

        using var doc = JsonDocument.Parse(await response.Content.ReadAsStringAsync(cancellationToken));
        var root = doc.RootElement;

        // Campos da FIPE v2: price, referenceMonth e codeFipe.
        // Mantém fallback para o formato legado da v1.
        var price = ReadString(root, "price", "Valor");
        var reference = ReadString(root, "referenceMonth", "MesReferencia");
        var code = ReadString(root, "codeFipe", "CodigoFipe");

        return (ParseCurrency(price), ParseReferenceMonthYear(reference).Month,
            ParseReferenceMonthYear(reference).Year, code);
    }

    public async Task<(decimal FipeValue, int Month, int Year)> FetchByFipeCodeAsync(
        string fipeCode, int? modelYear, CancellationToken cancellationToken = default)
    {
        var sanitizedCode = fipeCode.Replace("-", "").Trim();
        using var client = new HttpClient { BaseAddress = new Uri("https://brasilapi.com.br/api/fipe/v1/") };
        var response = await client.GetAsync(sanitizedCode, cancellationToken);
        response.EnsureSuccessStatusCode();

        using var doc = JsonDocument.Parse(await response.Content.ReadAsStringAsync(cancellationToken));
        var root = doc.RootElement;
        if (root.ValueKind != JsonValueKind.Array || root.GetArrayLength() == 0)
            throw new InvalidOperationException($"Nenhum resultado FIPE para o código '{fipeCode}'.");

        var target = root[0];
        if (modelYear.HasValue)
        {
            foreach (var item in root.EnumerateArray())
            {
                if (item.TryGetProperty("anoModelo", out var year) && year.GetInt32() == modelYear.Value)
                {
                    target = item;
                    break;
                }
            }
        }

        var value = target.GetProperty("valor").GetString() ?? "0";
        var month = target.GetProperty("mesReferencia").GetString() ?? "";
        var reference = ParseReferenceMonthYear(month);
        return (ParseCurrency(value), reference.Month, reference.Year);
    }

    private static IEnumerable<FipeLookupItemDto> ReadLookupItems(JsonElement root)
    {
        if (root.ValueKind != JsonValueKind.Array)
            throw new InvalidOperationException("A API FIPE retornou uma lista em formato inesperado.");

        foreach (var item in root.EnumerateArray())
        {
            var code = ReadString(item, "code", "codigo");
            var name = ReadString(item, "name", "nome");
            if (!string.IsNullOrWhiteSpace(code) && !string.IsNullOrWhiteSpace(name))
                yield return new FipeLookupItemDto(code, name);
        }
    }

    private static string ReadString(JsonElement element, string currentName, string legacyName)
    {
        if (element.TryGetProperty(currentName, out var current) && current.ValueKind == JsonValueKind.String)
            return current.GetString() ?? "";
        if (element.TryGetProperty(legacyName, out var legacy) && legacy.ValueKind == JsonValueKind.String)
            return legacy.GetString() ?? "";
        return "";
    }

    private static string MapVehicleType(string type)
    {
        var normalized = type?.Trim().ToLowerInvariant() ?? "carro";
        if (normalized.Contains("moto")) return "motorcycles";
        if (normalized.Contains("caminh")) return "trucks";
        return "cars";
    }

    private static decimal ParseCurrency(string value)
    {
        var clean = value.Replace("R$", "", StringComparison.OrdinalIgnoreCase).Trim();
        if (decimal.TryParse(clean, NumberStyles.Currency, new CultureInfo("pt-BR"), out var parsed))
            return parsed;
        return 0m;
    }

    private static (int Month, int Year) ParseReferenceMonthYear(string value)
    {
        var now = DateTime.UtcNow;
        if (string.IsNullOrWhiteSpace(value)) return (now.Month, now.Year);

        var parts = value.ToLowerInvariant().Split(new[] { " de ", " " }, StringSplitOptions.RemoveEmptyEntries);
        if (parts.Length < 2) return (now.Month, now.Year);

        var month = parts[0] switch
        {
            "janeiro" => 1, "fevereiro" => 2, "março" or "marco" => 3,
            "abril" => 4, "maio" => 5, "junho" => 6, "julho" => 7,
            "agosto" => 8, "setembro" => 9, "outubro" => 10,
            "novembro" => 11, "dezembro" => 12, _ => now.Month
        };
        var year = int.TryParse(parts[^1], out var parsedYear) ? parsedYear : now.Year;
        return (month, year);
    }
}
