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

import {
  DeleteSupplierParams,
  GetSupplierByIdParams,
  GetSuppliersParams,
  SupplierModel,
  SupplierModelApiPaginationResponse,
  SupplierRequest,
  UpdateSupplierParams,
  VerifySupplierParams,
} from "./data-contracts";
import { ContentType, HttpClient, RequestParams } from "./http-client";

export class Supplier<
  SecurityDataType = unknown,
> extends HttpClient<SecurityDataType> {
  /**
   * No description
   *
   * @tags Supplier
   * @name GetSuppliers
   * @request GET:/api/suppliers
   */
  getSuppliers = (query: GetSuppliersParams = {}, params: RequestParams = {}) =>
    this.request<SupplierModelApiPaginationResponse, any>({
      path: `/api/suppliers`,
      method: "GET",
      query: query,
      format: "json",
      ...params,
    });
  /**
   * No description
   *
   * @tags Supplier
   * @name CreateSupplier
   * @request POST:/api/suppliers
   */
  createSupplier = (data: SupplierRequest, params: RequestParams = {}) =>
    this.request<SupplierModel, any>({
      path: `/api/suppliers`,
      method: "POST",
      body: data,
      type: ContentType.Json,
      format: "json",
      ...params,
    });
  /**
   * No description
   *
   * @tags Supplier
   * @name GetSupplierById
   * @request GET:/api/suppliers/{id}
   */
  getSupplierById = (
    { id }: GetSupplierByIdParams,
    params: RequestParams = {},
  ) =>
    this.request<SupplierModel, any>({
      path: `/api/suppliers/${id}`,
      method: "GET",
      format: "json",
      ...params,
    });
  /**
   * No description
   *
   * @tags Supplier
   * @name UpdateSupplier
   * @request PUT:/api/suppliers/{id}
   */
  updateSupplier = (
    { id }: UpdateSupplierParams,
    data: SupplierRequest,
    params: RequestParams = {},
  ) =>
    this.request<SupplierModel, any>({
      path: `/api/suppliers/${id}`,
      method: "PUT",
      body: data,
      type: ContentType.Json,
      format: "json",
      ...params,
    });
  /**
   * No description
   *
   * @tags Supplier
   * @name DeleteSupplier
   * @request DELETE:/api/suppliers/{id}
   */
  deleteSupplier = ({ id }: DeleteSupplierParams, params: RequestParams = {}) =>
    this.request<void, any>({
      path: `/api/suppliers/${id}`,
      method: "DELETE",
      ...params,
    });
  /**
   * No description
   *
   * @tags Supplier
   * @name VerifySupplier
   * @request POST:/api/suppliers/{id}/verify
   */
  verifySupplier = ({ id }: VerifySupplierParams, params: RequestParams = {}) =>
    this.request<SupplierModel, any>({
      path: `/api/suppliers/${id}/verify`,
      method: "POST",
      format: "json",
      ...params,
    });
}
