using DataStructureExercises.Models.Common;
using DataStructureExercises.Models.Structures;
using DataStructureExercises.Services.Implementations;
using Xunit;

namespace DataStructureExercises.Tests;

public class ListasTests
{
    [Fact]
    public void ListaRetiraCabezaMedioFinalYPermiteReutilizarse()
    {
        var lista = new ListaSimple<int>();
        foreach (var numero in new[] { 1, 2, 3, 4 }) lista.Agregar(numero);
        Assert.True(lista.Retirar(n => n == 1, out var primero)); Assert.Equal(1, primero);
        Assert.True(lista.Retirar(n => n == 3, out _));
        Assert.True(lista.Retirar(n => n == 4, out _));
        lista.Agregar(5);
        Assert.Equal(new[] { 2, 5 }, lista.ToArray());
        Assert.True(lista.Reemplazar(n => n == 2, 9));
        Assert.False(lista.Retirar(n => n == 7, out _));
        Assert.Equal(2, lista.Cantidad);
        lista.Limpiar(); lista.Agregar(8);
        Assert.Equal(new[] { 8 }, lista.ToArray());
        Assert.True(lista.Retirar(_ => true, out _)); lista.Agregar(10);
        Assert.Equal(new[] { 10 }, lista.ToArray());
    }
    [Fact]
    public void ListaOrdenaVaciaDuplicadosYConservaFinal()
    {
        var lista = new ListaSimple<int>();
        lista.Ordenar((a, b) => a.CompareTo(b));
        foreach (var numero in new[] { 4, 2, 2, 1, 3 }) lista.Agregar(numero);
        lista.Ordenar((a, b) => a.CompareTo(b)); lista.Agregar(6);
        Assert.Equal(new[] { 1, 2, 2, 3, 4, 6 }, lista.ToArray()); Assert.Equal(6, lista.Cantidad);
    }
    [Fact]
    public void SupermercadoConservaProductosAlRetirarlos()
    {
        var servicio = new ListasService();
        servicio.Escanear(); var inicial = servicio.Escanear();
        var producto = inicial.Disponibles[0];
        Assert.Equal("producto 1", producto.Nombre);
        Assert.InRange(producto.Cantidad, 1, 20); Assert.InRange(producto.Precio, 1m, 500m);
        servicio.ActualizarProducto(producto.Id, 8, 2.35m);
        var estado = servicio.RetirarProducto(producto.Id);
        Assert.Single(estado.Disponibles); Assert.Single(estado.Retirados);
        Assert.Equal(8, estado.UnidadesRetiradas); Assert.Equal(2.35m, estado.Retirados[0].Precio);
        Assert.Throws<ReglaNegocioException>(() => servicio.RetirarProducto(producto.Id));
        Assert.Equal("producto 3", servicio.Escanear().Disponibles.Last().Nombre);
    }
    [Theory]
    [InlineData(1)] [InlineData(100)]
    public void NumerosSeParticionanSinPerderOrdenNiDuplicados(int cantidad)
    {
        var estado = new ListasService().GenerarNumeros(cantidad);
        Assert.Equal(cantidad, estado.Original.Length);
        Assert.Equal(estado.Original.Where(n => n % 2 == 0), estado.Pares);
        Assert.Equal(estado.Original.Where(n => n % 2 != 0), estado.Impares);
        Assert.All(estado.Original, n => Assert.InRange(n, 0, 999));
    }
    [Theory]
    [InlineData(0)] [InlineData(101)] [InlineData(-1)]
    public void NumerosRechazanCantidadesInvalidas(int cantidad) => Assert.Throws<ReglaNegocioException>(() => new ListasService().GenerarNumeros(cantidad));

    [Fact]
    public void CalificacionesClasificanLimitesYReubicanAlEditar()
    {
        var servicio = new ListasService();
        servicio.GuardarAlumno(null, "Cero", 0); servicio.GuardarAlumno(null, "Diez", 10);
        servicio.GuardarAlumno(null, "Siete", 7); var estado = servicio.GuardarAlumno(null, "Casi", 6.99m);
        Assert.Equal(2, estado.Aprobados.Length); Assert.Equal(2, estado.Reprobados.Length);
        var id = estado.Reprobados.Last().Id;
        estado = servicio.GuardarAlumno(id, "Casi", 7.01m);
        Assert.Equal(3, estado.Aprobados.Length); Assert.Single(estado.Reprobados);
        Assert.Equal(2, servicio.EliminarAlumno(id).Aprobados.Length);
        Assert.Throws<ReglaNegocioException>(() => servicio.GuardarAlumno(null, "Fuera", 10.01m));
        Assert.Throws<ReglaNegocioException>(() => servicio.GuardarAlumno(null, " ", 8));
    }
    [Fact]
    public void CatalogoOrdenaSumaDecimalesYEliminaPorClave()
    {
        var servicio = new ListasService();
        servicio.GuardarCatalogo("B", "Zanahoria", .20m, false);
        var estado = servicio.GuardarCatalogo("A", "Arroz", .10m, false);
        Assert.Equal(new[] { "Arroz", "Zanahoria" }, estado.Productos.Select(p => p.Nombre)); Assert.Equal(.30m, estado.Total);
        Assert.Throws<ReglaNegocioException>(() => servicio.GuardarCatalogo("a", "Duplicado", 3, false));
        estado = servicio.GuardarCatalogo("b", "Aceite", 10.25m, true);
        Assert.Equal("Aceite", estado.Productos[0].Nombre); Assert.Equal(10.35m, estado.Total);
        Assert.Equal(.10m, servicio.EliminarCatalogo(" B ").Total);
        Assert.Throws<ReglaNegocioException>(() => servicio.GuardarCatalogo("X", "X", -1, false));
        Assert.Throws<ReglaNegocioException>(() => servicio.GuardarCatalogo("X", "X", 1.001m, false));
    }
    [Fact]
    public void PalabrasCreanGruposDinamicosYRespetanInicialesUnicode()
    {
        var servicio = new ListasService();
        foreach (var texto in new[] { "Fresa", "fresca", "Orilla", "Oso", "Peso", "Pez", "Ñandú", "Árbol", "A\u0301guila", "Fresa" }) servicio.GuardarPalabra(null, texto);
        var estado = servicio.Palabras();
        Assert.Equal(10, estado.General.Length); Assert.Equal(5, estado.Grupos.Length);
        Assert.Equal(3, estado.Grupos.Single(g => g.Letra == "F").Palabras.Length);
        Assert.Equal(2, estado.Grupos.Single(g => g.Letra == "Á").Palabras.Length);
        var id = estado.General.Single(p => p.Texto == "Ñandú").Id;
        estado = servicio.GuardarPalabra(id, "Zorro");
        Assert.DoesNotContain(estado.Grupos, g => g.Letra == "Ñ"); Assert.Contains(estado.Grupos, g => g.Letra == "Z");
        Assert.DoesNotContain(servicio.EliminarPalabra(id).Grupos, g => g.Letra == "Z");
        Assert.Throws<ReglaNegocioException>(() => servicio.GuardarPalabra(null, "dos palabras"));
    }
    [Fact]
    public void ReinicioNoAfectaOtrosEjercicios()
    {
        var servicio = new ListasService(); servicio.Escanear(); servicio.GuardarPalabra(null, "Hola");
        servicio.Reiniciar(1); Assert.Empty(servicio.Supermercado().Disponibles); Assert.Single(servicio.Palabras().General);
        Assert.Equal("producto 1", servicio.Escanear().Disponibles[0].Nombre);
    }
    [Fact]
    public void OperacionesConcurrentesNoPierdenNodos()
    {
        var servicio = new ListasService();
        Parallel.For(0, 100, _ => servicio.Escanear());
        var estado = servicio.Supermercado(); Assert.Equal(100, estado.TotalDisponibles);
        Assert.Equal(100, estado.Disponibles.Select(p => p.Id).Distinct().Count());
    }
}
