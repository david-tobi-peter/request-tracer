export type TimingMs = number;

type IPFamily = "ipv4" | "ipv6";

export interface DNSResult {
  time: TimingMs;
  address: string;
  family: IPFamily;
}

export interface TCPResult {
  time: TimingMs;
  localPort: number;
  remotePort: number;
  socket: import("net").Socket;
}

export interface TLSResult {
  time: TimingMs;
  protocol: string;
  cipher: string;
  alpn: string;
  sessionReused: boolean;
  certIssuer: string;
  socket: import("tls").TLSSocket;
}

export interface HTTPResult {
  ttfb: TimingMs;
  download: TimingMs;
  statusCode: number;
  statusMessage: string;
  httpVersion: string;
  headers: Record<string, string | string[]>;
  bytes: number;
}

export interface TraceResult {
  url: URL;
  dns: DNSResult;
  tcp: TCPResult;
  tls?: TLSResult;
  http: HTTPResult;
  totalTime: TimingMs;
}

export interface TraceOptions {
  explain: boolean;
  verbose: boolean;
  timeoutMs: number;
}