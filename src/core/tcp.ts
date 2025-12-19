import { measureTime, TCPResult } from "@/shared";
import net from "net";

export class TCPConnector {
  async connect(host: string, port: number, timeoutMs: number): Promise<TCPResult> {
    let socket: net.Socket;

    const { result: tcpSocket, timeMs } = await measureTime(() =>
      new Promise<net.Socket>((resolve, reject) => {
        let isSettled = false;

        socket = net.connect({ host, port });

        socket.once("connect", () => {
          if (isSettled) return;
          isSettled = true;
          resolve(socket);
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
    );

    return {
      time: timeMs,
      localPort: tcpSocket.localPort!,
      remotePort: tcpSocket.remotePort!,
      socket: tcpSocket,
    };
  }
}