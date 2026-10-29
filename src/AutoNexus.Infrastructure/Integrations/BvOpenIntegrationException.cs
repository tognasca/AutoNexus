namespace AutoNexus.Infrastructure.Integrations;

public sealed class BvOpenIntegrationException : Exception
{
    public int? UpstreamStatusCode { get; }
    public string? CorrelationId { get; }

    public BvOpenIntegrationException(
        string message,
        int? upstreamStatusCode = null,
        string? correlationId = null,
        Exception? innerException = null)
        : base(message, innerException)
    {
        UpstreamStatusCode = upstreamStatusCode;
        CorrelationId = correlationId;
    }
}
