#nullable enable

using FanSite4.Domain.Entities;
using Microsoft.AspNetCore.Identity.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore;

namespace FanSite4.Infrastructure.Persistence;

public sealed class ApplicationDbContext : IdentityDbContext<ApplicationUser>
{
    public ApplicationDbContext(DbContextOptions<ApplicationDbContext> options) : base(options) { }

    // ===== Content =====
    public DbSet<Article> Articles => Set<Article>();
    public DbSet<Comment> Comments => Set<Comment>();

    // ===== Engagement / Moderation =====
    public DbSet<Reaction> Reactions => Set<Reaction>();
    public DbSet<Report> Reports => Set<Report>();

    // ===== Auth =====
    public DbSet<RefreshToken> RefreshTokens => Set<RefreshToken>();

    protected override void OnModelCreating(ModelBuilder b)
    {
        base.OnModelCreating(b);

        // =========================
        // ApplicationUser
        // =========================
        b.Entity<ApplicationUser>(e =>
        {
            e.Property(x => x.Role)
             .HasConversion<string>()
             .HasMaxLength(32)
             .IsRequired();

            e.HasIndex(x => x.Email).HasDatabaseName("IX_Users_Email");
        });

        // =========================
        // Article
        // =========================
        b.Entity<Article>(e =>
        {
            e.ToTable("Articles");
            e.HasKey(x => x.Id);

            e.Property(x => x.Title).HasMaxLength(200).IsRequired();
            e.Property(x => x.Content).HasMaxLength(20000).IsRequired();
            e.Property(x => x.ImageUrl).HasMaxLength(2048);

            e.Property(x => x.Category)
             .HasConversion<string>()
             .HasMaxLength(32)
             .IsRequired();

            // ВИПРАВЛЕНО: прибрали .HasColumnType("datetime2")
            // PostgreSQL автоматично зробить це timestamp without time zone
            e.Property(x => x.CreatedAt);

            e.HasIndex(x => x.CreatedAt).HasDatabaseName("IX_Articles_CreatedAt");
            e.HasIndex(x => x.Category).HasDatabaseName("IX_Articles_Category");
        });

        // =========================
        // Reaction
        // =========================
        b.Entity<Reaction>(e =>
        {
            e.ToTable("Reactions");
            e.HasKey(x => x.Id);

            e.Property(x => x.Type)
             .HasConversion<string>()
             .HasMaxLength(32)
             .IsRequired();

            // ВИПРАВЛЕНО: прибрали datetime2
            e.Property(x => x.CreatedAt);

            e.HasOne(x => x.Article)
             .WithMany(x => x.Reactions)
             .HasForeignKey(x => x.ArticleId)
             .OnDelete(DeleteBehavior.Cascade);

            e.HasOne(x => x.User)
             .WithMany()
             .HasForeignKey(x => x.UserId)
             .OnDelete(DeleteBehavior.Cascade);

            e.HasIndex(x => new { x.ArticleId, x.UserId })
             .IsUnique()
             .HasDatabaseName("UX_Reactions_Article_User");

            e.HasIndex(x => x.ArticleId).HasDatabaseName("IX_Reactions_ArticleId");
        });

        // =========================
        // Report
        // =========================
        b.Entity<Report>(e =>
        {
            e.ToTable("Reports");
            e.HasKey(x => x.Id);

            e.Property(x => x.Reason).HasMaxLength(1000).IsRequired();

            // ВИПРАВЛЕНО: прибрали datetime2
            e.Property(x => x.CreatedAt);

            e.HasOne(x => x.Article)
             .WithMany(x => x.Reports)
             .HasForeignKey(x => x.ArticleId)
             .OnDelete(DeleteBehavior.Cascade);

            e.HasOne(x => x.User)
             .WithMany()
             .HasForeignKey(x => x.UserId)
             .OnDelete(DeleteBehavior.Cascade);

            e.HasIndex(x => new { x.ArticleId, x.UserId })
             .IsUnique()
             .HasDatabaseName("UX_Reports_Article_User");

            e.HasIndex(x => x.CreatedAt).HasDatabaseName("IX_Reports_CreatedAt");
        });

        // =========================
        // Comment
        // =========================
        b.Entity<Comment>(e =>
        {
            e.ToTable("Comments");
            e.HasKey(x => x.Id);

            e.Property(x => x.Text)
             .HasMaxLength(4000)
             .IsRequired();

            // ВИПРАВЛЕНО: прибрали datetime2
            e.Property(x => x.CreatedAtUtc)
             .IsRequired();

            e.Property(x => x.AuthorId)
             .HasMaxLength(450)
             .IsRequired();

            e.HasOne(x => x.Article)
             .WithMany(x => x.Comments)
             .HasForeignKey(x => x.ArticleId)
             .OnDelete(DeleteBehavior.Cascade);

            e.HasOne(x => x.Author)
             .WithMany()
             .HasForeignKey(x => x.AuthorId)
             .OnDelete(DeleteBehavior.Cascade);

            e.HasIndex(x => x.ArticleId).HasDatabaseName("IX_Comments_ArticleId");
            e.HasIndex(x => x.AuthorId).HasDatabaseName("IX_Comments_AuthorId");
            e.HasIndex(x => x.CreatedAtUtc).HasDatabaseName("IX_Comments_CreatedAtUtc");
        });

        // =========================
        // RefreshToken
        // =========================
        b.Entity<RefreshToken>(e =>
        {
            e.ToTable("RefreshTokens");
            e.HasKey(x => x.Id);

            e.Property(x => x.Token).HasMaxLength(512).IsRequired();

            // ВИПРАВЛЕНО: прибрали datetime2 для всіх дат
            e.Property(x => x.CreatedAt);
            e.Property(x => x.ExpiresAt);
            e.Property(x => x.RevokedAt);

            e.HasOne(x => x.User)
             .WithMany()
             .HasForeignKey(x => x.UserId)
             .OnDelete(DeleteBehavior.Cascade);

            e.HasIndex(x => x.Token).IsUnique().HasDatabaseName("UX_RefreshTokens_Token");
            e.HasIndex(x => x.UserId).HasDatabaseName("IX_RefreshTokens_UserId");
        });
    }
}