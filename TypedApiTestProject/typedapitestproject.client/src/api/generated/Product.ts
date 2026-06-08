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

import type {
  DeleteProductParams,
  ExportProductsParams,
  GetProductByIdParams,
  GetProductsParams,
  ProductModel,
  ProductRequest,
  ProductTableRowApiPaginationResponse,
  ToggleProductActiveParams,
  UpdateProductParams,
} from "./data-contracts";
import { ContentType, HttpClient } from "./http-client";
import type { RequestParams } from "./http-client";

export class Product<
  SecurityDataType = unknown,
> extends HttpClient<SecurityDataType> {
  /**
   * No description
   *
   * @tags Product
   * @name GetProducts
   * @request GET:/api/products
   */
  getProducts = (query: GetProductsParams = {}, params: RequestParams = {}) =>
    this.request<ProductTableRowApiPaginationResponse, any>({
      path: `/api/products`,
      method: "GET",
      query: query,
      format: "json",
      ...params,
    });
  /**
   * No description
   *
   * @tags Product
   * @name CreateProduct
   * @request POST:/api/products
   */
  createProduct = (data: ProductRequest, params: RequestParams = {}) =>
    this.request<ProductModel, any>({
      path: `/api/products`,
      method: "POST",
      body: data,
      type: ContentType.Json,
      format: "json",
      ...params,
    });
  /**
   * No description
   *
   * @tags Product
   * @name GetProductById
   * @request GET:/api/products/{id}
   */
  getProductById = ({ id }: GetProductByIdParams, params: RequestParams = {}) =>
    this.request<ProductModel, any>({
      path: `/api/products/${id}`,
      method: "GET",
      format: "json",
      ...params,
    });
  /**
   * No description
   *
   * @tags Product
   * @name UpdateProduct
   * @request PUT:/api/products/{id}
   */
  updateProduct = (
    { id }: UpdateProductParams,
    data: ProductRequest,
    params: RequestParams = {},
  ) =>
    this.request<ProductModel, any>({
      path: `/api/products/${id}`,
      method: "PUT",
      body: data,
      type: ContentType.Json,
      format: "json",
      ...params,
    });
  /**
   * No description
   *
   * @tags Product
   * @name DeleteProduct
   * @request DELETE:/api/products/{id}
   */
  deleteProduct = ({ id }: DeleteProductParams, params: RequestParams = {}) =>
    this.request<void, any>({
      path: `/api/products/${id}`,
      method: "DELETE",
      ...params,
    });
  /**
   * No description
   *
   * @tags Product
   * @name ToggleProductActive
   * @request POST:/api/products/{id}/toggle-active
   */
  toggleProductActive = (
    { id }: ToggleProductActiveParams,
    params: RequestParams = {},
  ) =>
    this.request<ProductModel, any>({
      path: `/api/products/${id}/toggle-active`,
      method: "POST",
      format: "json",
      ...params,
    });
  /**
   * No description
   *
   * @tags Product
   * @name ExportProducts
   * @request GET:/api/products/export
   */
  exportProducts = (
    query: ExportProductsParams = {},
    params: RequestParams = {},
  ) =>
    this.request<void, any>({
      path: `/api/products/export`,
      method: "GET",
      query: query,
      ...params,
    });
}
