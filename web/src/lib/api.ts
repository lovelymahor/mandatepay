async function j(path: string, method = "GET", body?: unknown) {
  const res = await fetch(`/api${path}`, { method, headers: { "Content-Type": "application/json" }, body: body ? JSON.stringify(body) : undefined });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error ?? "Request failed");
  return data;
}
export const api = {
  mandates: () => j("/mandates"),
  createMandate: (text: string) => j("/mandates", "POST", { text }),
  orders: () => j("/orders"),
  runTask: (mandateId: string, request: string) => j("/tasks", "POST", { mandateId, request }),
  approve: (id: string) => j(`/orders/${id}/approve`, "POST"),
  reject: (id: string) => j(`/orders/${id}/reject`, "POST"),
  capture: (id: string) => j(`/orders/${id}/capture`, "POST"),
};
