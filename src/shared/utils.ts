export async function measureTime<T>(fn: () => Promise<T>): Promise<{ result: T; timeMs: number }> {
  const start = process.hrtime.bigint();
  const result = await fn();
  const end = process.hrtime.bigint();

  return { result, timeMs: Number(end - start) / 1000000 };
}

export function parseHeaders(raw?: string): Record<string, string> {
  if (!raw) return {};

  const trimmed = raw.trim();

  if (!trimmed.startsWith("{") || !trimmed.endsWith("}")) {
    console.error(`Invalid --header format. Expected {k1:v1,k2:v2}`);
    process.exit(1);
  }

  const inner = trimmed.slice(1, -1).trim();
  if (!inner) return {};

  const headers: Record<string, string> = {};

  for (const pair of inner.split(",")) {
    const [key, ...rest] = pair.split(":");

    if (!key || rest.length === 0) {
      console.error(`Invalid header entry: "${pair}"`);
      process.exit(1);
    }

    const value = rest.join(":").trim();
    if (!value) {
      console.error(`Empty value for header: "${key}"`);
      process.exit(1);
    }

    headers[key.trim()] = value;
  }

  return headers;
}

export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(2)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(2)} MB`;
}