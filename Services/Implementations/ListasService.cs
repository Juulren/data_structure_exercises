using System.Globalization;
using System.Text;
using DataStructureExercises.Models.Common;
using DataStructureExercises.Models.Entities;
using DataStructureExercises.Models.Structures;
using DataStructureExercises.Services.Interfaces;

namespace DataStructureExercises.Services.Implementations;

public sealed class ListasService : IListasService
{
    private readonly object sync = new();
    private readonly ListaSimple<Producto> disponibles = new(), retirados = new(), catalogo = new();
    private readonly ListaSimple<int> original = new(), pares = new(), impares = new();
    private readonly ListaSimple<Alumno> aprobados = new(), reprobados = new();
    private readonly ListaSimple<Palabra> palabras = new();
    private int productoId, alumnoId, palabraId, catalogoId;
    private const int Limite = 500;

    private static string Texto(string? valor, int maximo = 100)
    {
        if (string.IsNullOrWhiteSpace(valor)) throw new ReglaNegocioException("Hay datos faltantes");
        valor = valor.Trim().Normalize(NormalizationForm.FormC);
        if (valor.Length > maximo) throw new ReglaNegocioException($"El texto no debe superar {maximo} caracteres");
        return valor;
    }
    private static void Capacidad(int cantidad)
    {
        if (cantidad >= Limite) throw new ReglaNegocioException("El límite de esta práctica es de 500 elementos");
    }
    private static void Precio(decimal precio)
    {
        if (precio < 0 || precio > 1000000) throw new ReglaNegocioException("El precio debe estar entre 0 y 1000000");
        if (decimal.Round(precio, 2) != precio) throw new ReglaNegocioException("El precio admite hasta dos decimales");
    }
    private static ReglaNegocioException NoExiste() => new("El elemento no existe", 404);

    public EstadoSupermercado Supermercado()
    {
        lock (sync) return new(disponibles.ToArray(), retirados.ToArray(), disponibles.Cantidad, retirados.Cantidad,
            disponibles.Sum(p => p.Cantidad), retirados.Sum(p => p.Cantidad));
    }
    public EstadoSupermercado Escanear()
    {
        lock (sync)
        {
            Capacidad(disponibles.Cantidad + retirados.Cantidad);
            var id = ++productoId;
            disponibles.Agregar(new(id, $"P{id}", $"producto {id}", Random.Shared.Next(1, 21), Random.Shared.Next(100, 50001) / 100m));
            return Supermercado();
        }
    }
    public EstadoSupermercado RetirarProducto(int id)
    {
        lock (sync)
        {
            if (!disponibles.Retirar(p => p.Id == id, out var producto)) throw NoExiste();
            retirados.Agregar(producto);
            return Supermercado();
        }
    }
    public EstadoSupermercado ActualizarProducto(int id, int cantidad, decimal precio)
    {
        lock (sync)
        {
            Precio(precio);
            if (cantidad < 1 || cantidad > 10000) throw new ReglaNegocioException("La cantidad debe estar entre 1 y 10000");
            var producto = disponibles.FirstOrDefault(p => p.Id == id) ?? throw NoExiste();
            disponibles.Reemplazar(p => p.Id == id, producto with { Cantidad = cantidad, Precio = precio });
            return Supermercado();
        }
    }
    public EstadoNumeros Numeros() { lock (sync) return new(original.ToArray(), pares.ToArray(), impares.ToArray()); }
    public EstadoNumeros GenerarNumeros(int cantidad)
    {
        lock (sync)
        {
            if (cantidad < 1 || cantidad > 100) throw new ReglaNegocioException("La cantidad debe estar entre 1 y 100");
            original.Limpiar(); pares.Limpiar(); impares.Limpiar();
            for (var i = 0; i < cantidad; i++)
            {
                var numero = Random.Shared.Next(0, 1000);
                original.Agregar(numero);
                (numero % 2 == 0 ? pares : impares).Agregar(numero);
            }
            return Numeros();
        }
    }
    public EstadoAlumnos Alumnos() { lock (sync) return new(aprobados.ToArray(), reprobados.ToArray()); }
    public EstadoAlumnos GuardarAlumno(int? id, string nombre, decimal calificacion)
    {
        lock (sync)
        {
            nombre = Texto(nombre);
            if (calificacion < 0 || calificacion > 10) throw new ReglaNegocioException("La calificación debe estar entre 0 y 10");
            if (id is null) Capacidad(aprobados.Cantidad + reprobados.Cantidad);
            else if (!aprobados.Any(a => a.Id == id) && !reprobados.Any(a => a.Id == id)) throw NoExiste();
            var alumno = new Alumno(id ?? ++alumnoId, nombre, calificacion);
            if (id is not null) { aprobados.Retirar(a => a.Id == id, out _); reprobados.Retirar(a => a.Id == id, out _); }
            aprobados.Agregar(alumno);
            // Extraer de la lista original a los reprobados y enlazarlos en su propia lista.
            while (aprobados.Retirar(a => a.Calificacion < 7, out var reprobado)) reprobados.Agregar(reprobado);
            return Alumnos();
        }
    }
    public EstadoAlumnos EliminarAlumno(int id)
    {
        lock (sync)
        {
            if (!aprobados.Retirar(a => a.Id == id, out _) && !reprobados.Retirar(a => a.Id == id, out _)) throw NoExiste();
            return Alumnos();
        }
    }
    public EstadoCatalogo Catalogo() { lock (sync) return new(catalogo.ToArray(), catalogo.Sum(p => p.Precio)); }
    public EstadoCatalogo GuardarCatalogo(string clave, string nombre, decimal precio, bool actualizar)
    {
        lock (sync)
        {
            clave = Texto(clave, 30); nombre = Texto(nombre); Precio(precio);
            var existente = catalogo.FirstOrDefault(p => p.Clave.Equals(clave, StringComparison.OrdinalIgnoreCase));
            if (actualizar && existente is null) throw NoExiste();
            if (!actualizar && existente is not null) throw new ReglaNegocioException("La clave del producto ya existe", 409);
            if (existente is null) { Capacidad(catalogo.Cantidad); catalogo.Agregar(new(++catalogoId, clave, nombre, 1, precio)); }
            else catalogo.Reemplazar(p => p.Id == existente.Id, existente with { Nombre = nombre, Precio = precio });
            catalogo.Ordenar((a, b) => CultureInfo.GetCultureInfo("es-MX").CompareInfo.Compare(a.Nombre, b.Nombre, CompareOptions.IgnoreCase));
            return Catalogo();
        }
    }
    public EstadoCatalogo EliminarCatalogo(string clave)
    {
        lock (sync)
        {
            clave = Texto(clave, 30);
            if (!catalogo.Retirar(p => p.Clave.Equals(clave, StringComparison.OrdinalIgnoreCase), out _)) throw NoExiste();
            return Catalogo();
        }
    }
    public EstadoPalabras Palabras()
    {
        lock (sync)
        {
            var grupos = new Dictionary<string, ListaSimple<Palabra>>();
            foreach (var palabra in palabras)
            {
                var letra = StringInfo.GetNextTextElement(palabra.Texto).ToUpper(CultureInfo.GetCultureInfo("es-MX"));
                if (!grupos.TryGetValue(letra, out var lista)) grupos[letra] = lista = new();
                lista.Agregar(palabra);
            }
            return new(palabras.ToArray(), grupos.Select(g => new GrupoPalabras(g.Key, g.Value.ToArray())).ToArray());
        }
    }
    public EstadoPalabras GuardarPalabra(int? id, string texto)
    {
        lock (sync)
        {
            texto = Texto(texto, 50);
            if (!texto.EnumerateRunes().All(Rune.IsLetter)) throw new ReglaNegocioException("Introduce una sola palabra, únicamente con letras");
            if (id is null) { Capacidad(palabras.Cantidad); palabras.Agregar(new(++palabraId, texto)); }
            else if (!palabras.Reemplazar(p => p.Id == id, new(id.Value, texto))) throw NoExiste();
            return Palabras();
        }
    }
    public EstadoPalabras EliminarPalabra(int id)
    {
        lock (sync)
        {
            if (!palabras.Retirar(p => p.Id == id, out _)) throw NoExiste();
            return Palabras();
        }
    }
    public void Reiniciar(int ejercicio)
    {
        lock (sync)
        {
            switch (ejercicio)
            {
                case 1: disponibles.Limpiar(); retirados.Limpiar(); productoId = 0; break;
                case 2: original.Limpiar(); pares.Limpiar(); impares.Limpiar(); break;
                case 3: aprobados.Limpiar(); reprobados.Limpiar(); alumnoId = 0; break;
                case 4: catalogo.Limpiar(); catalogoId = 0; break;
                case 5: palabras.Limpiar(); palabraId = 0; break;
                default: throw NoExiste();
            }
        }
    }
}
