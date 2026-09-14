namespace AutoNexus.Application.DTOs.Contract;

public record StoreInfoDto(
    string Name,
    string Cnpj,
    string Address,
    string Phone,
    string Email
);
