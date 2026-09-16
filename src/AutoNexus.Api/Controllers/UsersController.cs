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
[Authorize]
public class UsersController : ControllerBase
{
    private readonly IUserRepository _userRepository;
    private readonly IPasswordHasher _passwordHasher;
    private readonly IUnitOfWork _unitOfWork;

    public UsersController(
        IUserRepository userRepository,
        IPasswordHasher passwordHasher,
        IUnitOfWork unitOfWork)
    {
        _userRepository = userRepository;
        _passwordHasher = passwordHasher;
        _unitOfWork = unitOfWork;
    }

    [HttpGet]
    public async Task<IActionResult> GetAll(CancellationToken cancellationToken)
    {
        var users = await _userRepository.GetAllAsync(cancellationToken);
        var dtos = users.Select(u => new UserDto(
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
            CreatedAt: u.CreatedAt
        )).OrderBy(u => u.Name);

        return Ok(dtos);
    }

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] CreateUserDto dto, CancellationToken cancellationToken)
    {
        var existing = await _userRepository.GetByEmailAsync(dto.Email, cancellationToken);
        if (existing != null)
        {
            return BadRequest(new { message = "Já existe um usuário cadastrado com este e-mail." });
        }

        var passwordHash = _passwordHasher.Hash(dto.Password);
        var user = new User(dto.Name, dto.Email, passwordHash, dto.Profile);

        await _userRepository.AddAsync(user, cancellationToken);
        await _unitOfWork.CommitAsync(cancellationToken);

        return Ok(new UserDto(
            Id: user.Id,
            Name: user.Name,
            Email: user.Email,
            Profile: user.Profile,
            ProfileName: user.Profile == UserProfile.Admin ? "Administrador" : "Vendedor",
            IsActive: user.IsActive,
            CreatedAt: user.CreatedAt
        ));
    }
}