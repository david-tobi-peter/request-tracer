import { measureTime, TLSResult } from "@/shared";
import tls from "tls";

export class TLSHandShaker {
  async handshake(
    tcpResult: { socket: import("net").Socket },
    hostname: string,
    timeoutMs: number
  ): Promise<TLSResult> {
    let tlsSocket: tls.TLSSocket;

    const { result: socket, timeMs } = await measureTime(() =>
      new Promise<tls.TLSSocket>((resolve, reject) => {
        let isSettled = false;

        tlsSocket = tls.connect({
          socket: tcpResult.socket,
          servername: hostname,
          timeout: timeoutMs,
        });

        tlsSocket.once("secureConnect", () => {
          if (isSettled) return;
          isSettled = true;
          resolve(tlsSocket);
        });

        tlsSocket.once("error", (err) => {
          if (isSettled) return;
          isSettled = true;
          tlsSocket.destroy();
          reject(new Error(`TLS handshake failed: ${err.message}`));
        });

        tlsSocket.setTimeout(timeoutMs, () => {
          if (isSettled) return;
          isSettled = true;
          tlsSocket.destroy();
          reject(new Error("TLS handshake timeout"));
        });
      })
    );

    const cert = socket.getPeerCertificate();
    const cipher = socket.getCipher();
    const protocol = socket.getProtocol();
    const sessionReused = socket.isSessionReused();

    return {
      time: timeMs,
      protocol: protocol || "unknown",
      cipher: cipher ? `${cipher.name} (${cipher.version})` : "unknown",
      alpn: socket.alpnProtocol || "http/1.1",
      sessionReused,
      certIssuer: cert.issuer?.O || "unknown",
      socket,
    };
  }
}