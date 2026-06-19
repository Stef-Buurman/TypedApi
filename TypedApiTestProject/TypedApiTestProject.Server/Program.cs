using Microsoft.AspNetCore.Http.Features;
using TypedApi.Swagger;

var builder = WebApplication.CreateBuilder(args);

builder.Services
    .AddControllers()
    .AddTypedApiJsonOptions();

builder.Services.Configure<IISServerOptions>(options =>
{
    options.MaxRequestBodySize = 419_430_400; // 400MB
});

builder.WebHost.ConfigureKestrel(serverOptions =>
{
    serverOptions.Limits.MaxRequestBodySize = 419_430_400; // 400MB
    serverOptions.Limits.RequestHeadersTimeout = TimeSpan.FromMinutes(10);
    serverOptions.Limits.KeepAliveTimeout = TimeSpan.FromMinutes(10);
});

builder.Services.Configure<FormOptions>(options =>
{
    options.ValueLengthLimit = int.MaxValue;
    options.MultipartBodyLengthLimit = 419_430_400; // 400MB
    options.MultipartHeadersLengthLimit = int.MaxValue;
});


builder.Services.AddEndpointsApiExplorer();
builder.Services.AddTypedApiSwagger();

builder.Services.AddCors(options =>
{
    options.AddPolicy("Frontend", policy =>
    {
        policy
            .WithOrigins("http://localhost:5173")
            .AllowAnyHeader()
            .AllowAnyMethod();
    });
});

var app = builder.Build();

app.UseCors("Frontend");

app.UseSwagger();
app.UseSwaggerUI();

app.MapControllers();

app.Run();