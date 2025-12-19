export async function measureTime<T>(fn: () => Promise<T>): Promise<{ result: T; timeMs: number }> {
  const start = process.hrtime.bigint();
  const result = await fn();
  const end = process.hrtime.bigint();

  return { result, timeMs: Number(end - start) / 1000000 };
}