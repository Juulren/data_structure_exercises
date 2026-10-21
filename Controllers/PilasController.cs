using System.Globalization;
using System.Text.RegularExpressions;
using DataStructureExercises.Models.Common;
using DataStructureExercises.Services.Interfaces;
using Microsoft.AspNetCore.Mvc;

namespace DataStructureExercises.Controllers;

public sealed record EntradaTextoPila(string? Texto);
public sealed record EntradaSuma(string? Operando1, string? Operando2);
public sealed record EntradaValorPila(string? Valor);
public sealed record EntradaReemplazo(string? Nuevo, string? Viejo);

[ApiController]
[Route("api/pilas")]
public sealed class PilasController(IPilasService pilas) : ControllerBase
{
    private static int Entero(string? texto)
    {
        if (string.IsNullOrWhiteSpace(texto)) throw new ReglaNegocioException("Hay datos faltantes");
        texto = texto.Trim();
        if (!Regex.IsMatch(texto, @"^[+-]?[0-9]+$") ||
            !int.TryParse(texto, NumberStyles.AllowLeadingSign, CultureInfo.InvariantCulture, out var valor)) throw new FormatException();
        return valor;
    }
    [HttpGet("invertir")] public object Inversion() => ApiResponse<EstadoInversion?>.Ok(pilas.Inversion());
    [HttpPost("invertir")] public object Invertir(EntradaTextoPila entrada) => ApiResponse<EstadoInversion>.Ok(pilas.Invertir(entrada.Texto));
    [HttpGet("palindromo")] public object Palindromo() => ApiResponse<EstadoPalindromo?>.Ok(pilas.Palindromo());
    [HttpPost("palindromo")] public object Evaluar(EntradaTextoPila entrada) => ApiResponse<EstadoPalindromo>.Ok(pilas.EvaluarPalindromo(entrada.Texto));
    [HttpGet("suma")] public object Suma() => ApiResponse<EstadoSuma?>.Ok(pilas.Suma());
    [HttpPost("suma")] public object Sumar(EntradaSuma entrada) => ApiResponse<EstadoSuma>.Ok(pilas.Sumar(entrada.Operando1, entrada.Operando2));
    [HttpGet("valores")] public object Valores() => ApiResponse<EstadoValores>.Ok(pilas.Valores());
    [HttpPost("valores")] public object Apilar(EntradaValorPila entrada) => ApiResponse<EstadoValores>.Ok(pilas.Apilar(Entero(entrada.Valor)));
    [HttpDelete("valores/tope")] public object Desapilar() => ApiResponse<EstadoValores>.Ok(pilas.Desapilar());
    [HttpPut("valores")] public object Reemplazar(EntradaReemplazo entrada)
    {
        if (string.IsNullOrWhiteSpace(entrada.Nuevo) || string.IsNullOrWhiteSpace(entrada.Viejo)) throw new ReglaNegocioException("Hay datos faltantes");
        return ApiResponse<EstadoValores>.Ok(pilas.ReemplazarValores(Entero(entrada.Nuevo), Entero(entrada.Viejo)));
    }
    [HttpDelete("{fase:int}/reiniciar")] public object Reiniciar(int fase)
    {
        pilas.Reiniciar(fase);
        return ApiResponse<object>.Ok(new { fase });
    }
}
