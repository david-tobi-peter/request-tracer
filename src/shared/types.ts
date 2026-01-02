export type TimingMsType = number;

export type IPFamilyType = "ipv4" | "ipv6";

export interface IDNSResult {
  time: TimingMsType;
  address: string;
  family: IPFamilyType;
}

export interface ITCPResult {
  time: TimingMsType;
  localPort: number;
  remotePort: number;
  socket: import("net").Socket;
}

export interface ITLSResult {
  time: TimingMsType;
  protocol: string;
  cipher: string;
  alpn: string;
  sessionReused: boolean;
  certIssuer: string;
  socket: import("tls").TLSSocket;
}

export interface IHTTPResult {
  ttfb: TimingMsType;
  download: TimingMsType;
  statusCode: number | string;
  statusMessage: string;
  httpVersion: string;
  headers: Record<string, string | string[]>;
  bytes: number;
}

export interface ITraceResult {
  url: URL;
  dns: IDNSResult;
  tcp: ITCPResult;
  tls?: ITLSResult;
  http: IHTTPResult;
  totalTime: TimingMsType;
}