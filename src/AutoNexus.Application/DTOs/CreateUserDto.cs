using AutoNexus.Domain.Enums;

namespace AutoNexus.Application.DTOs;
public record CreateUserDto(
    string Name,
    string Email,
    string Password,
    UserProfile Profile
);
