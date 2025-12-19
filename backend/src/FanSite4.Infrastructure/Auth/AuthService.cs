using FanSite4.Application.Abstractions;
using FanSite4.Application.DTOs.Auth;
using FanSite4.Domain.Entities;
using FanSite4.Domain.Enums;
using FanSite4.Infrastructure.Persistence;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;

namespace FanSite4.Infrastructure.Auth;

public sealed class AuthService(
    UserManager<ApplicationUser> userManager,
    SignInManager<ApplicationUser> signInManager,
    ApplicationDbContext db,
    IJwtTokenService jwt,
    JwtOptions jwtOptions
) : IAuthService
{
    public async Task<AuthResponse> RegisterAsync(RegisterRequest request, CancellationToken ct)
    {
        var email = request.Email.Trim().ToLowerInvariant();

        var existing = await userManager.FindByEmailAsync(email);
        if (existing is not null)
            throw new InvalidOperationException("Email already registered.");

        var user = new ApplicationUser
        {
            Email = email,
            UserName = email,
            Role = UserRole.User
        };

        var result = await userManager.CreateAsync(user, request.Password);
        if (!result.Succeeded)
            throw new InvalidOperationException(string.Join("; ", result.Errors.Select(e => e.Description)));

        return await IssueTokensAsync(user, ct);
    }

    public async Task<AuthResponse> LoginAsync(LoginRequest request, CancellationToken ct)
    {
        var email = request.Email.Trim().ToLowerInvariant();
        var user = await userManager.FindByEmailAsync(email);

        if (user is null)
            throw new InvalidOperationException("Invalid credentials.");

        var ok = await signInManager.CheckPasswordSignInAsync(user, request.Password, lockoutOnFailure: true);
        if (!ok.Succeeded)
            throw new InvalidOperationException("Invalid credentials.");

        return await IssueTokensAsync(user, ct);
    }

    public async Task<AuthResponse> RefreshAsync(RefreshRequest request, CancellationToken ct)
    {
        var token = request.RefreshToken.Trim();

        var existing = await db.RefreshTokens
            .Include(t => t.User)
            .FirstOrDefaultAsync(t => t.Token == token, ct);

        if (existing?.User is null || !existing.IsActive)
            throw new InvalidOperationException("Invalid refresh token.");

        // rotate refresh token
        existing.RevokedAt = DateTime.UtcNow;

        var newRefresh = jwt.CreateRefreshToken();
        existing.ReplacedByToken = newRefresh;

        db.RefreshTokens.Add(new RefreshToken
        {
            UserId = existing.UserId,
            Token = newRefresh,
            CreatedAt = DateTime.UtcNow,
            ExpiresAt = DateTime.UtcNow.AddDays(jwtOptions.RefreshTokenDays)
        });

        await db.SaveChangesAsync(ct);

        var (access, expiresIn) = jwt.CreateAccessToken(existing.User);
        return new AuthResponse
        {
            User = new UserDto
            {
                Id = existing.User.Id,
                Email = existing.User.Email ?? "",
                UserName = existing.User.UserName ?? "",
                Role = existing.User.Role.ToString()
            },
            AccessToken = access,
            RefreshToken = newRefresh,
            ExpiresInSeconds = expiresIn
        };
    }

    public async Task LogoutAsync(string refreshToken, CancellationToken ct)
    {
        var token = refreshToken.Trim();
        var existing = await db.RefreshTokens.FirstOrDefaultAsync(t => t.Token == token, ct);
        if (existing is null) return;

        existing.RevokedAt = DateTime.UtcNow;
        await db.SaveChangesAsync(ct);
    }

    private async Task<AuthResponse> IssueTokensAsync(ApplicationUser user, CancellationToken ct)
    {
        var (access, expiresIn) = jwt.CreateAccessToken(user);
        var refresh = jwt.CreateRefreshToken();

        db.RefreshTokens.Add(new RefreshToken
        {
            UserId = user.Id,
            Token = refresh,
            CreatedAt = DateTime.UtcNow,
            ExpiresAt = DateTime.UtcNow.AddDays(jwtOptions.RefreshTokenDays)
        });

        await db.SaveChangesAsync(ct);

        return new AuthResponse
        {
            User = new UserDto
            {
                Id = user.Id,
                Email = user.Email ?? "",
                UserName = user.UserName ?? "",
                Role = user.Role.ToString()
            },
            AccessToken = access,
            RefreshToken = refresh,
            ExpiresInSeconds = expiresIn
        };
    }
}
