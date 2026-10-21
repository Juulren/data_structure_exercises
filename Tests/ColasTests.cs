using DataStructureExercises.Models.Common;
using DataStructureExercises.Models.Structures;
using DataStructureExercises.Services.Implementations;
using Xunit;

namespace DataStructureExercises.Tests;

public sealed class RelojPrueba : TimeProvider
{
    private DateTimeOffset ahora = new(2026, 10, 21, 12, 0, 0, TimeSpan.Zero);
    public override DateTimeOffset GetUtcNow() => ahora;
    public void Avanzar(decimal segundos) => ahora = ahora.AddTicks((long)(segundos * TimeSpan.TicksPerSecond));
}

public class ColasTests
{
    [Fact]
    public void ColaLimitadaReutilizaEspaciosYRespetaFifo()
    {
        var cola = new ColaConLimite<int>(3);
        Assert.Throws<ArgumentOutOfRangeException>(() => new ColaConLimite<int>(0));
        Assert.Throws<InvalidOperationException>(() => cola.Peek()); Assert.Null(cola.FrenteIndice);
        foreach (var n in new[] { 1, 2, 3 }) cola.Enqueue(n);
        Assert.True(cola.ColaLlena()); Assert.Throws<InvalidOperationException>(() => cola.Enqueue(4));
        Assert.Equal(1, cola.Peek()); Assert.Equal(3, cola.Cantidad);
        Assert.Equal(1, cola.Dequeue()); cola.Enqueue(4);
        Assert.Equal(1, cola.FrenteIndice); Assert.Equal(0, cola.FinalIndice);
        Assert.Equal(new[] { 2, 3, 4 }, cola.ToArray());
        Assert.True(cola.Reemplazar(n => n == 3, 9)); Assert.False(cola.Reemplazar(n => n == 99, 0));
        Assert.Equal(new[] { 2, 9, 4 }, cola.ToArray());
        cola.Limpiar(); Assert.True(cola.ColaVacia()); Assert.Null(cola.FinalIndice);
        Assert.Throws<InvalidOperationException>(() => cola.Dequeue()); cola.Agregar(8); Assert.Equal(8, cola.Dequeue());
    }
    private static void VerificarCirculo(ColaCircularDoble<int> cola)
    {
        if (cola.Cantidad == 0) { Assert.Null(cola.Frente); Assert.Null(cola.Final); return; }
        Assert.Same(cola.Frente, cola.Final!.Siguiente); Assert.Same(cola.Final, cola.Frente!.Anterior);
        var nodo = cola.Frente;
        for (var i = 0; i < cola.Cantidad; i++, nodo = nodo.Siguiente)
        { Assert.Same(nodo, nodo.Siguiente.Anterior); Assert.Same(nodo, nodo.Anterior.Siguiente); }
        Assert.Same(cola.Frente, nodo);
        Assert.Equal(cola.Reverse(), cola.RecorrerInverso());
    }
    [Fact]
    public void ColaDobleConservaEnlacesConUnoMuchosYTrasVaciarse()
    {
        var cola = new ColaCircularDoble<int>();
        Assert.Throws<InvalidOperationException>(() => cola.Dequeue()); VerificarCirculo(cola);
        cola.Enqueue(1); VerificarCirculo(cola); Assert.Same(cola.Frente, cola.Frente!.Siguiente);
        cola.Enqueue(2); cola.Enqueue(3); VerificarCirculo(cola);
        Assert.True(cola.Reemplazar(n => n == 2, 8)); Assert.Equal(new[] { 1, 8, 3 }, cola.ToArray());
        Assert.Equal(1, cola.Dequeue()); VerificarCirculo(cola);
        Assert.Equal(8, cola.Dequeue()); VerificarCirculo(cola);
        Assert.Equal(3, cola.Dequeue()); VerificarCirculo(cola);
        cola.Enqueue(9); cola.Limpiar(); cola.Enqueue(10); VerificarCirculo(cola); Assert.Equal(10, cola.Peek());
    }
    [Fact]
    public void ColaDobleCoincideConOracleTrasOperacionesAleatorias()
    {
        var cola = new ColaCircularDoble<int>(); var esperado = new Queue<int>(); var random = new Random(42);
        for (var i = 0; i < 500; i++)
        {
            if (esperado.Count == 0 || random.Next(2) == 0) { cola.Enqueue(i); esperado.Enqueue(i); }
            else Assert.Equal(esperado.Dequeue(), cola.Dequeue());
            Assert.Equal(esperado.ToArray(), cola.ToArray()); VerificarCirculo(cola);
        }
    }
    [Fact]
    public void BancoGeneraTurnosValidaMovimientosYCalculaEsperaExacta()
    {
        var reloj = new RelojPrueba(); var servicio = new ColasService(reloj);
        Assert.Throws<ReglaNegocioException>(() => servicio.EliminaCola());
        Assert.Throws<ReglaNegocioException>(() => servicio.InsertaCola("", "Retiro"));
        Assert.Throws<ReglaNegocioException>(() => servicio.InsertaCola("Ana", "Otro"));
        var inicial = servicio.InsertaCola("Ana", "Depósito").Clientes[0];
        reloj.Avanzar(1.25m); servicio.InsertaCola("Luis", "Retiro");
        var editado = servicio.EditarCliente(1, "Ana corregida", "Consulta de saldo");
        Assert.Equal(inicial.HoraLlegada, editado.Clientes[0].HoraLlegada);
        reloj.Avanzar(9.25m); var estado = servicio.EliminaCola();
        Assert.Equal(1, estado.UltimaAtencion!.Cliente.Turno); Assert.Equal(10.5m, estado.UltimaAtencion.SegundosEspera);
        Assert.Equal("Ana corregida", estado.UltimaAtencion.Cliente.Nombre); Assert.Equal(2, estado.Clientes[0].Turno);
    }
    [Fact]
    public void BancoControlaSobreflujoYReutilizaEspaciosSinConsumirTurnosFallidos()
    {
        var servicio = new ColasService(new RelojPrueba());
        for (var i = 0; i < 10; i++) servicio.InsertaCola($"Cliente {i}", "Retiro");
        Assert.Throws<ReglaNegocioException>(() => servicio.InsertaCola("Sobra", "Retiro"));
        servicio.EliminaCola(); var estado = servicio.InsertaCola("Nuevo", "Pago de servicio");
        Assert.Equal(1, estado.Frente); Assert.Equal(0, estado.Final); Assert.Equal(11, estado.Clientes[^1].Turno);
    }
    [Fact]
    public void JuegoLlegaCadaVeinteYFinalizaExactamenteConCincoInclusoSinConsultas()
    {
        var reloj = new RelojPrueba(); var servicio = new ColasService(reloj);
        Assert.Equal("Sin iniciar", servicio.Juego().Estado); servicio.IniciarJuego();
        reloj.Avanzar(19.999m); Assert.Empty(servicio.Juego().Coches);
        reloj.Avanzar(.001m); Assert.Single(servicio.Juego().Coches);
        reloj.Avanzar(79.999m); Assert.Equal(4, servicio.Juego().Coches.Length);
        reloj.Avanzar(.001m); var final = servicio.Juego();
        Assert.Equal("Finalizado", final.Estado); Assert.Equal(5, final.Coches.Length); Assert.Equal(100m, final.TiempoSegundos);
        reloj.Avanzar(1000); Assert.Equal(100m, servicio.Juego().TiempoSegundos);
        Assert.Throws<ReglaNegocioException>(() => servicio.Pintar(final.PartidaId!.Value, final.Coches[0].Id, final.Coches[0].Color));
    }
    [Fact]
    public void JuegoRecuperaCienSegundosSinPolling()
    {
        var reloj = new RelojPrueba(); var servicio = new ColasService(reloj);
        servicio.IniciarJuego(); reloj.Avanzar(1000);
        Assert.Equal(100m, servicio.Juego().TiempoSegundos); Assert.Equal(5, servicio.Juego().Coches.Length);
    }
    [Fact]
    public void JuegoRechazaColorIncorrectoSegundoCocheYReintentosObsoletos()
    {
        var reloj = new RelojPrueba(); var servicio = new ColasService(reloj); var inicio = servicio.IniciarJuego();
        Assert.Throws<ReglaNegocioException>(() => servicio.IniciarJuego());
        Assert.Throws<ReglaNegocioException>(() => servicio.Pintar(inicio.PartidaId!.Value, 1, "Rojo"));
        reloj.Avanzar(40); var estado = servicio.Juego(); var primero = estado.Coches[0];
        Assert.All(estado.Coches, c => Assert.Contains(c.Color, estado.Colores));
        Assert.Throws<ReglaNegocioException>(() => servicio.Pintar(estado.PartidaId!.Value, estado.Coches[1].Id, estado.Coches[1].Color));
        Assert.Throws<ReglaNegocioException>(() => servicio.Pintar(estado.PartidaId!.Value, primero.Id, "No es color"));
        Assert.Throws<ReglaNegocioException>(() => servicio.Pintar(Guid.NewGuid(), primero.Id, primero.Color));
        var pintado = servicio.Pintar(estado.PartidaId!.Value, primero.Id, primero.Color);
        Assert.Equal(1, pintado.Pintados); Assert.Single(pintado.Coches); Assert.Equal(primero, pintado.Atendido);
        Assert.Throws<ReglaNegocioException>(() => servicio.Pintar(estado.PartidaId.Value, primero.Id, primero.Color));
    }
    [Fact]
    public void JuegoAceleraCadaTresPintadosHastaMinimoYConservaRecordEntrePartidas()
    {
        var reloj = new RelojPrueba(); var servicio = new ColasService(reloj); var estado = servicio.IniciarJuego();
        for (var i = 1; i <= 30; i++)
        {
            reloj.Avanzar(estado.ProximoEnSegundos!.Value); estado = servicio.Juego(); var coche = estado.Coches[0];
            estado = servicio.Pintar(estado.PartidaId!.Value, coche.Id, coche.Color);
            Assert.Equal(Math.Max(4, 20 - 2 * (i / 3)), estado.IntervaloSegundos);
            Assert.Empty(estado.Coches); Assert.Equal(i, estado.Pintados);
        }
        reloj.Avanzar(20); var final = servicio.Juego(); Assert.Equal("Finalizado", final.Estado);
        Assert.Equal(30, final.MejorPuntaje); Assert.Equal(final.TiempoSegundos, final.RecordTiempoSegundos);
        var nuevo = servicio.IniciarJuego(); Assert.Equal(30, nuevo.MejorPuntaje); Assert.NotEqual(final.PartidaId, nuevo.PartidaId);
        Assert.Empty(nuevo.Coches); Assert.Equal(0, nuevo.Pintados); Assert.Equal(20, nuevo.IntervaloSegundos);
    }
    [Fact]
    public void JuegoNoPermiteRescatarUnaColaQueYaLlegoACinco()
    {
        var reloj = new RelojPrueba(); var servicio = new ColasService(reloj); servicio.IniciarJuego();
        reloj.Avanzar(80); var estado = servicio.Juego(); reloj.Avanzar(20);
        Assert.Throws<ReglaNegocioException>(() => servicio.Pintar(estado.PartidaId!.Value, estado.Coches[0].Id, estado.Coches[0].Color));
        Assert.Equal("Finalizado", servicio.Juego().Estado);
    }
    [Fact]
    public void EstacionamientoCobraFraccionesExactasYExtraePorOrdenDeEntrada()
    {
        var reloj = new RelojPrueba(); var servicio = new ColasService(reloj);
        servicio.EntrarAuto(" abc-123 ", "Ana"); reloj.Avanzar(1.25m); servicio.EntrarAuto("XYZ", "Luis");
        var estado = servicio.SalirAuto(); var ticket = estado.UltimoTicket!;
        Assert.Equal("ABC-123", ticket.Auto.Placas); Assert.Equal(1.25m, ticket.Segundos); Assert.Equal(2.50m, ticket.Importe);
        Assert.Equal("XYZ", estado.Autos[0].Placas); Assert.Single(estado.Autos);
        reloj.Avanzar(.0000001m); ticket = servicio.SalirAuto().UltimoTicket!;
        Assert.Equal(.0000002m, ticket.Importe); Assert.Empty(servicio.Estacionamiento().Autos);
        Assert.Throws<ReglaNegocioException>(() => servicio.SalirAuto());
    }
    [Fact]
    public void EstacionamientoValidaPlacasUnicasYEdicionConservaEnlacesYHora()
    {
        var servicio = new ColasService(new RelojPrueba());
        var auto = servicio.EntrarAuto("ABC", "Ana").Autos[0]; servicio.EntrarAuto("XYZ", "Luis");
        Assert.Throws<ReglaNegocioException>(() => servicio.EntrarAuto("abc", "Otro"));
        Assert.Throws<ReglaNegocioException>(() => servicio.EditarAuto(auto.Id, "xyz", "Otro"));
        var estado = servicio.EditarAuto(auto.Id, "NUEVA", "Ana corregida");
        Assert.Equal(auto.HoraEntrada, estado.Autos[0].HoraEntrada);
        Assert.Equal(new[] { "NUEVA", "XYZ" }, estado.Autos.Select(a => a.Placas));
        Assert.Equal("XYZ", estado.Vinculos[0].Siguiente); Assert.Equal("XYZ", estado.Vinculos[0].Anterior);
        Assert.Equal("NUEVA", estado.Vinculos[1].Siguiente); Assert.Equal("NUEVA", estado.Vinculos[1].Anterior);
    }
    [Fact]
    public void EstacionamientoNoImponeLimiteDeQuinientosAutos()
    {
        var servicio = new ColasService(new RelojPrueba());
        for (var i = 0; i < 600; i++) servicio.EntrarAuto($"AUTO-{i}", "Propietario");
        Assert.Equal(600, servicio.Estacionamiento().Autos.Length);
    }
    [Fact]
    public void ReiniciosDeColasSonIndependientes()
    {
        var servicio = new ColasService(new RelojPrueba());
        servicio.InsertaCola("Ana", "Retiro"); servicio.IniciarJuego(); servicio.EntrarAuto("ABC", "Ana");
        servicio.Reiniciar(10); Assert.Empty(servicio.Banco().Clientes); Assert.Equal("En curso", servicio.Juego().Estado);
        servicio.Reiniciar(11); Assert.Equal("Sin iniciar", servicio.Juego().Estado); Assert.Single(servicio.Estacionamiento().Autos);
        servicio.Reiniciar(12); Assert.Empty(servicio.Estacionamiento().Autos);
    }
    [Fact]
    public void EntradasConcurrentesConservanAutosYTurnos()
    {
        var servicio = new ColasService(new RelojPrueba());
        Parallel.For(0, 100, i => servicio.EntrarAuto($"AUTO-{i}", "Nombre"));
        Assert.Equal(100, servicio.Estacionamiento().Autos.Length);
        Parallel.For(0, 10, i => servicio.InsertaCola($"Cliente {i}", "Retiro"));
        Assert.Equal(Enumerable.Range(1, 10), servicio.Banco().Clientes.Select(c => c.Turno));
    }
}
