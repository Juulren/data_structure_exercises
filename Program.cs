using DataStructureExercises.Models.Common;
using Microsoft.AspNetCore.Mvc;
using DataStructureExercises.Services.Interfaces;
using DataStructureExercises.Services.Implementations;

var builder = WebApplication.CreateBuilder(args);
builder.Services.AddSingleton<IListasService, ListasService>();
builder.Services.AddSingleton<IPilasService, PilasService>();
builder.Services.AddControllers().ConfigureApiBehaviorOptions(options =>
{
    options.InvalidModelStateResponseFactory = context =>
    {
        var numericError = context.ModelState.Values.SelectMany(value => value.Errors)
            .Any(error => error.Exception is System.Text.Json.JsonException ||
                error.ErrorMessage.Contains("could not be converted", StringComparison.OrdinalIgnoreCase));
        return new BadRequestObjectResult(ApiResponse<object>.Fail(
            numericError ? "Introducir sólo números" : "Hay datos faltantes"));
    };
});

var app = builder.Build();
app.Use(async (context, next) =>
{
    try
    {
        await next(context);
    }
    catch (Exception exception) when (!context.Response.HasStarted)
    {
        var (status, message) = exception switch
        {
            ReglaNegocioException regla => (regla.Estado, regla.Message),
            FormatException or OverflowException => (400, "Introducir sólo números"),
            ArgumentException => (400, "Hay datos faltantes"),
            BadHttpRequestException => (400, "Hay datos faltantes"),
            _ => (500, "Ocurrió un error inesperado. Inténtalo nuevamente.")
        };
        if (status == 500) app.Logger.LogError(exception, "Error al procesar la solicitud");
        context.Response.StatusCode = status;
        await context.Response.WriteAsJsonAsync(ApiResponse<object>.Fail(message));
    }
});
app.UseDefaultFiles();
app.UseStaticFiles();
app.MapGet("/", () => Results.File(Path.Combine(app.Environment.WebRootPath, "index.html"), "text/html; charset=utf-8"));
app.MapControllers();
app.MapGet("/api/estado", () => ApiResponse<object>.Ok(new { fase = 9, ejercicios = 12, implementados = 9 }, "Aplicación lista"));
app.MapFallback(async context =>
{
    context.Response.StatusCode = 404;
    await context.Response.WriteAsJsonAsync(ApiResponse<object>.Fail("Recurso no encontrado"));
});
app.Run();
