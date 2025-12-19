import { TCPResult, toMs } from "@/shared";
import net from "net";

export class TCPConnector {
  async connect(host: string, port: number, timeoutMs: number): Promise<TCPResult> {
    return new Promise((resolve, reject) => {
      const start = process.hrtime.bigint();
      const socket = net.connect({ host, port });

      let isSettled = false;

      socket.once("connect", () => {
        if (isSettled) return;
        isSettled = true;

        const end = process.hrtime.bigint();

        resolve({
          time: toMs(end - start),
          localPort: socket.localPort!,
          remotePort: socket.remotePort!,
          socket,
        });
      });

      socket.once("error", (err) => {
        if (isSettled) return;
        isSettled = true;
        socket.destroy();

        reject(new Error(`TCP connection failed: ${err.message}`));
      });

      socket.setTimeout(timeoutMs, () => {
        if (isSettled) return;
        isSettled = true;
        socket.destroy();

        reject(new Error("TCP connection timeout"));
      });
    })
  }
}