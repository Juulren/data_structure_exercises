namespace DataStructureExercises.Models.Structures;

public sealed class PilaPersonalizada<T> : EstructuraLineal<T>
{
    private Nodo<T>? tope;

    public void Push(T valor)
    {
        tope = new Nodo<T>(valor) { Siguiente = tope };
        Cantidad++;
    }
    public T Peek() => tope is null ? throw new InvalidOperationException("La pila está vacía") : tope.Valor;
    public T Pop()
    {
        var valor = Peek();
        tope = tope!.Siguiente;
        Cantidad--;
        return valor;
    }
    public override void Agregar(T valor) => Push(valor);
    public override void Limpiar() { tope = null; Cantidad = 0; }
    // El recorrido comienza por el tope: el mismo orden en que Pop extrae los valores.
    public override IEnumerator<T> GetEnumerator()
    {
        for (var nodo = tope; nodo is not null; nodo = nodo.Siguiente) yield return nodo.Valor;
    }
}
