using System.Runtime.CompilerServices;

// Permite que a camada de Infrastructure (EF Core: DbContext, seeds, migrations)
// atribua o TenantId das entidades através de setters "internal" — sem expor
// esse setter publicamente para regras de negócio (Application/API), que nunca
// devem definir o TenantId manualmente. Isso mantém a garantia de que o
// TenantId só é atribuído de forma centralizada (ver TenantOwnedEntityBase e
// AutoNexusDbContext.SaveChanges).
[assembly: InternalsVisibleTo("AutoNexus.Infrastructure")]
