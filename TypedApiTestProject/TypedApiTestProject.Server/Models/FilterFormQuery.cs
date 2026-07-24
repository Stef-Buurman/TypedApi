using Microsoft.AspNetCore.Mvc.ModelBinding;

namespace TypedApiTestProject.Server.Models;

public class FilterFormQuery
{
    public string? Search { get; set; }
    public int? MinScore { get; set; }
    public int? MaxScore { get; set; }
    public bool? Active { get; set; }
    public DateTimeOffset? CreatedFrom { get; set; }
    public DateTimeOffset? CreatedTo { get; set; }
    public string[]? Categories { get; set; }
    public Guid[]? ItemIds { get; set; }
    public string? Echo { get; set; }
}

public sealed class FilterFormMapQuery : FilterFormQuery
{
    [BindRequired]
    public double West { get; set; }

    [BindRequired]
    public double South { get; set; }

    [BindRequired]
    public double East { get; set; }

    [BindRequired]
    public double North { get; set; }

    [BindRequired]
    public int Zoom { get; set; }
}
