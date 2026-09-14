namespace AutoNexus.Domain.Entities;

public class AuditLog : EntityBase
{
    public Guid? UserId { get; private set; }
    public string Operation { get; private set; } = string.Empty;
    public string Resource { get; private set; } = string.Empty;
    public string? ResourceId { get; private set; }
    public string? Details { get; private set; }
    public DateTime ExecutedAt { get; private set; }

    public AuditLog(
        Guid? userId,
        string operation,
        string resource,
        string? resourceId = null,
        string? details = null)
    {
        UserId = userId;
        Operation = operation;
        Resource = resource;
        ResourceId = resourceId;
        Details = details;
        ExecutedAt = DateTime.UtcNow;
    }
}