using System.Text.Json.Serialization;

namespace TypedApiTestProject.Server.Models;

[JsonPolymorphic(TypeDiscriminatorPropertyName = "kind")]
[JsonDerivedType(typeof(EmailNotificationModel), "email")]
[JsonDerivedType(typeof(SmsNotificationModel), "sms")]
public abstract class NotificationModel
{
    public required string Message { get; set; }
    public DateTimeOffset CreatedAt { get; set; }
}

public sealed class EmailNotificationModel : NotificationModel
{
    public required string EmailAddress { get; set; }
    public required string Subject { get; set; }
}

public sealed class SmsNotificationModel : NotificationModel
{
    public required string PhoneNumber { get; set; }
    public int SegmentCount { get; set; }
}
