using AutoNexus.Domain.Entities;
using AutoNexus.Domain.Enums;
using FluentAssertions;
using Xunit;

namespace AutoNexus.Domain.Tests;

public class LeadTests
{
    [Fact]
    public void Should_Create_Lead_With_Normalized_Fields_And_New_Status()
    {
        var lead = new Lead("  Maria Silva  ", " 11999998888 ", " MARIA@EXAMPLE.COM ", " Instagram ", " Primeiro contato ", null, null);

        lead.Name.Should().Be("Maria Silva");
        lead.Phone.Should().Be("11999998888");
        lead.Email.Should().Be("maria@example.com");
        lead.Source.Should().Be("Instagram");
        lead.Notes.Should().Be("Primeiro contato");
        lead.Status.Should().Be(LeadStatus.Novo);
    }

    [Theory]
    [InlineData("", "11999998888")]
    [InlineData("Maria Silva", "")]
    public void Should_Reject_Lead_Without_Name_Or_Phone(string name, string phone)
    {
        var action = () => new Lead(name, phone, null, null, null, null, null);
        action.Should().Throw<ArgumentException>();
    }

    [Fact]
    public void Registering_First_Contact_Should_Move_Lead_To_Contact_Status()
    {
        var lead = new Lead("Maria Silva", "11999998888", null, null, null, null, null);

        lead.RegisterContact();

        lead.Status.Should().Be(LeadStatus.Contato);
        lead.LastContactAt.Should().NotBeNull();
    }

    [Fact]
    public void Should_Allow_Lead_To_Move_Through_Sales_Pipeline()
    {
        var lead = new Lead("Maria Silva", "11999998888", null, null, null, null, null);

        lead.ChangeStatus(LeadStatus.Negociacao);
        lead.Status.Should().Be(LeadStatus.Negociacao);
        lead.ChangeStatus(LeadStatus.Proposta);
        lead.Status.Should().Be(LeadStatus.Proposta);
        lead.ChangeStatus(LeadStatus.Venda);
        lead.Status.Should().Be(LeadStatus.Venda);
    }
}
