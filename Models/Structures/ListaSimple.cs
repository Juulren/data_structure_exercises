using System.Collections;

namespace DataStructureExercises.Models.Structures;

public interface IEstructuraLineal<T> : IEnumerable<T>
{
    int Cantidad { get; }
    void Agregar(T valor);
    void Limpiar();
}

public abstract class EstructuraLineal<T> : IEstructuraLineal<T>
{
    public int Cantidad { get; protected set; }
    public abstract void Agregar(T valor);
    public abstract void Limpiar();
    public abstract IEnumerator<T> GetEnumerator();
    IEnumerator IEnumerable.GetEnumerator() => GetEnumerator();
}

// La lista almacena los datos en nodos propios; los arreglos son solo snapshots de salida.
public sealed class ListaSimple<T> : EstructuraLineal<T>
{
    private Nodo<T>? cabeza;
    private Nodo<T>? final;

    public override void Agregar(T valor)
    {
        var nodo = new Nodo<T>(valor);
        if (final is null) cabeza = nodo;
        else final.Siguiente = nodo;
        final = nodo;
        Cantidad++;
    }

    public bool Retirar(Predicate<T> criterio, out T valor)
    {
        Nodo<T>? anterior = null;
        for (var actual = cabeza; actual is not null; actual = actual.Siguiente)
        {
            if (!criterio(actual.Valor)) { anterior = actual; continue; }
            if (anterior is null) cabeza = actual.Siguiente;
            else anterior.Siguiente = actual.Siguiente;
            if (actual == final) final = anterior;
            Cantidad--;
            valor = actual.Valor;
            return true;
        }
        valor = default!;
        return false;
    }

    public bool Reemplazar(Predicate<T> criterio, T nuevo)
    {
        for (var actual = cabeza; actual is not null; actual = actual.Siguiente)
            if (criterio(actual.Valor)) { actual.Valor = nuevo; return true; }
        return false;
    }

    public void Ordenar(Comparison<T> comparar)
    {
        // Inserción ordenada reenlazando nodos, sin List<T> ni LinkedList<T>.
        Nodo<T>? ordenada = null;
        while (cabeza is not null)
        {
            var nodo = cabeza;
            cabeza = cabeza.Siguiente;
            if (ordenada is null || comparar(nodo.Valor, ordenada.Valor) < 0)
            { nodo.Siguiente = ordenada; ordenada = nodo; }
            else
            {
                var previo = ordenada;
                while (previo.Siguiente is not null && comparar(nodo.Valor, previo.Siguiente.Valor) >= 0)
                    previo = previo.Siguiente;
                nodo.Siguiente = previo.Siguiente;
                previo.Siguiente = nodo;
            }
        }
        cabeza = ordenada;
        final = cabeza;
        while (final?.Siguiente is not null) final = final.Siguiente;
    }

    public override void Limpiar() { cabeza = final = null; Cantidad = 0; }
    public override IEnumerator<T> GetEnumerator()
    {
        for (var actual = cabeza; actual is not null; actual = actual.Siguiente) yield return actual.Valor;
    }
}
