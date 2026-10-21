namespace DataStructureExercises.Models.Entities;

public sealed record Producto(int Id, string Clave, string Nombre, int Cantidad, decimal Precio);
public sealed record Alumno(int Id, string Nombre, decimal Calificacion);
public sealed record Palabra(int Id, string Texto);
