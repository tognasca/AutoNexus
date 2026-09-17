
using System.Xml.Linq;
using AutoNexus.Application.Interfaces;
using AutoNexus.Domain.Enums;
using AutoNexus.Domain.Interfaces;

namespace AutoNexus.Application.Services;

public class FeedExportService : IFeedExportService
{
    private readonly IVehicleRepository _vehicleRepository;

    public FeedExportService(IVehicleRepository vehicleRepository)
    {
        _vehicleRepository = vehicleRepository;
    }

    public async Task<string> GenerateXmlFeedAsync()
    {
        var vehicles = await _vehicleRepository.GetByListAsync();
        var availableVehicles = vehicles.Where(v => v.Status == VehicleStatus.AVenda).ToList();

        var xml = new XDocument(
            new XDeclaration("1.0", "utf-8", "yes"),
            new XElement("estoque",
                new XAttribute("data_geracao", DateTime.Now.ToString("yyyy-MM-dd HH:mm:ss")),
                new XAttribute("total_veiculos", availableVehicles.Count),
                availableVehicles.Select(v => new XElement("veiculo",
                    new XElement("id", v.Id),
                    new XElement("marca", v.Brand),
                    new XElement("modelo", v.Model),
                    new XElement("ano_fabricacao", v.ManufacturingYear),
                    new XElement("ano_modelo", v.ModelYear),
                    new XElement("placa", v.Plate),
                    new XElement("cor", v.Color),
                    new XElement("combustivel", v.Fuel),
                    new XElement("cambio", v.Transmission),
                    new XElement("quilometragem", v.Mileage),
                    new XElement("preco", v.ListedValue),
                    new XElement("preco_fipe", v.FipeHistories.FirstOrDefault(x => x.VehicleId == v.Id)?.FipeValue ?? 0),
                    new XElement("descricao", v.Notes ?? string.Empty),
                    new XElement("fotos",
                        v.Photos?.Select(p => new XElement("foto", p.StoragePath))
                    )
                    // new XElement("opcionais",
                    //     v.Optionals?.Select(o => new XElement("opcional", o.Name))
                    // )
                ))
            )
        );

        return xml.ToString();
    }
}