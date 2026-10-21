namespace DataStructureExercises.Models.Structures;

internal sealed class Nodo<T>(T valor)
{
    public T Valor { get; set; } = valor;
    public Nodo<T>? Siguiente { get; set; }
}
