namespace DataStructureExercises.Models.Structures;

public sealed class NodoDoble<T>
{
    public NodoDoble(T valor) { Valor = valor; Siguiente = Anterior = this; }
    public T Valor { get; internal set; }
    public NodoDoble<T> Siguiente { get; internal set; }
    public NodoDoble<T> Anterior { get; internal set; }
}

public sealed class ColaCircularDoble<T> : EstructuraLineal<T>
{
    public NodoDoble<T>? Frente { get; private set; }
    public NodoDoble<T>? Final => Frente?.Anterior;
    public bool ColaVacia() => Cantidad == 0;
    public void Enqueue(T valor)
    {
        var nodo = new NodoDoble<T>(valor);
        if (Frente is null) Frente = nodo;
        else
        {
            var final = Frente.Anterior;
            nodo.Siguiente = Frente; nodo.Anterior = final;
            final.Siguiente = nodo; Frente.Anterior = nodo;
        }
        Cantidad++;
    }
    public T Peek() => Frente is null ? throw new InvalidOperationException("La cola está vacía") : Frente.Valor;
    public T Dequeue()
    {
        var valor = Peek();
        var retirado = Frente!;
        if (Cantidad == 1) Frente = null;
        else
        {
            Frente = retirado.Siguiente;
            Frente.Anterior = retirado.Anterior;
            retirado.Anterior.Siguiente = Frente;
        }
        retirado.Siguiente = retirado.Anterior = retirado;
        Cantidad--;
        return valor;
    }
    public bool Reemplazar(Predicate<T> criterio, T valor)
    {
        var nodo = Frente;
        for (var i = 0; i < Cantidad; i++, nodo = nodo!.Siguiente)
            if (criterio(nodo!.Valor)) { nodo.Valor = valor; return true; }
        return false;
    }
    public IEnumerable<T> RecorrerInverso()
    {
        var nodo = Final;
        for (var i = 0; i < Cantidad; i++, nodo = nodo!.Anterior) yield return nodo!.Valor;
    }
    public override void Agregar(T valor) => Enqueue(valor);
    public override void Limpiar() { Frente = null; Cantidad = 0; }
    public override IEnumerator<T> GetEnumerator()
    {
        var nodo = Frente;
        for (var i = 0; i < Cantidad; i++, nodo = nodo!.Siguiente) yield return nodo!.Valor;
    }
}
