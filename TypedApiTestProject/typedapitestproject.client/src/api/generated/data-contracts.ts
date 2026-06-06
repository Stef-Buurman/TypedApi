/* eslint-disable */
/* tslint:disable */
// @ts-nocheck
/*
 * ---------------------------------------------------------------
 * ## THIS FILE WAS GENERATED VIA SWAGGER-TYPESCRIPT-API        ##
 * ##                                                           ##
 * ## AUTHOR: acacode                                           ##
 * ## SOURCE: https://github.com/acacode/swagger-typescript-api ##
 * ---------------------------------------------------------------
 */

/** @format int32 */
export enum SortDirection {
  Value0 = 0,
  Value1 = 1,
  Value2 = 2,
}

/** @format int32 */
export enum OrderStatus {
  Value0 = 0,
  Value1 = 1,
  Value2 = 2,
  Value3 = 3,
  Value4 = 4,
}

export interface OrderModel {
  /** @format uuid */
  id: string;
  orderNumber: string | null;
  /** @format uuid */
  productId: string;
  /** @format uuid */
  supplierId: string;
  /** @format int32 */
  quantity: number;
  /** @format double */
  totalPrice: number;
  /** @format date-time */
  orderedAt: string;
  status: OrderStatus;
}

export interface OrderModelApiPaginationResponse {
  data: OrderModel[] | null;
  /** @format int32 */
  pageNumber: number;
  /** @format int32 */
  pageSize: number;
  /** @format int32 */
  totalCount: number;
}

export interface OrderRequest {
  orderNumber: string | null;
  /** @format uuid */
  productId: string;
  /** @format uuid */
  supplierId: string;
  /** @format int32 */
  quantity: number;
  /** @format double */
  totalPrice: number;
  /** @format date-time */
  orderedAt: string;
  status: OrderStatus;
}

export interface ProductModel {
  /** @format uuid */
  id: string;
  name: string | null;
  sku: string | null;
  /** @format double */
  price: number;
  /** @format int32 */
  stock: number;
  active: boolean;
  /** @format uuid */
  supplierId: string;
  /** @format date-time */
  createdAt: string;
}

export interface ProductRequest {
  name: string | null;
  sku: string | null;
  /** @format double */
  price: number;
  /** @format int32 */
  stock: number;
  active: boolean;
  /** @format uuid */
  supplierId: string;
}

export interface ProductTableRow {
  /** @format uuid */
  id: string;
  name: string | null;
  sku: string | null;
  /** @format double */
  price: number;
  /** @format int32 */
  stock: number;
  active: boolean;
}

export interface ProductTableRowApiPaginationResponse {
  data: ProductTableRow[] | null;
  /** @format int32 */
  pageNumber: number;
  /** @format int32 */
  pageSize: number;
  /** @format int32 */
  totalCount: number;
}

export interface SupplierModel {
  /** @format uuid */
  id: string;
  companyName: string | null;
  contactEmail: string | null;
  countryCode: string | null;
  verified: boolean;
  /** @format date-time */
  createdAt: string;
}

export interface SupplierModelApiPaginationResponse {
  data: SupplierModel[] | null;
  /** @format int32 */
  pageNumber: number;
  /** @format int32 */
  pageSize: number;
  /** @format int32 */
  totalCount: number;
}

export interface SupplierRequest {
  companyName: string | null;
  contactEmail: string | null;
  countryCode: string | null;
  verified: boolean;
}

export interface UploadResult {
  /** @format int32 */
  fileCount: number;
  fileNames: string[] | null;
  message: string | null;
}

export interface WarehouseModel {
  /** @format uuid */
  id: string;
  code: string | null;
  name: string | null;
  city: string | null;
  countryCode: string | null;
  /** @format int32 */
  capacity: number;
  isActive: boolean;
}

export interface WarehouseModelApiPaginationResponse {
  data: WarehouseModel[] | null;
  /** @format int32 */
  pageNumber: number;
  /** @format int32 */
  pageSize: number;
  /** @format int32 */
  totalCount: number;
}

export interface WarehouseRequest {
  code: string | null;
  name: string | null;
  city: string | null;
  countryCode: string | null;
  /** @format int32 */
  capacity: number;
  isActive: boolean;
}

export interface WeatherForecast {
  /** @format date */
  date: string;
  /** @format int32 */
  temperatureC: number;
  /** @format int32 */
  temperatureF: number;
  summary?: string | null;
}

export interface UploadProductFilesPayload {
  Files?: File[];
}

export interface UploadSupplierFilePayload {
  /** @format binary */
  File?: File;
}

export interface UploadMixedImportPayload {
  Files?: File[];
  ImportName?: string;
  ValidateOnly?: boolean;
}

export interface GetOrdersParams {
  orderIds?: string[];
  orderNumber?: string;
  /** @format uuid */
  productId?: string;
  /** @format uuid */
  supplierId?: string;
  /** @format int32 */
  minQuantity?: number;
  /** @format int32 */
  maxQuantity?: number;
  /** @format double */
  minTotalPrice?: number;
  /** @format double */
  maxTotalPrice?: number;
  /** @format date-time */
  orderedFrom?: string;
  /** @format date-time */
  orderedTo?: string;
  status?: OrderStatus;
  statuses?: OrderStatus[];
  /**
   * @format int32
   * @default 1
   */
  pageNumber?: number;
  /**
   * @format int32
   * @default 100
   */
  pageSize?: number;
  sortBy?: string;
  sortDirection?: SortDirection;
}

export interface GetOrderByIdParams {
  /** @format uuid */
  id: string;
}

export interface UpdateOrderParams {
  /** @format uuid */
  id: string;
}

export interface DeleteOrderParams {
  /** @format uuid */
  id: string;
}

export interface ApproveOrderParams {
  /** @format uuid */
  id: string;
}

export interface CancelOrderParams {
  reason?: string;
  /** @format uuid */
  id: string;
}

export interface GetProductsParams {
  productIds?: string[];
  search?: string;
  skus?: string[];
  /** @format double */
  minPrice?: number;
  /** @format double */
  maxPrice?: number;
  /** @format int32 */
  minStock?: number;
  /** @format int32 */
  maxStock?: number;
  active?: boolean;
  /** @format uuid */
  supplierId?: string;
  /** @format date-time */
  createdFrom?: string;
  /** @format date-time */
  createdTo?: string;
  /**
   * @format int32
   * @default 1
   */
  pageNumber?: number;
  /**
   * @format int32
   * @default 100
   */
  pageSize?: number;
  sortBy?: string;
  sortDirection?: SortDirection;
}

export interface GetProductByIdParams {
  /** @format uuid */
  id: string;
}

export interface UpdateProductParams {
  /** @format uuid */
  id: string;
}

export interface DeleteProductParams {
  /** @format uuid */
  id: string;
}

export interface ToggleProductActiveParams {
  /** @format uuid */
  id: string;
}

export interface ExportProductsParams {
  search?: string;
  active?: boolean;
  productIds?: string[];
}

export interface GetSuppliersParams {
  supplierIds?: string[];
  companyName?: string;
  countryCodes?: string[];
  verified?: boolean;
  /** @format date-time */
  createdFrom?: string;
  /** @format date-time */
  createdTo?: string;
  /**
   * @format int32
   * @default 1
   */
  pageNumber?: number;
  /**
   * @format int32
   * @default 100
   */
  pageSize?: number;
  sortBy?: string;
  sortDirection?: SortDirection;
}

export interface GetSupplierByIdParams {
  /** @format uuid */
  id: string;
}

export interface UpdateSupplierParams {
  /** @format uuid */
  id: string;
}

export interface DeleteSupplierParams {
  /** @format uuid */
  id: string;
}

export interface VerifySupplierParams {
  /** @format uuid */
  id: string;
}

export interface GetWarehousesParams {
  search?: string;
  countryCodes?: string[];
  /** @format int32 */
  minCapacity?: number;
  /** @format int32 */
  maxCapacity?: number;
  isActive?: boolean;
  /**
   * @format int32
   * @default 1
   */
  pageNumber?: number;
  /**
   * @format int32
   * @default 100
   */
  pageSize?: number;
  sortBy?: string;
  sortDirection?: SortDirection;
}

export interface GetWarehouseByIdParams {
  /** @format uuid */
  id: string;
}

export interface UpdateWarehouseParams {
  /** @format uuid */
  id: string;
}

export interface DeleteWarehouseParams {
  /** @format uuid */
  id: string;
}
