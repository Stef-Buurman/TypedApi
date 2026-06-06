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

import { WeatherForecast } from "./data-contracts";
import { HttpClient, RequestParams } from "./http-client";

export class WeatherForecast<
  SecurityDataType = unknown,
> extends HttpClient<SecurityDataType> {
  /**
   * No description
   *
   * @tags WeatherForecast
   * @name Get
   * @request GET:/WeatherForecast
   */
  get = (params: RequestParams = {}) =>
    this.request<WeatherForecast[], any>({
      path: `/WeatherForecast`,
      method: "GET",
      format: "json",
      ...params,
    });
}
