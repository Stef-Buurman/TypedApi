import { FilterFormValues, OptionValue } from "../interfaces/Filter";

/**
 * Sort direction value accepted by generated query objects.
 *
 * APIs often expose sort direction as either a string enum or numeric enum, so both are supported.
 */
export type SortDirection = number | string;

/**
 * Builds a typed query object from filter form values, pagination, and sorting.
 *
 * Empty filter values are ignored.
 * List filters are converted item by item.
 * `OptionValue` lists send their `value` fields instead of the display names.
 */
export function buildQuery<TQuery, TSortModel = TQuery>(
  filters: FilterFormValues<TQuery>[],
  page = 1,
  pageSize = 100,
  sortBy: keyof TSortModel | null = null,
  sortDirection?: SortDirection,
): Partial<TQuery> {
  const query = filters.reduce<Partial<TQuery>>((queryResult, filter) => {
    const { filterName, filterNameMax, type, value, maxValue, isAList } =
      filter;

    if (isEmptyValue(value) && isEmptyValue(maxValue)) {
      return queryResult;
    }

    if (isAList && Array.isArray(value)) {
      const convertedValues = value
        .map((item) =>
          convertType(type, isOptionValue(item) ? item.value : item),
        )
        .filter((item) => item !== null);

      if (convertedValues.length > 0) {
        queryResult[filterName] = convertedValues as TQuery[keyof TQuery];
      }

      return queryResult;
    }

    const rawValue = isOptionValue(value) ? value.value : value;
    const convertedValue = convertType(type, rawValue);

    if (convertedValue !== null) {
      queryResult[filterName] = convertedValue as TQuery[keyof TQuery];
    }

    if (filterNameMax && !isEmptyValue(maxValue)) {
      const convertedMaxValue = convertType(type, maxValue);

      if (convertedMaxValue !== null) {
        queryResult[filterNameMax] = convertedMaxValue as TQuery[keyof TQuery];
      }
    }

    return queryResult;
  }, {});

  (query as Record<string, unknown>).pageNumber = page;

  if (pageSize > 0) {
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

function isEmptyValue(value: unknown): boolean {
  return (
    value === null ||
    value === undefined ||
    value === "" ||
    value === "null" ||
    value === "undefined"
  );
}

function isOptionValue(value: unknown): value is OptionValue {
  return typeof value === "object" && value !== null && "value" in value;
}

function convertType(type: string, value: unknown): unknown {
  if (isEmptyValue(value)) {
    return null;
  }

  switch (type) {
    case "date": {
      if (value instanceof Date) {
        return Number.isNaN(value.getTime()) ? null : value.toISOString();
      }

      return value;
    }

    case "number": {
      const numberValue = Number(value);
      return Number.isNaN(numberValue) ? null : numberValue;
    }

    case "boolean":
    case "boolean-button": {
      if (typeof value === "boolean") {
        return value;
      }

      if (typeof value === "string") {
        const normalized = value.trim().toLowerCase();

        if (["true", "1", "yes", "on"].includes(normalized)) {
          return true;
        }

        if (["false", "0", "no", "off"].includes(normalized)) {
          return false;
        }
      }

      return Boolean(value);
    }

    default:
      return value;
  }
}
