namespace AutoNexus.Application.DTOs.Contract;

public record DigitalAcceptanceInfoDto(
    bool IsAccepted,
    DateTime? AcceptedAt,
    string? IpAddress,
    string? SecurityToken
);