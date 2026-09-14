using System;
using AutoNexus.Application.DTOs.Contract;


namespace AutoNexus.Application.DTOs.Contract;

public record ContractDto(
    Guid Id,
    string ContractNumber,
    DateTime IssueDate,
    string DocumentType, // "CONTRATO" ou "PROPOSTA"
    
    // Dados da Loja / Vendedor
    StoreInfoDto Store,

    // Dados do Cliente / Comprador
    CustomerInfoDto Customer,

    // Dados do Veículo Principal
    ContractVehicleDto Vehicle,

    // Dados do Veículo de Troca (se houver)
    ContractVehicleDto? TradeVehicle,

    // Condições Financeiras (em BRL)
    FinancialConditionsDto Financials,

    // Aceite Digital (se assinado online)
    DigitalAcceptanceInfoDto? DigitalAcceptance
);