using AutoNexus.Application.Services;
using AutoNexus.Domain.Entities;
using AutoNexus.Domain.Interfaces;
using AutoNexus.Domain.Models;

namespace AutoNexus.Application.Tests;

public class FinancingHistoryTests
{
    [Theory]
    [InlineData("{\"VehiclePrice\":100000,\"EntryValue\":20000,\"TradeValue\":10000}")]
    [InlineData("{\"vehicle\":{\"VehiclePrice\":100000},\"financial\":{\"EntryValue\":20000,\"TradeValue\":10000}}")]
    [InlineData("{\"vehicle\":{\"vehiclePrice\":100000},\"financial\":{\"entryValue\":20000,\"tradeValue\":10000}}")]
    public async Task HistoricalAndManualPayloadsPreserveFinancialValuesAndExport(string json)
    {
        var request = new CreditProposalRequest("bank", "Banco", "Cliente", "00000000000", null,
            5000, true, null, null, "Veículo", 70000, 48, 2000, PrivacyConsent: true);
        var record = new CreditProposalRecord(request, json);
        var service = new FinancingProposalService(new Repository(record));
        var listed = Assert.Single(await service.ListAsync());
        Assert.Equal(100000, listed.VehiclePrice);
        Assert.Equal(20000, listed.EntryValue);
        Assert.Equal(10000, listed.TradeValue);
        var csv = await service.ExportAsync(record.Id, "csv");
        Assert.Contains("\"100000\"", csv.Content);
        Assert.Contains("\"20000\"", csv.Content);
    }

    private sealed class Repository(CreditProposalRecord record) : ICreditProposalRepository
    {
        public Task AddAsync(CreditProposalRecord value, CancellationToken ct = default) => Task.CompletedTask;
        public Task UpdateAsync(CreditProposalRecord value, CancellationToken ct = default) => Task.CompletedTask;
        public Task<CreditProposalRecord?> GetByIdAsync(Guid id, CancellationToken ct = default) => Task.FromResult<CreditProposalRecord?>(id == record.Id ? record : null);
        public Task<CreditProposalRecord?> GetByProposalNumberAsync(string number, CancellationToken ct = default) => Task.FromResult<CreditProposalRecord?>(record);
        public Task<IReadOnlyList<CreditProposalRecord>> GetAllAsync(CancellationToken ct = default) => Task.FromResult<IReadOnlyList<CreditProposalRecord>>([record]);
    }
}
