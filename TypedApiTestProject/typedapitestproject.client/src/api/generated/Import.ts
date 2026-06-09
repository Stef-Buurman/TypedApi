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

import type { UploadMixedImportPayload, UploadProductFilesPayload, UploadResult, UploadSupplierFilePayload, } from "./data-contracts";
import { ContentType, HttpClient } from "./http-client";
import type { RequestParams } from "./http-client";

export class Import<
  SecurityDataType = unknown,
> extends HttpClient<SecurityDataType> {
  /**
   * No description
   *
   * @tags Import
   * @name UploadProductFiles
   * @request POST:/api/imports/products
   */
  uploadProductFiles = (
    data: UploadProductFilesPayload,
    params: RequestParams = {},
  ) =>
    this.request<UploadResult, any>({
      path: `/api/imports/products`,
      method: "POST",
      body: data,
      type: ContentType.FormData,
      format: "json",
      ...params,
    });
  /**
   * No description
   *
   * @tags Import
   * @name UploadSupplierFile
   * @request POST:/api/imports/supplier
   */
  uploadSupplierFile = (
    data: UploadSupplierFilePayload,
    params: RequestParams = {},
  ) =>
    this.request<UploadResult, any>({
      path: `/api/imports/supplier`,
      method: "POST",
      body: data,
      type: ContentType.FormData,
      format: "json",
      ...params,
    });
  /**
   * No description
   *
   * @tags Import
   * @name UploadMixedImport
   * @request POST:/api/imports/mixed
   */
  uploadMixedImport = (
    data: UploadMixedImportPayload,
    params: RequestParams = {},
  ) =>
    this.request<UploadResult, any>({
      path: `/api/imports/mixed`,
      method: "POST",
      body: data,
      type: ContentType.FormData,
      format: "json",
      ...params,
    });
}
