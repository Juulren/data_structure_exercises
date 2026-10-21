using DataStructureExercises.Models.Common;

namespace DataStructureExercises.Services.Interfaces;

public interface IPilasService
{
    EstadoInversion? Inversion();
    EstadoInversion Invertir(string? palabra);
    EstadoPalindromo? Palindromo();
    EstadoPalindromo EvaluarPalindromo(string? texto);
    EstadoSuma? Suma();
    EstadoSuma Sumar(string? operando1, string? operando2);
    EstadoValores Valores();
    EstadoValores Apilar(int valor);
    EstadoValores Desapilar();
    EstadoValores ReemplazarValores(int nuevo, int viejo);
    void Reiniciar(int fase);
}
