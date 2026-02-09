import type { Mock } from 'vitest';

type mockResponse = {
  ok?: boolean;
  status?: number;
  statusText?: string;
  json?: () => Promise<any>;
  text?: () => Promise<string>;
  blob?: () => Promise<Blob>;
  arrayBuffer?: () => Promise<ArrayBuffer>;
  headers?: Headers;
};

/**
 * Mock a fetch response for testing purposes.
 *
 * @param data The data to return in the response body. Can be a string (for text) or an object (for JSON).
 * @param response Optional additional properties to include in the response, such as status codes or headers.
 * @returns A Promise that resolves to a mock fetch response object.
 */
export function mockFetchResponse(
  data: any,
  response: mockResponse | undefined = undefined,
  dataType: string | undefined = undefined
) {
  response = response || { ok: true, status: 200, statusText: 'OK' };
  response.status = response.status || 200;
  response.ok =
    response.ok !== undefined ? response.ok : response.status >= 200 && response.status < 300;
  dataType = dataType || (typeof data === 'string' ? 'text' : 'json');

  (fetch as Mock).mockResolvedValue({
    ...response,
    [dataType]: () => Promise.resolve(data)
  });
}
