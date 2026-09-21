using AutoNexus.Application.DTOs;
using AutoNexus.Application.Interfaces;
using AutoNexus.Domain.Enums;
using AutoNexus.Domain.Interfaces;

namespace AutoNexus.Application.Services;

public class AuthService : IAuthService
{
    private readonly IUserRepository _userRepository;
    private readonly ITenantRepository _tenantRepository;
    private readonly IPasswordHasher _passwordHasher;
    private readonly IJwtTokenGenerator _jwtTokenGenerator;

    public AuthService(
        IUserRepository userRepository,
        ITenantRepository tenantRepository,
        IPasswordHasher passwordHasher,
        IJwtTokenGenerator jwtTokenGenerator)
    {
        _userRepository = userRepository;
        _tenantRepository = tenantRepository;
        _passwordHasher = passwordHasher;
        _jwtTokenGenerator = jwtTokenGenerator;
    }

    public async Task<LoginResponseDto> LoginAsync(LoginRequestDto dto, CancellationToken cancellationToken = default)
    {
        if (string.IsNullOrWhiteSpace(dto.Email) || string.IsNullOrWhiteSpace(dto.Password))
            throw new UnauthorizedAccessException("E-mail e senha são obrigatórios.");

        var user = await _userRepository.GetByEmailAsync(dto.Email, cancellationToken);
        if (user == null || !user.IsActive)
            throw new UnauthorizedAccessException("Credenciais inválidas.");

        var isPasswordValid = _passwordHasher.Verify(dto.Password, user.PasswordHash);
        if (!isPasswordValid)
            throw new UnauthorizedAccessException("Credenciais inválidas.");

        // SuperAdmin não pertence a nenhum tenant (TenantId vazio de
        // propósito) — só usuários normais de uma empresa precisam checar se
        // a empresa continua ativa.
        if (user.Profile != UserProfile.SuperAdmin)
        {
            var tenant = await _tenantRepository.GetByIdAsync(user.TenantId, cancellationToken);
            if (tenant == null || !tenant.IsActive)
                throw new UnauthorizedAccessException("Esta empresa está desativada. Fale com o suporte.");
        }

        var token = _jwtTokenGenerator.GenerateToken(user);

        return new LoginResponseDto(
            token,
            user.Id,
            user.Name,
            user.Email,
            user.Profile
        );
    }

    public async Task<UserDto?> GetCurrentUserAsync(Guid userId, CancellationToken cancellationToken = default)
    {
        var user = await _userRepository.GetByIdAsync(userId, cancellationToken);
        if (user == null) return null;

        var ProfileName = user.Profile switch
        {
            Domain.Enums.UserProfile.SuperAdmin => "Super Admin",
            Domain.Enums.UserProfile.Admin => "Administrador",
            Domain.Enums.UserProfile.Vendedor => "Vendedor",
            _ => "Cliente"
        };

        return new UserDto(user.Id, user.Name, user.Email, user.Profile, ProfileName, user.IsActive, user.CreatedAt);
    }
}