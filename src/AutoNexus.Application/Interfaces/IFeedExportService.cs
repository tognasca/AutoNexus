namespace AutoNexus.Application.Interfaces;

public interface IFeedExportService
{
    Task<string> GenerateXmlFeedAsync();
}