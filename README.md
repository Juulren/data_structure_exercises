# Laboratorio de estructuras de datos

Aplicación de la Unidad II con ASP.NET Core 8, HTML, CSS y JavaScript modular. Las fases 0 a 12 están implementadas: módulos de listas, pilas y colas completos.

## Ejecutar

Requiere el SDK de .NET 8 o superior y el runtime de ASP.NET Core 8. Desde la raíz:

```powershell
dotnet run
```

Abre la dirección que imprime Kestrel (por defecto http://localhost:5000). Para elegir otra dirección: `dotnet run --urls http://localhost:5080`.

Los datos se conservan en memoria en un servicio Singleton, compartido entre las pestañas y clientes del mismo servidor. Detener el servidor elimina los datos. Cada ejercicio tiene un reinicio independiente con confirmación.

## Ejercicios disponibles

| Fase | Ejercicio | Comportamiento |
| --- | --- | --- |
| 1 | Productos disponibles y retirados | Escanear genera nombre secuencial, cantidad de 1–20 y precio de $1–$500. Editar disponibles, transferir a retirados y consultar productos y unidades en ambas listas. |
| 2 | Pares e impares | Generar entre 1 y 100 enteros aleatorios de 0–999. Mostrar original, pares e impares, conservando repeticiones y orden. Cada generación reemplaza las listas anteriores. |
| 3 | Aprobados y reprobados | Registrar y editar calificaciones decimales de 0–10. Extraer menores de 7 a la lista de reprobados y reubicar al editar. Permite eliminar alumnos. |
| 4 | Catálogo de compras | Agregar con clave única, editar, eliminar por clave, ordenar por nombre con reglas de español y sumar precios con `decimal`. Las claves no distinguen mayúsculas. |
| 5 | Palabras por letra | Lista general y listas enlazadas por inicial, creadas dinámicamente. Agregar, editar y eliminar palabras; conservar duplicados, acentos y ñ. Las iniciales ignoran mayúsculas; Á y A son grupos diferentes. |
| 6 | Invertir palabra | Insertar caracteres con Push y extraerlos con Pop. Animación paso a paso, conservando caracteres Unicode combinados y emojis. Hasta 80 caracteres visibles, sin espacios interiores. |
| 7 | Palíndromo | Comparar palabras, números o frases con los elementos extraídos de una pila. Ignorar mayúsculas, espacios, signos y acentos; conservar ñ como letra distinta. Hasta 120 caracteres normalizados y 1000 unidades UTF-16 de entrada. |
| 8 | Suma de números grandes | Sumar dos enteros no negativos de hasta 1000 dígitos cada uno con tres pilas propias. Mostrar operand-stack1, operand-stack2, result-stack y cada acarreo. Sin conversión del número completo a tipos numéricos. Normalizar ceros iniciales. |
| 9 | Reemplazar valor | Push, Peek, Pop y reemplazo de todas las coincidencias utilizando una pila auxiliar, conservando el orden. Hasta 100 enteros de 32 bits, incluidos negativos y repetidos. |
| 10 | Ventanilla de un banco | Cola circular de 10 lugares. Turnos consecutivos y hora del servidor, cinco movimientos exactos, corrección de datos sin cambiar posición ni llegada, atención FIFO, índices Frente/Final y modales de ingreso/espera. |
| 11 | Juego: pintar coches | Llegadas aleatorias cada 20 segundos; después de cada tres coches pintados, el intervalo disminuye 2 segundos hasta un mínimo de 4. Solo se pinta el frente con el color solicitado. Al acumular cinco coches, termina y muestra pintados y tiempo total. |
| 12 | Estacionamiento de autos | Cola circular doblemente ligada sin límite de cupo. Placas únicas, entrada y salida FIFO, corrección de datos conservando hora/posición, enlaces Siguiente/Anterior y ticket de $2.00 por segundo, incluidas fracciones. |

Todas las vistas incluyen descripción, E-P-S y diagramas SVG desplazables. Hay formularios con etiquetas flotantes, notificaciones, animaciones con soporte para movimiento reducido y navegación adaptable. La interfaz espera la respuesta del servidor y muestra sus errores.

En las fases 6–8 el servidor devuelve el resultado y la traza del proceso. Los controles permiten avanzar, retroceder, reproducir, pausar o saltar a cualquier paso sin repetir cálculos en el navegador. Las pilas muestran hasta 12 bloques SVG y permiten consultar todos sus valores en un panel desplegable; la tabla muestra las operaciones cercanas al paso elegido. La reproducción se detiene al navegar. Se conserva el último resultado de cada fase en memoria.

El juego comienza vacío y el primer coche llega a los 20 segundos. El servidor es la autoridad del tiempo: al consultar o pintar recupera las llegadas pendientes, incluidas las ocurridas al cerrar la página o perder conexión. El fin se registra exactamente en la quinta llegada acumulada, aunque la consulta sea posterior. La vista consulta cada segundo durante la partida; deja de consultar al navegar, sin pausar el tiempo de juego. Las peticiones de pintura llevan identificador de partida y coche para rechazar intentos obsoletos y evitar atender dos coches con un reintento. La aceleración recalcula la próxima llegada desde la llegada anterior. Una nueva partida conserva el mejor puntaje; reiniciar el ejercicio borra también el récord.

Banco y estacionamiento registran fechas UTC con el reloj del servidor (`TimeProvider.System`), y la interfaz muestra horas de Ciudad de México. Las esperas y el cobro se calculan con ticks y `decimal`, conservando fracciones de segundo. El ticket presenta hasta siete decimales, sin redondear previamente el tiempo a segundos enteros. El banco permite 10 clientes simultáneos y reutiliza lugares atendidos; el estacionamiento no impone ese límite. La opción Actualizar permite consultar cambios hechos en otra pestaña.

## Arquitectura

- `Models/Structures/`: nodos y `ListaSimple<T>` implementados desde cero, con inserción, iteración, reemplazo, extracción, limpieza y ordenamiento por reenlace. Contrato `IEstructuraLineal<T>` y clase abstracta `EstructuraLineal<T>` para genericidad, herencia y polimorfismo.
- `Models/Structures/PilaPersonalizada.cs`: pila genérica de nodos propios que hereda de `EstructuraLineal<T>`, con Push, Pop, Peek, recorrido desde el tope y limpieza. No utiliza `Stack<T>` de la biblioteca estándar.
- `Models/Entities/` y `Models/Common/`: entidades inmutables, snapshots de respuesta y errores de negocio.
- `Services/Interfaces/` y `Services/Implementations/`: reglas de los cinco ejercicios, inyección de dependencias y exclusión mutua para evitar corrupción por solicitudes simultáneas.
- `Controllers/ListasController.cs`: rutas REST y conversión estricta de entradas numéricas. Los números del formulario viajan como cadenas JSON para validar letras y campos vacíos con los mensajes exigidos. Se admite coma o punto decimal, sin separadores de miles. Cantidades son enteras; precios no negativos hasta $1,000,000 con hasta dos decimales.
- `wwwroot/js/api.js`, `listas.js` y `svgEngine.js`: transporte, vistas y diagramas desacoplados. El contenido introducido por el usuario se escapa antes de renderizarlo.
- `PilasController`, `IPilasService`, `PilasService` y `wwwroot/js/pilas.js`: HTTP, reglas del módulo 2 y visualización de las trazas. El servicio Singleton protege su estado mediante exclusión mutua. `Reemplazar(PilaPersonalizada<int> pila, int nuevo, int viejo)` usa exclusivamente Pop/Push y una pila auxiliar para conservar el orden.
- `ColaConLimite<T>` utiliza un arreglo circular propio, con ColaLlena, ColaVacia, Enqueue, Peek, Dequeue, reemplazo y limpieza. `ColaCircularDoble<T>` utiliza nodos propios con enlaces recíprocos y circulares, sin `Queue<T>` ni `LinkedList<T>` de la biblioteca estándar. Ambas heredan de `EstructuraLineal<T>`.
- `ColasController`, `IColasService`, `ColasService` y `wwwroot/js/colas.js`: módulo 3, reglas FIFO y visualizaciones. `TimeProvider` inyectado permite probar el paso del tiempo sin esperas reales. Las mutaciones y snapshots del Singleton están protegidos por exclusión mutua.

Los ejercicios 1, 3, 4 y 5 admiten hasta 500 elementos cada uno, para mantener manejable la visualización. El supermercado cuenta disponibles y retirados juntos para ese límite.

## API

Todas las respuestas tienen `{ success, message, data }`. Errores: 400 para entradas inválidas, 404 para elementos inexistentes y 409 para claves duplicadas. Mensajes requeridos: `Hay datos faltantes` e `Introducir sólo números`.

| Ruta bajo `/api/listas` | Operaciones |
| --- | --- |
| `/supermercado` | GET consultar, POST escanear |
| `/supermercado/{id}` | PUT cantidad/precio, DELETE transferir a retirados |
| `/numeros` | GET consultar, POST generar con `{ "cantidad": "10" }` |
| `/alumnos` | GET consultar, POST agregar con nombre/calificacion |
| `/alumnos/{id}` | PUT editar, DELETE eliminar |
| `/catalogo` | GET consultar, POST agregar, PUT editar con clave/nombre/precio |
| `/catalogo?clave=...` | DELETE eliminar por clave |
| `/palabras` | GET consultar, POST agregar con texto |
| `/palabras/{id}` | PUT editar texto, DELETE eliminar |
| `/{ejercicio}/reiniciar` | DELETE reiniciar una fase de 1 a 5 |

`GET /api/estado` informa la fase implementada y la cantidad de ejercicios disponibles.

Rutas del módulo de pilas bajo `/api/pilas` (entradas numéricas como cadenas JSON):

| Ruta | Operaciones |
| --- | --- |
| `/invertir` | GET último resultado (null si no existe), POST con `{ "texto": "UTM" }` |
| `/palindromo` | GET último resultado, POST con `{ "texto": "Anita lava la tina" }` |
| `/suma` | GET último resultado, POST con `{ "operando1": "592", "operando2": "3784" }` |
| `/valores` | GET consultar pila y tope, POST con `{ "valor": "2" }`, PUT con `{ "nuevo": "9", "viejo": "2" }` |
| `/valores/tope` | DELETE extraer tope (409 si la pila está vacía) |
| `/{fase}/reiniciar` | DELETE reiniciar únicamente la fase indicada (6 a 9) |

Cada nuevo POST de las fases 6–8 sustituye el resultado anterior solo si las entradas son válidas. Los enteros grandes aceptan únicamente dígitos ASCII del 0 al 9, sin signos, puntos, comas ni notación científica. Los valores de la fase 9 aceptan signo y rango de `int`; el desbordamiento se informa como `Introducir sólo números`. Reemplazar en una pila no vacía sin coincidencias deja la pila intacta e informa cero reemplazos.

Rutas de colas bajo `/api/colas`:

| Ruta | Operaciones |
| --- | --- |
| `/banco` | GET consultar, POST insertar con `{ "nombre": "Ana", "movimiento": "Depósito" }` |
| `/banco/{turno}` | PUT corregir nombre/movimiento, conservando hora y posición |
| `/banco/frente` | DELETE atender al primer cliente |
| `/juego` | GET consultar y recuperar llegadas pendientes |
| `/juego/iniciar` | POST comenzar una partida (409 si ya hay una activa) |
| `/juego/pintar` | POST con `{ "partidaId": "GUID de la partida", "cocheId": "1", "color": "Rojo" }` |
| `/estacionamiento` | GET consultar autos, enlaces y último ticket; POST ingresar con placas/propietario |
| `/estacionamiento/{id}` | PUT corregir placas/propietario, conservando hora y posición |
| `/estacionamiento/frente` | DELETE retirar el primer auto y generar ticket |
| `/{fase}/reiniciar` | DELETE reiniciar únicamente la fase indicada (10 a 12) |

Los movimientos bancarios admitidos son exactamente Pago de servicio, Depósito, Retiro, Compra de tiempo-aire y Consulta de saldo. Las placas se normalizan a mayúsculas y deben ser únicas entre los autos presentes. Subflujo, sobreflujo, placas duplicadas e intentos de pintura fuera de turno devuelven 409; color incorrecto, movimiento inválido y entradas faltantes devuelven 400.

## Pruebas

Pruebas automatizadas de estructura y servicio:

```powershell
dotnet test Tests/DataStructureExercises.Tests.csproj
```

Las pruebas de integración y navegador necesitan una instancia en http://localhost:5080. **Reinician los ejercicios del módulo que prueban**; ejecutarlas en una instancia de pruebas sin datos que se deseen conservar. Se puede cambiar la dirección con `TEST_BASE_URL`.

```powershell
node Tests/api.cjs
node Tests/pilas-api.cjs
node Tests/colas-api.cjs
```

Para navegador (Node.js y Playwright; instalar solo en el entorno de desarrollo):

```powershell
npm install --no-save --package-lock=false playwright
npx playwright install chromium
node Tests/browser.cjs
node Tests/pilas-browser.cjs
node Tests/colas-browser.cjs
```

En Windows se puede usar Edge instalado: `$env:TEST_BROWSER_CHANNEL = 'msedge'`. Si Playwright está en otro directorio, `PLAYWRIGHT_MODULE` puede apuntar a ese módulo.

Las pruebas cubren extracción de cabeza/medio/final, reutilización, ordenamiento, conservación de productos, partición de números, límites de calificaciones, reubicación al editar, claves duplicadas, totales decimales, agrupación Unicode, reinicios independientes, concurrencia, validaciones HTTP y flujos de los cinco ejercicios en escritorio y móvil. Las capturas de navegador se guardan en `TestResults/`, ignorado por Git.

Las pruebas de pilas cubren LIFO, Peek sin extracción, subflujo, capacidad, palabras Unicode, todos los ejemplos de palíndromos del plan, frases con acentos, suma de 1000 dígitos y acarreos encadenados, 50 sumas aleatorias comparadas con `BigInteger` únicamente en las pruebas, conservación del orden al reemplazar duplicados, enteros límite y concurrencia. Las pruebas de navegador verifican reproducción y cancelación al navegar, tres pilas, errores de red, persistencia tras recargar, reinicio, móvil y movimiento reducido.

Las pruebas de colas verifican reutilización de posiciones, sobreflujo/subflujo, FIFO, integridad de enlaces recíprocos después de 500 operaciones aleatorias, atención bancaria y esperas exactas, cobro por fracciones de segundo, 600 autos sin límite artificial, unicidad de placas, concurrencia, reinicios y conservación de horas al editar. El reloj controlado prueba llegadas, aceleración hasta el mínimo, recuperación sin consultas, rechazo de colores/turnos obsoletos y final exacto con cinco coches. El navegador verifica además el juego con tiempo real: pinta un coche y espera hasta el fin a los 120 segundos desde el inicio. Esta prueba dura aproximadamente dos minutos, sin acelerar el reloj ni agregar rutas de prueba al servidor.

## Flujo de entrega

Codex ejecuta las pruebas y realiza el commit y el push a [GitHub](https://github.com/Juulren/data_structure_exercises). Los tres módulos se implementaron por bloques completos por indicación expresa del usuario.
