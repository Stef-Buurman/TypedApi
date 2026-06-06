import { FilterFormValues, OptionValue } from "../interfaces/Filter";

export type SortDirection = number | string;

export function buildQuery<TQuery, TSortModel = keyof TQuery>(
  filters: FilterFormValues<TQuery>[],
  page = 1,
  pageSize = 100,
  sortBy: keyof TSortModel | null = null,
  sortDirection?: SortDirection,
): Partial<TQuery> {
  let isPageSizeSet = pageSize > 0;

  const query = filters.reduce<Partial<TQuery>>((queryResult, filter) => {
    const { filterName, filterNameMax, type, value, maxValue, isAList } =
      filter;

    if (
      (value === null || value === undefined || value === "") &&
      (maxValue === null || maxValue === undefined || maxValue === "")
    ) {
      return queryResult;
    }

    if (isAList && Array.isArray(value)) {
      if (isOptionValueArray(value)) {
        queryResult[filterName] = value.map((item) =>
          convertType(type, item.value),
        ) as TQuery[keyof TQuery];

        return queryResult;
      }

      queryResult[filterName] = value.map((item) =>
        convertType(type, item),
      ) as TQuery[keyof TQuery];

      return queryResult;
    }

    if (
      value !== "null" &&
      value !== "undefined" &&
      value !== null &&
      value !== undefined &&
      value !== ""
    ) {
      const convertedValue = convertType(type, value);

      if (convertedValue !== null) {
        queryResult[filterName] = convertedValue as TQuery[keyof TQuery];
      }
    }

    if (
      filterNameMax &&
      maxValue !== null &&
      maxValue !== undefined &&
      maxValue !== ""
    ) {
      const convertedMaxValue = convertType(type, maxValue);

      if (convertedMaxValue !== null) {
        queryResult[filterNameMax] = convertedMaxValue as TQuery[keyof TQuery];
      }
    }

    if (String(filterName) === "pageSize" && !isPageSizeSet) {
      isPageSizeSet = true;
    }

    return queryResult;
  }, {});

  (query as Record<string, unknown>).pageNumber = page;

  if (isPageSizeSet) {
    (query as Record<string, unknown>).pageSize = pageSize;
  }

  if (sortBy) {
    (query as Record<string, unknown>).sortBy = sortBy;
  }

  if (sortDirection !== undefined && sortDirection !== "Default") {
    (query as Record<string, unknown>).sortDirection = sortDirection;
  }

  return query;
}

function isOptionValue(value: unknown): value is OptionValue {
  return typeof value === "object" && value !== null && "value" in value;
}

function isOptionValueArray(value: unknown[]): value is OptionValue[] {
  return value.every(isOptionValue);
}

function convertType(type: string, value: unknown): unknown {
  switch (type) {
    case "date":
      return value instanceof Date ? value.toISOString() : value;

    case "number":
      return Number(value);

    case "boolean":
      return Boolean(value);

    default:
      return value;
  }
}
