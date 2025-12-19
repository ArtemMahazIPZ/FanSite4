using FanSite4.Infrastructure;
using FanSite4.Infrastructure.Seeding;
using Microsoft.AspNetCore.StaticFiles;
using Microsoft.Extensions.FileProviders;
using Microsoft.OpenApi.Models; // Цей простір імен працює в версіях 1.x (які використовує Swashbuckle)
using System.Text.Json.Serialization;

var builder = WebApplication.CreateBuilder(args);

// 1. Налаштування контролерів та JSON
builder.Services
    .AddControllers()
    .AddJsonOptions(o => o.JsonSerializerOptions.Converters.Add(new JsonStringEnumConverter()));

// 2. Підключення твого шару інфраструктури
builder.Services.AddFanSite4(builder.Configuration);

// 3. Налаштування CORS (для Angular)
builder.Services.AddCors(opt =>
{
    opt.AddPolicy("spa", p => p
        .WithOrigins("http://localhost:4200")
        .AllowAnyHeader()
        .AllowAnyMethod()
        .AllowCredentials());
});

builder.Services.AddEndpointsApiExplorer();

// 4. Налаштування Swagger (ВИПРАВЛЕНО)
builder.Services.AddSwaggerGen(options =>
{
    options.SwaggerDoc("v1", new OpenApiInfo
    {
        Title = "FanSite4 API",
        Version = "v1"
    });

    // Визначаємо схему безпеки
    var jwtSecurityScheme = new OpenApiSecurityScheme
    {
        Name = "Authorization",
        Type = SecuritySchemeType.Http,
        Scheme = "bearer",
        BearerFormat = "JWT",
        In = ParameterLocation.Header,
        Description = "Введіть токен доступу",

        // Цей Reference критично важливий для зв'язку Definition і Requirement
        Reference = new OpenApiReference
        {
            Type = ReferenceType.SecurityScheme,
            Id = "Bearer"
        }
    };

    options.AddSecurityDefinition("Bearer", jwtSecurityScheme);

    options.AddSecurityRequirement(new OpenApiSecurityRequirement
    {
        { jwtSecurityScheme, Array.Empty<string>() }
    });
});

var app = builder.Build();

// 5. Сідінг даних (створення адміна)
// Використовуємо Scope, щоб отримати сервіси коректно
using (var scope = app.Services.CreateScope())
{
    var services = scope.ServiceProvider;
    await AdminSeeder.SeedAdminAsync(services, app.Configuration);
}

// 6. Middleware пайплайн
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI(c =>
    {
        c.SwaggerEndpoint("/swagger/v1/swagger.json", "FanSite4 API v1");
        c.RoutePrefix = "swagger";
    });
}

// Налаштування папки для завантажених файлів
var uploadsRoot = Path.Combine(app.Environment.ContentRootPath, "uploads");
if (!Directory.Exists(uploadsRoot))
{
    Directory.CreateDirectory(uploadsRoot);
}

var contentTypeProvider = new FileExtensionContentTypeProvider();
contentTypeProvider.Mappings[".webp"] = "image/webp";

app.UseStaticFiles(new StaticFileOptions
{
    FileProvider = new PhysicalFileProvider(uploadsRoot),
    RequestPath = "/uploads",
    ContentTypeProvider = contentTypeProvider
});

if (!app.Environment.IsDevelopment())
{
    app.UseHttpsRedirection();
}

app.UseCors("spa");

// Порядок важливий: спочатку Аутентифікація, потім Авторизація
app.UseAuthentication();
app.UseAuthorization();

app.MapControllers();

app.Run();