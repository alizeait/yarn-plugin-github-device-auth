import type { httpUtils } from '@yarnpkg/core';

/**
 * Error class that wraps an HTTP response for error handling
 */
export class ResponseError extends Error {
  response: httpUtils.Response;

  constructor(message: string, response: httpUtils.Response) {
    super(message);
    this.response = response;
  }
}
