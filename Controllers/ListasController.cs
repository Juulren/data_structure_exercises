using System.Globalization;
using System.Text.RegularExpressions;
using DataStructureExercises.Models.Common;
using DataStructureExercises.Services.Interfaces;
using Microsoft.AspNetCore.Mvc;

namespace DataStructureExercises.Controllers;

public sealed record EntradaNumero(string? Cantidad);
public sealed record EntradaProducto(string? Cantidad, string? Precio);
public sealed record EntradaAlumno(string? Nombre, string? Calificacion);
public sealed record EntradaCatalogo(string? Clave, string? Nombre, string? Precio);
public sealed record EntradaPalabra(string? Texto);

[ApiController]
[Route("api/listas")]
public sealed class ListasController(IListasService listas) : ControllerBase
{
    private static string Requerido(string? valor)
    {
        if (string.IsNullOrWhiteSpace(valor)) throw new ReglaNegocioException("Hay datos faltantes");
        return valor.Trim();
    }
    private static decimal Decimal(string? valor)
    {
        var texto = Requerido(valor);
        if (!Regex.IsMatch(texto, @"^[+-]?\d+(?:[.,]\d+)?$") ||
            !decimal.TryParse(texto.Replace(',', '.'), NumberStyles.AllowLeadingSign | NumberStyles.AllowDecimalPoint,
                CultureInfo.InvariantCulture, out var numero)) throw new FormatException();
        return numero;
    }
    private static int Entero(string? valor)
    {
        var texto = Requerido(valor);
        if (!Regex.IsMatch(texto, @"^[+-]?\d+$") || !int.TryParse(texto, out var numero)) throw new FormatException();
        return numero;
    }
    private static ApiResponse<T> OkDatos<T>(T datos) => ApiResponse<T>.Ok(datos);

    [HttpGet("supermercado")] public object Supermercado() => OkDatos(listas.Supermercado());
    [HttpPost("supermercado")] public object Escanear() => OkDatos(listas.Escanear());
    [HttpDelete("supermercado/{id:int}")] public object Retirar(int id) => OkDatos(listas.RetirarProducto(id));
    [HttpPut("supermercado/{id:int}")] public object EditarProducto(int id, EntradaProducto entrada)
    {
        Requerido(entrada.Cantidad); Requerido(entrada.Precio);
        return OkDatos(listas.ActualizarProducto(id, Entero(entrada.Cantidad), Decimal(entrada.Precio)));
    }
    [HttpGet("numeros")] public object Numeros() => OkDatos(listas.Numeros());
    [HttpPost("numeros")] public object Generar(EntradaNumero entrada) => OkDatos(listas.GenerarNumeros(Entero(entrada.Cantidad)));
    [HttpGet("alumnos")] public object Alumnos() => OkDatos(listas.Alumnos());
    [HttpPost("alumnos")] public object AgregarAlumno(EntradaAlumno entrada) => GuardarAlumno(null, entrada);
    [HttpPut("alumnos/{id:int}")] public object EditarAlumno(int id, EntradaAlumno entrada) => GuardarAlumno(id, entrada);
    private object GuardarAlumno(int? id, EntradaAlumno entrada)
    {
        Requerido(entrada.Nombre); Requerido(entrada.Calificacion);
        return OkDatos(listas.GuardarAlumno(id, entrada.Nombre!, Decimal(entrada.Calificacion)));
    }
    [HttpDelete("alumnos/{id:int}")] public object EliminarAlumno(int id) => OkDatos(listas.EliminarAlumno(id));
    [HttpGet("catalogo")] public object Catalogo() => OkDatos(listas.Catalogo());
    [HttpPost("catalogo")] public object AgregarCatalogo(EntradaCatalogo entrada) => GuardarCatalogo(entrada, false);
    [HttpPut("catalogo")] public object EditarCatalogo(EntradaCatalogo entrada) => GuardarCatalogo(entrada, true);
    private object GuardarCatalogo(EntradaCatalogo entrada, bool actualizar)
    {
        Requerido(entrada.Clave); Requerido(entrada.Nombre); Requerido(entrada.Precio);
        return OkDatos(listas.GuardarCatalogo(entrada.Clave!, entrada.Nombre!, Decimal(entrada.Precio), actualizar));
    }
    [HttpDelete("catalogo")] public object EliminarCatalogo([FromQuery] string? clave) => OkDatos(listas.EliminarCatalogo(Requerido(clave)));
    [HttpGet("palabras")] public object Palabras() => OkDatos(listas.Palabras());
    [HttpPost("palabras")] public object AgregarPalabra(EntradaPalabra entrada) => OkDatos(listas.GuardarPalabra(null, Requerido(entrada.Texto)));
    [HttpPut("palabras/{id:int}")] public object EditarPalabra(int id, EntradaPalabra entrada) => OkDatos(listas.GuardarPalabra(id, Requerido(entrada.Texto)));
    [HttpDelete("palabras/{id:int}")] public object EliminarPalabra(int id) => OkDatos(listas.EliminarPalabra(id));
    [HttpDelete("{ejercicio:int}/reiniciar")] public object Reiniciar(int ejercicio)
    {
        listas.Reiniciar(ejercicio);
        return OkDatos(new { ejercicio });
    }
}
