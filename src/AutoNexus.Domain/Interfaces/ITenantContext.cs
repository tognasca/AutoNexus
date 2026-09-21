namespace AutoNexus.Domain.Interfaces;

public interface ITenantContext
{
    bool HasTenant { get; }
    Guid TenantId { get; }
}
