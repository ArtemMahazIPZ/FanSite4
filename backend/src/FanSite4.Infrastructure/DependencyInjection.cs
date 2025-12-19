using FanSite4.Application.Abstractions;
using FanSite4.Infrastructure.Auth;
using FanSite4.Infrastructure.Persistence;
using FanSite4.Infrastructure.Services;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.IdentityModel.Tokens;
using System.Security.Claims;
using System.Text;

namespace FanSite4.Infrastructure;

public static class DependencyInjection
{
    private const string JwtKeyId = "fansite4";

    public static IServiceCollection AddFanSite4(this IServiceCollection services, IConfiguration config)
    {
        services.AddDbContext<ApplicationDbContext>(opt =>
            opt.UseNpgsql(config.GetConnectionString("Default")));


        services.AddIdentityCore<FanSite4.Domain.Entities.ApplicationUser>(opt =>
        {
            opt.Password.RequireNonAlphanumeric = false;
            opt.User.RequireUniqueEmail = true;
        })
            .AddEntityFrameworkStores<ApplicationDbContext>()
            .AddSignInManager();

        var jwtOptions = config.GetSection("Jwt").Get<JwtOptions>() ?? new JwtOptions();

        if (string.IsNullOrWhiteSpace(jwtOptions.Key) || jwtOptions.Key.Length < 16)
            throw new InvalidOperationException("Jwt:Key must be set (>= 16 chars). Check appsettings.json / appsettings.Development.json / user-secrets.");

        services.AddSingleton(jwtOptions);
        services.AddSingleton<IJwtTokenService, JwtTokenService>();

        // ✅ single signing key instance (same KeyId as in JwtTokenService)
        var signingKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtOptions.Key))
        {
            KeyId = JwtKeyId
        };

        services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
            .AddJwtBearer(opt =>
            {
                // Helpful in Swagger/Postman where people sometimes paste "Bearer <token>" as token.
                opt.Events = new JwtBearerEvents
                {
                    OnMessageReceived = context =>
                    {
                        // If Swagger sends: Authorization: Bearer Bearer <token>, token becomes "Bearer <token>".
                        if (!string.IsNullOrWhiteSpace(context.Token) &&
                            context.Token.StartsWith("Bearer ", StringComparison.OrdinalIgnoreCase))
                        {
                            context.Token = context.Token["Bearer ".Length..].Trim();
                        }

                        return Task.CompletedTask;
                    }
                };

                opt.TokenValidationParameters = new TokenValidationParameters
                {
                    ValidateIssuer = true,
                    ValidateAudience = true,
                    ValidateIssuerSigningKey = true,
                    ValidateLifetime = true,

                    ValidIssuer = jwtOptions.Issuer,
                    ValidAudience = jwtOptions.Audience,
                    IssuerSigningKey = signingKey,

                    RoleClaimType = ClaimTypes.Role,

                    // ✅ less "mystery" in development
                    ClockSkew = TimeSpan.Zero,

                    // ✅ makes validation work even if token has "kid" and key id doesn't match perfectly
                    TryAllIssuerSigningKeys = true
                };
            });

        services.AddAuthorization();

        services.AddScoped<IAuthService, AuthService>();
        services.AddScoped<IArticleService, ArticleService>();
        services.AddScoped<IReactionService, ReactionService>();
        services.AddScoped<IReportService, ReportService>();

        return services;
    }
}
