using System.Net.Http;
using AutoNexus.Domain.Entities;
using AutoNexus.Domain.Models;

namespace AutoNexus.Domain.Interfaces;

public interface IBankAdapter
{
    string BankCode { get; }

    /// <summary>
    /// Converte os dados da proposta do AutoNexus no HttpRequestMessage exigido pela API do banco.
    /// </summary>
    HttpRequestMessage BuildHttpRequest(BankConfig config, CreditProposalRequest proposal);

    /// <summary>
    /// Converte a resposta HTTP retornada pelo banco no padrão interno de resposta do AutoNexus.
    /// </summary>
    CreditProposalResponse ParseHttpResponse(string rawResponseBody, int statusCode);
}