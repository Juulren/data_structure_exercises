using DataStructureExercises.Models.Entities;

namespace DataStructureExercises.Models.Common;

public sealed record EstadoSupermercado(Producto[] Disponibles, Producto[] Retirados, int TotalDisponibles, int TotalRetirados, int UnidadesDisponibles, int UnidadesRetiradas);
public sealed record EstadoNumeros(int[] Original, int[] Pares, int[] Impares);
public sealed record EstadoAlumnos(Alumno[] Aprobados, Alumno[] Reprobados);
public sealed record EstadoCatalogo(Producto[] Productos, decimal Total);
public sealed record GrupoPalabras(string Letra, Palabra[] Palabras);
public sealed record EstadoPalabras(Palabra[] General, GrupoPalabras[] Grupos);

public sealed class ReglaNegocioException(string mensaje, int estado = 400) : Exception(mensaje)
{
    public int Estado { get; } = estado;
}
