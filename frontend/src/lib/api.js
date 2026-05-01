const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:4000/api";

async function parseResponse(response) {
  const payload = await response.json().catch(() => ({}));

  if (!response.ok) {
    const message = payload.message || "Request failed";
    const error = new Error(message);
    error.status = response.status;
    error.details = payload.details || [];
    throw error;
  }

  return payload;
}

export async function apiRequest(path, options = {}) {
  const headers = {
    ...(options.headers || {})
  };
  const isFormData = options.body instanceof FormData;

  if (!isFormData && !headers["Content-Type"]) {
    headers["Content-Type"] = "application/json";
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers
  });

  return parseResponse(response);
}

export { API_BASE_URL };
