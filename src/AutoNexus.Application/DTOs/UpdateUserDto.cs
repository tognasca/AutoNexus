using AutoNexus.Domain.Enums;

namespace AutoNexus.Application.DTOs;

public record UpdateUserDto(
    string Name,
    string Email,
    UserProfile Profile,
    bool IsActive
);