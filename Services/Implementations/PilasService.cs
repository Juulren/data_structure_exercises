using System.Globalization;
using System.Text;
using DataStructureExercises.Models.Common;
using DataStructureExercises.Models.Structures;
using DataStructureExercises.Services.Interfaces;

namespace DataStructureExercises.Services.Implementations;

public sealed class PilasService : IPilasService
{
    private readonly object sync = new();
    private EstadoInversion? inversion;
    private EstadoPalindromo? palindromo;
    private EstadoSuma? suma;
    private readonly PilaPersonalizada<int> valores = new();
    private int? ultimoRetirado;
    private int reemplazos;

    private static string Requerido(string? texto)
    {
        if (string.IsNullOrWhiteSpace(texto)) throw new ReglaNegocioException("Hay datos faltantes");
        return texto.Trim();
    }
    private static string[] Caracteres(string texto) =>
        StringInfo.ParseCombiningCharacters(texto).Select((start, index) =>
            StringInfo.GetNextTextElement(texto, start)).ToArray();

    public EstadoInversion? Inversion() { lock (sync) return inversion; }
    public EstadoInversion Invertir(string? palabra)
    {
        lock (sync)
        {
            palabra = Requerido(palabra);
            if (palabra.Length > 1000) throw new ReglaNegocioException("La palabra admite hasta 80 caracteres visibles");
            if (palabra.Any(char.IsWhiteSpace)) throw new ReglaNegocioException("Introduce una sola palabra, sin espacios");
            var caracteres = Caracteres(palabra);
            if (caracteres.Length > 80) throw new ReglaNegocioException("La palabra admite hasta 80 caracteres visibles");
            var pila = new PilaPersonalizada<string>();
            foreach (var caracter in caracteres) pila.Push(caracter);
            var extraidos = new string[caracteres.Length];
            for (var i = 0; pila.Cantidad > 0; i++) extraidos[i] = pila.Pop();
            return inversion = new(palabra, caracteres, extraidos, string.Concat(extraidos));
        }
    }

    public EstadoPalindromo? Palindromo() { lock (sync) return palindromo; }
    public EstadoPalindromo EvaluarPalindromo(string? texto)
    {
        lock (sync)
        {
            texto = Requerido(texto);
            if (texto.Length > 1000) throw new ReglaNegocioException("El texto admite hasta 1000 unidades UTF-16 y 120 letras o números normalizados");
            var normalizado = new StringBuilder();
            // Ignorar diacríticos, espacios y signos, conservando la ñ como letra distinta.
            foreach (var elemento in Caracteres(texto.Normalize(NormalizationForm.FormC)))
            {
                if (elemento is "ñ" or "Ñ") { normalizado.Append('Ñ'); continue; }
                foreach (var rune in elemento.Normalize(NormalizationForm.FormD).EnumerateRunes())
                    if (Rune.GetUnicodeCategory(rune) != UnicodeCategory.NonSpacingMark && Rune.IsLetterOrDigit(rune))
                        normalizado.Append(Rune.ToUpperInvariant(rune).ToString());
            }
            var cadena = normalizado.ToString().Normalize(NormalizationForm.FormC);
            var caracteres = Caracteres(cadena);
            if (caracteres.Length == 0) throw new ReglaNegocioException("Introduce al menos una letra o un número");
            if (caracteres.Length > 120) throw new ReglaNegocioException("El texto admite hasta 120 letras o números normalizados");
            var pila = new PilaPersonalizada<string>();
            foreach (var caracter in caracteres) pila.Push(caracter);
            var pasos = new PasoPalindromo[caracteres.Length];
            for (var i = 0; i < caracteres.Length; i++)
            {
                var extraido = pila.Pop();
                pasos[i] = new(i + 1, caracteres[i], extraido, caracteres[i] == extraido);
            }
            return palindromo = new(texto, cadena, caracteres, pasos, pasos.All(p => p.Coincide));
        }
    }

    public EstadoSuma? Suma() { lock (sync) return suma; }
    public EstadoSuma Sumar(string? operando1, string? operando2)
    {
        lock (sync)
        {
            operando1 = Requerido(operando1); operando2 = Requerido(operando2);
            static string Numero(string texto)
            {
                if (texto.Any(c => c < '0' || c > '9')) throw new FormatException();
                if (texto.Length > 1000) throw new ReglaNegocioException("Cada operando admite hasta 1000 dígitos");
                var limpio = texto.TrimStart('0');
                return limpio.Length == 0 ? "0" : limpio;
            }
            operando1 = Numero(operando1); operando2 = Numero(operando2);
            var pila1 = new PilaPersonalizada<int>();
            var pila2 = new PilaPersonalizada<int>();
            var resultado = new PilaPersonalizada<int>();
            foreach (var digito in operando1) pila1.Push(digito - '0');
            foreach (var digito in operando2) pila2.Push(digito - '0');
            var inicial1 = pila1.ToArray(); var inicial2 = pila2.ToArray();
            var pasos = new ListaSimple<PasoSuma>();
            var acarreo = 0;
            while (pila1.Cantidad > 0 || pila2.Cantidad > 0 || acarreo > 0)
            {
                int? a = pila1.Cantidad > 0 ? pila1.Pop() : null;
                int? b = pila2.Cantidad > 0 ? pila2.Pop() : null;
                var total = (a ?? 0) + (b ?? 0) + acarreo;
                resultado.Push(total % 10);
                pasos.Agregar(new(pasos.Cantidad + 1, a, b, acarreo, total, total % 10, total / 10));
                acarreo = total / 10;
            }
            var textoResultado = new StringBuilder();
            while (resultado.Cantidad > 0) textoResultado.Append(resultado.Pop());
            return suma = new(operando1, operando2, inicial1, inicial2, pasos.ToArray(), textoResultado.ToString());
        }
    }

    public EstadoValores Valores()
    {
        lock (sync) return new(valores.ToArray(), valores.Cantidad, valores.Cantidad == 0 ? null : valores.Peek(), ultimoRetirado, reemplazos);
    }
    public EstadoValores Apilar(int valor)
    {
        lock (sync)
        {
            if (valores.Cantidad >= 100) throw new ReglaNegocioException("La pila admite hasta 100 enteros");
            valores.Push(valor); ultimoRetirado = null; reemplazos = 0;
            return Valores();
        }
    }
    public EstadoValores Desapilar()
    {
        lock (sync)
        {
            if (valores.Cantidad == 0) throw new ReglaNegocioException("La pila está vacía", 409);
            ultimoRetirado = valores.Pop(); reemplazos = 0;
            return Valores();
        }
    }
    public static int Reemplazar(PilaPersonalizada<int> pila, int nuevo, int viejo)
    {
        var auxiliar = new PilaPersonalizada<int>();
        var coincidencias = 0;
        while (pila.Cantidad > 0)
        {
            var valor = pila.Pop();
            if (valor == viejo) { valor = nuevo; coincidencias++; }
            auxiliar.Push(valor);
        }
        while (auxiliar.Cantidad > 0) pila.Push(auxiliar.Pop());
        return coincidencias;
    }
    public EstadoValores ReemplazarValores(int nuevo, int viejo)
    {
        lock (sync)
        {
            if (valores.Cantidad == 0) throw new ReglaNegocioException("La pila está vacía", 409);
            reemplazos = Reemplazar(valores, nuevo, viejo); ultimoRetirado = null;
            return Valores();
        }
    }
    public void Reiniciar(int fase)
    {
        lock (sync)
        {
            switch (fase)
            {
                case 6: inversion = null; break;
                case 7: palindromo = null; break;
                case 8: suma = null; break;
                case 9: valores.Limpiar(); ultimoRetirado = null; reemplazos = 0; break;
                default: throw new ReglaNegocioException("El ejercicio no existe", 404);
            }
        }
    }
}
