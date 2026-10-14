namespace AutoNexus.Application.DTOs;

public record ForgotPasswordDto(string Email);
public record ResetPasswordDto(string Token, string NewPassword);
public record ChangePasswordDto(string CurrentPassword, string NewPassword);
