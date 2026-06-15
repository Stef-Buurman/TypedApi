/**
 * Supported filter input types used by typed filter forms.
 *
 * These values decide which UI input should be rendered for a filter.
 */
export type FilterType =
  | "number"
  | "date"
  | "string"
  | "timespan"
  | "boolean"
  | "boolean-button"
  | "OptionValue";

/**
 * Selectable option value used by option-based filters.
 *
 * `name` is shown in the UI and `value` is sent as the actual filter value.
 */
export interface OptionValue {
  name: string;
  value: number | string | Date;
}

/**
 * Configuration for one filter field in a typed filter form.
 *
 * `filterName` maps the form value to a query property.
 * `filterNameMax` can be used for range filters such as dates or numbers.
 */
export interface FilterFormValues<TQuery> {
  name: string;
  filterName: keyof TQuery;
  filterNameMax?: keyof TQuery;
  type: FilterType;
  value: number | string | Date | boolean | null | OptionValue[] | string[];
  maxValue?: number | string | Date | null;
  isAList: boolean;
}