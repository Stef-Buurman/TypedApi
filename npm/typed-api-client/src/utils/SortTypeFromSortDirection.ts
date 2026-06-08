import type { SortType } from "../interfaces/SortType";

/** Values supported by the generated API SortDirection enum. */
export type ApiSortDirection = "Default" | "Ascending" | "Descending";

/**
 * Sort states supported by TypedApi UI components.
 *
 * Includes `Neutral`, which is a UI-only state and is sent to the API as `Default`.
 */
export const sortTypes = [
  "Default",
  "Neutral",
  "Ascending",
  "Descending",
] as const satisfies readonly SortType[];

/**
 * Converts an API sort direction to the sort state used by UI components.
 *
 * Unknown or missing values safely fall back to `Default`.
 */
export function getSortTypeFromSortDirection(
  sortDirection: ApiSortDirection | null | undefined,
): SortType {
  switch (sortDirection) {
    case "Ascending":
      return "Ascending";
    case "Descending":
      return "Descending";
    case "Default":
    default:
      return "Default";
  }
}

/**
 * Converts a UI sort state to a value accepted by the generated API.
 *
 * `Neutral` means no explicit sorting is active, so it maps to `Default`.
 */
export function getSortDirectionFromSortType(
  sortType: SortType | null | undefined,
): ApiSortDirection {
  switch (sortType) {
    case "Ascending":
      return "Ascending";
    case "Descending":
      return "Descending";
    case "Neutral":
    case "Default":
    default:
      return "Default";
  }
}
