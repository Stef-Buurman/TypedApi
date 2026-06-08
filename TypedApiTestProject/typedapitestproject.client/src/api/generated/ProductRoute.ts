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
  ProductModel,
  ProductRequest,
  ProductTableRowApiPaginationResponse,
  SortDirection,
} from "./data-contracts";

export namespace Product {
  /**
   * No description
   * @tags Product
   * @name GetProducts
   * @request GET:/api/products
   */
  export namespace GetProducts {
    export type RequestParams = {};
    export type RequestQuery = {
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
    };
    export type RequestBody = never;
    export type RequestHeaders = {};
    export type ResponseBody = ProductTableRowApiPaginationResponse;
  }

  /**
   * No description
   * @tags Product
   * @name CreateProduct
   * @request POST:/api/products
   */
  export namespace CreateProduct {
    export type RequestParams = {};
    export type RequestQuery = {};
    export type RequestBody = ProductRequest;
    export type RequestHeaders = {};
    export type ResponseBody = ProductModel;
  }

  /**
   * No description
   * @tags Product
   * @name GetProductById
   * @request GET:/api/products/{id}
   */
  export namespace GetProductById {
    export type RequestParams = {
      /** @format uuid */
      id: string;
    };
    export type RequestQuery = {};
    export type RequestBody = never;
    export type RequestHeaders = {};
    export type ResponseBody = ProductModel;
  }

  /**
   * No description
   * @tags Product
   * @name UpdateProduct
   * @request PUT:/api/products/{id}
   */
  export namespace UpdateProduct {
    export type RequestParams = {
      /** @format uuid */
      id: string;
    };
    export type RequestQuery = {};
    export type RequestBody = ProductRequest;
    export type RequestHeaders = {};
    export type ResponseBody = ProductModel;
  }

  /**
   * No description
   * @tags Product
   * @name DeleteProduct
   * @request DELETE:/api/products/{id}
   */
  export namespace DeleteProduct {
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
   * @tags Product
   * @name ToggleProductActive
   * @request POST:/api/products/{id}/toggle-active
   */
  export namespace ToggleProductActive {
    export type RequestParams = {
      /** @format uuid */
      id: string;
    };
    export type RequestQuery = {};
    export type RequestBody = never;
    export type RequestHeaders = {};
    export type ResponseBody = ProductModel;
  }

  /**
   * No description
   * @tags Product
   * @name ExportProducts
   * @request GET:/api/products/export
   */
  export namespace ExportProducts {
    export type RequestParams = {};
    export type RequestQuery = {
      search?: string;
      active?: boolean;
      productIds?: string[];
    };
    export type RequestBody = never;
    export type RequestHeaders = {};
    export type ResponseBody = void;
  }
}
