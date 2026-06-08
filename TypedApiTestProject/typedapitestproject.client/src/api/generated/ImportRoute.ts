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
  UploadMixedImportPayload,
  UploadProductFilesPayload,
  UploadResult,
  UploadSupplierFilePayload,
} from "./data-contracts";

export namespace Import {
  /**
   * No description
   * @tags Import
   * @name UploadProductFiles
   * @request POST:/api/imports/products
   */
  export namespace UploadProductFiles {
    export type RequestParams = {};
    export type RequestQuery = {};
    export type RequestBody = UploadProductFilesPayload;
    export type RequestHeaders = {};
    export type ResponseBody = UploadResult;
  }

  /**
   * No description
   * @tags Import
   * @name UploadSupplierFile
   * @request POST:/api/imports/supplier
   */
  export namespace UploadSupplierFile {
    export type RequestParams = {};
    export type RequestQuery = {};
    export type RequestBody = UploadSupplierFilePayload;
    export type RequestHeaders = {};
    export type ResponseBody = UploadResult;
  }

  /**
   * No description
   * @tags Import
   * @name UploadMixedImport
   * @request POST:/api/imports/mixed
   */
  export namespace UploadMixedImport {
    export type RequestParams = {};
    export type RequestQuery = {};
    export type RequestBody = UploadMixedImportPayload;
    export type RequestHeaders = {};
    export type ResponseBody = UploadResult;
  }
}
