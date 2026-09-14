namespace AutoNexus.Application.DTOs.Contract;
public record CustomerInfoDto(
    string Name,
    string Document, // CPF ou CNPJ
    string RgNumber,
    string Phone,
    string Email,
    string Address
);