using AutoNexus.Infrastructure.Integrations.Adapters;
namespace AutoNexus.Application.Tests;

public class SantanderResponseTests
{
    [Theory]
    [InlineData("not-json")]
    [InlineData("{}")]
    [InlineData("{\"statusProposta\":\"APROVADO\"}")]
    [InlineData("{\"statusProposta\":\"DESCONHECIDO\",\"idProposta\":\"123\"}")]
    [InlineData("{\"statusProposta\":\"PENDING\",\"idProposta\":\"\"}")]
    public void UnconfirmedResponsesNeverInventSubmissionOrApproval(string json)
    {
        var response = new SantanderBankAdapter().ParseHttpResponse(json, 200);
        Assert.Equal("Unavailable", response.Status);
        Assert.Equal("", response.ProposalNumber);
    }

    [Theory]
    [InlineData("APROVADO", "Approved")]
    [InlineData("RECUSADO", "Rejected")]
    [InlineData("EM_ANALISE", "Pending")]
    public void ExplicitProtocolAndKnownStatusArePreserved(string status, string expected)
    {
        var response = new SantanderBankAdapter().ParseHttpResponse(
            "{\"statusProposta\":\"" + status + "\",\"idProposta\":\"BANK-123\"}", 200);
        Assert.Equal(expected, response.Status);
        Assert.Equal("BANK-123", response.ProposalNumber);
    }

    [Fact]
    public void HttpFailureCannotApproveEvenWithApprovedPayload()
    {
        var response = new SantanderBankAdapter().ParseHttpResponse("{\"statusProposta\":\"APROVADO\",\"idProposta\":\"123\"}", 500);
        Assert.Equal("Unavailable", response.Status);
    }
}
