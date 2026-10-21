namespace DataStructureExercises.Models.Structures;

// Arreglo circular: los espacios retirados pueden reutilizarse sin desplazar elementos.
public sealed class ColaConLimite<T> : EstructuraLineal<T>
{
    private readonly T?[] datos;
    private int frente;
    public ColaConLimite(int capacidad)
    {
        if (capacidad < 1) throw new ArgumentOutOfRangeException(nameof(capacidad));
        datos = new T[capacidad];
    }
    public int Capacidad => datos.Length;
    public int? FrenteIndice => ColaVacia() ? null : frente;
    public int? FinalIndice => ColaVacia() ? null : (frente + Cantidad - 1) % Capacidad;
    public bool ColaLlena() => Cantidad == Capacidad;
    public bool ColaVacia() => Cantidad == 0;
    public void Enqueue(T valor)
    {
        if (ColaLlena()) throw new InvalidOperationException("La cola está llena");
        datos[(frente + Cantidad) % Capacidad] = valor;
        Cantidad++;
    }
    public T Peek() => ColaVacia() ? throw new InvalidOperationException("La cola está vacía") : datos[frente]!;
    public T Dequeue()
    {
        var valor = Peek();
        datos[frente] = default;
        frente = (frente + 1) % Capacidad;
        Cantidad--;
        return valor;
    }
    public bool Reemplazar(Predicate<T> criterio, T valor)
    {
        for (var i = 0; i < Cantidad; i++)
        {
            var indice = (frente + i) % Capacidad;
            if (criterio(datos[indice]!)) { datos[indice] = valor; return true; }
        }
        return false;
    }
    public override void Agregar(T valor) => Enqueue(valor);
    public override void Limpiar() { Array.Clear(datos); frente = 0; Cantidad = 0; }
    public override IEnumerator<T> GetEnumerator()
    {
        for (var i = 0; i < Cantidad; i++) yield return datos[(frente + i) % Capacidad]!;
    }
}
