namespace DataStructureExercises.Models.Common;

public sealed record EstadoInversion(string Original, string[] Caracteres, string[] Extraidos, string Invertida);
public sealed record PasoPalindromo(int Posicion, string Izquierda, string Extraido, bool Coincide);
public sealed record EstadoPalindromo(string Original, string Normalizado, string[] Caracteres, PasoPalindromo[] Pasos, bool EsPalindromo);
public sealed record PasoSuma(int Columna, int? Digito1, int? Digito2, int AcarreoEntrada, int Total, int Digito, int AcarreoSalida);
public sealed record EstadoSuma(string Operando1, string Operando2, int[] Pila1, int[] Pila2, PasoSuma[] Pasos, string Resultado);
public sealed record EstadoValores(int[] Elementos, int Cantidad, int? Tope, int? UltimoRetirado, int Reemplazos);
