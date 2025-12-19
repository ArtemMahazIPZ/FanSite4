namespace FanSite4.Api.Contracts.Comments;

public sealed record CommentDto(
    int Id,
    int ArticleId,
    string Text,
    DateTime CreatedAtUtc,
    string AuthorEmail,
    bool IsMine
);

public sealed record CreateCommentRequest(string Text);
