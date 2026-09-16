using AutoNexus.Domain.Enums;

namespace AutoNexus.Application.DTOs;

public record LoginRequestDto(string Email, string Password);

public record LoginResponseDto(
    string Token,
    Guid UserId,
    string Name,
    string Email,
    UserProfile Profile
);