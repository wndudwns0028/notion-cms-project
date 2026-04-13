export class ApiError extends Error {
  constructor(
    public status: number,
    message: string
  ) {
    super(message);
    this.name = "ApiError";
  }
}

async function fetchWrapper<T>(url: string, options?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    headers: { "Content-Type": "application/json", ...options?.headers },
    ...options,
  });

  if (!res.ok) {
    const error = await res.json().catch(() => ({ message: "Unknown error" }));
    throw new ApiError(res.status, error.message ?? "Request failed");
  }

  return res.json() as Promise<T>;
}

export const apiClient = {
  get: <T>(url: string, options?: RequestInit) =>
    fetchWrapper<T>(url, { method: "GET", ...options }),
  post: <T>(url: string, body: unknown, options?: RequestInit) =>
    fetchWrapper<T>(url, {
      method: "POST",
      body: JSON.stringify(body),
      ...options,
    }),
  put: <T>(url: string, body: unknown, options?: RequestInit) =>
    fetchWrapper<T>(url, {
      method: "PUT",
      body: JSON.stringify(body),
      ...options,
    }),
  delete: <T>(url: string, options?: RequestInit) =>
    fetchWrapper<T>(url, { method: "DELETE", ...options }),
};
