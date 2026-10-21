using DataStructureExercises.Models.Common;

namespace DataStructureExercises.Services.Interfaces;

public interface IColasService
{
    EstadoBanco Banco();
    EstadoBanco InsertaCola(string? nombre, string? movimiento);
    EstadoBanco EliminaCola();
    EstadoBanco EditarCliente(int turno, string? nombre, string? movimiento);
    EstadoJuego Juego();
    EstadoJuego IniciarJuego();
    EstadoJuego Pintar(Guid partidaId, int cocheId, string? color);
    EstadoEstacionamiento Estacionamiento();
    EstadoEstacionamiento EntrarAuto(string? placas, string? propietario);
    EstadoEstacionamiento SalirAuto();
    EstadoEstacionamiento EditarAuto(int id, string? placas, string? propietario);
    void Reiniciar(int fase);
}
