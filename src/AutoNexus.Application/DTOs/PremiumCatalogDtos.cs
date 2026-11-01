namespace AutoNexus.Application.DTOs;

public record PremiumCatalogPublicationDto(string Domain, bool IsActive, DateTime? LastGeneratedAt);
public record SavePremiumCatalogPublicationDto(string Domain);
