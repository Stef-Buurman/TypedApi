export type FilterType =
  | "number"
  | "date"
  | "string"
  | "timespan"
  | "boolean"
  | "boolean-button"
  | "OptionValue";

export interface OptionValue {
  name: string;
  value: number | string | Date;
}

export interface FilterFormValues<TQuery> {
  name: string;
  filterName: keyof TQuery;
  filterNameMax?: keyof TQuery;
  type: FilterType;
  value: number | string | Date | boolean | null | OptionValue[] | string[];
  maxValue?: number | string | Date | null;
  isAList: boolean;
}