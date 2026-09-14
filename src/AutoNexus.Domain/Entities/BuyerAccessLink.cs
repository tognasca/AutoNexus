namespace AutoNexus.Domain.Entities;

public class BuyerAccessLink : EntityBase
{
    public Guid VehicleId { get; private set; }
    public string Token { get; private set; } = string.Empty;
    public DateTime ExpiresAt { get; private set; }
    public bool IsRevoked { get; private set; }
    public Guid CreatedByUserId { get; private set; }
    public string? BuyerName { get; private set; }

    public Vehicle Vehicle { get; private set; } = null!;

    protected BuyerAccessLink() { }

    public BuyerAccessLink(Guid vehicleId, Guid createdByUserId, int expirationDays = 30, string? buyerName = null)
    {
        VehicleId = vehicleId;
        Token = Convert.ToHexString(Guid.NewGuid().ToByteArray()) + Convert.ToHexString(Guid.NewGuid().ToByteArray());
        ExpiresAt = DateTime.UtcNow.AddDays(expirationDays);
        IsRevoked = false;
        CreatedByUserId = createdByUserId;
        BuyerName = buyerName?.Trim();
    }

    public bool IsValid() => !IsRevoked && ExpiresAt > DateTime.UtcNow;

    public void Revoke()
    {
        IsRevoked = true;
        UpdatedAt = DateTime.UtcNow;
    }
}
