using AutoNexus.Domain.Enums;

namespace AutoNexus.Application.DTOs;

/// <summary>Dados para iniciar uma assinatura recorrente cobrada em cartão de crédito.</summary>
public record CreateCardSubscriptionRequest(
    string PlanName,
    decimal Amount,
    BillingCycle Cycle,
    string PayerEmail,
    string ExternalReference,
    string BackUrl,
    /// <summary>Dias de teste grátis restantes: a primeira cobrança só ocorre depois deles.</summary>
    int? FreeTrialDays = null
);

public record CreateCardSubscriptionResult(
    string ExternalSubscriptionId,
    string CheckoutUrl
);

/// <summary>Dados para um pagamento avulso (Pix ou Boleto) — usado tanto no checkout inicial quanto em renovações manuais desses dois meios.</summary>
public record CreateOneTimePaymentRequest(
    decimal Amount,
    PaymentMethodType Method,
    string PayerEmail,
    string PayerName,
    string? PayerDocument,
    string Description,
    string ExternalReference,
    /// <summary>Stable key reused when retrying the same local payment creation.</summary>
    string? IdempotencyKey = null
);

public record CreateOneTimePaymentResult(
    string ExternalPaymentId,
    PaymentStatus Status,
    /// <summary>Pix: código copia-e-cola. Boleto: URL do boleto. Cartão (quando aplicável): link de checkout.</summary>
    string? PaymentDetail,
    /// <summary>Pix: imagem do QR Code em base64 (sem o prefixo data:image).</summary>
    string? QrCodeBase64
);

public record PaymentStatusResult(
    string ExternalPaymentId,
    PaymentStatus Status,
    string? RawStatus,
    decimal Amount = 0,
    /// <summary>external_reference que enviamos ao gateway ao criar a cobrança (id da assinatura local) — permite ligar cobranças recorrentes à assinatura certa.</summary>
    string? ExternalReference = null,
    PaymentMethodType? Method = null);

public enum ProviderSubscriptionStatus
{
    Pending = 1,
    Authorized = 2,
    Paused = 3,
    Cancelled = 4,
    Unknown = 99
}

/// <summary>Resultado da validação/parse de uma notificação de webhook recebida.</summary>
public record WebhookParseResult(
    bool IsValid,
    string? EventType,
    string? ExternalEventId,
    string? ExternalPaymentId,
    string? ExternalSubscriptionId
);
