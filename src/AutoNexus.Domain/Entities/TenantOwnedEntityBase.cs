namespace AutoNexus.Domain.Entities;

/// <summary>
/// Toda entidade que representa um dado de negócio pertencente a uma empresa
/// (não um dado de referência global, como VehicleType/VehicleBrand/VehicleModel)
/// deve herdar desta classe em vez de <see cref="EntityBase"/> diretamente.
///
/// O TenantId NUNCA deve ser atribuído manualmente em código de
/// Application/API — ele é preenchido automaticamente pelo
/// AutoNexusDbContext (ver SaveChanges) a partir do ITenantContext resolvido
/// da requisição autenticada. O setter é "internal" justamente para impedir
/// que qualquer camada fora de Infrastructure o altere diretamente.
/// </summary>
public abstract class TenantOwnedEntityBase : EntityBase
{
    public Guid TenantId { get; internal set; }
}
