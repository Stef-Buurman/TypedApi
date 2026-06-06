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
  SupplierModel,
  SupplierModelApiPaginationResponse,
  SupplierRequest,
} from "./data-contracts";

export namespace Supplier {
  /**
   * No description
   * @tags Supplier
   * @name GetSuppliers
   * @request GET:/api/suppliers
   */
  export namespace GetSuppliers {
    export type RequestParams = {};
    export type RequestQuery = {
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
    };
    export type RequestBody = never;
    export type RequestHeaders = {};
    export type ResponseBody = SupplierModelApiPaginationResponse;
  }

  /**
   * No description
   * @tags Supplier
   * @name CreateSupplier
   * @request POST:/api/suppliers
   */
  export namespace CreateSupplier {
    export type RequestParams = {};
    export type RequestQuery = {};
    export type RequestBody = SupplierRequest;
    export type RequestHeaders = {};
    export type ResponseBody = SupplierModel;
  }

  /**
   * No description
   * @tags Supplier
   * @name GetSupplierById
   * @request GET:/api/suppliers/{id}
   */
  export namespace GetSupplierById {
    export type RequestParams = {
      /** @format uuid */
      id: string;
    };
    export type RequestQuery = {};
    export type RequestBody = never;
    export type RequestHeaders = {};
    export type ResponseBody = SupplierModel;
  }

  /**
   * No description
   * @tags Supplier
   * @name UpdateSupplier
   * @request PUT:/api/suppliers/{id}
   */
  export namespace UpdateSupplier {
    export type RequestParams = {
      /** @format uuid */
      id: string;
    };
    export type RequestQuery = {};
    export type RequestBody = SupplierRequest;
    export type RequestHeaders = {};
    export type ResponseBody = SupplierModel;
  }

  /**
   * No description
   * @tags Supplier
   * @name DeleteSupplier
   * @request DELETE:/api/suppliers/{id}
   */
  export namespace DeleteSupplier {
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
   * @tags Supplier
   * @name VerifySupplier
   * @request POST:/api/suppliers/{id}/verify
   */
  export namespace VerifySupplier {
    export type RequestParams = {
      /** @format uuid */
      id: string;
    };
    export type RequestQuery = {};
    export type RequestBody = never;
    export type RequestHeaders = {};
    export type ResponseBody = SupplierModel;
  }
}
