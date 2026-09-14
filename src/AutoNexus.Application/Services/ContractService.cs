using System;
using System.Threading.Tasks;
using AutoNexus.Application.DTOs.Contract;
using AutoNexus.Application.Interfaces;
using AutoNexus.Domain.Interfaces;

namespace AutoNexus.Application.Services;

public class ContractService : IContractService
{
    private readonly IVehicleRepository _vehicleRepository;

    public ContractService(IVehicleRepository vehicleRepository)
    {
        _vehicleRepository = vehicleRepository;
    }

    public async Task<ContractDto> GenerateContractDataAsync(Guid vehicleId, ContractRequestDto request)
    {
        var vehicle = await _vehicleRepository.GetByIdAsync(vehicleId, includeDetails: true);
        if (vehicle == null) throw new KeyNotFoundException("Veículo não encontrado.");

        var store = new StoreInfoDto(
            Name: "AutoNexus Veículos Ltda",
            Cnpj: "12.345.678/0001-90",
            Address: "Av. Automotiva, 1000 - Centro, São Paulo - SP",
            Phone: "(11) 99999-8888",
            Email: "contato@autonexus.com.br"
        );

        var customer = new CustomerInfoDto(
            Name: request.CustomerName,
            Document: request.CustomerDocument,
            RgNumber: request.CustomerRg ?? "N/I",
            Phone: request.CustomerPhone,
            Email: request.CustomerEmail ?? "",
            Address: request.CustomerAddress ?? "Não informado"
        );

        var mainVehicle = new ContractVehicleDto(
            Brand: vehicle.Brand,
            Model: vehicle.Model,
            ModelYear: vehicle.ModelYear,
            ManufactureYear: vehicle.ManufacturingYear,
            Color: vehicle.Color ?? "N/I",
            LicensePlate: vehicle.Plate ?? "N/I",
            Chassi: vehicle.Chassis ?? "N/I",
            Renavam: vehicle.Renavam ?? "N/I",
            Mileage: vehicle.Mileage,
            Value: request.SaleValue
        );

        ContractVehicleDto? tradeVehicle = null;
        if (request.HasTrade && !string.IsNullOrWhiteSpace(request.TradeBrand))
        {
            tradeVehicle = new ContractVehicleDto(
                Brand: request.TradeBrand,
                Model: request.TradeModel ?? "",
                ModelYear: request.TradeYear,
                ManufactureYear: request.TradeYear,
                Color: request.TradeColor ?? "",
                LicensePlate: request.TradePlate ?? "",
                Chassi: request.TradeChassi ?? "N/I",
                Renavam: request.TradeRenavam ?? "N/I",
                Mileage: request.TradeMileage,
                Value: request.TradeValue
            );
        }

        var financials = new FinancialConditionsDto(
            TotalVehicleValue: mainVehicle.Value,
            EntryValue: request.EntryValue,
            TradeVehicleValue: request.TradeValue,
            FinancedValue: request.FinancedValue,
            InstallmentsCount: request.InstallmentsCount,
            InstallmentValue: request.InstallmentValue,
            PaymentMethod: request.PaymentMethod,
            Notes: request.Notes ?? ""
        );

        return new ContractDto(
            Id: Guid.NewGuid(),
            ContractNumber: $"CTX-{DateTime.UtcNow:yyyyMMdd}-{Random.Shared.Next(1000, 9999)}",
            IssueDate: DateTime.UtcNow,
            DocumentType: request.IsProposal ? "PROPOSTA COMERCIAL" : "CONTRATO DE COMPRA E VENDA",
            Store: store,
            Customer: customer,
            Vehicle: mainVehicle,
            TradeVehicle: tradeVehicle,
            Financials: financials,
            DigitalAcceptance: null
        );
    }
}