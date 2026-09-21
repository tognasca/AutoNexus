using AutoNexus.Domain.Enums;
namespace AutoNexus.Application.DTOs;

public record UserDto(
    Guid Id,
    string Name,
    string Email,
    UserProfile Profile,
    string ProfileName,
    bool IsActive,
    DateTime CreatedAt,
    Guid TenantId
);