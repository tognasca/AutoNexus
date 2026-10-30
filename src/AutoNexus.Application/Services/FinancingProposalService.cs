using System.Globalization;
using System.Text;
using System.Text.Json;
using System.Xml.Linq;
using AutoNexus.Application.DTOs;
using AutoNexus.Application.Interfaces;
using AutoNexus.Domain.Entities;
using AutoNexus.Domain.Interfaces;
using AutoNexus.Domain.Models;

namespace AutoNexus.Application.Services;

public sealed class FinancingProposalService : IFinancingProposalService
{
    private const string ManualBankId = "manual";
    private const string ManualBankName = "Cadastro manual / exportação";

    private readonly ICreditProposalRepository _repository;

    public FinancingProposalService(ICreditProposalRepository repository)
    {
        _repository = repository;
    }

    public async Task<FinancingProposalDto> CreateAsync(
        FinancingProposalCreateDto request,
        CancellationToken cancellationToken = default)
    {
        Validate(request);

        var safeRequest = new CreditProposalRequest(
            BankId: ManualBankId,
            BankName: ManualBankName,
            CustomerName: request.CustomerName.Trim(),
            CustomerCpf: request.CustomerCpf.Trim(),
            BirthDate: request.BirthDate,
            MonthlyIncome: request.MonthlyIncome,
            HasDriverLicense: request.HasDriverLicense,
            CustomerPhotoBase64: null,
            DriverLicensePhotoBase64: null,
            VehicleName: request.VehicleName.Trim(),
            FinancedAmount: request.FinancedAmount,
            Months: request.Months,
            InstallmentValue: request.InstallmentValue,
            Phone: request.Phone,
            Email: request.Email,
            MaritalStatus: request.MaritalStatus,
            Nationality: request.Nationality,
            AddressJson: request.Address is null ? null : JsonSerializer.Serialize(request.Address),
            ProfessionalJson: request.Professional is null ? null : JsonSerializer.Serialize(request.Professional),
            PrivacyConsent: request.PrivacyConsent,
            VehicleId: request.VehicleId,
            VehiclePrice: request.VehiclePrice,
            EntryValue: request.EntryValue,
            TradeValue: request.TradeValue);

        var payload = new
        {
            customer = new
            {
                request.CustomerName,
                request.CustomerCpf,
                request.BirthDate,
                request.MonthlyIncome,
                request.HasDriverLicense,
                request.Phone,
                request.Email,
                request.MaritalStatus,
                request.Nationality,
                address = request.Address,
                professional = request.Professional
            },
            vehicle = new
            {
                request.VehicleId,
                request.VehicleName,
                request.Brand,
                request.Model,
                request.VehicleYear,
                request.Plate,
                request.Renavam,
                request.Chassis,
                request.VehiclePrice
            },
            financial = new
            {
                request.EntryValue,
                request.TradeValue,
                request.FinancedAmount,
                request.Months,
                request.InstallmentValue
            },
            request.Notes,
            documentReferences = request.DocumentReferences ?? Array.Empty<string>()
        };

        var record = new CreditProposalRecord(safeRequest, JsonSerializer.Serialize(payload));
        record.SetResult(new CreditProposalResponse(
            "Draft",
            $"AUTO-{record.Id:N}",
            "Cadastro salvo no AutoNexus. Nenhuma financeira foi acionada.",
            null,
            null,
            null));

        await _repository.AddAsync(record, cancellationToken);
        return ToDto(record);
    }

    public async Task<IReadOnlyList<FinancingProposalDto>> ListAsync(CancellationToken cancellationToken = default)
    {
        var records = await _repository.GetAllAsync(cancellationToken);
        return records.Select(ToDto).ToList();
    }

    public async Task<(string Content, string ContentType, string FileName)> ExportAsync(
        Guid id,
        string format,
        CancellationToken cancellationToken = default)
    {
        var record = await _repository.GetByIdAsync(id, cancellationToken)
            ?? throw new KeyNotFoundException("Proposta de financiamento não encontrada.");

        var normalized = format.Trim().ToLowerInvariant();
        var payload = JsonSerializer.Deserialize<JsonElement>(record.RequestDataJson);
        var baseName = $"autonexus-financiamento-{record.ProposalNumber ?? record.Id.ToString("N")}";

        return normalized switch
        {
            "json" => (JsonSerializer.Serialize(payload, new JsonSerializerOptions { WriteIndented = true }), "application/json", baseName + ".json"),
            "xml" => (BuildXml(record, payload), "application/xml", baseName + ".xml"),
            "txt" => (BuildText(record, payload), "text/plain; charset=utf-8", baseName + ".txt"),
            "csv" => (BuildCsv(record, payload), "text/csv; charset=utf-8", baseName + ".csv"),
            _ => throw new ArgumentException("Formato de exportação inválido. Use XML, TXT, CSV ou JSON.", nameof(format))
        };
    }

    private static void Validate(FinancingProposalCreateDto request)
    {
        if (!request.PrivacyConsent)
            throw new ArgumentException("O consentimento informado é obrigatório para registrar a proposta.");
        if (string.IsNullOrWhiteSpace(request.CustomerName) || string.IsNullOrWhiteSpace(request.CustomerCpf))
            throw new ArgumentException("Nome e CPF do cliente são obrigatórios.");
        if (string.IsNullOrWhiteSpace(request.VehicleName))
            throw new ArgumentException("O veículo é obrigatório.");
        if (request.MonthlyIncome <= 0 || request.VehiclePrice <= 0 || request.FinancedAmount <= 0 || request.Months <= 0 || request.InstallmentValue <= 0)
            throw new ArgumentException("Os valores financeiros da proposta são inválidos.");
        if (request.EntryValue < 0 || request.TradeValue < 0)
            throw new ArgumentException("Entrada e troca não podem ser negativas.");
        if (Math.Abs(request.VehiclePrice - request.EntryValue - request.TradeValue - request.FinancedAmount) > 0.02m)
            throw new ArgumentException("Os valores da negociação não fecham com o saldo a financiar.");
    }

    private static FinancingProposalDto ToDto(CreditProposalRecord record) => new(
        record.Id,
        record.ProposalNumber ?? $"AUTO-{record.Id:N}",
        record.Status,
        record.CustomerName,
        record.CustomerCpf,
        record.VehicleName,
        record.RequestDataJson.TryGetDecimal("vehiclePrice"),
        record.RequestDataJson.TryGetDecimal("entryValue"),
        record.RequestDataJson.TryGetDecimal("tradeValue"),
        record.FinancedAmount,
        record.Months,
        record.InstallmentValue,
        record.CreatedAt,
        record.StatusUpdatedAt,
        record.Message);

    private static string BuildXml(CreditProposalRecord record, JsonElement payload)
    {
        var root = new XElement("FinancingProposal",
            new XElement("ProposalNumber", record.ProposalNumber),
            new XElement("Status", record.Status),
            new XElement("CustomerName", record.CustomerName),
            new XElement("CustomerCpf", record.CustomerCpf),
            new XElement("VehicleName", record.VehicleName),
            new XElement("FinancedAmount", record.FinancedAmount.ToString(CultureInfo.InvariantCulture)),
            new XElement("Months", record.Months),
            new XElement("InstallmentValue", record.InstallmentValue.ToString(CultureInfo.InvariantCulture)),
            JsonElementToXml(payload, "Data"));
        return new XDocument(new XDeclaration("1.0", "utf-8", "yes"), root).ToString();
    }

    private static XElement JsonElementToXml(JsonElement element, string name)
    {
        if (element.ValueKind != JsonValueKind.Object)
            return new XElement(name, element.ToString());

        var node = new XElement(name);
        foreach (var property in element.EnumerateObject())
            node.Add(JsonPropertyToXml(property));
        return node;
    }

    private static XElement JsonPropertyToXml(JsonProperty property)
    {
        if (property.Value.ValueKind == JsonValueKind.Object)
            return JsonElementToXml(property.Value, property.Name);
        if (property.Value.ValueKind == JsonValueKind.Array)
            return new XElement(property.Name, property.Value.EnumerateArray().Select(x => JsonElementToXml(x, "Item")));
        return new XElement(property.Name, property.Value.ToString());
    }

    private static string BuildText(CreditProposalRecord record, JsonElement payload)
    {
        var sb = new StringBuilder();
        sb.AppendLine("AUTONEXUS - PROPOSTA DE FINANCIAMENTO");
        sb.AppendLine($"Proposta: {record.ProposalNumber}");
        sb.AppendLine($"Status: {record.Status}");
        sb.AppendLine($"Cliente: {record.CustomerName}");
        sb.AppendLine($"CPF: {record.CustomerCpf}");
        sb.AppendLine($"Veículo: {record.VehicleName}");
        sb.AppendLine($"Valor financiado: {record.FinancedAmount.ToString("F2", CultureInfo.GetCultureInfo("pt-BR"))}");
        sb.AppendLine($"Parcelas: {record.Months}");
        sb.AppendLine($"Parcela: {record.InstallmentValue.ToString("F2", CultureInfo.GetCultureInfo("pt-BR"))}");
        sb.AppendLine();
        sb.AppendLine("DADOS COMPLETOS");
        sb.AppendLine(JsonSerializer.Serialize(payload, new JsonSerializerOptions { WriteIndented = true }));
        return sb.ToString();
    }

    private static string BuildCsv(CreditProposalRecord record, JsonElement payload)
    {
        var columns = new[] { "proposalNumber", "status", "customerName", "customerCpf", "vehicleName", "vehiclePrice", "entryValue", "tradeValue", "financedAmount", "months", "installmentValue", "payloadJson" };
        var values = new[]
        {
            Csv(record.ProposalNumber), Csv(record.Status), Csv(record.CustomerName), Csv(record.CustomerCpf), Csv(record.VehicleName),
            Csv(payload.GetProperty("vehicle").GetProperty("VehiclePrice").ToString()),
            Csv(payload.GetProperty("financial").GetProperty("EntryValue").ToString()),
            Csv(payload.GetProperty("financial").GetProperty("TradeValue").ToString()),
            Csv(record.FinancedAmount.ToString(CultureInfo.InvariantCulture)), Csv(record.Months.ToString(CultureInfo.InvariantCulture)),
            Csv(record.InstallmentValue.ToString(CultureInfo.InvariantCulture)), Csv(JsonSerializer.Serialize(payload))
        };
        return string.Join(";", columns) + "\r\n" + string.Join(";", values) + "\r\n";
    }

    private static string Csv(string? value) => $"\"{(value ?? string.Empty).Replace("\"", "\"\"")}\"";
}

internal static class FinancingJsonExtensions
{
    public static decimal TryGetDecimal(this string json, string propertyName)
    {
        try
        {
            var root = JsonSerializer.Deserialize<JsonElement>(json);
            if (root.TryGetProperty("vehicle", out var vehicle) && vehicle.TryGetProperty("VehiclePrice", out var vehiclePrice) && propertyName == "vehiclePrice") return vehiclePrice.GetDecimal();
            if (root.TryGetProperty("financial", out var financial) && financial.TryGetProperty("EntryValue", out var entry) && propertyName == "entryValue") return entry.GetDecimal();
            if (root.TryGetProperty("financial", out financial) && financial.TryGetProperty("TradeValue", out var trade) && propertyName == "tradeValue") return trade.GetDecimal();
        }
        catch { }
        return 0m;
    }
}
