using FanSite4.Domain.Entities;
using FanSite4.Domain.Enums;
using FanSite4.Infrastructure.Persistence;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;

namespace FanSite4.Infrastructure.Seeding;

public static class AdminSeeder
{
    public static async Task SeedAdminAsync(IServiceProvider services, IConfiguration config, CancellationToken ct = default)
    {
        using var scope = services.CreateScope();
        var sp = scope.ServiceProvider;

        var db = sp.GetRequiredService<ApplicationDbContext>();
        await db.Database.MigrateAsync(ct);

        var userManager = sp.GetRequiredService<UserManager<ApplicationUser>>();

        var adminCfg = config.GetSection("Seed:Admin");
        var email = adminCfg["Email"] ?? "admin@fansite4.local";
        var userName = adminCfg["UserName"] ?? "admin";
        var password = adminCfg["Password"] ?? "Admin123!";

        var existing = await userManager.FindByEmailAsync(email);

        if (existing is null)
        {
            var byName = await userManager.FindByNameAsync(userName);
            if (byName is not null && !string.Equals(byName.Email, email, StringComparison.OrdinalIgnoreCase))
                userName = email;

            var admin = new ApplicationUser
            {
                Email = email,
                UserName = userName,
                EmailConfirmed = true,
                Role = UserRole.Admin
            };

            var create = await userManager.CreateAsync(admin, password);
            if (!create.Succeeded)
            {
                var msg = string.Join("; ", create.Errors.Select(e => $"{e.Code}: {e.Description}"));
                throw new InvalidOperationException($"Admin seed failed: {msg}");
            }
        }
        else
        {
            if (existing.Role != UserRole.Admin)
            {
                existing.Role = UserRole.Admin;
                var upd = await userManager.UpdateAsync(existing);
                if (!upd.Succeeded)
                {
                    var msg = string.Join("; ", upd.Errors.Select(e => $"{e.Code}: {e.Description}"));
                    throw new InvalidOperationException($"Admin role update failed: {msg}");
                }
            }
        }
    }
}
