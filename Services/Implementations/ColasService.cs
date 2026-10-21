using System.Text;
using DataStructureExercises.Models.Common;
using DataStructureExercises.Models.Entities;
using DataStructureExercises.Models.Structures;
using DataStructureExercises.Services.Interfaces;

namespace DataStructureExercises.Services.Implementations;

public sealed class ColasService(TimeProvider reloj) : IColasService
{
    private readonly object sync = new();
    private readonly ColaConLimite<ClienteBanco> banco = new(10);
    private readonly ColaConLimite<CocheJuego> coches = new(5);
    private readonly ColaCircularDoble<AutoEstacionamiento> autos = new();
    private static readonly string[] movimientos = ["Pago de servicio", "Depósito", "Retiro", "Compra de tiempo-aire", "Consulta de saldo"];
    private static readonly string[] colores = ["Naranja", "Rojo", "Verde", "Azul", "Amarillo", "Morado"];
    private int turno, autoId, cocheId, pintados, mejorPuntaje;
    private AtencionBanco? ultimaAtencion;
    private TicketEstacionamiento? ultimoTicket;
    private Guid? partidaId;
    private string estadoJuego = "Sin iniciar";
    private CocheJuego? atendido;
    private DateTime inicio, fin, proximaLlegada, ultimaLlegada;
    private int intervalo = 20;
    private decimal recordTiempo;
    private DateTime Ahora => reloj.GetUtcNow().UtcDateTime;
    private static decimal Segundos(DateTime desde, DateTime hasta) => Math.Max(0m, (hasta.Ticks - desde.Ticks) / (decimal)TimeSpan.TicksPerSecond);
    private static string Texto(string? valor, int maximo = 100)
    {
        if (string.IsNullOrWhiteSpace(valor)) throw new ReglaNegocioException("Hay datos faltantes");
        valor = valor.Trim().Normalize(NormalizationForm.FormC);
        if (valor.Length > maximo) throw new ReglaNegocioException($"El texto no debe superar {maximo} caracteres");
        return valor;
    }
    private static string Movimiento(string? valor)
    {
        valor = Texto(valor);
        if (!movimientos.Contains(valor)) throw new ReglaNegocioException("Selecciona un tipo de movimiento válido");
        return valor;
    }
    public EstadoBanco Banco()
    {
        lock (sync) return new(banco.ToArray(), banco.Capacidad, banco.FrenteIndice, banco.FinalIndice, movimientos.ToArray(), ultimaAtencion);
    }
    public EstadoBanco InsertaCola(string? nombre, string? movimiento)
    {
        lock (sync)
        {
            nombre = Texto(nombre); movimiento = Movimiento(movimiento);
            if (banco.ColaLlena()) throw new ReglaNegocioException("La cola está llena", 409);
            banco.Enqueue(new(++turno, nombre, movimiento, Ahora));
            return Banco();
        }
    }
    public EstadoBanco EliminaCola()
    {
        lock (sync)
        {
            if (banco.ColaVacia()) throw new ReglaNegocioException("La cola está vacía", 409);
            var cliente = banco.Dequeue(); var ahora = Ahora;
            ultimaAtencion = new(cliente, ahora, Segundos(cliente.HoraLlegada, ahora));
            return Banco();
        }
    }
    public EstadoBanco EditarCliente(int turno, string? nombre, string? movimiento)
    {
        lock (sync)
        {
            nombre = Texto(nombre); movimiento = Movimiento(movimiento);
            var cliente = banco.FirstOrDefault(c => c.Turno == turno) ?? throw new ReglaNegocioException("El cliente no existe", 404);
            banco.Reemplazar(c => c.Turno == turno, cliente with { Nombre = nombre, Movimiento = movimiento });
            return Banco();
        }
    }

    private void AvanzarJuego(DateTime ahora)
    {
        // Se recuperan también las llegadas ocurridas con la página cerrada o sin conexión.
        while (estadoJuego == "En curso" && ahora >= proximaLlegada)
        {
            ultimaLlegada = proximaLlegada;
            coches.Enqueue(new(++cocheId, colores[Random.Shared.Next(colores.Length)], ultimaLlegada));
            if (coches.ColaLlena())
            {
                estadoJuego = "Finalizado"; fin = ultimaLlegada;
                var tiempo = Segundos(inicio, fin);
                if (pintados > mejorPuntaje || (pintados == mejorPuntaje && tiempo > recordTiempo))
                { mejorPuntaje = pintados; recordTiempo = tiempo; }
            }
            else proximaLlegada = ultimaLlegada.AddSeconds(intervalo);
        }
    }
    public EstadoJuego Juego()
    {
        lock (sync)
        {
            var ahora = Ahora; AvanzarJuego(ahora);
            return new(partidaId, estadoJuego, coches.ToArray(), atendido, colores.ToArray(), pintados,
                estadoJuego == "Sin iniciar" ? 0 : Segundos(inicio, estadoJuego == "Finalizado" ? fin : ahora), intervalo,
                estadoJuego == "En curso" ? Segundos(ahora, proximaLlegada) : null, mejorPuntaje, recordTiempo);
        }
    }
    public EstadoJuego IniciarJuego()
    {
        lock (sync)
        {
            AvanzarJuego(Ahora);
            if (estadoJuego == "En curso") throw new ReglaNegocioException("Ya hay una partida en curso", 409);
            coches.Limpiar(); atendido = null; cocheId = pintados = 0; intervalo = 20;
            inicio = ultimaLlegada = Ahora; proximaLlegada = inicio.AddSeconds(intervalo);
            partidaId = Guid.NewGuid(); estadoJuego = "En curso";
            return Juego();
        }
    }
    public EstadoJuego Pintar(Guid partida, int id, string? color)
    {
        lock (sync)
        {
            var ahora = Ahora; AvanzarJuego(ahora);
            if (estadoJuego != "En curso") throw new ReglaNegocioException("No hay una partida en curso", 409);
            if (partida != partidaId) throw new ReglaNegocioException("La partida cambió; actualiza la vista", 409);
            color = Texto(color);
            if (coches.ColaVacia()) throw new ReglaNegocioException("Aún no hay coches en la cola", 409);
            var primero = coches.Peek();
            if (primero.Id != id) throw new ReglaNegocioException("Solo se puede pintar el primer coche de la fila", 409);
            if (!primero.Color.Equals(color, StringComparison.OrdinalIgnoreCase)) throw new ReglaNegocioException("El color no coincide con el solicitado");
            atendido = coches.Dequeue(); pintados++;
            if (pintados % 3 == 0)
            {
                intervalo = Math.Max(4, 20 - 2 * (pintados / 3));
                proximaLlegada = ultimaLlegada.AddSeconds(intervalo);
            }
            return Juego();
        }
    }

    public EstadoEstacionamiento Estacionamiento()
    {
        lock (sync)
        {
            var vinculos = new ListaSimple<VinculoAuto>();
            var nodo = autos.Frente;
            for (var i = 0; i < autos.Cantidad; i++, nodo = nodo!.Siguiente)
                vinculos.Agregar(new(nodo!.Valor.Placas, nodo.Siguiente.Valor.Placas, nodo.Anterior.Valor.Placas));
            return new(autos.ToArray(), vinculos.ToArray(), 2m, ultimoTicket);
        }
    }
    private void PlacaUnica(string placas, int? id = null)
    {
        if (autos.Any(a => a.Id != id && a.Placas.Equals(placas, StringComparison.OrdinalIgnoreCase)))
            throw new ReglaNegocioException("Ya hay un auto con esas placas", 409);
    }
    public EstadoEstacionamiento EntrarAuto(string? placas, string? propietario)
    {
        lock (sync)
        {
            placas = Texto(placas, 20).ToUpperInvariant(); propietario = Texto(propietario); PlacaUnica(placas);
            autos.Enqueue(new(++autoId, placas, propietario, Ahora));
            return Estacionamiento();
        }
    }
    public EstadoEstacionamiento SalirAuto()
    {
        lock (sync)
        {
            if (autos.ColaVacia()) throw new ReglaNegocioException("El estacionamiento está vacío", 409);
            var auto = autos.Dequeue(); var ahora = Ahora;
            var segundos = Segundos(auto.HoraEntrada, ahora);
            ultimoTicket = new(Guid.NewGuid(), auto, ahora, segundos, 2m, segundos * 2m);
            return Estacionamiento();
        }
    }
    public EstadoEstacionamiento EditarAuto(int id, string? placas, string? propietario)
    {
        lock (sync)
        {
            placas = Texto(placas, 20).ToUpperInvariant(); propietario = Texto(propietario); PlacaUnica(placas, id);
            var auto = autos.FirstOrDefault(a => a.Id == id) ?? throw new ReglaNegocioException("El auto no existe", 404);
            autos.Reemplazar(a => a.Id == id, auto with { Placas = placas, Propietario = propietario });
            return Estacionamiento();
        }
    }
    public void Reiniciar(int fase)
    {
        lock (sync)
        {
            switch (fase)
            {
                case 10: banco.Limpiar(); turno = 0; ultimaAtencion = null; break;
                case 11:
                    coches.Limpiar(); estadoJuego = "Sin iniciar"; partidaId = null; atendido = null;
                    pintados = cocheId = mejorPuntaje = 0; recordTiempo = 0; intervalo = 20; break;
                case 12: autos.Limpiar(); autoId = 0; ultimoTicket = null; break;
                default: throw new ReglaNegocioException("El ejercicio no existe", 404);
            }
        }
    }
}
