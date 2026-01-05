#!/usr/bin/env node

import { RequestTracer } from "../core/request-tracer.js";
import { ITraceResult, IParsedArgs, HTTPMethodType } from "../shared/types.js";
import process from "process";
import yargs from "yargs";
import { hideBin } from "yargs/helpers";
import { formatBytes, parseHeaders } from "../shared/utils.js";

function parseArgs(): IParsedArgs {
  const argv = yargs(hideBin(process.argv))
    .scriptName("request-tracer")
    .usage("Usage: $0 --url <url> [options]")
    .option("url", {
      type: "string",
      describe: "URL to trace",
      demandOption: true,
    })
    .option("timeout", {
      type: "number",
      describe: "Request timeout in milliseconds",
      default: 30_000,
    })
    .option("method", {
      type: "string",
      describe: "HTTP method",
      default: "GET",
      choices: ["GET", "POST", "PUT", "PATCH", "DELETE", "HEAD", "OPTIONS"],
    })
    .option("header", {
      type: "string",
      describe: "HTTP headers in the form {k1:v1,k2:v2}",
    })
    .option("body", {
      type: "string",
      describe: "Request body (POST/PUT/PATCH)",
    })
    .example(
      "$0 --url https://api.example.com/users",
      "Trace a simple GET request"
    )
    .example(
      `$0 --url https://api.example.com/users --method POST --body '{"name":"John"}'`,
      "Trace a POST request with a JSON body"
    )
    .example(
      `$0 --url https://api.example.com/data --header '{Authorization:BearerToken}'`,
      "Trace a request with custom headers"
    )
    .example(
      `$0 --url https://api.example.com/data --header '{Authorization:BearerToken,X-Env:prod}'`,
      "Trace a request with multiple headers"
    )
    .strict()
    .help()
    .parseSync();

  const rawUrl = argv.url;
  const fullUrl =
    rawUrl.startsWith("http://") || rawUrl.startsWith("https://")
      ? rawUrl
      : `http://${rawUrl}`;

  try {
    new URL(fullUrl);
  } catch {
    console.error(`Invalid URL: ${rawUrl}`);
    process.exit(1);
  }

  const headers = parseHeaders(argv.header);

  const method = argv.method as HTTPMethodType;
  const body = argv.body;

  if (body && ["POST", "PUT", "PATCH"].includes(method) && !headers["Content-Type"]) {
    headers["Content-Type"] = "application/json";
  }

  return {
    url: fullUrl,
    timeoutMs: argv.timeout,
    method,
    headers,
    body,
  };
}

function printResult(result: ITraceResult, method: HTTPMethodType) {
  console.log(`\nTracing: ${method} ${result.url.href}\n`);

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
  const { url, timeoutMs, method, headers, body } = parseArgs();
  const tracer = new RequestTracer();

  try {
    const result = await tracer.trace(url, timeoutMs, { method, headers, body });
    printResult(result, method);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("Trace failed:", message);
    process.exit(1);
  }
}

main();
