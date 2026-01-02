import { DNSResolver } from "./dns.js";
import { TCPConnector } from "./tcp.js";
import { TLSHandShaker } from "./tls.js";
import { HTTPClient } from "./http.js";
import type net from "net";
import type tls from "tls";
import type { ITraceResult } from "../shared/types.js";

export class RequestTracer {
  private dns = new DNSResolver();
  private tcp = new TCPConnector();
  private tls = new TLSHandShaker();
  private http = new HTTPClient();

  async trace(
    url: string,
    timeoutMs: number = 3_000
  ): Promise<ITraceResult> {
    const target = new URL(url);

    const port = (() => {
      if (target.port) return Number(target.port);
      return target.protocol === "https:" ? 443 : 80;
    })();

    const IDNSResult = await this.dns.resolve(target.hostname);

    const ITCPResult = await this.tcp.connect(
      IDNSResult.address,
      port,
      timeoutMs
    );

    let activeSocket: net.Socket | tls.TLSSocket = ITCPResult.socket;
    let ITLSResult: ITraceResult["tls"];

    if (target.protocol === "https:") {
      ITLSResult = await this.tls.handshake(
        { socket: ITCPResult.socket },
        target.hostname,
        timeoutMs
      );

      activeSocket = ITLSResult.socket;
    }

    const IHTTPResult = await this.http.request(
      target.href,
      { socket: activeSocket },
      timeoutMs
    );

    const totalTime =
      IDNSResult.time +
      ITCPResult.time +
      (ITLSResult?.time ?? 0) +
      IHTTPResult.ttfb +
      IHTTPResult.download;

    return {
      url: target,
      dns: IDNSResult,
      tcp: ITCPResult,
      ...(ITLSResult ? { tls: ITLSResult } : {}),
      http: IHTTPResult,
      totalTime,
    };
  }
}
