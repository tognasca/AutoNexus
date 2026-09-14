using AutoNexus.Domain.Entities;

namespace AutoNexus.Application.Interfaces;

public interface IJwtTokenGenerator
{
    string GenerateToken(User user);
}