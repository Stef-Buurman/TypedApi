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
  ApproveOrderParams,
  CancelOrderParams,
  DeleteOrderParams,
  GetOrderByIdParams,
  GetOrdersParams,
  OrderModel,
  OrderModelApiPaginationResponse,
  OrderRequest,
  UpdateOrderParams,
} from "./data-contracts";
import { ContentType, HttpClient } from "./http-client";
import type { RequestParams } from "./http-client";

export class Order<
  SecurityDataType = unknown,
> extends HttpClient<SecurityDataType> {
  /**
   * No description
   *
   * @tags Order
   * @name GetOrders
   * @request GET:/api/orders
   */
  getOrders = (query: GetOrdersParams = {}, params: RequestParams = {}) =>
    this.request<OrderModelApiPaginationResponse, any>({
      path: `/api/orders`,
      method: "GET",
      query: query,
      format: "json",
      ...params,
    });
  /**
   * No description
   *
   * @tags Order
   * @name CreateOrder
   * @request POST:/api/orders
   */
  createOrder = (data: OrderRequest, params: RequestParams = {}) =>
    this.request<OrderModel, any>({
      path: `/api/orders`,
      method: "POST",
      body: data,
      type: ContentType.Json,
      format: "json",
      ...params,
    });
  /**
   * No description
   *
   * @tags Order
   * @name GetOrderById
   * @request GET:/api/orders/{id}
   */
  getOrderById = ({ id }: GetOrderByIdParams, params: RequestParams = {}) =>
    this.request<OrderModel, any>({
      path: `/api/orders/${id}`,
      method: "GET",
      format: "json",
      ...params,
    });
  /**
   * No description
   *
   * @tags Order
   * @name UpdateOrder
   * @request PUT:/api/orders/{id}
   */
  updateOrder = (
    { id }: UpdateOrderParams,
    data: OrderRequest,
    params: RequestParams = {},
  ) =>
    this.request<OrderModel, any>({
      path: `/api/orders/${id}`,
      method: "PUT",
      body: data,
      type: ContentType.Json,
      format: "json",
      ...params,
    });
  /**
   * No description
   *
   * @tags Order
   * @name DeleteOrder
   * @request DELETE:/api/orders/{id}
   */
  deleteOrder = ({ id }: DeleteOrderParams, params: RequestParams = {}) =>
    this.request<void, any>({
      path: `/api/orders/${id}`,
      method: "DELETE",
      ...params,
    });
  /**
   * No description
   *
   * @tags Order
   * @name ApproveOrder
   * @request POST:/api/orders/{id}/approve
   */
  approveOrder = ({ id }: ApproveOrderParams, params: RequestParams = {}) =>
    this.request<OrderModel, any>({
      path: `/api/orders/${id}/approve`,
      method: "POST",
      format: "json",
      ...params,
    });
  /**
   * No description
   *
   * @tags Order
   * @name CancelOrder
   * @request POST:/api/orders/{id}/cancel
   */
  cancelOrder = (
    { id, ...query }: CancelOrderParams,
    params: RequestParams = {},
  ) =>
    this.request<OrderModel, any>({
      path: `/api/orders/${id}/cancel`,
      method: "POST",
      query: query,
      format: "json",
      ...params,
    });
}
