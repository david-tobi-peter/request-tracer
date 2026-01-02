#!/usr/bin/env node

import { RequestTracer } from "../core/request-tracer.js";
import { ITraceResult } from "../shared/types.js";
import process from "process";

function parseArgs(): { url: string; timeoutMs: number | undefined } {
  const args = process.argv.slice(2);

  if (args.length === 0 || args.includes("--help") || args.includes("-h")) {
    console.log(`Usage: tracer --url <url> [--timeout <ms>]
      Options:
        --url <url>        URL to trace (required)
        --timeout <ms>     Request timeout in milliseconds (default: 30000)
    `);
    process.exit(0);
  }

  const urlIndex = args.indexOf("--url");
  if (urlIndex === -1 || !args[urlIndex + 1]) {
    console.error("Missing or invalid --url argument\n");
    console.log(`Usage: tracer --url <url> [--timeout <ms>]
      Options:
        --url <url>        URL to trace (required)
        --timeout <ms>     Request timeout in milliseconds (default: 30000)
    `);
    process.exit(1);
  }

  const url = (() => {
    const raw = args[urlIndex + 1] as string;
    const full = raw.startsWith("http://") || raw.startsWith("https://") ? raw : `http://${raw}`;
    try {
      new URL(full);
      return full;
    } catch {
      console.error(`Invalid URL: ${raw}`);
      process.exit(1);
    }
  })();

  const timeoutIndex = args.indexOf("--timeout");
  const timeoutMs = timeoutIndex >= 0 && args[timeoutIndex + 1]
    ? (() => {
      const parsed = Number(args[timeoutIndex + 1]);
      if (isNaN(parsed) || parsed <= 0) {
        console.error(`Invalid timeout value: ${args[timeoutIndex + 1]}`);
        process.exit(1);
      }
      return parsed;
    })()
    : undefined;

  return { url, timeoutMs };
}


function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(2)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(2)} MB`;
}

function printResult(result: ITraceResult) {
  console.log(`\nTracing: ${result.url.href}\n`);

  console.log(`DNS:       ${result.dns.time.toFixed(2)} ms → ${result.dns.address} (${result.dns.family})`);
  console.log(`TCP:       ${result.tcp.time.toFixed(2)} ms → local:${result.tcp.localPort} remote:${result.tcp.remotePort}`);

  if (result.tls) {
    console.log(`TLS:       ${result.tls.time.toFixed(2)} ms → ${result.tls.protocol} / ${result.tls.cipher}`);
    console.log(`ALPN:      ${result.tls.alpn} | Session reused: ${result.tls.sessionReused}`);
    console.log(`Cert:      ${result.tls.certIssuer}`);
  }

  console.log(`HTTP:      ${result.http.ttfb.toFixed(2)} ms TTFB + ${result.http.download.toFixed(2)} ms download`);
  console.log(`Status:    ${result.http.statusCode} ${result.http.statusMessage} (HTTP/${result.http.httpVersion})`);
  console.log(`Bytes:     ${formatBytes(result.http.bytes)}`);

  console.log(`\nTotal time: ${result.totalTime.toFixed(2)} ms\n`);
}

async function main() {
  const { url, timeoutMs } = parseArgs();
  const tracer = new RequestTracer();

  try {
    const result = await tracer.trace(url, timeoutMs);
    printResult(result);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("Trace failed:", message);
    process.exit(1);
  }
}

main();
