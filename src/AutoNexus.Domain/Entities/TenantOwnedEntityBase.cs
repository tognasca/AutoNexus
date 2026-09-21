namespace AutoNexus.Domain.Entities;

public abstract class TenantOwnedEntityBase : EntityBase
{
    public Guid TenantId { get; internal set; }
}
