namespace DataStructureExercises.Models.Entities;

public sealed record ClienteBanco(int Turno, string Nombre, string Movimiento, DateTime HoraLlegada);
public sealed record CocheJuego(int Id, string Color, DateTime HoraLlegada);
public sealed record AutoEstacionamiento(int Id, string Placas, string Propietario, DateTime HoraEntrada);
