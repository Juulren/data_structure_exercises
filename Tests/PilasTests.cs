using System.Numerics;
using DataStructureExercises.Models.Common;
using DataStructureExercises.Models.Structures;
using DataStructureExercises.Services.Implementations;
using Xunit;

namespace DataStructureExercises.Tests;

public class PilasTests
{
    [Fact]
    public void PilaRespetaLifoPeekNoExtraeYSeReutiliza()
    {
        var pila = new PilaPersonalizada<int>();
        Assert.Throws<InvalidOperationException>(() => pila.Peek());
        Assert.Throws<InvalidOperationException>(() => pila.Pop());
        Assert.Equal(0, pila.Cantidad);
        IEstructuraLineal<int> contrato = pila;
        contrato.Agregar(1); pila.Push(2); pila.Push(3);
        Assert.Equal(3, pila.Peek()); Assert.Equal(3, pila.Cantidad);
        Assert.Equal(new[] { 3, 2, 1 }, pila.ToArray());
        Assert.Equal(3, pila.Pop()); Assert.Equal(2, pila.Pop()); Assert.Equal(1, pila.Pop());
        pila.Push(4); pila.Limpiar(); pila.Push(5);
        Assert.Equal(5, pila.Pop()); Assert.Equal(0, pila.Cantidad);
    }
    [Theory]
    [InlineData("UTM", "MTU")]
    [InlineData("árbol", "lobrá")]
    [InlineData("a", "a")]
    [InlineData("a👩‍💻b", "b👩‍💻a")]
    [InlineData("a\u0301b", "ba\u0301")]
    public void InversionConservaCaracteresUnicode(string entrada, string esperada)
    {
        var estado = new PilasService().Invertir(entrada);
        Assert.Equal(esperada, estado.Invertida);
        Assert.Equal(estado.Caracteres.Reverse(), estado.Extraidos);
    }
    [Fact]
    public void InversionRechazaVaciosFrasesYExcesoSinCambiarResultadoPrevio()
    {
        var servicio = new PilasService(); var previo = servicio.Invertir("UTM");
        Assert.Throws<ReglaNegocioException>(() => servicio.Invertir(" "));
        Assert.Throws<ReglaNegocioException>(() => servicio.Invertir("dos palabras"));
        Assert.Throws<ReglaNegocioException>(() => servicio.Invertir(new string('a', 81)));
        Assert.Same(previo, servicio.Inversion());
    }
    [Theory]
    [InlineData("ana")] [InlineData("arenera")] [InlineData("arepera")]
    [InlineData("anilina")] [InlineData("Malayalam")] [InlineData("Oruro")]
    [InlineData("oso")] [InlineData("radar")] [InlineData("reconocer")]
    [InlineData("rotor")] [InlineData("salas")] [InlineData("seres")]
    [InlineData("somos")] [InlineData("sometemos")]
    [InlineData("Anita lava la tina")] [InlineData("Dábale arroz a la zorra el abad")]
    [InlineData("12321")] [InlineData("aÑa")]
    public void PalindromosExigidosYFrasesSeComparanConPop(string texto)
    {
        var estado = new PilasService().EvaluarPalindromo(texto);
        Assert.True(estado.EsPalindromo); Assert.All(estado.Pasos, paso => Assert.True(paso.Coincide));
        Assert.Equal(estado.Caracteres.Reverse(), estado.Pasos.Select(p => p.Extraido));
    }
    [Theory]
    [InlineData("UTM")] [InlineData("12345")] [InlineData("nñ")]
    public void NoPalindromosRegistranDiferencias(string texto)
    {
        var estado = new PilasService().EvaluarPalindromo(texto);
        Assert.False(estado.EsPalindromo); Assert.Contains(estado.Pasos, p => !p.Coincide);
    }
    [Fact]
    public void PalindromoRechazaTextoSinLetrasYNumerosYLimites()
    {
        var servicio = new PilasService();
        Assert.Throws<ReglaNegocioException>(() => servicio.EvaluarPalindromo("!!!"));
        Assert.Throws<ReglaNegocioException>(() => servicio.EvaluarPalindromo(new string('a', 121)));
        Assert.True(servicio.EvaluarPalindromo(new string('a', 120)).EsPalindromo);
    }
    [Theory]
    [InlineData("592", "3784", "4376")]
    [InlineData("999", "1", "1000")]
    [InlineData("0", "0", "0")]
    [InlineData("00009", "0001", "10")]
    [InlineData("5", "123456", "123461")]
    public void SumaResuelveLongitudesDistintasYAcarreos(string a, string b, string esperado)
    {
        var estado = new PilasService().Sumar(a, b);
        Assert.Equal(esperado, estado.Resultado);
        Assert.Equal(estado.Operando1.Reverse().Select(c => c - '0'), estado.Pila1);
        foreach (var paso in estado.Pasos)
        {
            Assert.Equal((paso.Digito1 ?? 0) + (paso.Digito2 ?? 0) + paso.AcarreoEntrada, paso.Total);
            Assert.Equal(paso.Total % 10, paso.Digito); Assert.Equal(paso.Total / 10, paso.AcarreoSalida);
        }
        Assert.Equal(esperado, string.Concat(estado.Pasos.Reverse().Select(p => p.Digito)));
    }
    [Fact]
    public void SumaMilDigitosPropagaAcarreoHastaCrearNuevaColumna()
    {
        var a = new string('9', 1000); var estado = new PilasService().Sumar(a, "1");
        Assert.Equal("1" + new string('0', 1000), estado.Resultado);
        Assert.Equal(1001, estado.Pasos.Length);
        Assert.Null(estado.Pasos[^1].Digito1); Assert.Null(estado.Pasos[^1].Digito2);
        Assert.Equal(1, estado.Pasos[^1].AcarreoEntrada); Assert.Equal(0, estado.Pasos[^1].AcarreoSalida);
    }
    [Fact]
    public void SumaAleatoriaCoincideConOracleBigInteger()
    {
        var random = new Random(42); var servicio = new PilasService();
        for (var i = 0; i < 50; i++)
        {
            var a = string.Concat(Enumerable.Range(0, random.Next(1, 300)).Select(_ => random.Next(10)));
            var b = string.Concat(Enumerable.Range(0, random.Next(1, 300)).Select(_ => random.Next(10)));
            Assert.Equal((BigInteger.Parse(a) + BigInteger.Parse(b)).ToString(), servicio.Sumar(a, b).Resultado);
        }
    }
    [Theory]
    [InlineData("-1")] [InlineData("1.5")] [InlineData("1e3")] [InlineData("abc")] [InlineData("١")]
    public void SumaRechazaEntradasQueNoSeanDigitosAscii(string invalido) =>
        Assert.Throws<FormatException>(() => new PilasService().Sumar(invalido, "1"));
    [Fact]
    public void SumaRechazaFaltantesYExcesoSinAlterarEstado()
    {
        var servicio = new PilasService(); var previo = servicio.Sumar("1", "2");
        Assert.Throws<ReglaNegocioException>(() => servicio.Sumar("", "1"));
        Assert.Throws<ReglaNegocioException>(() => servicio.Sumar(new string('1', 1001), "1"));
        Assert.Same(previo, servicio.Suma());
    }
    [Fact]
    public void ReemplazoSustituyeTodasLasCoincidenciasYConservaOrden()
    {
        var servicio = new PilasService();
        foreach (var n in new[] { 2, -5, 2, 8, 2 }) servicio.Apilar(n);
        var estado = servicio.ReemplazarValores(int.MaxValue, 2);
        Assert.Equal(new[] { int.MaxValue, 8, int.MaxValue, -5, int.MaxValue }, estado.Elementos);
        Assert.Equal(3, estado.Reemplazos); Assert.Equal(5, estado.Cantidad);
        estado = servicio.ReemplazarValores(9, 99); Assert.Equal(0, estado.Reemplazos);
        Assert.Equal(int.MaxValue, estado.Tope);
        Assert.Equal(int.MaxValue, servicio.Desapilar().UltimoRetirado);
        Assert.Equal(8, servicio.Valores().Tope);
    }
    [Fact]
    public void ReemplazoConValoresIgualesYUnaSolaEntradaMantieneLaPila()
    {
        var pila = new PilaPersonalizada<int>();
        Assert.Equal(0, PilasService.Reemplazar(pila, 1, 2));
        pila.Push(2); Assert.Equal(1, PilasService.Reemplazar(pila, 2, 2));
        Assert.Equal(2, pila.Pop()); Assert.Equal(0, pila.Cantidad);
    }
    [Fact]
    public void PilaVaciaYLimiteSeValidanSinPerderDatos()
    {
        var servicio = new PilasService();
        Assert.Throws<ReglaNegocioException>(() => servicio.Desapilar());
        Assert.Throws<ReglaNegocioException>(() => servicio.ReemplazarValores(1, 2));
        for (var i = 0; i < 100; i++) servicio.Apilar(i);
        Assert.Throws<ReglaNegocioException>(() => servicio.Apilar(101)); Assert.Equal(100, servicio.Valores().Cantidad);
    }
    [Fact]
    public void ReinicioDePilasEsIndependientePorFase()
    {
        var servicio = new PilasService();
        servicio.Invertir("UTM"); servicio.EvaluarPalindromo("ana"); servicio.Sumar("1", "2"); servicio.Apilar(4);
        servicio.Reiniciar(6); Assert.Null(servicio.Inversion()); Assert.NotNull(servicio.Palindromo());
        servicio.Reiniciar(7); Assert.Null(servicio.Palindromo()); Assert.NotNull(servicio.Suma());
        servicio.Reiniciar(8); Assert.Null(servicio.Suma()); Assert.Single(servicio.Valores().Elementos);
        servicio.Reiniciar(9); Assert.Empty(servicio.Valores().Elementos); Assert.Null(servicio.Valores().Tope);
        Assert.Throws<ReglaNegocioException>(() => servicio.Reiniciar(5));
    }
    [Fact]
    public void PushConcurrentesNoPierdenDatos()
    {
        var servicio = new PilasService(); Parallel.For(0, 100, n => servicio.Apilar(n));
        Assert.Equal(Enumerable.Range(0, 100), servicio.Valores().Elementos.Order());
    }
}
