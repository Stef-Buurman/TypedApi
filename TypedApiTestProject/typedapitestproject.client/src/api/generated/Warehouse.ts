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

import type { DeleteWarehouseParams, GetWarehouseByIdParams, GetWarehousesParams, UpdateWarehouseParams, WarehouseModel, WarehouseModelApiPaginationResponse, WarehouseRequest, } from "./data-contracts";
import { ContentType, HttpClient } from "./http-client";
import type { RequestParams } from "./http-client";

export class Warehouse<
  SecurityDataType = unknown,
> extends HttpClient<SecurityDataType> {
  /**
   * No description
   *
   * @tags Warehouse
   * @name GetWarehouses
   * @request GET:/api/warehouses
   */
  getWarehouses = (
    query: GetWarehousesParams = {},
    params: RequestParams = {},
  ) =>
    this.request<WarehouseModelApiPaginationResponse, any>({
      path: `/api/warehouses`,
      method: "GET",
      query: query,
      format: "json",
      ...params,
    });
  /**
   * No description
   *
   * @tags Warehouse
   * @name CreateWarehouse
   * @request POST:/api/warehouses
   */
  createWarehouse = (data: WarehouseRequest, params: RequestParams = {}) =>
    this.request<WarehouseModel, any>({
      path: `/api/warehouses`,
      method: "POST",
      body: data,
      type: ContentType.Json,
      format: "json",
      ...params,
    });
  /**
   * No description
   *
   * @tags Warehouse
   * @name GetWarehouseById
   * @request GET:/api/warehouses/{id}
   */
  getWarehouseById = (
    { id }: GetWarehouseByIdParams,
    params: RequestParams = {},
  ) =>
    this.request<WarehouseModel, any>({
      path: `/api/warehouses/${id}`,
      method: "GET",
      format: "json",
      ...params,
    });
  /**
   * No description
   *
   * @tags Warehouse
   * @name UpdateWarehouse
   * @request PUT:/api/warehouses/{id}
   */
  updateWarehouse = (
    { id }: UpdateWarehouseParams,
    data: WarehouseRequest,
    params: RequestParams = {},
  ) =>
    this.request<WarehouseModel, any>({
      path: `/api/warehouses/${id}`,
      method: "PUT",
      body: data,
      type: ContentType.Json,
      format: "json",
      ...params,
    });
  /**
   * No description
   *
   * @tags Warehouse
   * @name DeleteWarehouse
   * @request DELETE:/api/warehouses/{id}
   */
  deleteWarehouse = (
    { id }: DeleteWarehouseParams,
    params: RequestParams = {},
  ) =>
    this.request<void, any>({
      path: `/api/warehouses/${id}`,
      method: "DELETE",
      ...params,
    });
}
