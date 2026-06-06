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
  SortDirection,
  WarehouseModel,
  WarehouseModelApiPaginationResponse,
  WarehouseRequest,
} from "./data-contracts";

export namespace Warehouse {
  /**
   * No description
   * @tags Warehouse
   * @name GetWarehouses
   * @request GET:/api/warehouses
   */
  export namespace GetWarehouses {
    export type RequestParams = {};
    export type RequestQuery = {
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
    };
    export type RequestBody = never;
    export type RequestHeaders = {};
    export type ResponseBody = WarehouseModelApiPaginationResponse;
  }

  /**
   * No description
   * @tags Warehouse
   * @name CreateWarehouse
   * @request POST:/api/warehouses
   */
  export namespace CreateWarehouse {
    export type RequestParams = {};
    export type RequestQuery = {};
    export type RequestBody = WarehouseRequest;
    export type RequestHeaders = {};
    export type ResponseBody = WarehouseModel;
  }

  /**
   * No description
   * @tags Warehouse
   * @name GetWarehouseById
   * @request GET:/api/warehouses/{id}
   */
  export namespace GetWarehouseById {
    export type RequestParams = {
      /** @format uuid */
      id: string;
    };
    export type RequestQuery = {};
    export type RequestBody = never;
    export type RequestHeaders = {};
    export type ResponseBody = WarehouseModel;
  }

  /**
   * No description
   * @tags Warehouse
   * @name UpdateWarehouse
   * @request PUT:/api/warehouses/{id}
   */
  export namespace UpdateWarehouse {
    export type RequestParams = {
      /** @format uuid */
      id: string;
    };
    export type RequestQuery = {};
    export type RequestBody = WarehouseRequest;
    export type RequestHeaders = {};
    export type ResponseBody = WarehouseModel;
  }

  /**
   * No description
   * @tags Warehouse
   * @name DeleteWarehouse
   * @request DELETE:/api/warehouses/{id}
   */
  export namespace DeleteWarehouse {
    export type RequestParams = {
      /** @format uuid */
      id: string;
    };
    export type RequestQuery = {};
    export type RequestBody = never;
    export type RequestHeaders = {};
    export type ResponseBody = void;
  }
}
