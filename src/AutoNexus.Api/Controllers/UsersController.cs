using AutoNexus.Application.DTOs;
using AutoNexus.Application.Interfaces;
using AutoNexus.Domain.Entities;
using AutoNexus.Domain.Enums;
using AutoNexus.Domain.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace AutoNexus.Api.Controllers;

[ApiController]
[Route("api/users")]
[Authorize(Roles = "Admin,1")] // <-- Apenas Administrador pode listar e cadastrar usuários
public class UsersController : ControllerBase
{
    private readonly IUserRepository _userRepository;
    private readonly IPasswordHasher _passwordHasher;
    private readonly IUnitOfWork _unitOfWork;
    private readonly IAuditLogService _auditLogService;

    public UsersController(
        IUserRepository userRepository,
        IPasswordHasher passwordHasher,
        IUnitOfWork unitOfWork,
        IAuditLogService auditLogService)
    {
        _userRepository = userRepository;
        _passwordHasher = passwordHasher;
        _unitOfWork = unitOfWork;
        _auditLogService = auditLogService;
    }

    [HttpGet]
    public async Task<IActionResult> GetAll(CancellationToken cancellationToken)
    {
        var users = await _userRepository.GetAllAsync(cancellationToken);
        var dtos = users?.Select(u => new UserDto(
            Id: u.Id,
            Name: u.Name,
            Email: u.Email,
            Profile: u.Profile,
            ProfileName: u.Profile switch {
                UserProfile.Admin => "Administrador",
                UserProfile.Vendedor => "Vendedor",
                _ => "Cliente"
            },
            IsActive: u.IsActive,
            CreatedAt: u.CreatedAt,
            TenantId: u.TenantId
        )).OrderBy(u => u.Name);

        return Ok(dtos);
    }

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] CreateUserDto dto, CancellationToken cancellationToken)
    {
        // Checagem global (não só do tenant atual): o e-mail é único no banco
        // inteiro, então a validação amigável também precisa ser global —
        // ver EmailExistsAsync.
        var emailExists = await _userRepository.EmailExistsAsync(dto.Email, cancellationToken);
        if (emailExists)
        {
            return BadRequest(new { message = "Já existe um usuário cadastrado com este e-mail." });
        }

        var passwordHash = _passwordHasher.Hash(dto.Password);
        var user = new User(dto.Name, dto.Email, passwordHash, dto.Profile);

        await _userRepository.AddAsync(user, cancellationToken);

        // LogAsync (não LogForTenantAsync): esta requisição já é de um Admin
        // autenticado dentro do próprio tenant, então o contexto ambiente
        // (ITenantContext) já resolve tenant e usuário sozinho.
        await _auditLogService.LogAsync("CriarUsuario", "User", user.Id.ToString(), $"Usuário '{user.Name}' ({user.Email}) criado", cancellationToken);

        await _unitOfWork.CommitAsync(cancellationToken);

        return Ok(new UserDto(
            Id: user.Id,
            Name: user.Name,
            Email: user.Email,
            Profile: user.Profile,
            ProfileName: user.Profile == UserProfile.Admin ? "Administrador" : "Vendedor",
            IsActive: user.IsActive,
            CreatedAt: user.CreatedAt,
            TenantId: user.TenantId
        ));
    }
}