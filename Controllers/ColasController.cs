using System.Globalization;
using DataStructureExercises.Models.Common;
using DataStructureExercises.Services.Interfaces;
using Microsoft.AspNetCore.Mvc;

namespace DataStructureExercises.Controllers;

public sealed record EntradaCliente(string? Nombre, string? Movimiento);
public sealed record EntradaAuto(string? Placas, string? Propietario);
public sealed record EntradaPintura(string? PartidaId, string? CocheId, string? Color);

[ApiController]
[Route("api/colas")]
public sealed class ColasController(IColasService colas) : ControllerBase
{
    [HttpGet("banco")] public object Banco() => ApiResponse<EstadoBanco>.Ok(colas.Banco());
    [HttpPost("banco")] public object Insertar(EntradaCliente entrada) => ApiResponse<EstadoBanco>.Ok(colas.InsertaCola(entrada.Nombre, entrada.Movimiento));
    [HttpDelete("banco/frente")] public object Atender() => ApiResponse<EstadoBanco>.Ok(colas.EliminaCola());
    [HttpPut("banco/{turno:int}")] public object EditarCliente(int turno, EntradaCliente entrada) => ApiResponse<EstadoBanco>.Ok(colas.EditarCliente(turno, entrada.Nombre, entrada.Movimiento));
    [HttpGet("juego")] public object Juego() => ApiResponse<EstadoJuego>.Ok(colas.Juego());
    [HttpPost("juego/iniciar")] public object Iniciar() => ApiResponse<EstadoJuego>.Ok(colas.IniciarJuego());
    [HttpPost("juego/pintar")] public object Pintar(EntradaPintura entrada)
    {
        if (string.IsNullOrWhiteSpace(entrada.PartidaId) || string.IsNullOrWhiteSpace(entrada.CocheId) || string.IsNullOrWhiteSpace(entrada.Color))
            throw new ReglaNegocioException("Hay datos faltantes");
        if (!int.TryParse(entrada.CocheId, NumberStyles.None, CultureInfo.InvariantCulture, out var id)) throw new FormatException();
        if (!Guid.TryParse(entrada.PartidaId, out var partida)) throw new ReglaNegocioException("La partida no es válida");
        return ApiResponse<EstadoJuego>.Ok(colas.Pintar(partida, id, entrada.Color));
    }
    [HttpGet("estacionamiento")] public object Estacionamiento() => ApiResponse<EstadoEstacionamiento>.Ok(colas.Estacionamiento());
    [HttpPost("estacionamiento")] public object Entrar(EntradaAuto entrada) => ApiResponse<EstadoEstacionamiento>.Ok(colas.EntrarAuto(entrada.Placas, entrada.Propietario));
    [HttpDelete("estacionamiento/frente")] public object Salir() => ApiResponse<EstadoEstacionamiento>.Ok(colas.SalirAuto());
    [HttpPut("estacionamiento/{id:int}")] public object EditarAuto(int id, EntradaAuto entrada) => ApiResponse<EstadoEstacionamiento>.Ok(colas.EditarAuto(id, entrada.Placas, entrada.Propietario));
    [HttpDelete("{fase:int}/reiniciar")] public object Reiniciar(int fase)
    {
        colas.Reiniciar(fase);
        return ApiResponse<object>.Ok(new { fase });
    }
}
