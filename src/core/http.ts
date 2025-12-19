import { HTTPResult, measureTime } from "@/shared";
import http from "http";
import https from "https";
import net from "net";
import tls from "tls";

export class HTTPClient {
  async request(
    url: string,
    socket: { socket: net.Socket | tls.TLSSocket },
    timeoutMs: number,
  ): Promise<HTTPResult> {
    const target = new URL(url);
    const protocolModule = target.protocol === "https:" ? https : http;

    let bytesReceived = 0;

    const options: http.RequestOptions = {
      hostname: target.hostname,
      port: target.port || (protocolModule === https ? 443 : 80),
      path: target.pathname + target.search,
      method: "GET",
      headers: {
        "user-agent": "RequestTracer/1.0",
      },
      createConnection: () => socket.socket,
      timeout: timeoutMs,
    };

    const { result: ttfbRes, timeMs: ttfb } = await measureTime(() =>
      new Promise<http.IncomingMessage>((resolve, reject) => {
        const req = protocolModule.request(options, resolve);

        req.on("error", (err) => reject(new Error(`HTTP request failed: ${err.message}`)));

        req.on("timeout", () => {
          req.destroy();
          reject(new Error("HTTP request timeout"));
        });

        req.end();
      })
    );

    const { timeMs: download } = await measureTime(() =>
      new Promise<void>((resolve) => {
        ttfbRes.on("data", (chunk) => {
          bytesReceived += chunk.length;
        });

        ttfbRes.on("end", () => resolve());
      })
    );

    return {
      ttfb,
      download,
      statusCode: ttfbRes.statusCode || "unknown",
      statusMessage: ttfbRes.statusMessage || "",
      httpVersion: ttfbRes.httpVersion,
      headers: ttfbRes.headers as Record<string, string | string[]>,
      bytes: bytesReceived,
    };
  }
}