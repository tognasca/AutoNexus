namespace AutoNexus.Application.DTOs.Common;

public class PagedResultDto<T>
{
    public IReadOnlyList<T> Items { get; set; } = Array.Empty<T>();
    public int TotalCount { get; set; }
    public int Page { get; set; }
    public int PageSize { get; set; }
    public int TotalPages => PageSize > 0 ? (int)Math.Ceiling((double)TotalCount / PageSize) : 0;

    public PagedResultDto() { }

    public PagedResultDto(IEnumerable<T> items, int totalCount, int page, int pageSize)
    {
        Items = items?.ToList() ?? new List<T>();
        TotalCount = totalCount;
        Page = page;
        PageSize = pageSize;
    }

    public PagedResultDto(IEnumerable<T> items, int totalCount, int page, int pageSize, int totalPages)
    {
        Items = items?.ToList() ?? new List<T>();
        TotalCount = totalCount;
        Page = page;
        PageSize = pageSize;
    }
}