

using AutoNexus.Domain.Models;

namespace AutoNexus.Domain.Interfaces;
 
public interface IBankCreditService
{
    Task<CreditProposalResponse> SubmitProposalAsync(CreditProposalRequest request);
    Task<CreditProposalResponse> CheckStatusAsync(string proposalNumber);
}