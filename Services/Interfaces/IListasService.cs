using DataStructureExercises.Models.Common;

namespace DataStructureExercises.Services.Interfaces;

public interface IListasService
{
    EstadoSupermercado Supermercado();
    EstadoSupermercado Escanear();
    EstadoSupermercado RetirarProducto(int id);
    EstadoSupermercado ActualizarProducto(int id, int cantidad, decimal precio);
    EstadoNumeros Numeros();
    EstadoNumeros GenerarNumeros(int cantidad);
    EstadoAlumnos Alumnos();
    EstadoAlumnos GuardarAlumno(int? id, string nombre, decimal calificacion);
    EstadoAlumnos EliminarAlumno(int id);
    EstadoCatalogo Catalogo();
    EstadoCatalogo GuardarCatalogo(string clave, string nombre, decimal precio, bool actualizar);
    EstadoCatalogo EliminarCatalogo(string clave);
    EstadoPalabras Palabras();
    EstadoPalabras GuardarPalabra(int? id, string texto);
    EstadoPalabras EliminarPalabra(int id);
    void Reiniciar(int ejercicio);
}
