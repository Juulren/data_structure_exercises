# Laboratorio de estructuras de datos

Aplicación de la Unidad II con ASP.NET Core 8, HTML, CSS y JavaScript modular. Las fases 0 a 5 están implementadas. Pilas y colas permanecen pendientes y se identifican así en el menú.

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

Todas las vistas incluyen descripción, E-P-S y diagramas SVG desplazables. Hay formularios con etiquetas flotantes, notificaciones, animaciones con soporte para movimiento reducido y navegación adaptable. La interfaz espera la respuesta del servidor y muestra sus errores.

## Arquitectura

- `Models/Structures/`: nodos y `ListaSimple<T>` implementados desde cero, con inserción, iteración, reemplazo, extracción, limpieza y ordenamiento por reenlace. Contrato `IEstructuraLineal<T>` y clase abstracta `EstructuraLineal<T>` para genericidad, herencia y polimorfismo.
- `Models/Entities/` y `Models/Common/`: entidades inmutables, snapshots de respuesta y errores de negocio.
- `Services/Interfaces/` y `Services/Implementations/`: reglas de los cinco ejercicios, inyección de dependencias y exclusión mutua para evitar corrupción por solicitudes simultáneas.
- `Controllers/ListasController.cs`: rutas REST y conversión estricta de entradas numéricas. Los números del formulario viajan como cadenas JSON para validar letras y campos vacíos con los mensajes exigidos. Se admite coma o punto decimal, sin separadores de miles. Cantidades son enteras; precios no negativos hasta $1,000,000 con hasta dos decimales.
- `wwwroot/js/api.js`, `listas.js` y `svgEngine.js`: transporte, vistas y diagramas desacoplados. El contenido introducido por el usuario se escapa antes de renderizarlo.

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

## Pruebas

Pruebas automatizadas de estructura y servicio:

```powershell
dotnet test Tests/DataStructureExercises.Tests.csproj
```

Las pruebas de integración y navegador necesitan una instancia en http://localhost:5080. **Reinician los cinco ejercicios**; ejecutarlas en una instancia de pruebas sin datos que se deseen conservar. Se puede cambiar la dirección con `TEST_BASE_URL`.

```powershell
node Tests/api.cjs
```

Para navegador (Node.js y Playwright; instalar solo en el entorno de desarrollo):

```powershell
npm install --no-save --package-lock=false playwright
npx playwright install chromium
node Tests/browser.cjs
```

En Windows se puede usar Edge instalado: `$env:TEST_BROWSER_CHANNEL = 'msedge'`. Si Playwright está en otro directorio, `PLAYWRIGHT_MODULE` puede apuntar a ese módulo.

Las pruebas cubren extracción de cabeza/medio/final, reutilización, ordenamiento, conservación de productos, partición de números, límites de calificaciones, reubicación al editar, claves duplicadas, totales decimales, agrupación Unicode, reinicios independientes, concurrencia, validaciones HTTP y flujos de los cinco ejercicios en escritorio y móvil. Las capturas de navegador se guardan en `TestResults/`, ignorado por Git.

## Flujo de entrega

Codex ejecuta las pruebas y realiza el commit y el push a [GitHub](https://github.com/Juulren/data_structure_exercises). El usuario confirma el avance a las siguientes fases. Las fases 1 a 5 se implementaron juntas por indicación expresa del usuario.
