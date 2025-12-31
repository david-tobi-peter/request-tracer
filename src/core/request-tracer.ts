import { DNSResolver } from "./dns";
import { TCPConnector } from "./tcp";
import { TLSHandShaker } from "./tls";
import { HTTPClient } from "./http";
import type net from "net";
import type tls from "tls";
import type { TraceResult } from "@/shared";

export class RequestTracer {
  private dns = new DNSResolver();
  private tcp = new TCPConnector();
  private tls = new TLSHandShaker();
  private http = new HTTPClient();

  async trace(
    url: string,
    timeoutMs: number
  ): Promise<TraceResult> {
    const target = new URL(url);

    const port = (() => {
      if (target.port) return Number(target.port);
      return target.protocol === "https:" ? 443 : 80;
    })();

    const dnsResult = await this.dns.resolve(target.hostname);

    const tcpResult = await this.tcp.connect(
      dnsResult.address,
      port,
      timeoutMs
    );

    let activeSocket: net.Socket | tls.TLSSocket = tcpResult.socket;
    let tlsResult: TraceResult["tls"];

    if (target.protocol === "https:") {
      tlsResult = await this.tls.handshake(
        { socket: tcpResult.socket },
        target.hostname,
        timeoutMs
      );

      activeSocket = tlsResult.socket;
    }

    const httpResult = await this.http.request(
      target.href,
      { socket: activeSocket },
      timeoutMs
    );

    const totalTime =
      dnsResult.time +
      tcpResult.time +
      (tlsResult?.time ?? 0) +
      httpResult.ttfb +
      httpResult.download;

    return {
      url: target,
      dns: dnsResult,
      tcp: tcpResult,
      ...(tlsResult ? { tls: tlsResult } : {}),
      http: httpResult,
      totalTime,
    };
  }
}
