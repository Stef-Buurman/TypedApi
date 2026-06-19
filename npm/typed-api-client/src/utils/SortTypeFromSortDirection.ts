import type { SortType } from "../interfaces/SortType";

/**
 * Values supported by the current TypedApi .NET SortDirection enum.
 * The legacy long names remain accepted when reading older APIs.
 */
export type ApiSortDirection =
  | "Default"
  | "Neutral"
  | "Asc"
  | "Desc"
  | "Ascending"
  | "Descending";

/** Sort states supported by TypedApi UI components. */
export const sortTypes = [
  "Default",
  "Neutral",
  "Ascending",
  "Descending",
] as const satisfies readonly SortType[];

/** Converts API sort direction values to the sort state used by UI components. */
export function getSortTypeFromSortDirection(
  sortDirection: ApiSortDirection | null | undefined,
): SortType {
  switch (sortDirection) {
    case "Asc":
    case "Ascending":
      return "Ascending";
    case "Desc":
    case "Descending":
      return "Descending";
    case "Neutral":
      return "Neutral";
    case "Default":
    default:
      return "Default";
  }
}

/** Converts a UI sort state to a value accepted by the current .NET API. */
export function getSortDirectionFromSortType(
  sortType: SortType | null | undefined,
): Extract<ApiSortDirection, "Default" | "Neutral" | "Asc" | "Desc"> {
  switch (sortType) {
    case "Ascending":
      return "Asc";
    case "Descending":
      return "Desc";
    case "Neutral":
      return "Neutral";
    case "Default":
    default:
      return "Default";
  }
}
