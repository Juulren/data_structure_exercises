using DataStructureExercises.Models.Entities;

namespace DataStructureExercises.Models.Common;

public sealed record AtencionBanco(ClienteBanco Cliente, DateTime HoraAtencion, decimal SegundosEspera);
public sealed record EstadoBanco(ClienteBanco[] Clientes, int Capacidad, int? Frente, int? Final, string[] Movimientos, AtencionBanco? UltimaAtencion);
public sealed record EstadoJuego(Guid? PartidaId, string Estado, CocheJuego[] Coches, CocheJuego? Atendido, string[] Colores,
    int Pintados, decimal TiempoSegundos, int IntervaloSegundos, decimal? ProximoEnSegundos, int MejorPuntaje, decimal RecordTiempoSegundos);
public sealed record VinculoAuto(string Placas, string Siguiente, string Anterior);
public sealed record TicketEstacionamiento(Guid Folio, AutoEstacionamiento Auto, DateTime HoraSalida, decimal Segundos, decimal Tarifa, decimal Importe);
public sealed record EstadoEstacionamiento(AutoEstacionamiento[] Autos, VinculoAuto[] Vinculos, decimal Tarifa, TicketEstacionamiento? UltimoTicket);
