using System.Globalization;
using System.Text.Json;
using AutoNexus.Application.DTOs;
using AutoNexus.Application.Interfaces;

namespace AutoNexus.Infrastructure.Services;

public class BrasilApiFipeService : IFipeExternalService
{
    private readonly HttpClient _httpClient;

    public BrasilApiFipeService(HttpClient httpClient)
    {
        _httpClient = httpClient;
        _httpClient.BaseAddress = new Uri("https://parallelum.com.br/fipe/api/v1/");
    }

    public async Task<IEnumerable<FipeLookupItemDto>> GetBrandsAsync(string vehicleType, CancellationToken cancellationToken = default)
    {
        var type = MapVehicleType(vehicleType);
        var response = await _httpClient.GetAsync($"{type}/marcas", cancellationToken);
        response.EnsureSuccessStatusCode();

        var json = await response.Content.ReadAsStringAsync(cancellationToken);
        using var doc = JsonDocument.Parse(json);

        var list = new List<FipeLookupItemDto>();
        foreach (var item in doc.RootElement.EnumerateArray())
        {
            var code = item.GetProperty("codigo").GetString() ?? "";
            var name = item.GetProperty("nome").GetString() ?? "";
            list.Add(new FipeLookupItemDto(code, name));
        }

        return list.OrderBy(x => x.Name);
    }

    public async Task<IEnumerable<FipeLookupItemDto>> GetModelsAsync(string vehicleType, string brandCode, CancellationToken cancellationToken = default)
    {
        var type = MapVehicleType(vehicleType);
        var response = await _httpClient.GetAsync($"{type}/marcas/{brandCode}/modelos", cancellationToken);
        response.EnsureSuccessStatusCode();

        var json = await response.Content.ReadAsStringAsync(cancellationToken);
        using var doc = JsonDocument.Parse(json);

        var list = new List<FipeLookupItemDto>();
        if (doc.RootElement.TryGetProperty("modelos", out var modelosArray))
        {
            foreach (var item in modelosArray.EnumerateArray())
            {
                var code = item.GetProperty("codigo").GetInt32().ToString();
                var name = item.GetProperty("nome").GetString() ?? "";
                list.Add(new FipeLookupItemDto(code, name));
            }
        }

        return list.OrderBy(x => x.Name);
    }

    public async Task<IEnumerable<FipeLookupItemDto>> GetYearsAsync(string vehicleType, string brandCode, string modelCode, CancellationToken cancellationToken = default)
    {
        var type = MapVehicleType(vehicleType);
        var response = await _httpClient.GetAsync($"{type}/marcas/{brandCode}/modelos/{modelCode}/anos", cancellationToken);
        response.EnsureSuccessStatusCode();

        var json = await response.Content.ReadAsStringAsync(cancellationToken);
        using var doc = JsonDocument.Parse(json);

        var list = new List<FipeLookupItemDto>();
        foreach (var item in doc.RootElement.EnumerateArray())
        {
            var code = item.GetProperty("codigo").GetString() ?? "";
            var name = item.GetProperty("nome").GetString() ?? "";
            list.Add(new FipeLookupItemDto(code, name));
        }

        return list;
    }

    public async Task<(decimal FipeValue, int Month, int Year, string FipeCode)> FetchByBrandModelYearAsync(
        string vehicleType, string brandCode, string modelCode, string yearCode, CancellationToken cancellationToken = default)
    {
        var type = MapVehicleType(vehicleType);
        var response = await _httpClient.GetAsync($"{type}/marcas/{brandCode}/modelos/{modelCode}/anos/{yearCode}", cancellationToken);
        response.EnsureSuccessStatusCode();

        var json = await response.Content.ReadAsStringAsync(cancellationToken);
        using var doc = JsonDocument.Parse(json);
        var root = doc.RootElement;

        var valorStr = root.GetProperty("Valor").GetString() ?? "0";
        var mesRefStr = root.GetProperty("MesReferencia").GetString() ?? "";
        var fipeCode = root.GetProperty("CodigoFipe").GetString() ?? "";

        var decimalValue = ParseCurrency(valorStr);
        var (month, year) = ParseReferenceMonthYear(mesRefStr);

        return (decimalValue, month, year, fipeCode);
    }

    public async Task<(decimal FipeValue, int Month, int Year)> FetchByFipeCodeAsync(string fipeCode, int? modelYear, CancellationToken cancellationToken = default)
    {
        var sanitizedCode = fipeCode.Replace("-", "").Trim();
        using var client = new HttpClient { BaseAddress = new Uri("https://brasilapi.com.br/api/fipe/v1/") };
        var response = await client.GetAsync($"{sanitizedCode}", cancellationToken);
        response.EnsureSuccessStatusCode();

        var json = await response.Content.ReadAsStringAsync(cancellationToken);
        using var doc = JsonDocument.Parse(json);
        var root = doc.RootElement;

        if (root.ValueKind != JsonValueKind.Array || root.GetArrayLength() == 0)
            throw new InvalidOperationException($"Nenhum resultado FIPE para o código '{fipeCode}'.");

        JsonElement targetElement = root[0];
        if (modelYear.HasValue)
        {
            foreach (var element in root.EnumerateArray())
            {
                if (element.TryGetProperty("anoModelo", out var yearProp) && yearProp.GetInt32() == modelYear.Value)
                {
                    targetElement = element;
                    break;
                }
            }
        }

        var valorStr = targetElement.GetProperty("valor").GetString() ?? "0";
        var mesRefStr = targetElement.GetProperty("mesReferencia").GetString() ?? "";

        return (ParseCurrency(valorStr), ParseReferenceMonthYear(mesRefStr).Month, ParseReferenceMonthYear(mesRefStr).Year);
    }

    private static string MapVehicleType(string type)
    {
        var t = type?.ToLower().Trim() ?? "carro";
        if (t.Contains("moto")) return "motos";
        if (t.Contains("caminh")) return "caminhoes";
        return "carros";
    }

    private static decimal ParseCurrency(string valorStr)
    {
        var clean = valorStr.Replace("R$", "").Replace(".", "").Trim();
        if (decimal.TryParse(clean, NumberStyles.Currency, new CultureInfo("pt-BR"), out var val))
            return val;
        return 0m;
    }

    private static (int Month, int Year) ParseReferenceMonthYear(string mesRefStr)
    {
        var now = DateTime.UtcNow;
        if (string.IsNullOrWhiteSpace(mesRefStr)) return (now.Month, now.Year);

        var parts = mesRefStr.ToLower().Split(new[] { "de", " " }, StringSplitOptions.RemoveEmptyEntries);
        if (parts.Length < 2) return (now.Month, now.Year);

        var monthName = parts[0].Trim();
        var yearStr = parts[^1].Trim();

        int month = monthName switch
        {
            "janeiro" => 1,
            "fevereiro" => 2,
            "março font" or "março" => 3,
            "abril" => 4,
            "maio" => 5,
            "junho" => 6,
            "julho" => 7,
            "agosto" => 8,
            "setembro" => 9,
            "outubro" => 10,
            "novembro" => 11,
            "dezembro" => 12,
            _ => now.Month
        };

        int year = int.TryParse(yearStr, out var y) ? y : now.Year;
        return (month, year);
    }
}
