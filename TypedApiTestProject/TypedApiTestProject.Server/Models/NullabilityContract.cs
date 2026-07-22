using System.ComponentModel.DataAnnotations;
using System.Text.Json.Serialization;

namespace TypedApiTestProject.Server.Models;

public class NullabilityContract
{
    public required string RequiredText { get; set; }
    public required string? RequiredNullableText { get; set; }

    [JsonRequired]
    public string? JsonRequiredNullableText { get; set; }

    [Required]
    public string? ValidatedText { get; set; }

    public string? OptionalNullableText { get; set; }
    public int RequiredCount { get; set; }
    public int? OptionalCount { get; set; }
}
