using AutoNexus.Domain.Entities;
using AutoNexus.Domain.Interfaces;
using AutoNexus.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace AutoNexus.Infrastructure.Repositories;

public class PaymentRepository : IPaymentRepository
{
    private readonly AutoNexusDbContext _context;

    public PaymentRepository(AutoNexusDbContext context)
    {
        _context = context;
    }

    public Task<List<Payment>> GetBySubscriptionAsync(Guid subscriptionId, CancellationToken cancellationToken = default)
        => _context.Payments
            .Where(p => p.SubscriptionId == subscriptionId)
            .OrderByDescending(p => p.CreatedAt)
            .ToListAsync(cancellationToken);

    public Task<Payment?> GetByExternalPaymentIdAsync(string externalPaymentId, CancellationToken cancellationToken = default)
        => _context.Payments.IgnoreQueryFilters()
            .FirstOrDefaultAsync(p => p.ExternalPaymentId == externalPaymentId, cancellationToken);

    public Task<Payment?> GetPendingWithoutExternalIdAsync(Guid subscriptionId, CancellationToken cancellationToken = default)
        => _context.Payments.IgnoreQueryFilters()
            .Where(p => p.SubscriptionId == subscriptionId && p.ExternalPaymentId == null && p.Status == Domain.Enums.PaymentStatus.Pending)
            .OrderByDescending(p => p.CreatedAt)
            .FirstOrDefaultAsync(cancellationToken);

    public async Task AddAsync(Payment payment, CancellationToken cancellationToken = default)
        => await _context.Payments.AddAsync(payment, cancellationToken);

    public async Task AddForTenantAsync(Payment payment, Guid tenantId, CancellationToken cancellationToken = default)
    {
        payment.TenantId = tenantId;
        await _context.Payments.AddAsync(payment, cancellationToken);
    }

    public void Update(Payment payment)
        => _context.Payments.Update(payment);
}
