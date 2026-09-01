import { RequestHistory } from "../models/requestHistory.model.js";

interface TestRequestInput {
  method: string;
  url: string;

  headers?: Record<string, string>;

  body?: unknown;

  // Authentication
  authType?: "none" | "bearer" | "basic";
  bearerToken?: string;
  basicUsername?: string;
  basicPassword?: string;

  // Body type
  bodyType?: "json" | "form-data" | "urlencoded";

  // Form data
  formData?: Record<string, string>;

  // Timeout in milliseconds
  timeout?: number;
}

export async function executeRequest(input: TestRequestInput) {
  const startTime = Date.now();

  const requestHeaders: Record<string, string> = {
    ...(input.headers || {}),
  };

  // ----------------------------------
  // Authentication
  // ----------------------------------

  if (input.authType === "bearer" && input.bearerToken) {
    requestHeaders["Authorization"] = `Bearer ${input.bearerToken}`;
  }

  if (
    input.authType === "basic" &&
    input.basicUsername !== undefined &&
    input.basicPassword !== undefined
  ) {
    const credentials = Buffer.from(
      `${input.basicUsername}:${input.basicPassword}`
    ).toString("base64");

    requestHeaders["Authorization"] = `Basic ${credentials}`;
  }

  // ----------------------------------
  // Prepare request body
  // ----------------------------------

  let requestBody: BodyInit | undefined;

  if (input.method !== "GET" && input.method !== "HEAD") {
    if (input.bodyType === "form-data") {
      const formData = new FormData();

      Object.entries(input.formData || {}).forEach(([key, value]) => {
        formData.append(key, value);
      });

      requestBody = formData;

      // Do NOT manually set multipart Content-Type.
      // fetch automatically adds the boundary.
      delete requestHeaders["Content-Type"];
    } else if (input.bodyType === "urlencoded") {
      const params = new URLSearchParams();

      if (input.formData) {
        Object.entries(input.formData).forEach(([key, value]) => {
          params.append(key, value);
        });
      }

      requestBody = params.toString();

      requestHeaders["Content-Type"] =
        "application/x-www-form-urlencoded";
    } else if (input.body !== undefined) {
      requestBody = JSON.stringify(input.body);

      if (!requestHeaders["Content-Type"]) {
        requestHeaders["Content-Type"] = "application/json";
      }
    }
  }

  // ----------------------------------
  // Request timeout
  // ----------------------------------

  const controller = new AbortController();

  const timeout = input.timeout && input.timeout > 0
    ? input.timeout
    : 30000;

  const timeoutId = setTimeout(() => {
    controller.abort();
  }, timeout);

  let response: Response;

  try {
    response = await fetch(input.url, {
      method: input.method,
      headers: requestHeaders,
      body: requestBody,
      signal: controller.signal,
    });
  } catch (error) {
    clearTimeout(timeoutId);

    if (error instanceof Error && error.name === "AbortError") {
      throw new Error(`Request timed out after ${timeout} ms`);
    }

    throw error;
  }

  clearTimeout(timeoutId);

  const responseTime = Date.now() - startTime;

  // ----------------------------------
  // Response headers
  // ----------------------------------

  const responseHeaders: Record<string, string> = {};

  response.headers.forEach((value, key) => {
    responseHeaders[key] = value;
  });

  // ----------------------------------
  // Read response
  // ----------------------------------

  const contentType =
    response.headers.get("content-type") || "";

  let responseData: unknown;

  if (contentType.includes("application/json")) {
    responseData = await response.json();
  } else {
    responseData = await response.text();
  }

  // ----------------------------------
  // Save history
  // ----------------------------------

  try {
    await RequestHistory.create({
      method: input.method,
      url: input.url,
      status: response.status,
      statusText: response.statusText,
      responseTime,

      requestHeaders,

      requestBody:
        input.bodyType === "form-data" ||
        input.bodyType === "urlencoded"
          ? input.formData
          : input.body,

      responseBody: responseData,
    });
  } catch (dbError) {
    console.error(
      "⚠️ Failed to save request history:",
      dbError
    );
  }

  return {
    status: response.status,
    statusText: response.statusText,
    headers: responseHeaders,
    data: responseData,
    responseTime,
  };
}