export function logEvent(message: string, data?: Record<string, unknown>) {
  const payload = data ? JSON.stringify(data) : "";
  console.info(`[event] ${message}`, payload);
}
