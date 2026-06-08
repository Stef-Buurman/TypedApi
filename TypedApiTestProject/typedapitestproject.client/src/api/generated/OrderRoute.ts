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
  OrderModel,
  OrderModelApiPaginationResponse,
  OrderRequest,
  OrderStatus,
  SortDirection,
} from "./data-contracts";

export namespace Order {
  /**
   * No description
   * @tags Order
   * @name GetOrders
   * @request GET:/api/orders
   */
  export namespace GetOrders {
    export type RequestParams = {};
    export type RequestQuery = {
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
    };
    export type RequestBody = never;
    export type RequestHeaders = {};
    export type ResponseBody = OrderModelApiPaginationResponse;
  }

  /**
   * No description
   * @tags Order
   * @name CreateOrder
   * @request POST:/api/orders
   */
  export namespace CreateOrder {
    export type RequestParams = {};
    export type RequestQuery = {};
    export type RequestBody = OrderRequest;
    export type RequestHeaders = {};
    export type ResponseBody = OrderModel;
  }

  /**
   * No description
   * @tags Order
   * @name GetOrderById
   * @request GET:/api/orders/{id}
   */
  export namespace GetOrderById {
    export type RequestParams = {
      /** @format uuid */
      id: string;
    };
    export type RequestQuery = {};
    export type RequestBody = never;
    export type RequestHeaders = {};
    export type ResponseBody = OrderModel;
  }

  /**
   * No description
   * @tags Order
   * @name UpdateOrder
   * @request PUT:/api/orders/{id}
   */
  export namespace UpdateOrder {
    export type RequestParams = {
      /** @format uuid */
      id: string;
    };
    export type RequestQuery = {};
    export type RequestBody = OrderRequest;
    export type RequestHeaders = {};
    export type ResponseBody = OrderModel;
  }

  /**
   * No description
   * @tags Order
   * @name DeleteOrder
   * @request DELETE:/api/orders/{id}
   */
  export namespace DeleteOrder {
    export type RequestParams = {
      /** @format uuid */
      id: string;
    };
    export type RequestQuery = {};
    export type RequestBody = never;
    export type RequestHeaders = {};
    export type ResponseBody = void;
  }

  /**
   * No description
   * @tags Order
   * @name ApproveOrder
   * @request POST:/api/orders/{id}/approve
   */
  export namespace ApproveOrder {
    export type RequestParams = {
      /** @format uuid */
      id: string;
    };
    export type RequestQuery = {};
    export type RequestBody = never;
    export type RequestHeaders = {};
    export type ResponseBody = OrderModel;
  }

  /**
   * No description
   * @tags Order
   * @name CancelOrder
   * @request POST:/api/orders/{id}/cancel
   */
  export namespace CancelOrder {
    export type RequestParams = {
      /** @format uuid */
      id: string;
    };
    export type RequestQuery = {
      reason?: string;
    };
    export type RequestBody = never;
    export type RequestHeaders = {};
    export type ResponseBody = OrderModel;
  }
}
